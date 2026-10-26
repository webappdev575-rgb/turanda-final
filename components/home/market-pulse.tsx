'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronUp, TrendingUp, ExternalLink } from 'lucide-react';
import { useCommodities } from '@/hooks/use-commodities';
import { useNews } from '@/hooks/use-news';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';
import { translateCommodity, getCommodityIcon, setDynamicTranslationOverrides, setDynamicIconOverrides } from '@/lib/translations';
import { localizedNewsTitle, type NewsArticle as LocalizedNewsArticle } from '@/hooks/use-news';
import type { CommodityPrice, CommodityRegistryEntry } from '@/hooks/use-commodities';
import { IconRenderer } from '@/components/shared/icon-renderer';

const MIN_TERM_LENGTH = 3;

function buildTermSet(entry: CommodityRegistryEntry): string[] {
  const raw = [entry.commodity_name, entry.translation_tr, entry.translation_en, entry.translation_ar];
  return Array.from(
    new Set(
      raw
        .map((term) => term.trim().toLocaleLowerCase('tr'))
        .filter((term) => term.length >= MIN_TERM_LENGTH),
    ),
  );
}

function matchArticleToPrice(
  article: { title: string; title_en?: string | null; title_ar?: string | null; summary?: string | null; summary_en?: string | null; summary_ar?: string | null },
  registry: CommodityRegistryEntry[],
  latestPrices: Map<string, CommodityPrice>,
): CommodityPrice | null {
  if (latestPrices.size === 0 || registry.length === 0) return null;
  // Matching always uses the original text so commodity pairings stay
  // stable regardless of display language.
  const text = `${article.title} ${article.summary ?? ''}`.toLocaleLowerCase('tr');
  const sorted = [...registry].sort((a, b) => a.display_order - b.display_order);
  for (const entry of sorted) {
    if (!latestPrices.has(entry.commodity_name)) continue;
    const terms = buildTermSet(entry);
    if (terms.some((term) => text.includes(term))) {
      return latestPrices.get(entry.commodity_name) ?? null;
    }
  }
  return null;
}

