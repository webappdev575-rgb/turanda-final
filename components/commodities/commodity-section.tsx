'use client';

import Image from 'next/image';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Search, Building2, MapPin, Wheat,
  ChevronUp, ChevronDown, BarChart3, Activity, ArrowRight, Clock,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCommodities } from '@/hooks/use-commodities';
import { useI18n } from '@/components/i18n-provider';
import { POPULAR_COMMODITIES } from '@/lib/app-config';
import { cn } from '@/lib/utils';
import {
  translateCommodity, getCommodityIcon,
  setDynamicTranslationOverrides, setDynamicIconOverrides,
} from '@/lib/translations';
import { IconRenderer } from '@/components/shared/icon-renderer';

function CommodityIcon({ name, className }: { name: string; className?: string }) {
  const iconInfo = getCommodityIcon(name);
  return <IconRenderer icon={iconInfo} className={className} fallback="Wheat" />;
}

export const TIME_RANGES = ['1d', '5d', '1m', '6m', 'ytd', '1y', '5y'] as const;
export type TimeRange = typeof TIME_RANGES[number];

type ChartType = 'area' | 'line' | 'rangebar' | 'rangeband';

const staticCategoryLabels: Record<string, { tr: string; en: string; ar: string }> = {
  'Grain & Field Crops': { tr: 'Tahıl & Tarla', en: 'Grain & Field', ar: 'الحبوب' },
  'Specialty Crops': { tr: 'Özel Ürünler', en: 'Specialty', ar: 'خاصة' },
  'Pulses': { tr: 'Baklagiller', en: 'Pulses', ar: 'بقوليات' },
  'Oilseeds': { tr: 'Yağlı Tohum', en: 'Oilseeds', ar: 'زيتية' },
};

const RANGE_BAR_COLOR = '#4A6FA5';

interface ChartPoint {
  date: string;
  price: number;
  minPrice: number | null;
  maxPrice: number | null;
  volume: number;
  change: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey: string }>;
  label?: string;
  formatDate: (d: string) => string;
  unit: string;
}

function ChartTooltip({ active, payload, label, formatDate, unit }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const priceData = payload.find((p) => p.name === 'price' || p.dataKey === 'price');
  const minData = payload.find((p) => p.dataKey === 'minPrice');
  const maxData = payload.find((p) => p.dataKey === 'maxPrice');
  const volData = payload.find((p) => p.name === 'volume' || p.dataKey === 'volume');
  const changeData = payload.find((p) => p.name === 'change' || p.dataKey === 'change');
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">{formatDate(label || '')}</p>
      {priceData && (
        <p className="text-sm font-bold text-foreground">
          ₺{Number(priceData.value).toLocaleString('tr-TR')}
          <span className="ml-1 text-[10px] text-muted-foreground">/{unit}</span>
        </p>
      )}
      {minData && maxData && (
        <div className="mt-0.5 flex gap-2 text-[10px]">
          <span className="text-muted-foreground">L: <span className="font-medium text-foreground">₺{Number(minData.value).toLocaleString('tr-TR')}</span></span>
          <span className="text-muted-foreground">H: <span className="font-medium text-foreground">₺{Number(maxData.value).toLocaleString('tr-TR')}</span></span>
        </div>
      )}
      {changeData && Number(changeData.value) !== 0 && (
        <p className={cn('text-[10px] font-medium', Number(changeData.value) >= 0 ? 'text-success' : 'text-destructive')}>
          {Number(changeData.value) >= 0 ? '+' : ''}{Number(changeData.value).toFixed(2)}%
        </p>
      )}
      {volData && (
        <p className="text-[10px] text-muted-foreground">
          {Number(volData.value)} exchanges
        </p>
      )}
    </div>
  );
}

export function filterByTimeRange(allData: ChartPoint[], range: TimeRange): { data: ChartPoint[]; granularity: string | null } {
  if (allData.length === 0) return { data: [], granularity: null };

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
    default: return { data: allData, granularity: null };
  }

  const filtered = allData.filter((d) => new Date(d.date) >= cutoff);
  if (filtered.length === 0) {
    return { data: allData, granularity: null };
  }

  let granularity: string | null = null;
  if (range === '1d' || range === '5d') {
    const firstDate = new Date(filtered[0].date);
    const lastDate = new Date(filtered[filtered.length - 1].date);
    const dayDiff = Math.abs(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    if (dayDiff > 10) granularity = 'monthly';
  }

  return { data: filtered, granularity };
}

