import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CommodityPriceInput {
  exchange_id: string;
  commodity_name: string;
  commodity_category: string;
  unit: string;
  price: number;
  min_price: number | null;
  max_price: number | null;
  currency: string;
  change_pct: number;
  recorded_date: string;
}

interface FieldMapping {
  commodity_name: string;
  price: string;
  unit: string;
  recorded_date: string;
  change_pct: string;
  // TOBB-specific fields
  tobb_exchange_code?: string;
  tobb_commodity_codes?: string;
  tobb_price_type?: string;
  tobb_start_date_field?: string;
  tobb_end_date_field?: string;
  tobb_date_range?: string;
  html_min_price?: string;
  html_max_price?: string;
  html_avg_price?: string;
  html_date?: string;
  html_commodity_name?: string;
  html_unit?: string;
}

interface CommoditySource {
  id: string;
  name: string;
  source_type: string;
  url: string;
  api_key_env: string | null;
  exchange_id: string | null;
  fetch_interval: string;
  is_active: boolean;
  field_mapping: FieldMapping;
}

const DEFAULT_MAPPING: FieldMapping = {
  commodity_name: "commodity_name",
  price: "price",
  unit: "unit",
  recorded_date: "recorded_date",
  change_pct: "change_pct",
};

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function getField(obj: Record<string, unknown>, key: string): string | number | null {
  if (key in obj) return obj[key] as string | number | null;
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === key.toLowerCase()) return obj[k] as string | number | null;
  }
  return null;
}