export function MarketPulse() {
  const { prices, registry, iconOverrides, loading: pricesLoading } = useCommodities();
  const { articles, loading: newsLoading } = useNews();
  const { settings } = useSiteSettings();
  const { t, locale } = useI18n();

  // Collapse the static label shortly after load so the marquee gets the
  // full bar width.
  const [labelVisible, setLabelVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLabelVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setDynamicTranslationOverrides(registry);
  }, [registry]);

  useEffect(() => {
    setDynamicIconOverrides(iconOverrides);
  }, [iconOverrides]);

  const tickerCommodities = useMemo(() => {
    const featuredNames = registry.filter((r) => r.is_featured && r.is_visible).map((r) => r.commodity_name);
    const popularNames = featuredNames.length > 0 ? featuredNames : registry.filter((r) => r.is_visible).slice(0, 8).map((r) => r.commodity_name);
    const seen = new Map<string, typeof prices[0]>();
    prices.forEach((p) => {
      if (!popularNames.includes(p.commodity_name)) return;
      const existing = seen.get(p.commodity_name);
      if (!existing || new Date(p.recorded_date) > new Date(existing.recorded_date)) {
        seen.set(p.commodity_name, p);
      }
    });
    return popularNames
      .map((name) => seen.get(name))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [prices, registry]);

  const tickerNews = useMemo(() => {
    if (settings?.marquee_mode === 'manual') {
      if (settings.marquee_post_ids && settings.marquee_post_ids.length > 0) {
        const idSet = new Set(settings.marquee_post_ids);
        const picked = articles.filter((a) => idSet.has(a.id));
        picked.sort((a, b) => settings.marquee_post_ids.indexOf(a.id) - settings.marquee_post_ids.indexOf(b.id));
        return picked.slice(0, 5);
      }
      return [];
    }
    // Auto mode: prefer posts tagged for the marquee, else newest 1-2
    const tagged = articles.filter((a) => (a.display_locations ?? []).includes('marquee'));
    if (tagged.length > 0) return tagged.slice(0, 5);
    return articles.slice(0, 2);
  }, [articles, settings]);

  // Interleave: each commodity's price is followed by a headline mentioning it,
  // then leftover prices, then leftover headlines.
  const tickerItems = useMemo(() => {
    type Item =
      | { kind: 'commodity'; price: CommodityPrice }
      | { kind: 'news'; title: string; href: string; external: boolean };

    const latestPrices = new Map<string, CommodityPrice>();
    prices.forEach((p) => {
      const existing = latestPrices.get(p.commodity_name);
      if (!existing || new Date(p.recorded_date) > new Date(existing.recorded_date)) {
        latestPrices.set(p.commodity_name, p);
      }
    });

    const usedArticles = new Set<number>();
    const newsLink = (a: LocalizedNewsArticle) =>
      a.url && /^https?:\/\//.test(a.url)
        ? { href: a.url, external: true }
        : { href: '/haberler', external: false };
    const items: (
      | { kind: 'commodity'; price: CommodityPrice }
      | { kind: 'news'; title: string; href: string; external: boolean }
    )[] = [];

    tickerCommodities.forEach((c) => {
      items.push({ kind: 'commodity', price: c });
      const articleIndex = tickerNews.findIndex(
        (a, i) =>
          !usedArticles.has(i) &&
          matchArticleToPrice(a, registry, latestPrices)?.commodity_name === c.commodity_name,
      );
      if (articleIndex >= 0) {
        usedArticles.add(articleIndex);
        items.push({
          kind: 'news',
          title: localizedNewsTitle(tickerNews[articleIndex], locale),
          ...newsLink(tickerNews[articleIndex]),
        });
      }
    });

    tickerNews.forEach((a, i) => {
      if (!usedArticles.has(i)) {
        items.push({ kind: 'news', title: localizedNewsTitle(a, locale), ...newsLink(a) });
      }
    });

    return items;
  }, [tickerCommodities, tickerNews, prices, registry, locale]);

  const loading = pricesLoading || newsLoading;
  const hasContent = tickerCommodities.length > 0 || tickerNews.length > 0;

  if (loading && !hasContent) {
    return (
      <div className="bg-evergreen">
        <div className="mx-auto flex min-h-8 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
          <span className="text-[11px] font-semibold text-white/70">{t('pulse.subtitle')}</span>
        </div>
      </div>
    );
  }

  if (!hasContent) return null;

  const commodityItems = tickerItems.map((item, i) =>
    item.kind === 'commodity' ? (
      <Link
        key={`item-${i}`}
        href="/piyasalar"
        className="inline-flex items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-80"
      >
        <IconRenderer icon={getCommodityIcon(item.price.commodity_name)} className="h-3 w-3 text-[#c9e7b8]/80" fallback="Wheat" />
        <span className="font-semibold text-[#c9e7b8]">
          {translateCommodity(item.price.commodity_name, locale)} {item.price.price.toLocaleString('tr-TR')} ₺
        </span>
        <span className={cn(
          'font-semibold text-white/45',
          item.price.change_pct < 0 && 'text-red-300/70'
        )}>
          {item.price.change_pct > 0 ? '+' : ''}{item.price.change_pct.toLocaleString('tr-TR')}%
        </span>
      </Link>
    ) : (
      <a
        key={`item-${i}`}
        href={item.href}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
        className="group inline-flex items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-90"
      >
        <TrendingUp className="h-3 w-3 text-[#c9e7b8]/60" />
        <span className="font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline">
          {item.title}
        </span>
      </a>
    ),
  );

  const allItems = commodityItems;

  // Duplicate the list so the marquee loops seamlessly (translateX -50%)
  const renderTrack = () => (
    <div className="flex animate-ticker-scroll items-center gap-10 ticker-scroll-target">
      {allItems.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
      {allItems.map((item, i) => (
        <span key={`dup-${i}`}>{item}</span>
      ))}
    </div>
  );

  return (
    <div className="bg-evergreen">
      <div className="flex min-h-8 w-full items-center gap-4 px-4 sm:px-6">
        {/* Static label */}
        <div
          className={`inline-flex shrink-0 items-center gap-2 overflow-hidden transition-all duration-500 ease-in ${
            labelVisible ? 'max-w-[240px] translate-x-0 opacity-100' : 'max-w-0 -translate-x-full opacity-0'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 shrink-0 animate-fade-in text-[#c9e7b8]" />
          <span className="whitespace-nowrap text-[11px] font-semibold text-white/70 animate-slide-from-left">
            {t('pulse.subtitle')}
          </span>
        </div>

        {/* Scrolling marquee */}
        <div className="group relative flex min-w-0 flex-1 items-center overflow-hidden py-1 hover:[&_.ticker-scroll-target]:[animation-play-state:paused]">
          <div className="flex animate-fade-in items-center text-[11px] leading-[16px]">
            {renderTrack()}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#1a1d21] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#1a1d21] to-transparent" />
        </div>

        {/* Open market center */}
        <Link
          href="/piyasalar"
          className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-[#c9e7b8] transition-colors hover:text-white"
        >
          <span className="hidden sm:inline">{t('pulse.openMarket')}</span>
          <span className="sm:hidden">{t('pulse.openMarketShort')}</span>
          <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