interface RangeBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartPoint;
}

function RangeBarShape(props: RangeBarShapeProps) {
  const { x, y, width, height, payload } = props;
  if (!x || !y || !width || !height || !payload) return null;

  const barCenterX = x + width / 2;
  const chartHeight = height;
  const chartBottom = y + chartHeight;

  // Calculate y positions from price values
  // We need the scale: price range from the data
  // Recharts passes the y based on the dataKey, but for custom shapes
  // we need to calculate positions ourselves
  // The `y` and `height` are for the full bar area
  // We use payload.minPrice, payload.maxPrice, payload.price

  if (payload.minPrice === null || payload.maxPrice === null) return null;

  // We'll use a simplified approach: use the chart's y-scale
  // The shape gets called with the full bar area
  // We draw a vertical line from min to max and a horizontal tick at avg

  const minP = payload.minPrice;
  const maxP = payload.maxPrice;
  const avgP = payload.price;

  // The y/height represent the bar for the "range" dataKey which we set to maxPrice
  // We need the full chart scale to map min/avg correctly
  // Actually, for a custom shape, recharts gives us x, y, width, height for THIS bar
  // We'll use the approach where we set up a custom layer instead

  // Simple approach: draw the whisker and tick using relative positions
  // The bar spans from y (top = maxPrice) to y+height (bottom = minPrice)
  // avgP is somewhere in between

  const priceRange = maxP - minP;
  if (priceRange === 0) {
    // Single line
    return (
      <g>
        <line x1={barCenterX} y1={y} x2={barCenterX} y2={y + height} stroke={RANGE_BAR_COLOR} strokeWidth={2} />
        <line x1={barCenterX - 6} y1={y} x2={barCenterX + 6} y2={y} stroke={RANGE_BAR_COLOR} strokeWidth={2} />
      </g>
    );
  }

  const avgRatio = (avgP - minP) / priceRange;
  const avgY = y + height - (avgRatio * height);

  return (
    <g>
      {/* Vertical whisker from min to max */}
      <line
        x1={barCenterX}
        y1={y}
        x2={barCenterX}
        y2={y + height}
        stroke={RANGE_BAR_COLOR}
        strokeWidth={1.5}
      />
      {/* Horizontal tick at average price */}
      <line
        x1={barCenterX - 7}
        y1={avgY}
        x2={barCenterX + 7}
        y2={avgY}
        stroke={RANGE_BAR_COLOR}
        strokeWidth={2.5}
      />
    </g>
  );
}

interface CommoditySectionProps {
  popularOnly?: boolean;
  showViewMore?: boolean;
  maxExchanges?: number;
  embedded?: boolean;
}

