import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsArticle {
  title: string;
  summary: string;
  category: string;
  region: string;
  source: string;
  url: string;
  published_at: string;
  agency_type?: string | null;
  sector?: string | null;
  source_key?: string | null;
  slug?: string | null;
}

interface ArticleRow {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  slug: string | null;
}

interface Translations {
  title_en: string | null;
  summary_en: string | null;
  title_ar: string | null;
  summary_ar: string | null;
}

interface RewriteResult {
  body_tr: string;
  commodities: string[];
}

interface CommodityHint {
  commodity_name: string;
  translation_en: string | null;
}

function slugify(title: string): string {
  const base = title
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "haber";
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// ─── AI helper (shared by translation + rewrite) ───

interface AiConfig {
  apiKey: string;
  endpoint: string;
  model: string;
}

function getAiConfig(): AiConfig | null {
  const apiKey = Deno.env.get("AI_TEXT_API_KEY");
  if (!apiKey) return null;
  return {
    apiKey,
    endpoint: Deno.env.get("AI_TEXT_ENDPOINT") || "https://api.openai.com/v1/chat/completions",
    model: Deno.env.get("AI_TEXT_MODEL") || "gpt-4o-mini",
  };
}

async function callAi(ai: AiConfig, system: string, user: string, timeoutMs = 120000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(ai.endpoint, {
      method: "POST",
      headers: { "Authorization": `Bearer ${ai.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ai.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`AI request failed: ${resp.status}`);
    const data = await resp.json();
    return (data.choices?.[0]?.message?.content ?? "") as string;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Staff authorization for privileged modes ───

async function isAuthorizedStaff(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<boolean> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  // Scheduled cron jobs authenticate with the service-role key
  if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;
  try {
    // Validate the session token with Supabase Auth (signature + expiry),
    // then check the caller's staff flags in profiles.
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: userData, error } = await anon.auth.getUser(token);
    if (error || !userData?.user?.id) return false;
    const { data } = await supabase
      .from("profiles")
      .select("is_admin, is_moderator, is_editor, is_banned")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!data || data.is_banned) return false;
    return data.is_admin === true || data.is_moderator === true || data.is_editor === true;
  } catch {
    return false;
  }
}

// ─── Article body extraction ───

async function extractArticleBody(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "TurandaNewsBot/1.0 (+https://turanda.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Strip scripts/styles, then pull <p> text — a pragmatic extraction that
    // works across the government/wire RSS pages we ingest.
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ");
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRegex.exec(cleaned)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
      if (text.length > 60) paragraphs.push(text);
    }
    const body = paragraphs.join("\n\n");
    return body.length > 200 ? body.slice(0, 12000) : null;
  } catch {
    return null;
  }
}

// ─── AI rewrite in Turkish + commodity tagging ───

const REWRITE_SYSTEM =
  "Sen Türkiye'nin önde gelen tarım haber sitesi Turanda için yazan deneyimli bir tarım muhabirisin. " +
  "Sana verilen kaynak metni TAMAMEN YENİ ifadelerle, özgün bir Türkçe haber makalesine dönüştür. " +
  "Kurallar: " +
  "(1) 300-500 kelime arasında yaz. " +
  "(2) Kaynaktaki tüm bilgi, rakam, fiyat, tarih ve alıntıları birebir doğru aktar; asla bilgi ekleme veya uydurma. " +
  "(3) Kaynak metinden kelime öbeklerini kopyalama; cümleleri kendi kelimelerinle kur. " +
  "(4) Paragrafları boş satırla ayır. Başlık yazma, sadece makale gövdesini yaz. " +
  "(5) Tarafsız, profesyonel haber dili kullan.";

async function rewriteArticle(
  ai: AiConfig,
  sourceText: string,
  commodityNames: string[],
): Promise<RewriteResult | null> {
  const commodityList = commodityNames.join(", ");
  const user =
    `Kaynak metin:\n"""\n${sourceText}\n"""\n\n` +
    `Sitedeki ürün listesi: ${commodityList}\n\n` +
    "Görevin: yukarıdaki metinden özgün bir Türkçe makale üret VE makalede adı geçen ürünleri listeden seç. " +
    'Yanıtı SADECE şu JSON formatında ver, markdown olmadan: ' +
    '{"body_tr": "makale metni (paragraflar \\n\\n ile ayrılmış)", "commodities": ["ürün1", "ürün2"]}';

  try {
    const content = await callAi(ai, REWRITE_SYSTEM, user);
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim()) as RewriteResult;
    if (typeof parsed.body_tr !== "string" || parsed.body_tr.trim().length < 200) return null;
    const valid = Array.isArray(parsed.commodities)
      ? parsed.commodities.filter((c) => commodityNames.includes(c))
      : [];
    return { body_tr: parsed.body_tr.trim(), commodities: valid };
  } catch {
    return null;
  }
}

// ─── Body translations (EN + AR) ───

const BODY_TRANSLATE_SYSTEM =
  "You are a translator for an agricultural news site. Translate the Turkish article body into English and Arabic. " +
  "Keep numbers, currency symbols and units exactly as in the source. Preserve paragraph breaks (blank line between paragraphs). " +
  'Respond with ONLY JSON: {"body_en": "...", "body_ar": "..."}. No markdown.';

async function translateBody(ai: AiConfig, bodyTr: string): Promise<{ body_en: string | null; body_ar: string | null }> {
  try {
    const content = await callAi(ai, BODY_TRANSLATE_SYSTEM, bodyTr);
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim()) as { body_en?: string; body_ar?: string };
    return {
      body_en: typeof parsed.body_en === "string" && parsed.body_en.trim() ? parsed.body_en.trim() : null,
      body_ar: typeof parsed.body_ar === "string" && parsed.body_ar.trim() ? parsed.body_ar.trim() : null,
    };
  } catch {
    return { body_en: null, body_ar: null };
  }
}

// ─── Title/summary translation (existing behavior) ───

async function translateArticles(articles: ArticleRow[]): Promise<Map<string, Translations>> {
  const translations = new Map<string, Translations>();
  const ai = getAiConfig();
  if (!ai || articles.length === 0) return translations;

  const payload = articles.map((a) => ({
    key: a.id,
    title: a.title,
    summary: a.summary ?? "",
  }));
  const systemPrompt =
    "You are a translator for an agricultural news site. For each item, translate the title and summary into English and Arabic. " +
    "Keep numbers, currency symbols and units exactly as in the source. " +
    'Respond with ONLY a JSON array, one object per input: {"key": "<same key>", "title_en": "...", "summary_en": "...", "title_ar": "...", "summary_ar": "..."}. No markdown.';

  try {
    const content = await callAi(ai, systemPrompt, JSON.stringify(payload), 90000);
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim()) as {
      key: string;
      title_en?: string;
      summary_en?: string;
      title_ar?: string;
      summary_ar?: string;
    }[];
    if (!Array.isArray(parsed)) return translations;

    const clean = (v: unknown): string | null =>
      typeof v === "string" && v.trim() ? v.trim() : null;

    for (const item of parsed) {
      if (typeof item?.key !== "string") continue;
      const hasAny = clean(item.title_en) || clean(item.title_ar);
      if (!hasAny) continue;
      translations.set(item.key, {
        title_en: clean(item.title_en),
        summary_en: clean(item.summary_en),
        title_ar: clean(item.title_ar),
        summary_ar: clean(item.summary_ar),
      });
    }
    return translations;
  } catch {
    return translations;
  }
}

async function persistTranslations(
  supabase: ReturnType<typeof createClient>,
  articles: ArticleRow[],
): Promise<number> {
  const translations = await translateArticles(articles);
  let saved = 0;
  for (const [id, tr] of translations) {
    const { error } = await supabase.from("news_articles").update(tr).eq("id", id);
    if (!error) saved++;
  }
  return saved;
}

// ─── Commodity registry cache (per invocation) ───

async function loadCommodityNames(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  const { data } = await supabase.from("commodity_registry").select("commodity_name");
  return (data ?? []).map((r: { commodity_name: string }) => r.commodity_name);
}

// ─── Full rewrite pipeline for freshly ingested rows ───

async function processRewrites(
  supabase: ReturnType<typeof createClient>,
  rows: ArticleRow[],
): Promise<{ rewritten: number; autoPublished: number; pendingReview: number; tagged: number }> {
  const ai = getAiConfig();
  const commodityNames = await loadCommodityNames(supabase);
  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("news_autopilot")
    .eq("id", 1)
    .maybeSingle();
  const autopilot = settingsRow?.news_autopilot === true;

  let rewritten = 0;
  let autoPublished = 0;
  let pendingReview = 0;
  let tagged = 0;

  for (const row of rows) {
    const sourceBody = await extractArticleBody(row.url);
    if (!ai || !sourceBody) continue; // no body extractable → stays in queue as-is

    const result = await rewriteArticle(ai, sourceBody, commodityNames);
    if (!result) continue; // rewrite failed → stays in queue, never auto-published

    const { body_en, body_ar } = await translateBody(ai, result.body_tr);

    const updates: Record<string, unknown> = {
      source_body: sourceBody,
      body_content_tr: result.body_tr,
      body_content_en: body_en,
      body_content_ar: body_ar,
      ai_rewritten_at: new Date().toISOString(),
      slug: row.slug ?? slugify(row.title),
    };
    if (autopilot) {
      updates.review_status = "approved";
      updates.reviewed_at = new Date().toISOString();
    } else {
      updates.review_status = "pending_review";
    }

    const { error } = await supabase.from("news_articles").update(updates).eq("id", row.id);
    if (error) continue;
    rewritten++;
    if (autopilot) autoPublished++; else pendingReview++;

    if (result.commodities.length > 0) {
      const links = result.commodities.map((c) => ({ article_id: row.id, commodity_name: c }));
      const { error: linkErr } = await supabase.from("news_article_commodities").upsert(links, {
        onConflict: "article_id,commodity_name",
        ignoreDuplicates: true,
      });
      if (!linkErr) tagged += result.commodities.length;
    }
  }

  return { rewritten, autoPublished, pendingReview, tagged };
}

// ─── On-demand rewrite for one article (admin button) ───

async function rewriteSingle(
  supabase: ReturnType<typeof createClient>,
  articleId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: row, error: fetchErr } = await supabase
    .from("news_articles")
    .select("id, title, url, slug, body_content_tr")
    .eq("id", articleId)
    .maybeSingle();
  if (fetchErr || !row) return { success: false, error: "Article not found" };

  const ai = getAiConfig();
  if (!ai) return { success: false, error: "AI service not configured" };

  const commodityNames = await loadCommodityNames(supabase);

  // Prefer the stored original; fall back to re-fetching the source URL.
  const { data: existing } = await supabase
    .from("news_articles")
    .select("source_body")
    .eq("id", articleId)
    .maybeSingle();
  const sourceText = existing?.source_body || (await extractArticleBody(row.url));
  if (!sourceText) return { success: false, error: "No source text available to rewrite" };

  const result = await rewriteArticle(ai, sourceText, commodityNames);
  if (!result) return { success: false, error: "AI rewrite failed" };

  const { body_en, body_ar } = await translateBody(ai, result.body_tr);

  const { error: updateErr } = await supabase
    .from("news_articles")
    .update({
      source_body: sourceText,
      body_content_tr: result.body_tr,
      body_content_en: body_en,
      body_content_ar: body_ar,
      ai_rewritten_at: new Date().toISOString(),
      slug: row.slug ?? slugify(row.title),
    })
    .eq("id", articleId);
  if (updateErr) return { success: false, error: updateErr.message };

  // Replace commodity links with the fresh tagging
  await supabase.from("news_article_commodities").delete().eq("article_id", articleId);
  if (result.commodities.length > 0) {
    const links = result.commodities.map((c) => ({ article_id: articleId, commodity_name: c }));
    await supabase.from("news_article_commodities").upsert(links, {
      onConflict: "article_id,commodity_name",
      ignoreDuplicates: true,
    });
  }

  return { success: true };
}

// ─── Upsert helper ───

async function upsertArticles(
  supabase: ReturnType<typeof createClient>,
  rows: NewsArticle[],
) {
  // Generate slugs for new rows; upsert on title, ignoring duplicates, then
  // return rows so the rewrite pipeline can process them.
  const withSlugs = rows.map((r) => ({ ...r, slug: r.slug ?? slugify(r.title) }));
  const inserted = await supabase
    .from("news_articles")
    .upsert(withSlugs, { onConflict: "title", ignoreDuplicates: true })
    .select("id, title, summary, url, slug");
  return inserted;
}

// ─── Government source registry (mirrors lib/gov-sources.ts) ───

interface GovSource {
  key: string;
  name: string;
  rssFeed: string | null;
  agencyType: string;
  sector: string;
  category: string;
}

const GOV_SOURCES: GovSource[] = [
  { key: "tarimorman", name: "T.C. Tarim ve Orman Bakanligi", rssFeed: "https://www.tarimorman.gov.tr/rss/bakanlik-haberleri", agencyType: "Central Ministry", sector: "Central Policy & Extension", category: "policy" },
  { key: "tmo", name: "Toprak Mahsulleri Ofisi (TMO)", rssFeed: "https://www.tmo.gov.tr/feed", agencyType: "State-Owned Enterprise", sector: "Grains & Cereals", category: "market" },
  { key: "esk", name: "Et ve Sut Kurumu (ESK)", rssFeed: "https://www.esk.gov.tr/Pages/Rss", agencyType: "State-Owned Enterprise", sector: "Livestock & Dairy", category: "market" },
  { key: "dsi", name: "Devlet Su Isleri (DSI)", rssFeed: "https://www.dsi.gov.tr/rss", agencyType: "Water & Infrastructure", sector: "Irrigation & Water", category: "policy" },
  { key: "tkdk", name: "TKDK", rssFeed: "https://www.tkdk.gov.tr/Default.aspx?RSS", agencyType: "Grants & Financing", sector: "Grants & EU IPARD", category: "policy" },
  { key: "tarsim", name: "TARSIM", rssFeed: "https://www.tarsim.gov.tr/rss", agencyType: "Insurance & Risk", sector: "Risk & Disaster Relief", category: "policy" },
  { key: "tuik", name: "TUIK", rssFeed: "https://www.tuik.gov.tr/rss", agencyType: "Statistics & Legislation", sector: "Statistics", category: "market" },
  { key: "resmigazete", name: "Resmi Gazete", rssFeed: "https://www.resmigazete.gov.tr/rss", agencyType: "Statistics & Legislation", sector: "Legislation", category: "policy" },
  { key: "aa", name: "Anadolu Ajansi", rssFeed: "https://www.aa.com.tr/rss/tarim", agencyType: "Wire Service", sector: "Wire Coverage", category: "general" },
];

async function fetchGovSource(
  supabase: ReturnType<typeof createClient>,
  src: GovSource,
): Promise<number> {
  try {
    const resp = await fetch(src.rssFeed!, {
      headers: { "User-Agent": "TurandaNewsBot/1.0 (+https://turanda.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return 0;
    const xml = await resp.text();

    const items: NewsArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
      const desc = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim();
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();

      if (title) {
        items.push({
          title: title.replace(/<[^>]*>/g, "").slice(0, 300),
          summary: desc ? desc.replace(/<[^>]*>/g, "").slice(0, 300) : "",
          category: src.category,
          region: "all",
          source: src.name,
          url: link || "",
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          agency_type: src.agencyType,
          sector: src.sector,
          source_key: src.key,
        });
      }
    }
    if (items.length === 0) return 0;

    const { data, error } = await upsertArticles(supabase, items);
    if (error) return 0;
    if (data && data.length > 0) await processRewrites(supabase, data as ArticleRow[]);
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

async function runGovSourcesMode(
  supabase: ReturnType<typeof createClient>,
  sourceKey?: string,
): Promise<{ ingested: number; sources: { key: string; fetched: number }[] }> {
  const sources = sourceKey ? GOV_SOURCES.filter((s) => s.key === sourceKey) : GOV_SOURCES;
  const results: { key: string; fetched: number }[] = [];
  let total = 0;

  for (const src of sources) {
    const fetched = await fetchGovSource(supabase, src);
    results.push({ key: src.key, fetched });
    total += fetched;
    // Respectful delay between upstream requests
    await new Promise((r) => setTimeout(r, 400));
  }

  return { ingested: total, sources: results };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const { source, articles } = body as {
      source?: string;
      articles?: NewsArticle[];
    };

    if (!(await isAuthorizedStaff(req, supabase))) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: staff session or service key required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 0: Government sources (POST { mode: "gov_sources", sourceKey? })
    if (body.mode === "gov_sources") {
      const result = await runGovSourcesMode(supabase, body.sourceKey);
      const ingestedRows = result.ingested > 0
        ? await supabase
            .from("news_articles")
            .select("id, title, summary, url, slug")
            .not("source_key", "is", null)
            .order("published_at", { ascending: false })
            .limit(result.ingested)
        : null;
      const translated = ingestedRows?.data ? await persistTranslations(supabase, ingestedRows.data) : 0;
      return new Response(
        JSON.stringify({ success: true, ...result, translated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 1: Ingest articles directly (POST with articles array)
    if (articles && Array.isArray(articles) && articles.length > 0) {
      const rows = articles.map((a) => ({
        title: a.title,
        summary: a.summary || null,
        category: a.category || "general",
        region: a.region || "all",
        source: a.source || source || "External API",
        url: a.url || null,
        published_at: a.published_at || new Date().toISOString(),
      }));

      const { data, error } = await upsertArticles(supabase, rows);
      if (error) throw error;

      const processed = await processRewrites(supabase, (data || []) as ArticleRow[]);
      const translated = await persistTranslations(supabase, (data || []) as ArticleRow[]);

      return new Response(
        JSON.stringify({ success: true, ingested: data?.length || 0, translated, ...processed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 2: Fetch from configured RSS feed (POST with feedUrl)
    const feedUrl = body.feedUrl;
    if (feedUrl) {
      const resp = await fetch(feedUrl, {
        headers: { "User-Agent": "TurandaNewsBot/1.0" },
      });
      if (!resp.ok) {
        throw new Error(`Feed fetch failed: ${resp.status}`);
      }
      const xml = await resp.text();

      // Parse RSS XML (basic regex parsing for RSS 2.0)
      const items: NewsArticle[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const title = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
        const desc = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim();
        const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();

        if (title) {
          items.push({
            title: title.replace(/<[^>]*>/g, ""),
            summary: desc ? desc.replace(/<[^>]*>/g, "").slice(0, 300) : "",
            category: body.category || "general",
            region: body.region || "all",
            source: source || feedUrl,
            url: link || "",
            published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          });
        }
      }

      if (items.length > 0) {
        const { data, error } = await upsertArticles(supabase, items);
        if (error) throw error;

        const processed = await processRewrites(supabase, (data || []) as ArticleRow[]);
        const translated = await persistTranslations(supabase, (data || []) as ArticleRow[]);

        return new Response(
          JSON.stringify({ success: true, ingested: data?.length || 0, fetched: items.length, translated, ...processed }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, ingested: 0, fetched: 0, message: "No items found in feed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 3: Backfill translations for existing articles (POST { backfill: true })
    if (body.backfill === true) {
      const limit = typeof body.limit === "number" ? body.limit : 50;
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, title, summary, url, slug")
        .or("title_en.is.null,title_ar.is.null")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No untranslated articles", translated: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const translated = await persistTranslations(supabase, data as ArticleRow[]);

      return new Response(
        JSON.stringify({ success: true, translated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 3b: Backfill AI rewrites for articles missing a body (POST { backfillRewrites: true })
    if (body.backfillRewrites === true) {
      const limit = typeof body.limit === "number" ? body.limit : 10;
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, title, summary, url, slug")
        .is("body_content_tr", null)
        .not("url", "is", null)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No articles need rewriting", ...processRewritesEmpty() }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const processed = await processRewrites(supabase, data as ArticleRow[]);
      return new Response(
        JSON.stringify({ success: true, ...processed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 4: Daily scheduled fetch (POST { daily: true }) —
    // fetches live RSS feeds only; no synthetic fallback content
    if (body.daily === true) {
      const result = await runGovSourcesMode(supabase);
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 5: Rewrite a single article on demand (POST { rewriteArticleId: "<uuid>" })
    if (typeof body.rewriteArticleId === "string" && body.rewriteArticleId) {
      const result = await rewriteSingle(supabase, body.rewriteArticleId);
      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Provide 'mode: gov_sources', 'articles' array, 'feedUrl', { backfill: true }, { backfillRewrites: true }, { daily: true }, or { rewriteArticleId } in request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function processRewritesEmpty() {
  return { rewritten: 0, autoPublished: 0, pendingReview: 0, tagged: 0 };
}