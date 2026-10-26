'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Locale } from '@/lib/i18n';

export interface NewsArticle {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  body_content_tr: string | null;
  body_content_en: string | null;
  body_content_ar: string | null;
  title_en: string | null;
  summary_en: string | null;
  title_ar: string | null;
  summary_ar: string | null;
  category: string;
  region: string;
  source: string | null;
  url: string | null;
  thumbnail_url: string | null;
  thumbnail_prompt: string | null;
  published_at: string;
  is_breaking?: boolean;
  agency_type?: string | null;
  sector?: string | null;
  source_key?: string | null;
  display_locations?: string[] | null;
  review_status?: string;
  ai_rewritten_at?: string | null;
  author_id?: string | null;
  submitted_by?: string | null;
  submitted_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  source_body?: string | null;
}

export type NewsDisplayLocation = 'market_news' | 'marquee' | 'homepage';

export interface ArticleCommodityPrice {
  commodity_name: string;
  unit: string | null;
  avg_price: number | null;
  latest_date: string | null;
}

// Picks the title/summary matching the visitor's language, falling back to
// the original text when no translation exists.
export function localizedNewsTitle(article: NewsArticle, locale: Locale): string {
  if (locale === 'en' && article.title_en) return article.title_en;
  if (locale === 'ar' && article.title_ar) return article.title_ar;
  return article.title;
}

export function localizedNewsSummary(article: NewsArticle, locale: Locale): string | null {
  if (locale === 'en' && article.summary_en) return article.summary_en;
  if (locale === 'ar' && article.summary_ar) return article.summary_ar;
  return article.summary;
}

export function localizedNewsBody(article: NewsArticle, locale: Locale): string | null {
  if (locale === 'en' && article.body_content_en) return article.body_content_en;
  if (locale === 'ar' && article.body_content_ar) return article.body_content_ar;
  return article.body_content_tr;
}

export function articleHref(article: Pick<NewsArticle, 'id' | 'slug'>): string {
  return article.slug ? `/haberler/${article.slug}` : `/haberler/a-${article.id}`;
}

// National-average price for one commodity: latest recorded date across all
// exchanges, averaged. Returns null when no price data exists yet.
export function useNationalAveragePrice(commodityName: string | null) {
  const [price, setPrice] = useState<ArticleCommodityPrice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!commodityName) {
      setPrice(null);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('commodity_prices')
        .select('commodity_name, unit, price, recorded_date')
        .eq('commodity_name', commodityName)
        .order('recorded_date', { ascending: false })
        .limit(40);
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setPrice(null);
        setLoading(false);
        return;
      }
      const latestDate = data[0].recorded_date;
      const latest = data.filter((p) => p.recorded_date === latestDate);
      const avg = latest.reduce((s, p) => s + Number(p.price), 0) / latest.length;
      setPrice({
        commodity_name: commodityName,
        unit: latest[0].unit ?? null,
        avg_price: Math.round(avg * 100) / 100,
        latest_date: latestDate,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [commodityName]);

  return { price, loading };
}

// All commodities linked to an article, each with its national-average price.
export function useArticleCommodityPrices(articleId: string | null) {
  const [items, setItems] = useState<ArticleCommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!articleId) {
      setItems([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data: links, error } = await supabase
        .from('news_article_commodities')
        .select('commodity_name')
        .eq('article_id', articleId);
      if (cancelled) return;
      if (error || !links || links.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const names = links.map((l) => l.commodity_name);
      const { data: prices } = await supabase
        .from('commodity_prices')
        .select('commodity_name, unit, price, recorded_date')
        .in('commodity_name', names)
        .order('recorded_date', { ascending: false })
        .limit(200);
      if (cancelled) return;

      const result: ArticleCommodityPrice[] = [];
      for (const name of names) {
        const rows = (prices ?? []).filter((p) => p.commodity_name === name);
        if (rows.length === 0) continue;
        const latestDate = rows[0].recorded_date;
        const latest = rows.filter((p) => p.recorded_date === latestDate);
        const avg = latest.reduce((s, p) => s + Number(p.price), 0) / latest.length;
        result.push({
          commodity_name: name,
          unit: latest[0].unit ?? null,
          avg_price: Math.round(avg * 100) / 100,
          latest_date: latestDate,
        });
      }
      setItems(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return { items, loading };
}

export function useNews(region?: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('news_articles')
        .select('*')
        .order('is_breaking', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(20);
      if (region && region !== 'all') {
        query = query.or('region.eq.all,region.eq.' + encodeURIComponent(region));
      }
      const { data, error: err } = await query;
      if (err) {
        setError(err.message);
      } else {
        setArticles((data as NewsArticle[]) ?? []);
      }
      setLoading(false);
    };
    fetchNews();
  }, [region]);

  return { articles, loading, error };
}

export function useGovNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('news_articles')
        .select('*')
        .not('source_key', 'is', null)
        .order('published_at', { ascending: false })
        .limit(100);
      if (err) {
        setError(err.message);
      } else {
        setArticles((data as NewsArticle[]) ?? []);
      }
      setLoading(false);
    };
    fetchNews();
  }, []);

  return { articles, loading, error };
}

// Fetches one article by slug or fallback id ("a-<uuid>"). Approved articles
// only for the public; the RLS layer also hides drafts from non-staff.
export function useNewsArticle(slugOrId: string) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setArticle(null);
      const id = slugOrId.startsWith('a-') ? slugOrId.slice(2) : null;
      let query = supabase.from('news_articles').select('*');
      query = id ? query.eq('id', id) : query.eq('slug', slugOrId);
      const { data, error: err } = await query.maybeSingle();
      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else if (!data) {
        setError('not_found');
      } else {
        setArticle(data as NewsArticle);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  return { article, loading, error };
}
