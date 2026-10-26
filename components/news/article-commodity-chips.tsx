'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import {
  useArticleCommodityPrices,
} from '@/hooks/use-news';
import { useI18n } from '@/components/i18n-provider';
import { translateCommodity } from '@/lib/translations';

// Clickable chips showing the national-average price for each commodity
// mentioned in an article. Prices are joined live so old articles stay current.
export function ArticleCommodityChips({ articleId }: { articleId: string }) {
  const { locale, t } = useI18n();
  const { items, loading } = useArticleCommodityPrices(articleId);

  const fmt = (value: number, unit: string | null) => {
    const formatted = value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Official quoting units (e.g. ton/litre-based registry units) are shown per kilo for readability.
    const perKilo = unit && !unit.toLowerCase().includes('kg');
    return perKilo ? `${formatted} ₺/kg` : `${formatted} ₺/${unit ?? 'kg'}`;
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="h-8 w-40 animate-pulse rounded-full bg-muted" />
        <span className="h-8 w-32 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <div className="my-6 rounded-2xl border border-border bg-muted/30 p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('news.priceChipsTitle')}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.commodity_name}
            href={`/piyasalar?commodity=${encodeURIComponent(item.commodity_name)}`}
            className="group inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background px-3.5 py-1.5 transition-all hover:border-primary hover:bg-primary/5"
          >
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {translateCommodity(item.commodity_name, locale)}
            </span>
            {item.avg_price !== null && (
              <span className="text-xs font-bold text-primary">
                {fmt(item.avg_price, item.unit)}
              </span>
            )}
            <span className="text-[9px] leading-none text-muted-foreground">
              {t('news.nationalAverage')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}