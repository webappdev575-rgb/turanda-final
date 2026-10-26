'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { translateCommodity } from '@/lib/translations';
import type { CommodityPrice, CommodityRegistryEntry } from '@/hooks/use-commodities';
import { cn } from '@/lib/utils';

interface TickerItem {
  name: string;
  price: number;
  change: number;
}

function buildTickerItems(
  prices: CommodityPrice[],
  registry: CommodityRegistryEntry[],
): TickerItem[] {
  const visible = registry
    .filter((r) => r.is_visible)
    .sort((a, b) => a.display_order - b.display_order)
    .map((r) => r.commodity_name);
  const latest = new Map<string, CommodityPrice>();
  prices.forEach((p) => {
    const existing = latest.get(p.commodity_name);
    if (!existing || new Date(p.recorded_date) > new Date(existing.recorded_date)) {
      latest.set(p.commodity_name, p);
    }
  });
  return visible
    .map((name) => {
      const p = latest.get(name);
      return p ? { name: p.commodity_name, price: p.price / 1000, change: p.change_pct } : null;
    })
    .filter((i): i is TickerItem => !!i)
    .slice(0, 8);
}

/** Infinite horizontal ticker of live commodity prices above the market section. */
export function MarketTicker({
  prices,
  registry,
}: {
  prices: CommodityPrice[];
  registry: CommodityRegistryEntry[];
}) {
  const { locale } = useI18n();
  const [pause, setPause] = useState(false);

  const items = useMemo(() => buildTickerItems(prices, registry), [prices, registry]);

  // Pause rotation while hovering; CSS animation drives the scroll.
  useEffect(() => {
    // no-op — interaction handled via CSS class
  }, [pause]);

  if (items.length === 0) return null;

  const renderItems = (prefix: string) => (
    <>
      {items.map((item, i) => (
        <Link
          key={`${prefix}-${item.name}-${i}`}
          href="/commodities"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-80"
        >
          <span className="text-sm font-semibold text-[#c9e7b8]">
            {translateCommodity(item.name, locale)}
          </span>
          <span className="text-sm font-bold text-white">
            {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </span>
          {item.change >= 0 ? (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-white/60">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />+
              {item.change.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-red-300/70">
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
              {item.change.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </span>
          )}
        </Link>
      ))}
    </>
  );

  return (
    <div className="mb-6 rounded-2xl bg-evergreen shadow-[0px_2px_8px_-2px_#14563d1a] lg:mb-8">
      <div className="flex items-center px-4">
        <div
          className="group relative min-w-0 flex-1 overflow-hidden py-2.5"
          onMouseEnter={() => setPause(true)}
          onMouseLeave={() => setPause(false)}
        >
          <div
            className={cn(
              'flex w-max items-center gap-10 [animation:ticker-scroll_40s_linear_infinite]',
              pause && '[animation-play-state:paused]',
            )}
          >
            {renderItems('a')}
            {renderItems('b')}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#08271d] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#08271d] to-transparent" />
        </div>
      </div>
    </div>
  );
}
