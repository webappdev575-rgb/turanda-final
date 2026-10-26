'use client';

import Image from 'next/image';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, TrendingDown, Star, Search } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '@/components/i18n-provider';
import { useTheme } from '@/components/theme-provider';
import { useCommodities, type CommodityExchange, type CommodityPrice } from '@/hooks/use-commodities';
import { useMarketFavorites } from '@/hooks/use-market-favorites';
import {
  translateCommodity,
  setDynamicTranslationOverrides,
  setDynamicIconOverrides,
  getCommodityIcon,
} from '@/lib/translations';
import { IconRenderer } from '@/components/shared/icon-renderer';
import { cn } from '@/lib/utils';

/* Screenshot palette */
const C = {
  dark: {
    panel: '#0d2a20',
    panelSoft: '#ffffff0d',
    panelSofter: '#ffffff14',
    divider: '#ffffff1a',
    accent: '#c9e7b8',
    accentSoft: '#c9e7b826',
    onAccent: '#08271d',
    textPrimary: '#ffffff',
    textMuted: '#ffffff99',
    textFaint: '#ffffff73',
    grid: '#ffffff14',
    axis: '#ffffff8c',
    axisLine: '#ffffff26',
    tooltipBg: '#08271de6',
    down: '#f4e7bd',
    downLine: '#f87171',
  },
  light: {
    panel: '#f5f2e8',
    panelSoft: '#0d2a200d',
    panelSofter: '#0d2a2014',
    divider: '#0d2a201f',
    accent: 'hsl(156 62% 20%)',
    accentSoft: 'hsl(156 62% 20% / 0.15)',
    onAccent: '#ffffff',
    textPrimary: '#12241c',
    textMuted: '#12241cb3',
    textFaint: '#12241c80',
    grid: '#0d2a2014',
    axis: '#12241c99',
    axisLine: '#0d2a2026',
    tooltipBg: '#0d2a21f2',
    down: '#a06514',
    downLine: '#b91c1c',
  },
} as const;

export type TimeRange = '1d' | '5d' | '1m' | '6m' | 'ytd' | '1y' | '5y';
const TIME_RANGES: TimeRange[] = ['1d', '5d', '1m', '6m', 'ytd', '1y', '5y'];

type ChartType = 'area' | 'line' | 'rangeband' | 'rangebar';

interface ChartPoint {
  date: string;
  price: number;
  minPrice: number | null;
  maxPrice: number | null;
  change: number;
}

function CommodityIcon({ name, className }: { name: string; className?: string }) {
  const iconInfo = getCommodityIcon(name);
  return <IconRenderer icon={iconInfo} className={className} fallback="Wheat" />;
}

function filterByTimeRange(data: ChartPoint[], range: TimeRange): ChartPoint[] {
  if (data.length === 0) return data;
  const now = new Date();
  const cutoff = new Date(now);
  switch (range) {
    case '1d': cutoff.setDate(now.getDate() - 1); break;
    case '5d': cutoff.setDate(now.getDate() - 5); break;
    case '1m': cutoff.setMonth(now.getMonth() - 1); break;
    case '6m': cutoff.setMonth(now.getMonth() - 6); break;
    case 'ytd': cutoff.setMonth(0); cutoff.setDate(1); break;
    case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
    case '5y': cutoff.setFullYear(now.getFullYear() - 5); break;
  }
  const filtered = data.filter((d) => new Date(d.date) >= cutoff);
  return filtered.length > 0 ? filtered : data;
}

const MONTH_NAMES: Record<string, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
};