export function CommoditySection({ popularOnly = false, showViewMore = false, maxExchanges, embedded = false }: CommoditySectionProps) {
  const { exchanges, prices, iconOverrides, registry, commodityCategories, loading } = useCommodities();
  const { t, locale } = useI18n();
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');

  useEffect(() => {
    setDynamicTranslationOverrides(registry);
  }, [registry]);

  useEffect(() => {
    setDynamicIconOverrides(iconOverrides);
  }, [iconOverrides]);

  const commoditiesList = useMemo(() => {
    const filtered = prices.filter((p) =>
      selectedExchange === 'all' || p.exchange_id === selectedExchange
    );

    const seen = new Map<string, typeof filtered[0]>();
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
      change: p.change_pct,
      unit: p.unit,
      exchange_id: p.exchange_id,
    })).sort((a, b) => b.price - a.price);

    if (popularOnly) {
      const featuredNames = registry.filter((r) => r.is_featured && r.is_visible).map((r) => r.commodity_name);
      const visibleNames = registry.filter((r) => r.is_visible).map((r) => r.commodity_name);
      const filterNames = featuredNames.length > 0 ? featuredNames : (visibleNames.length > 0 ? visibleNames : POPULAR_COMMODITIES);
      list = list.filter((c) => filterNames.includes(c.name));
      list.sort((a, b) => filterNames.indexOf(a.name) - filterNames.indexOf(b.name));
    } else {
      const visibleNames = registry.filter((r) => r.is_visible).map((r) => r.commodity_name);
      if (visibleNames.length > 0) {
        list = list.filter((c) => visibleNames.includes(c.name));
        list.sort((a, b) => {
          const aOrder = registry.find((r) => r.commodity_name === a.name)?.display_order || 999;
          const bOrder = registry.find((r) => r.commodity_name === b.name)?.display_order || 999;
          return aOrder - bOrder;
        });
      }
    }

    return list;
  }, [prices, selectedExchange, popularOnly, registry]);

  const filteredCommodities = useMemo(() => {
    if (!search) return commoditiesList;
    const q = search.toLowerCase();
    return commoditiesList.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      translateCommodity(c.name, locale).toLowerCase().includes(q)
    );
  }, [commoditiesList, search, locale]);

  useEffect(() => {
    if (filteredCommodities.length > 0) {
      const stillSelected = filteredCommodities.find((c) => c.name === selectedCommodity);
      if (!stillSelected) {
        setSelectedCommodity(filteredCommodities[0].name);
      }
    } else if (selectedCommodity) {
      setSelectedCommodity('');
    }
  }, [filteredCommodities, selectedCommodity]);

  const allChartData: ChartPoint[] = useMemo(() => {
    if (!selectedCommodity) return [];

    const commodityPrices = prices
      .filter((p) =>
        p.commodity_name === selectedCommodity &&
        (selectedExchange === 'all' || p.exchange_id === selectedExchange)
      )
      .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());

    const byDate = new Map<string, {
      prices: number[];
      minPrices: number[];
      maxPrices: number[];
      exchanges: Set<string>;
    }>();

    commodityPrices.forEach((p) => {
      const entry = byDate.get(p.recorded_date) || {
        prices: [], minPrices: [], maxPrices: [], exchanges: new Set<string>(),
      };
      entry.prices.push(p.price);
      if (p.min_price !== null) entry.minPrices.push(p.min_price);
      if (p.max_price !== null) entry.maxPrices.push(p.max_price);
      entry.exchanges.add(p.exchange_id);
      byDate.set(p.recorded_date, entry);
    });

    const sortedDates = Array.from(byDate.keys()).sort();
    let prevAvg = 0;

    return sortedDates.map((date) => {
      const entry = byDate.get(date)!;
      const priceArr = entry.prices;
      const avg = priceArr.reduce((s, v) => s + v, 0) / priceArr.length;
      const change = prevAvg > 0 ? ((avg - prevAvg) / prevAvg) * 100 : 0;
      prevAvg = avg;

      // For per-exchange: use this exchange's min/max
      // For all-exchanges: use national min (lowest of all minPrices) and national max (highest of all maxPrices)
      const minPrice = entry.minPrices.length > 0 ? Math.min(...entry.minPrices) : null;
      const maxPrice = entry.maxPrices.length > 0 ? Math.max(...entry.maxPrices) : null;

      return {
        date,
        price: Math.round(avg * 100) / 100,
        minPrice: minPrice !== null ? Math.round(minPrice * 100) / 100 : null,
        maxPrice: maxPrice !== null ? Math.round(maxPrice * 100) / 100 : null,
        volume: entry.exchanges.size,
        change: Math.round(change * 100) / 100,
      };
    });
  }, [prices, selectedCommodity, selectedExchange]);

  const { data: chartData, granularity } = useMemo(
    () => filterByTimeRange(allChartData, timeRange),
    [allChartData, timeRange],
  );

  // Check if range data (min/max) is available for the current selection
  const hasRangeData = useMemo(() => {
    return chartData.some((d) => d.minPrice !== null && d.maxPrice !== null);
  }, [chartData]);

  // Determine available chart types based on exchange selection and data
  const isAllExchanges = selectedExchange === 'all';
  const availableChartTypes = useMemo<ChartType[]>(() => isAllExchanges
    ? ['area', 'line', 'rangeband']
    : ['area', 'line', 'rangebar'], [isAllExchanges]);

  // Auto-fallback chart type if current is not available
  useEffect(() => {
    if (!availableChartTypes.includes(chartType)) {
      setChartType('area');
    }
  }, [availableChartTypes, chartType]);

  // Disable range charts if no min/max data
  const effectiveChartType: ChartType = (chartType === 'rangebar' || chartType === 'rangeband') && !hasRangeData
    ? 'area'
    : chartType;

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const prices_arr = chartData.map((d) => d.price);
    const current = prices_arr[prices_arr.length - 1];
    const previous = prices_arr[prices_arr.length - 2] || current;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const high = Math.max(...prices_arr);
    const low = Math.min(...prices_arr);
    const avg = prices_arr.reduce((s, v) => s + v, 0) / prices_arr.length;
    return { current, change, high, low, avg };
  }, [chartData]);

  const selectedCommodityData = commoditiesList.find((c) => c.name === selectedCommodity);

  const filteredExchanges = useMemo(() => {
    const list = exchanges.filter((ex) =>
      search ? ex.name.toLowerCase().includes(search.toLowerCase()) || ex.city.toLowerCase().includes(search.toLowerCase()) : true
    );
    return maxExchanges ? list.slice(0, maxExchanges) : list;
  }, [exchanges, search, maxExchanges]);

  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const months = locale === 'en' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] :
                   locale === 'ar' ? ['ينا','فبر','مار','أبر','ماي','يون','يول','أغس','سبت','أكت','نوف','ديس'] :
                   ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }, [locale]);

  const lastUpdated = useMemo(() => {
    const dates = prices.map((p) => p.recorded_date).sort();
    if (dates.length === 0) return null;
    return dates[dates.length - 1];
  }, [prices]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('com.loading')}</p>
        </div>
      </section>
    );
  }

  const isUp = (stats?.change ?? 0) >= 0;
  const chartColor = isUp ? '#16a34a' : '#dc2626';

  // Chart type button data
  const chartTypeButtons: { type: ChartType; icon: typeof BarChart3; label: string; disabled: boolean }[] = [
    { type: 'area', icon: BarChart3, label: t('com.chartType.area'), disabled: false },
    { type: 'line', icon: Activity, label: t('com.chartType.line'), disabled: false },
    ...(isAllExchanges
      ? [{ type: 'rangeband' as ChartType, icon: Activity, label: t('com.chartType.rangeband'), disabled: !hasRangeData }]
      : [{ type: 'rangebar' as ChartType, icon: BarChart3, label: t('com.chartType.rangebar'), disabled: !hasRangeData }]),
  ];

  const sectionClass = embedded ? '' : 'mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8';

  return (
    <section className={sectionClass}>
      {!embedded && (
        <div className="mb-8 text-center">
          <Badge className="mb-3 border-secondary/30 bg-secondary/10 text-secondary">
            <Wheat className="mr-1 h-3 w-3" />
            {t('com.sectionTitle')}
          </Badge>
          <h2 className="text-3xl font-bold text-foreground">{t('com.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('com.subtitle')}</p>
          {lastUpdated && (
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {t('com.lastUpdate')}: {new Date(lastUpdated).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'ar' ? 'ar' : 'tr-TR')}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Ticker Sidebar */}
        <Card className="lg:col-span-1 p-0 overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">
                {popularOnly ? t('com.popular') : t('com.allCommodities')}
              </h3>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('com.searchCommodity')}
                className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="max-h-[460px] overflow-y-auto scrollbar-hide">
            {filteredCommodities.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">{t('com.noData')}</div>
            ) : (
              filteredCommodities.map((commodity, i) => {
                const isActive = selectedCommodity === commodity.name;
                const up = commodity.change >= 0;
                return (
                  <button
                    key={commodity.name}
                    onClick={() => setSelectedCommodity(commodity.name)}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={cn(
                      'commodity-ticker-item flex w-full items-center justify-between border-b border-border px-4 py-3 text-left transition-colors',
                      isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CommodityIcon name={commodity.name} className="h-4 w-4 shrink-0 text-secondary" />
                        <span className="truncate text-sm font-medium text-foreground">{translateCommodity(commodity.name, locale)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {(commodityCategories.find((c) => c.key === commodity.category) ? { tr: commodityCategories.find((c) => c.key === commodity.category)!.translation_tr, en: commodityCategories.find((c) => c.key === commodity.category)!.translation_en, ar: commodityCategories.find((c) => c.key === commodity.category)!.translation_ar } : staticCategoryLabels[commodity.category])?.[locale] || commodity.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        ₺{commodity.price.toLocaleString('tr-TR')}
                      </p>
                      <p className={cn('flex items-center justify-end gap-0.5 text-[10px] font-medium', up ? 'text-success' : 'text-destructive')}>
                        {up ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                        {commodity.change > 0 ? '+' : ''}{commodity.change}%
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Main Chart Area */}
        <Card className="lg:col-span-3 p-0 overflow-hidden">
          {selectedCommodityData && stats && (
            <div className="border-b border-border bg-muted/20 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CommodityIcon name={selectedCommodityData.name} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{translateCommodity(selectedCommodityData.name, locale)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {(commodityCategories.find((c) => c.key === selectedCommodityData.category) ? { tr: commodityCategories.find((c) => c.key === selectedCommodityData.category)!.translation_tr, en: commodityCategories.find((c) => c.key === selectedCommodityData.category)!.translation_en, ar: commodityCategories.find((c) => c.key === selectedCommodityData.category)!.translation_ar } : staticCategoryLabels[selectedCommodityData.category])?.[locale] || selectedCommodityData.category}
                      {' · '}{selectedCommodityData.unit}
                      {' · '}
                      {selectedExchange === 'all'
                        ? t('com.allExchanges')
                        : exchanges.find((e) => e.id === selectedExchange)?.short_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      ₺{stats.current.toLocaleString('tr-TR')}
                    </p>
                    <p className={cn('flex items-center justify-end gap-1 text-sm font-semibold', isUp ? 'text-success' : 'text-destructive')}>
                      {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {isUp ? '+' : ''}{stats.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">H:</span>
                  <span className="font-semibold text-success tabular-nums">₺{stats.high.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">L:</span>
                  <span className="font-semibold text-destructive tabular-nums">₺{stats.low.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Avg:</span>
                  <span className="font-semibold text-foreground tabular-nums">₺{Math.round(stats.avg).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Chart Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-2">
            <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
              {TIME_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    timeRange === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t(`com.${range}` as 'com.1d')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {granularity && (
                <span className="text-[10px] italic text-muted-foreground">
                  {locale === 'en' ? 'showing monthly data' : locale === 'ar' ? 'بيانات شهرية' : 'aylık veri'}
                </span>
              )}
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary"
              >
                <option value="all">{t('com.allExchanges')}</option>
                {exchanges.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.short_name} — {ex.city}</option>
                ))}
              </select>
              <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                {chartTypeButtons.map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => !btn.disabled && setChartType(btn.type)}
                    disabled={btn.disabled}
                    title={btn.disabled ? t('com.rangeDataUnavailable') : btn.label}
                    className={cn(
                      'rounded p-1 text-xs font-medium transition-colors',
                      effectiveChartType === btn.type ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                      btn.disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    <btn.icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Price Chart */}
          <div className="px-2 py-3">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                {effectiveChartType === 'area' ? (
                  <AreaChart key={`area-${selectedCommodity}-${selectedExchange}`} data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} width={50} />
                    <Tooltip content={<ChartTooltip formatDate={formatDate} unit={selectedCommodityData?.unit || 'ton'} />} />
                    {stats && (
                      <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.3} />
                    )}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={chartColor}
                      strokeWidth={2.5}
                      fill="url(#priceGradient)"
                      dot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: chartColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : effectiveChartType === 'line' ? (
                  <ComposedChart key={`line-${selectedCommodity}-${selectedExchange}`} data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} width={50} />
                    <Tooltip content={<ChartTooltip formatDate={formatDate} unit={selectedCommodityData?.unit || 'ton'} />} />
                    {stats && (
                      <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.3} />
                    )}
                    <Bar dataKey="volume" fill="hsl(var(--muted-foreground))" opacity={0.15} yAxisId={0} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={chartColor}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: chartColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                ) : effectiveChartType === 'rangebar' ? (
                  <ComposedChart key={`rangebar-${selectedCommodity}-${selectedExchange}`} data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} width={50} domain={['dataMin - 50', 'dataMax + 50']} />
                    <Tooltip content={<ChartTooltip formatDate={formatDate} unit={selectedCommodityData?.unit || 'ton'} />} />
                    {stats && (
                      <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.3} />
                    )}
                    <Bar
                      dataKey="maxPrice"
                      shape={<RangeBarShape />}
                      fill={RANGE_BAR_COLOR}
                      opacity={0.01}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={chartColor}
                      strokeWidth={1.5}
                      dot={{ r: 2, fill: chartColor, strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: chartColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart key={`rangeband-${selectedCommodity}-${selectedExchange}`} data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={RANGE_BAR_COLOR} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={RANGE_BAR_COLOR} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} width={50} />
                    <Tooltip content={<ChartTooltip formatDate={formatDate} unit={selectedCommodityData?.unit || 'ton'} />} />
                    {stats && (
                      <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.3} />
                    )}
                    {/* Upper area (maxPrice) */}
                    <Area
                      type="monotone"
                      dataKey="maxPrice"
                      stroke={RANGE_BAR_COLOR}
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      fill="url(#bandGradient)"
                      dot={false}
                    />
                    {/* Lower area (minPrice) — filled with background color to create band effect */}
                    <Area
                      type="monotone"
                      dataKey="minPrice"
                      stroke={RANGE_BAR_COLOR}
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      fill="hsl(var(--background))"
                      dot={false}
                    />
                    {/* Average line on top */}
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={chartColor}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: chartColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                <p>{t('com.noData')}</p>
              </div>
            )}
          </div>

          {/* Range data unavailable note */}
          {(chartType === 'rangebar' || chartType === 'rangeband') && !hasRangeData && chartData.length > 0 && (
            <div className="px-5 pb-2">
              <p className="text-[10px] italic text-muted-foreground">{t('com.rangeDataUnavailable')}</p>
            </div>
          )}

          {/* Volume Bar Chart */}
          {chartData.length > 0 && effectiveChartType !== 'rangebar' && effectiveChartType !== 'rangeband' && (
            <div className="border-t border-border px-2 py-2">
              <ResponsiveContainer width="100%" height={80}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} width={50} tickFormatter={(v) => String(v)} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }}
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value: number) => [`${value} exchanges`, 'Exchanges Reporting']}
                  />
                  <Bar dataKey="volume" fill={chartColor} opacity={0.3} radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* TOBB Attribution Citation */}
          <div className="border-t border-border px-5 py-2">
            <a
              href="https://borsa.tobb.org.tr/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('com.sourceTobb')}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </Card>
      </div>

      {/* Exchange Hubs */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('com.regional')}</h3>
            <p className="text-sm text-muted-foreground">{t('com.regionalDesc')}</p>
          </div>
          {showViewMore && (
            <Link href="/piyasalar" className="hidden sm:block">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {t('com.viewMore')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredExchanges.map((ex, i) => (
            <Card
              key={ex.id}
              className="exchange-card relative overflow-hidden p-4 transition-all hover:shadow-lg hover:border-primary/20"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-secondary/30 to-transparent" />
              <div className="flex items-start gap-2">
                {ex.thumbnail_url ? (
                  <Image width={36} height={36} src={ex.thumbnail_url} alt={ex.name} className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                    <span className="text-xs font-bold text-primary">{(ex.short_name || ex.name).charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-foreground">{ex.name}</h4>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {ex.city} · {ex.region}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ex.specialties.slice(0, 4).map((spec, si) => (
                      <span key={si} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {translateCommodity(spec, locale)}
                      </span>
                    ))}
                  </div>
                  {ex.latest_price_date && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(ex.latest_price_date).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'ar' ? 'ar' : 'tr-TR')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        {showViewMore && (
          <div className="mt-6 text-center sm:hidden">
            <Link href="/piyasalar">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {t('com.viewMore')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
