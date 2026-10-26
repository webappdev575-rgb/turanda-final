import { authorizeStaff } from '../_shared/authorization.ts';
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";


// Edge function: generates AI thumbnails for news articles
// Supports batch mode: POST { batch: true } to process all articles without thumbnails

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const fallbacks = [
  'https://images.pexels.com/photos/18431220/pexels-photo-18431220.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/34632627/pexels-photo-34632627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33031012/pexels-photo-33031012.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13077531/pexels-photo-13077531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/10221672/pexels-photo-10221672.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/27037548/pexels-photo-27037548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33447908/pexels-photo-33447908.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8954984/pexels-photo-8954984.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/13065278/pexels-photo-13065278.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/9952172/pexels-photo-9952172.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

async function generateForArticle(
  supabase: SupabaseClient,
  article: { id: string; title: string; summary: string | null; category: string },
): Promise<string> {
  const categoryContext = article.category ? `Category: ${article.category}. ` : "";
  const summaryContext = article.summary ? article.summary.slice(0, 200) : "";
  const prompt = `A professional news thumbnail image for an agricultural news article. Title: "${article.title}". ${categoryContext}${summaryContext}. Style: realistic, editorial photography, agricultural setting, no text overlay, high quality.`;

  const aiKey = Deno.env.get("AI_IMAGE_API_KEY");
  const provider = Deno.env.get("AI_IMAGE_PROVIDER") || "openai";
  let imageUrl: string | null = null;

  if (aiKey) {
    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${aiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "dall-e-3", prompt: prompt.slice(0, 1000), size: "1024x576", quality: "standard", n: 1 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        imageUrl = data.data?.[0]?.url || null;
      }
    } else if (provider === "custom") {
      const customEndpoint = Deno.env.get("AI_IMAGE_ENDPOINT");
      if (customEndpoint) {
        const resp = await fetch(customEndpoint, {
          method: "POST",
          headers: { "Authorization": `Bearer ${aiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.slice(0, 1000), size: "1024x576" }),
        });
        if (resp.ok) {
          const data = await resp.json();
          imageUrl = data.url || data.image || data.data?.[0]?.url || null;
        }
      }
    }
  }

  if (!imageUrl) {
    const idx = parseInt(article.id.replace(/[^0-9]/g, '').slice(0, 6) || '0') % fallbacks.length;
    imageUrl = fallbacks[idx];
  }

  await supabase
    .from("news_articles")
    .update({ thumbnail_url: imageUrl, thumbnail_prompt: prompt })
    .eq("id", article.id);

  return imageUrl;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", Allow: "POST, OPTIONS" } });
  }
  if (!(await authorizeStaff(req, ['is_admin', 'is_moderator', 'is_editor']))) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));

    // Batch mode: process all articles without thumbnails
    if (body.batch === true) {
      const { data: articles, error: queryError } = await supabase
        .from("news_articles")
        .select("id, title, summary, category")
        .is("thumbnail_url", null)
        .order("published_at", { ascending: false })
        .limit(50);

      if (queryError) throw queryError;
      if (!articles || articles.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No articles without thumbnails", processed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const results: { id: string; thumbnail_url: string }[] = [];
      for (const article of articles) {
        const url = await generateForArticle(supabase, article);
        results.push({ id: article.id, thumbnail_url: url });
      }

      return new Response(
        JSON.stringify({ success: true, processed: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Single article mode
    const { article_id, title, summary, category } = body;
    if (!article_id || !title) {
      return new Response(
        JSON.stringify({ error: "article_id and title are required (or use { batch: true })" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = await generateForArticle(supabase, { id: article_id, title, summary: summary || null, category: category || "general" });

    return new Response(
      JSON.stringify({ success: true, thumbnail_url: url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Thumbnail generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