function formatDate(dateStr: string, range: TimeRange, locale: string) {
  const d = new Date(dateStr);
  const months = MONTH_NAMES[locale] ?? MONTH_NAMES.tr;
  if (range === '1d' || range === '5d' || range === '1m') {
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  if (range === '5y') {
    return `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  }
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function changeFromSeries(pts: { price: number }[]): number {
  if (pts.length === 0) return 0;
  const current = pts[pts.length - 1].price;
  const previous = pts.length > 1 ? pts[pts.length - 2].price : current;
  return previous > 0 ? Math.round(((current - previous) / previous) * 10000) / 100 : 0;
}

type UnitDisplay = 'kilo' | 'official';
type SparkMode = 'daily' | 'weekly';

// Everyday display: tons become ₺/kilo; litres/kg/adet stay as quoted.
function displayUnit(unit: string): { divisor: number; label: string } {
  if (unit === 'ton') return { divisor: 1000, label: 'kilo' };
  return { divisor: 1, label: unit };
}

function Sparkline({ points, color, mode }: { points: { date: string; price: number }[]; color: string; mode: SparkMode }) {
  let series = points.slice(-14);
  if (mode === 'weekly') {
    const byWeek = new Map<string, number[]>();
    points.forEach((p) => {
      const d = new Date(p.date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      const arr = byWeek.get(key) ?? [];
      arr.push(p.price);
      byWeek.set(key, arr);
    });
    series = Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, ps]) => ({ date, price: ps.reduce((s, v) => s + v, 0) / ps.length }));
  }
  if (series.length < 2) return null;
  const values = series.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 56;
  const h = 18;
  const path = series
    .map((p, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((p.price - min) / span) * (h - 2) - 1;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function MarketPanel() {
  const { exchanges, prices, registry, iconOverrides, commodityCategories, loading } = useCommodities();
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const { favorites, toggle, ready: favsReady } = useMarketFavorites();
  const searchParams = useSearchParams();
  const urlCommodity = searchParams.get('commodity');

  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [unitDisplay, setUnitDisplay] = useState<UnitDisplay>('kilo');
  const [sparkMode, setSparkMode] = useState<SparkMode>('daily');

  useEffect(() => {
    setDynamicTranslationOverrides(registry);
  }, [registry]);

  useEffect(() => {
    setDynamicIconOverrides(iconOverrides);
  }, [iconOverrides]);

  const pal = theme === 'dark' ? C.dark : C.light;

  const categoryLabel = (key: string): string => {
    const cat = commodityCategories.find((c) => c.key === key);
    if (cat) return cat[`translation_${locale}` as 'translation_tr'] || key;
    return key;
  };

  const dailyAvgSeries = useMemo(() => {
    const byName = new Map<string, Map<string, number[]>>();
    prices.forEach((p) => {
      if (selectedExchange !== 'all' && p.exchange_id !== selectedExchange) return;
      let byDate = byName.get(p.commodity_name);
      if (!byDate) {
        byDate = new Map();
        byName.set(p.commodity_name, byDate);
      }
      const arr = byDate.get(p.recorded_date) ?? [];
      arr.push(p.price);
      byDate.set(p.recorded_date, arr);
    });
    const series = new Map<string, { date: string; price: number }[]>();
    byName.forEach((byDate, name) => {
      series.set(
        name,
        Array.from(byDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, ps]) => ({
            date,
            price: Math.round((ps.reduce((s, v) => s + v, 0) / ps.length) * 100) / 100,
          })),
      );
    });
    return series;
  }, [prices, selectedExchange]);

  const commoditiesList = useMemo(() => {
    const filtered = prices.filter((p) => selectedExchange === 'all' || p.exchange_id === selectedExchange);
    const seen = new Map<string, CommodityPrice>();
    filtered.forEach((p) => {
      const existing = seen.get(p.commodity_name);
      if (!existing || new Date(p.recorded_date) > new Date(existing.recorded_date)) {
        seen.set(p.commodity_name, p);
      }
    });
    let list = Array.from(seen.values()).map((p) => ({
      name: p.commodity_name,
      category: p.commodity_category,
      price: p.price,
      change: changeFromSeries(dailyAvgSeries.get(p.commodity_name) ?? []),
      unit: p.unit,
    })).sort((a, b) => b.price - a.price);

    const visibleNames = registry.filter((r) => r.is_visible).map((r) => r.commodity_name);
    if (visibleNames.length > 0) {
      list = list.filter((c) => visibleNames.includes(c.name));
      list.sort((a, b) => {
        const aOrder = registry.find((r) => r.commodity_name === a.name)?.display_order ?? 999;
        const bOrder = registry.find((r) => r.commodity_name === b.name)?.display_order ?? 999;
        return aOrder - bOrder;
      });
    }
    return list;
  }, [prices, selectedExchange, registry, dailyAvgSeries]);

  const filteredCommodities = useMemo(() => {
    if (!search) return commoditiesList;
    const q = search.toLowerCase();
    return commoditiesList.filter(
      (c) => c.name.toLowerCase().includes(q) || translateCommodity(c.name, locale).toLowerCase().includes(q),
    );
  }, [commoditiesList, search, locale]);

  useEffect(() => {
    if (filteredCommodities.length > 0) {
      if (urlCommodity && filteredCommodities.some((c) => c.name === urlCommodity)) {
        if (selectedCommodity !== urlCommodity) setSelectedCommodity(urlCommodity);
        return;
      }
      if (!filteredCommodities.some((c) => c.name === selectedCommodity)) {
        setSelectedCommodity(filteredCommodities[0].name);
      }
    } else if (selectedCommodity) {
      setSelectedCommodity('');
    }
  }, [filteredCommodities, selectedCommodity, urlCommodity]);

  const favoriteCommodities = useMemo(
    () => favorites.commodity.filter((name) => commoditiesList.some((c) => c.name === name)),
    [favorites.commodity, commoditiesList],
  );
  const favoriteExchanges = useMemo(
    () => favorites.exchange
      .map((id) => exchanges.find((e) => e.id === id))
      .filter((e): e is CommodityExchange => Boolean(e)),
    [favorites.exchange, exchanges],
  );

  const allChartData: ChartPoint[] = useMemo(() => {
    if (!selectedCommodity) return [];
    const commodityPrices = prices
      .filter(
        (p) =>
          p.commodity_name === selectedCommodity &&
          (selectedExchange === 'all' || p.exchange_id === selectedExchange),
      )
      .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());

    const byDate = new Map<string, { prices: number[]; mins: number[]; maxs: number[] }>();
    commodityPrices.forEach((p) => {
      const entry = byDate.get(p.recorded_date) ?? { prices: [], mins: [], maxs: [] };
      entry.prices.push(p.price);
      if (p.min_price !== null) entry.mins.push(p.min_price);
      if (p.max_price !== null) entry.maxs.push(p.max_price);
      byDate.set(p.recorded_date, entry);
    });

    let prevAvg = 0;
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entry]) => {
        const avg = entry.prices.reduce((s, v) => s + v, 0) / entry.prices.length;
        const change = prevAvg > 0 ? ((avg - prevAvg) / prevAvg) * 100 : 0;
        prevAvg = avg;
        return {
          date,
          price: Math.round(avg * 100) / 100,
          minPrice: entry.mins.length > 0 ? Math.round(Math.min(...entry.mins) * 100) / 100 : null,
          maxPrice: entry.maxs.length > 0 ? Math.round(Math.max(...entry.maxs) * 100) / 100 : null,
          change: Math.round(change * 100) / 100,
        };
      });
  }, [prices, selectedCommodity, selectedExchange]);

  const chartData = useMemo(() => filterByTimeRange(allChartData, timeRange), [allChartData, timeRange]);

  const hasRangeData = useMemo(
    () => chartData.some((d) => d.minPrice !== null && d.maxPrice !== null),
    [chartData],
  );

  const effectiveChartType: ChartType =
    (chartType === 'rangebar' || chartType === 'rangeband') && !hasRangeData ? 'area' : chartType;

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const arr = chartData.map((d) => d.price);
    const current = arr[arr.length - 1];
    const previous = arr[arr.length - 2] ?? current;
    return {
      current,
      change: previous > 0 ? ((current - previous) / previous) * 100 : 0,
      high: Math.max(...arr),
      low: Math.min(...arr),
      avg: arr.reduce((s, v) => s + v, 0) / arr.length,
    };
  }, [chartData]);

  const selectedCommodityData = commoditiesList.find((c) => c.name === selectedCommodity);
  const isFavCommodity = favsReady ? favorites.commodity.includes(selectedCommodity) : false;
  const isExchangeFav = (id: string) => favsReady && favorites.exchange.includes(id);

  const filteredExchanges = useMemo(() => {
    if (!search) return exchanges;
    const q = search.toLowerCase();
    return exchanges.filter(
      (ex) => ex.name.toLowerCase().includes(q) || ex.city.toLowerCase().includes(q),
    );
  }, [exchanges, search]);

  const formatAxisDate = (dateStr: string) => formatDate(dateStr, timeRange, locale);

  const fmt = (value: number) =>
    value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rangeSpan = chartData.length > 1
    ? Math.max(...chartData.map((d) => d.price)) - Math.min(...chartData.map((d) => d.price))
    : 0;
  const yPadding = rangeSpan > 0 ? rangeSpan * 0.35 : Math.max((stats?.current ?? 1) * 0.08, 0.5);

  const up = (stats?.change ?? 0) >= 0;
  const chartColor = up ? pal.accent : pal.downLine;
  const TrendIcon = up ? TrendingUp : TrendingDown;

  const chartTypeButtons: { type: ChartType; label: string; disabled: boolean }[] = [
    { type: 'area', label: t('com.chartType.area') as string, disabled: false },
    { type: 'line', label: t('com.chartType.line') as string, disabled: false },
    ...(selectedExchange === 'all'
      ? [{ type: 'rangeband' as ChartType, label: t('com.chartType.rangeband') as string, disabled: !hasRangeData }]
      : [{ type: 'rangebar' as ChartType, label: t('com.chartType.rangebar') as string, disabled: !hasRangeData }]),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl shadow-xl" style={{ backgroundColor: pal.panel }}>
      {/* Favorites chips */}
      {favsReady && (favoriteCommodities.length > 0 || favoriteExchanges.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-7">
          {favoriteCommodities.map((name) => (
            <button
              key={`c-${name}`}
              type="button"
              onClick={() => setSelectedCommodity(name)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03]',
              )}
              style={{
                backgroundColor: selectedCommodity === name ? pal.accent : pal.panelSofter,
                color: selectedCommodity === name ? pal.onAccent : pal.textPrimary,
              }}
            >
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              {translateCommodity(name, locale)}
            </button>
          ))}
          {favoriteExchanges.map((ex) => (
            <button
              key={`e-${ex.id}`}
              type="button"
              onClick={() => setSelectedExchange(ex.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03]"
              style={{
                backgroundColor: selectedExchange === ex.id ? pal.accent : pal.panelSofter,
                color: selectedExchange === ex.id ? pal.onAccent : pal.textPrimary,
              }}
            >
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              {ex.short_name || ex.city}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4">
        {/* Commodity list sidebar */}
        <div className="min-w-0 border-b border-[color:var(--divider)] lg:border-b-0 lg:border-r" style={{ borderColor: pal.divider }}>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: pal.textFaint }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('com.searchCommodity') as string}
                className="w-full rounded-lg py-2 pl-8 pr-3 text-xs outline-none transition-colors"
                style={{ backgroundColor: pal.panelSoft, color: pal.textPrimary, border: `1px solid ${pal.divider}` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: pal.panelSofter }}>
                {(['kilo', 'official'] as UnitDisplay[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setUnitDisplay(mode)}
                    aria-pressed={unitDisplay === mode}
                    className="rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
                    style={{
                      backgroundColor: unitDisplay === mode ? pal.accent : 'transparent',
                      color: unitDisplay === mode ? pal.onAccent : pal.textMuted,
                    }}
                  >
                    {mode === 'kilo' ? '₺/Kilo' : '₺/Ton'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: pal.panelSofter }}>
                {(['daily', 'weekly'] as SparkMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSparkMode(mode)}
                    aria-pressed={sparkMode === mode}
                    className="rounded-md px-2 py-1 text-[10px] font-semibold transition-colors"
                    style={{
                      backgroundColor: sparkMode === mode ? pal.accent : 'transparent',
                      color: sparkMode === mode ? pal.onAccent : pal.textMuted,
                    }}
                  >
                    {mode === 'daily' ? (t('com.1d') as string) : (t('com.1w') as string)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="max-h-[430px] overflow-y-auto px-2 pb-2 scrollbar-hide">
            {filteredCommodities.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs" style={{ color: pal.textFaint }}>
                {t('com.noData') as string}
              </div>
            ) : (
              filteredCommodities.map((commodity) => {
                const isActive = selectedCommodity === commodity.name;
                const favd = favsReady && favorites.commodity.includes(commodity.name);
                return (
                  <div
                    key={commodity.name}
                    className={cn(
                      'group flex w-full items-center gap-1 rounded-xl px-2 py-2 transition-colors',
                      isActive ? '' : 'hover:bg-[color:var(--panel-soft)]',
                    )}
                    style={{ backgroundColor: isActive ? pal.panelSofter : undefined }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCommodity(commodity.name)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <CommodityIcon name={commodity.name} className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium"
                          style={{ color: isActive ? pal.accent : pal.textPrimary }}
                        >
                          {translateCommodity(commodity.name, locale)}
                        </p>
                        <p className="text-[10px]" style={{ color: pal.textFaint }}>
                          {categoryLabel(commodity.category)}
                        </p>
                      </div>
                      <Sparkline
                        points={dailyAvgSeries.get(commodity.name) ?? []}
                        color={commodity.change >= 0 ? pal.accent : pal.downLine}
                        mode={sparkMode}
                      />
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums" style={{ color: pal.textPrimary }}>
                          {(() => {
                            const du = displayUnit(commodity.unit);
                            const useKilo = unitDisplay === 'kilo' && commodity.unit === 'ton';
                            const value = useKilo ? commodity.price / 1000 : commodity.price;
                            return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          })()}
                        </p>
                        <p className="text-[9px] leading-3" style={{ color: pal.textFaint }}>
                          ₺/{unitDisplay === 'kilo' && commodity.unit === 'ton' ? 'kilo' : commodity.unit}
                        </p>
                        <p
                          className="flex items-center justify-end gap-0.5 text-[10px] font-medium"
                          style={{ color: commodity.change >= 0 ? pal.accent : pal.down }}
                        >
                          {commodity.change > 0 ? '+' : ''}
                          {commodity.change.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={favd ? t('mkt.unfavorite') as string : t('mkt.favorite') as string}
                      onClick={() => toggle('commodity', commodity.name)}
                      className="shrink-0 rounded-full p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn('h-3.5 w-3.5 transition-colors', favd && 'fill-current')}
                        style={{ color: favd ? pal.accent : pal.textFaint }}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart area */}
        <div className="min-w-0 lg:col-span-3">
          <div className="flex min-h-[280px] flex-col px-5 pb-5 pt-4 sm:px-7">
            {selectedCommodityData && stats ? (
              <article className="flex shrink-0 flex-wrap items-end justify-between gap-3 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CommodityIcon name={selectedCommodityData.name} className="h-5 w-5" />
                    <h2 className="text-lg font-bold" style={{ color: pal.textPrimary }}>
                      {translateCommodity(selectedCommodityData.name, locale)}
                    </h2>
                    <button
                      type="button"
                      aria-label={isFavCommodity ? t('mkt.unfavorite') as string : t('mkt.favorite') as string}
                      onClick={() => toggle('commodity', selectedCommodityData.name)}
                      className="rounded-full p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn('h-4 w-4 transition-colors', isFavCommodity && 'fill-current')}
                        style={{ color: isFavCommodity ? pal.accent : pal.textFaint }}
                      />
                    </button>
                  </div>
                  <p className="pt-0.5 text-xs" style={{ color: pal.textFaint }}>
                    {categoryLabel(selectedCommodityData.category)} · {selectedCommodityData.unit} ·{' '}
                    {selectedExchange === 'all'
                      ? (t('com.allExchanges') as string)
                      : exchanges.find((e) => e.id === selectedExchange)?.short_name}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex flex-col items-start">
                    <p
                      className="text-3xl font-bold leading-9 tracking-[-0.9px] tabular-nums sm:text-4xl sm:leading-10"
                      style={{ color: pal.textPrimary }}
                    >
                      {(() => {
                        const useKilo = unitDisplay === 'kilo' && selectedCommodityData.unit === 'ton';
                        return fmt(useKilo ? stats.current / 1000 : stats.current);
                      })()}
                    </p>
                    <p className="pt-1 text-xs" style={{ color: pal.textFaint }}>
                      ₺ / {unitDisplay === 'kilo' && selectedCommodityData.unit === 'ton'
                        ? 'kilo'
                        : selectedCommodityData.unit}
                    </p>
                    {unitDisplay === 'kilo' && selectedCommodityData.unit === 'ton' && (
                      <p className="pt-0.5 text-[10px]" style={{ color: pal.textFaint }}>
                        {fmt(stats.current)} ₺/ton
                      </p>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: pal.accentSoft }}
                  >
                    <TrendIcon
                      className="h-3.5 w-3.5"
                      style={{ color: up ? pal.accent : pal.down }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-bold" style={{ color: up ? pal.accent : pal.down }}>
                      {up ? '+' : ''}
                      %{stats.change.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-xs" style={{ color: pal.textFaint }}>
                      {t('home.today') as string}
                    </span>
                  </span>
                </div>
              </article>
            ) : (
              <div className="pb-3" />
            )}

            {/* Chart panel */}
            <figure
              className="flex min-h-[300px] w-full flex-1 flex-col rounded-2xl p-3"
              style={{ backgroundColor: pal.panelSoft }}
            >
              <figcaption className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: pal.panelSofter }}>
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTimeRange(range)}
                      aria-pressed={timeRange === range}
                      className="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
                      style={{
                        backgroundColor: timeRange === range ? pal.accent : 'transparent',
                        color: timeRange === range ? pal.onAccent : pal.textMuted,
                      }}
                    >
                      {t(`com.${range}` as 'com.1d') as string}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedExchange}
                    onChange={(e) => setSelectedExchange(e.target.value)}
                    aria-label={t('com.selectExchange') as string}
                    className="rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none"
                    style={{ backgroundColor: pal.panelSofter, color: pal.textPrimary, border: `1px solid ${pal.divider}` }}
                  >
                    <option value="all">{t('com.allExchanges') as string}</option>
                    {exchanges.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.short_name} — {ex.city}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: pal.panelSofter }}>
                    {chartTypeButtons.map((btn) => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => !btn.disabled && setChartType(btn.type)}
                        disabled={btn.disabled}
                        title={btn.label}
                        aria-pressed={effectiveChartType === btn.type}
                        className={cn(
                          'rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
                          btn.disabled && 'cursor-not-allowed opacity-30',
                        )}
                        style={{
                          backgroundColor: effectiveChartType === btn.type ? pal.accent : 'transparent',
                          color: effectiveChartType === btn.type ? pal.onAccent : pal.textMuted,
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </figcaption>

              <div className="relative mt-1 h-[280px] w-full">
                {chartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {effectiveChartType === 'area' ? (
                      <AreaChart
                        key={`area-${selectedCommodity}-${selectedExchange}`}
                        data={chartData}
                        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="mktAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={pal.grid} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatAxisDate}
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={{ stroke: pal.axisLine }}
                          tickLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={46}
                          domain={[`dataMin - ${yPadding}`, `dataMax + ${yPadding}`]}
                          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload as ChartPoint;
                            return (
                              <div
                                className="rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
                                style={{ backgroundColor: pal.tooltipBg, color: '#ffffff' }}
                              >
                                <span className="font-bold">{fmt(point.price)} ₺</span>
                                <span className="ml-1.5 opacity-70">{formatAxisDate(String(label))}</span>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={chartColor}
                          strokeWidth={2.5}
                          fill="url(#mktAreaFill)"
                          dot={{ r: 2.5, fill: chartColor, strokeWidth: 0 }}
                          activeDot={{ r: 4, fill: chartColor, stroke: pal.panel, strokeWidth: 2 }}
                          isAnimationActive
                          animationDuration={450}
                        />
                      </AreaChart>
                    ) : effectiveChartType === 'line' ? (
                      <ComposedChart
                        key={`line-${selectedCommodity}-${selectedExchange}`}
                        data={chartData}
                        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid stroke={pal.grid} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatAxisDate}
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={{ stroke: pal.axisLine }}
                          tickLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={46}
                          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload as ChartPoint;
                            return (
                              <div
                                className="rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
                                style={{ backgroundColor: pal.tooltipBg, color: '#ffffff' }}
                              >
                                <span className="font-bold">{fmt(point.price)} ₺</span>
                                <span className="ml-1.5 opacity-70">{formatAxisDate(String(label))}</span>
                              </div>
                            );
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={chartColor}
                          strokeWidth={2.5}
                          dot={{ r: 2.5, fill: chartColor, strokeWidth: 0 }}
                          activeDot={{ r: 4, fill: chartColor, stroke: pal.panel, strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    ) : effectiveChartType === 'rangebar' ? (
                      <ComposedChart
                        key={`rangebar-${selectedCommodity}-${selectedExchange}`}
                        data={chartData}
                        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid stroke={pal.grid} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatAxisDate}
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={{ stroke: pal.axisLine }}
                          tickLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={46}
                          domain={[`dataMin - ${yPadding}`, `dataMax + ${yPadding}`]}
                          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload as ChartPoint;
                            return (
                              <div
                                className="rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
                                style={{ backgroundColor: pal.tooltipBg, color: '#ffffff' }}
                              >
                                <span className="font-bold">{fmt(point.price)} ₺</span>
                                <span className="ml-1.5 opacity-70">{formatAxisDate(String(label))}</span>
                                {point.minPrice !== null && point.maxPrice !== null && (
                                  <span className="ml-1.5 opacity-70">
                                    L {fmt(point.minPrice)} / H {fmt(point.maxPrice)}
                                  </span>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="maxPrice" fill={chartColor} opacity={0.01} shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: ChartPoint }) => {
                          const { x, y, width, height, payload } = props;
                          if (!x || !y || !width || !height || !payload?.minPrice || !payload?.maxPrice) return <g />;
                          const cx = x + width / 2;
                          const range = payload.maxPrice - payload.minPrice || 1;
                          const avgRatio = (payload.price - payload.minPrice) / range;
                          const avgY = y + height - avgRatio * height;
                          return (
                            <g>
                              <line x1={cx} y1={y} x2={cx} y2={y + height} stroke={chartColor} strokeWidth={1.5} />
                              <line x1={cx - 6} y1={avgY} x2={cx + 6} y2={avgY} stroke={chartColor} strokeWidth={2.5} />
                            </g>
                          );
                        }} />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={chartColor}
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 4, fill: chartColor, stroke: pal.panel, strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    ) : (
                      <ComposedChart
                        key={`rangeband-${selectedCommodity}-${selectedExchange}`}
                        data={chartData}
                        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="mktBandFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.18} />
                            <stop offset="100%" stopColor={chartColor} stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={pal.grid} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatAxisDate}
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={{ stroke: pal.axisLine }}
                          tickLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: pal.axis, fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={46}
                          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
                        />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload as ChartPoint;
                            return (
                              <div
                                className="rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
                                style={{ backgroundColor: pal.tooltipBg, color: '#ffffff' }}
                              >
                                <span className="font-bold">{fmt(point.price)} ₺</span>
                                <span className="ml-1.5 opacity-70">{formatAxisDate(String(label))}</span>
                                {point.minPrice !== null && point.maxPrice !== null && (
                                  <span className="ml-1.5 opacity-70">
                                    L {fmt(point.minPrice)} / H {fmt(point.maxPrice)}
                                  </span>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="maxPrice"
                          stroke={chartColor}
                          strokeWidth={1}
                          strokeOpacity={0.5}
                          fill="url(#mktBandFill)"
                          dot={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="minPrice"
                          stroke={chartColor}
                          strokeWidth={1}
                          strokeOpacity={0.5}
                          fill={pal.panel}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={chartColor}
                          strokeWidth={2.5}
                          dot={{ r: 2.5, fill: chartColor, strokeWidth: 0 }}
                          activeDot={{ r: 4, fill: chartColor, stroke: pal.panel, strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="grid h-full place-items-center text-xs"
                    style={{ color: pal.textFaint }}
                  >
                    {t('com.noData') as string}
                  </div>
                )}
              </div>

              {/* H/L/Avg row */}
              {stats && (
                <div className="flex flex-wrap gap-4 pt-3 text-xs" style={{ color: pal.textFaint }}>
                  <span>
                    H: <b style={{ color: pal.accent }}>₺{fmt(stats.high)}</b>
                  </span>
                  <span>
                    L: <b style={{ color: pal.down }}>₺{fmt(stats.low)}</b>
                  </span>
                  <span>
                    {t('com.avg') as string}: <b style={{ color: pal.textPrimary }}>₺{fmt(stats.avg)}</b>
                  </span>
                </div>
              )}
            </figure>
          </div>
        </div>
      </div>

      {/* Regional exchanges */}
      <div className="border-t px-5 py-6 sm:px-7" style={{ borderColor: pal.divider }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: pal.textPrimary }}>
              {t('com.regional') as string}
            </h3>
            <p className="text-sm" style={{ color: pal.textFaint }}>
              {t('mkt.regionalHint') as string}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredExchanges.map((ex) => {
            const isSelected = selectedExchange === ex.id;
            const favd = isExchangeFav(ex.id);
            return (
              <div
                key={ex.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedExchange(isSelected ? 'all' : ex.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedExchange(isSelected ? 'all' : ex.id);
                  }
                }}
                className="cursor-pointer rounded-2xl p-4 transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: isSelected ? pal.accentSoft : pal.panelSoft,
                  border: `1px solid ${isSelected ? pal.accent : pal.divider}`,
                }}
              >
                <div className="flex items-start gap-2">
                  {ex.thumbnail_url ? (
                    <Image width={36} height={36} src={ex.thumbnail_url} alt="" className="h-9 w-9 shrink-0 rounded-lg border object-cover" style={{ borderColor: pal.divider }} />
                  ) : (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{ backgroundColor: pal.panelSofter, color: pal.accent }}
                    >
                      {(ex.short_name || ex.name).charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold" style={{ color: pal.textPrimary }}>
                      {ex.name}
                    </h4>
                    <p className="text-xs" style={{ color: pal.textFaint }}>
                      {ex.city} · {ex.region}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={favd ? t('mkt.unfavorite') as string : t('mkt.favorite') as string}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle('exchange', ex.id);
                    }}
                    className="shrink-0 rounded-full p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn('h-3.5 w-3.5 transition-colors', favd && 'fill-current')}
                      style={{ color: favd ? pal.accent : pal.textFaint }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary during prerendering.
export function MarketPanelWrapper() {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <MarketPanel />
    </Suspense>
  );
}

export { MarketPanel };