function parsePrice(str: string | null): number | null {
  if (!str) return null;
  const cleaned = str.replace(/[^\d.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parseDate(str: string | null): string | null {
  if (!str) return null;
  // Try DD.MM.YYYY format (TOBB standard)
  const dotMatch = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    const [, d, m, y] = dotMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];
  // Try DD/MM/YYYY
  const slashMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeLog(
  supabase: ReturnType<typeof createClient>,
  sourceId: string,
  status: string,
  recordsIngested: number,
  errorMessage: string | null,
) {
  await supabase.from("commodity_source_logs").insert({
    source_id: sourceId,
    status,
    records_ingested: recordsIngested,
    error_message: errorMessage,
  });
}

async function fetchJsonApiSource(
  source: CommoditySource,
  _supabase: ReturnType<typeof createClient>,
): Promise<{ prices: CommodityPriceInput[]; error: string | null }> {
  if (!source.exchange_id) return { prices: [], error: "No target exchange configured" };
  if (!source.url) return { prices: [], error: "No URL configured" };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (source.api_key_env) {
    const key = Deno.env.get(source.api_key_env);
    if (key) headers["Authorization"] = `Bearer ${key}`;
  }

  const resp = await fetch(source.url, { headers });
  if (!resp.ok) return { prices: [], error: `API fetch failed: ${resp.status}` };

  const data = await resp.json();
  const items: Record<string, unknown>[] = Array.isArray(data) ? data : (data.data || data.results || data.items || []);
  if (!Array.isArray(items)) return { prices: [], error: "API response is not an array" };

  const mapping = source.field_mapping || DEFAULT_MAPPING;
  const prices: CommodityPriceInput[] = [];

  for (const item of items) {
    const name = getField(item, mapping.commodity_name);
    const price = getField(item, mapping.price);
    const unit = getField(item, mapping.unit);
    const date = getField(item, mapping.recorded_date);
    const change = getField(item, mapping.change_pct);
    const minP = getField(item, "min_price");
    const maxP = getField(item, "max_price");

    if (!name || price === null || price === undefined) continue;

    prices.push({
      exchange_id: source.exchange_id,
      commodity_name: String(name),
      commodity_category: "Grain & Field Crops",
      unit: unit ? String(unit) : "ton",
      price: Number(price),
      min_price: minP !== null && minP !== undefined ? Number(minP) : null,
      max_price: maxP !== null && maxP !== undefined ? Number(maxP) : null,
      currency: "TRY",
      change_pct: change ? Number(change) : 0,
      recorded_date: date ? String(date) : new Date().toISOString().split("T")[0],
    });
  }

  return { prices, error: null };
}

async function fetchRssXmlSource(
  source: CommoditySource,
  _supabase: ReturnType<typeof createClient>,
): Promise<{ prices: CommodityPriceInput[]; error: string | null }> {
  if (!source.exchange_id) return { prices: [], error: "No target exchange configured" };
  if (!source.url) return { prices: [], error: "No URL configured" };

  const resp = await fetch(source.url);
  if (!resp.ok) return { prices: [], error: `XML fetch failed: ${resp.status}` };

  const xmlText = await resp.text();
  const prices: CommodityPriceInput[] = [];
  const mapping = source.field_mapping || DEFAULT_MAPPING;

  const itemRegex = /<(?:item|row|entry)[\s\S]*?<\/(?:item|row|entry)>/gi;
  const items = xmlText.match(itemRegex) || [];

  for (const itemXml of items) {
    const getTag = (tag: string): string | null => {
      const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, "i");
      const match = itemXml.match(regex);
      return match ? match[1].trim() : null;
    };

    const name = getTag(mapping.commodity_name);
    const priceStr = getTag(mapping.price);
    const unit = getTag(mapping.unit);
    const date = getTag(mapping.recorded_date);
    const changeStr = getTag(mapping.change_pct);
    const minStr = getTag("min_price");
    const maxStr = getTag("max_price");

    if (!name || !priceStr) continue;
    const price = parseFloat(priceStr.replace(/[^\d.-]/g, ""));
    if (isNaN(price)) continue;

    prices.push({
      exchange_id: source.exchange_id,
      commodity_name: name,
      commodity_category: "Grain & Field Crops",
      unit: unit || "ton",
      price,
      min_price: parsePrice(minStr),
      max_price: parsePrice(maxStr),
      currency: "TRY",
      change_pct: changeStr ? parseFloat(changeStr.replace(/[^\d.-]/g, "")) || 0 : 0,
      recorded_date: date || new Date().toISOString().split("T")[0],
    });
  }

  return { prices, error: null };
}

// ============================================================================
// TOBB HTML Scraper
// Scrapes TOBB's gecmis_fiyat1.php endpoint with POST form data
// Handles session cookies, user-agent headers, and respectful delays
// ============================================================================

function parseHtmlTable(html: string, mapping: FieldMapping): CommodityPriceInput[] {
  const prices: CommodityPriceInput[] = [];
  const exchangeId = mapping.tobb_exchange_code || "unknown";

  // Find all <tr> rows in the HTML
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = html.match(trRegex) || [];

  for (const row of rows) {
    // Extract all <td> cells from this row
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(row)) !== null) {
      // Strip HTML tags and decode entities
      const cellText = tdMatch[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      cells.push(cellText);
    }

    if (cells.length < 3) continue;

    // Try to identify columns by header keywords or by configured positions
    // Default column assumption for TOBB tables:
    // [0] = commodity name, [1] = min price, [2] = max price, [3] = avg price, [4] = unit, [5] = date
    // This can be overridden via field_mapping html_* keys

    const nameIdx = mapping.html_commodity_name ? parseInt(mapping.html_commodity_name) : 0;
    const minIdx = mapping.html_min_price ? parseInt(mapping.html_min_price) : 1;
    const maxIdx = mapping.html_max_price ? parseInt(mapping.html_max_price) : 2;
    const avgIdx = mapping.html_avg_price ? parseInt(mapping.html_avg_price) : 3;
    const unitIdx = mapping.html_unit ? parseInt(mapping.html_unit) : 4;
    const dateIdx = mapping.html_date ? parseInt(mapping.html_date) : 5;

    const name = cells[nameIdx] || null;
    const minPrice = parsePrice(cells[minIdx] || null);
    const maxPrice = parsePrice(cells[maxIdx] || null);
    const avgPrice = parsePrice(cells[avgIdx] || null);
    const unit = cells[unitIdx] || "ton";
    const date = parseDate(cells[dateIdx] || null);

    if (!name || avgPrice === null) continue;

    // Skip header rows
    if (name.toLowerCase().includes("ürün") || name.toLowerCase().includes("commodity") || name.toLowerCase().includes("toplam")) {
      continue;
    }

    prices.push({
      exchange_id: exchangeId,
      commodity_name: name,
      commodity_category: "Grain & Field Crops",
      unit,
      price: avgPrice,
      min_price: minPrice,
      max_price: maxPrice,
      currency: "TRY",
      change_pct: 0,
      recorded_date: date || new Date().toISOString().split("T")[0],
    });
  }

  return prices;
}

function formatDateForTobb(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

async function fetchTobbHtmlSource(
  source: CommoditySource,
  _supabase: ReturnType<typeof createClient>,
): Promise<{ prices: CommodityPriceInput[]; error: string | null }> {
  if (!source.exchange_id) return { prices: [], error: "No target exchange configured" };
  if (!source.url) return { prices: [], error: "No URL configured" };

  const mapping = source.field_mapping as FieldMapping;

  // Parse commodity codes to fetch
  const commodityCodes = (mapping.tobb_commodity_codes || "").split(",").map((c) => c.trim()).filter(Boolean);
  if (commodityCodes.length === 0) {
    return { prices: [], error: "No commodity codes configured in field_mapping.tobb_commodity_codes" };
  }

  // Determine date range
  const dateRange = mapping.tobb_date_range || "latest";
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (dateRange) {
    case "7days": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case "30days": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case "latest": startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  }

  const startDateStr = formatDateForTobb(startDate);
  const endDateStr = formatDateForTobb(endDate);

  // Form field names (configurable, with defaults matching TOBB's known parameters)
  const startField = mapping.tobb_start_date_field || "bas_tarih";
  const endField = mapping.tobb_end_date_field || "bit_tarih";
  const exchangeField = "borsa_kodu";
  const commodityField = "urun_kodu";
  const priceTypeField = "fiyat_tipi";
  const priceType = mapping.tobb_price_type || "1";

  // We need the actual exchange_id from the source to map to our database
  // The tobb_exchange_code in mapping tells us which TOBB exchange code to query
  // But our database exchange_id is source.exchange_id
  const dbExchangeId = source.exchange_id;

  const allPrices: CommodityPriceInput[] = [];
  let sessionCookies = "";

  for (let i = 0; i < commodityCodes.length; i++) {
    const commodityCode = commodityCodes[i];

    // Build POST body
    const formData = new URLSearchParams();
    formData.append(exchangeField, mapping.tobb_exchange_code || "0");
    formData.append(commodityField, commodityCode);
    formData.append(startField, startDateStr);
    formData.append(endField, endDateStr);
    formData.append(priceTypeField, priceType);

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": BROWSER_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "Origin": "https://www.tobb.org.tr",
      "Referer": source.url,
    };

    if (sessionCookies) {
      headers["Cookie"] = sessionCookies;
    }

    try {
      const resp = await fetch(source.url, {
        method: "POST",
        headers,
        body: formData.toString(),
      });

      // Capture session cookies
      const setCookie = resp.headers.get("set-cookie");
      if (setCookie) {
        const cookies = setCookie.split(",").map((c) => c.split(";")[0].trim()).join("; ");
        sessionCookies = sessionCookies ? `${sessionCookies}; ${cookies}` : cookies;
      }

      if (!resp.ok) {
        return { prices: [], error: `TOBB fetch failed for commodity ${commodityCode}: HTTP ${resp.status}` };
      }

      const html = await resp.text();

      // Parse the HTML table, but override the exchange_id with our database exchange_id
      // We need to temporarily set the exchange_id in the mapping
      const tobbMapping = { ...mapping, tobb_exchange_code: dbExchangeId };
      const pagePrices = parseHtmlTable(html, tobbMapping);

      // Remap exchange_id to the database exchange_id
      for (const p of pagePrices) {
        p.exchange_id = dbExchangeId;
      }

      allPrices.push(...pagePrices);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { prices: [], error: `TOBB fetch error for commodity ${commodityCode}: ${msg}` };
    }

    // Respectful delay: 1.5 seconds between requests
    if (i < commodityCodes.length - 1) {
      await sleep(1500);
    }
  }

  return { prices: allPrices, error: null };
}

async function ingestPrices(
  supabase: ReturnType<typeof createClient>,
  prices: CommodityPriceInput[],
): Promise<number> {
  if (prices.length === 0) return 0;

  const { data, error } = await supabase
    .from("commodity_prices")
    .upsert(prices, { onConflict: "exchange_id,commodity_name,recorded_date" })
    .select("id");

  if (error) throw error;
  return data?.length || 0;
}

async function updateExchangeLatestDate(
  supabase: ReturnType<typeof createClient>,
  exchangeId: string,
  prices: CommodityPriceInput[],
) {
  if (prices.length === 0) return;
  const latest = prices.reduce((max, p) =>
    new Date(p.recorded_date) > new Date(max) ? p.recorded_date : max
  , prices[0].recorded_date);

  await supabase
    .from("commodity_exchanges")
    .update({ latest_price_date: latest })
    .eq("id", exchangeId);
}

async function fetchSingleSource(
  source: CommoditySource,
  supabase: ReturnType<typeof createClient>,
): Promise<{ ingested: number; error: string | null }> {
  let result: { prices: CommodityPriceInput[]; error: string | null };

  if (source.source_type === "json_api") {
    result = await fetchJsonApiSource(source, supabase);
  } else if (source.source_type === "rss_xml") {
    result = await fetchRssXmlSource(source, supabase);
  } else if (source.source_type === "tobb_html") {
    result = await fetchTobbHtmlSource(source, supabase);
  } else {
    return { ingested: 0, error: "Manual JSON sources cannot be auto-fetched" };
  }

  if (result.error) {
    await writeLog(supabase, source.id, "failed", 0, result.error);
    return { ingested: 0, error: result.error };
  }

  try {
    const ingested = await ingestPrices(supabase, result.prices);
    if (source.exchange_id) {
      await updateExchangeLatestDate(supabase, source.exchange_id, result.prices);
    }
    await writeLog(supabase, source.id, "success", ingested, null);
    return { ingested, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeLog(supabase, source.id, "failed", 0, msg);
    return { ingested: 0, error: msg };
  }
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
    const { prices, apiUrl, apiKey, mode, sourceId } = body as {
      prices?: CommodityPriceInput[];
      apiUrl?: string;
      apiKey?: string;
      mode?: string;
      sourceId?: string;
    };

    // Mode: scheduled — fetch all active sources
    if (mode === "scheduled") {
      const { data: activeSources } = await supabase
        .from("commodity_sources")
        .select("*")
        .eq("is_active", true)
        .in("source_type", ["json_api", "rss_xml", "tobb_html"]);

      if (!activeSources || activeSources.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No active sources to fetch", results: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const results = [];
      for (const source of activeSources as CommoditySource[]) {
        const result = await fetchSingleSource(source, supabase);
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          ingested: result.ingested,
          error: result.error,
        });
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode: fetch single source by ID
    if (sourceId) {
      const { data: source } = await supabase
        .from("commodity_sources")
        .select("*")
        .eq("id", sourceId)
        .maybeSingle();

      if (!source) {
        return new Response(
          JSON.stringify({ error: "Source not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const result = await fetchSingleSource(source as CommoditySource, supabase);
      return new Response(
        JSON.stringify({
          success: result.error === null,
          ingested: result.ingested,
          error: result.error,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 1: Ingest prices directly (POST with prices array)
    if (prices && Array.isArray(prices) && prices.length > 0) {
      const valid = prices.filter((p) => p.exchange_id);

      if (valid.length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid prices with exchange_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const ingested = await ingestPrices(supabase, valid);
      return new Response(
        JSON.stringify({ success: true, ingested }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mode 2: Fetch from external API (POST with apiUrl)
    if (apiUrl) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      const resp = await fetch(apiUrl, { headers });
      if (!resp.ok) throw new Error(`External API fetch failed: ${resp.status}`);
      const data = await resp.json();

      return new Response(
        JSON.stringify({ success: true, source: apiUrl, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Provide 'prices' array, 'apiUrl', 'sourceId', or mode='scheduled' in request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
