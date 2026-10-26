'use client';

import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '@/components/i18n-provider';
import { translateCommodity } from '@/lib/translations';
import type { CommodityPrice, CommodityExchange } from '@/hooks/use-commodities';

type RangeMode = 'daily' | '7d';

interface ChartPoint {
  date: string;
  label: string;
  price: number;
}

interface TooltipState {
  x: number;
  y: number;
  point: ChartPoint;
}

function buildDailyAverages(prices: CommodityPrice[], commodityName: string): ChartPoint[] {
  const byDate = new Map<string, { sum: number; count: number }>();
  prices.forEach((p) => {
    if (p.commodity_name !== commodityName) return;
    const day = p.recorded_date.slice(0, 10);
    const entry = byDate.get(day) ?? { sum: 0, count: 0 };
    entry.sum += p.price;
    entry.count += 1;
    byDate.set(day, entry);
  });
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([day, { sum, count }]) => {
      const d = new Date(`${day}T00:00:00`);
      const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        date: day,
        label,
        price: count > 0 ? (sum / count) / 1000 : 0,
      };
    });
}

function buildLatestDayByExchange(
  prices: CommodityPrice[],
  commodityName: string,
  exchangeMap: Map<string, string>,
): ChartPoint[] {
  const commodityPrices = prices.filter((p) => p.commodity_name === commodityName);
  if (commodityPrices.length === 0) return [];

  const latestDate = commodityPrices
    .map((p) => p.recorded_date)
    .sort()
    .pop();

  return commodityPrices
    .filter((p) => p.recorded_date === latestDate)
    .sort((a, b) => a.price - b.price)
    .map((p) => ({
      date: p.recorded_date,
      label: exchangeMap.get(p.exchange_id) ?? '—',
      price: p.price / 1000,
    }));
}

function dayChangePct(prices: CommodityPrice[], commodityName: string): number {
  const days = new Map<string, number[]>();
  prices.forEach((p) => {
    if (p.commodity_name !== commodityName) return;
    const day = p.recorded_date.slice(0, 10);
    const list = days.get(day) ?? [];
    list.push(p.price);
    days.set(day, list);
  });
  const sortedDays = Array.from(days.keys()).sort();
  if (sortedDays.length < 2) return 0;
  const avg = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length;
  const today = avg(days.get(sortedDays[sortedDays.length - 1]) ?? []);
  const yesterday = avg(days.get(sortedDays[sortedDays.length - 2]) ?? []);
  if (yesterday === 0) return 0;
  return ((today - yesterday) / yesterday) * 100;
}

export function CommodityChartCard({
  prices,
  headline,
  selectable,
  exchanges,
}: {
  prices: CommodityPrice[];
  headline: CommodityPrice;
  selectable: CommodityPrice[];
  exchanges: CommodityExchange[];
}) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState(headline.commodity_name);
  const [range, setRange] = useState<RangeMode>('daily');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const activeName = selectable.some((s) => s.commodity_name === selected)
    ? selected
    : headline.commodity_name;

  const active = selectable.find((s) => s.commodity_name === activeName) ?? headline;

  const exchangeMap = useMemo(
    () => new Map(exchanges.map((e) => [e.id, e.short_name ?? e.city])),
    [exchanges],
  );

  const series = useMemo(() => {
    if (range === '7d') return buildDailyAverages(prices, activeName);
    const byExchange = buildLatestDayByExchange(prices, activeName, exchangeMap);
    return byExchange.length >= 2
      ? byExchange
      : buildDailyAverages(prices, activeName).slice(-5);
  }, [prices, activeName, range, exchangeMap]);

  const fmt = (value: number) =>
    value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pricePerKilo = (value: number) => value / 1000;

  const change = dayChangePct(prices, activeName);
  const rangeSpan =
    series.length > 1
      ? Math.max(...series.map((s) => s.price)) - Math.min(...series.map((s) => s.price))
      : 0;
  const yPadding = rangeSpan > 0 ? rangeSpan * 0.35 : Math.max(pricePerKilo(active.price) * 0.08, 0.5);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[231px] flex-1 flex-col py-4 sm:py-6">
        {/* Headline commodity — horizontal row: name left, price + change right */}
        <article key={activeName} className="animate-fade-in flex shrink-0 items-end justify-between gap-4 pb-4">
          <div className="flex min-w-0 flex-col items-start">
            <h2 className="text-sm font-semibold leading-5 text-[#617069] dark:text-[#ffffff99]">
              {translateCommodity(active.commodity_name, locale)}
            </h2>
            <p className="pt-1 text-xs leading-4 text-[#96a09a] dark:text-[#ffffff73]">₺ / kilo</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <p className="text-3xl font-bold leading-9 tracking-[-0.9px] text-ink tabular-nums dark:text-[#f5f3eb] sm:text-4xl sm:leading-10">
              {fmt(pricePerKilo(active.price))}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-field/10 px-3 py-1.5 dark:bg-[#c9e7b826]">
              <TrendingUp
                className={`h-3.5 w-3.5 ${
                  change >= 0 ? 'text-field dark:text-[#c9e7b8]' : 'rotate-180 text-[#b45309] dark:text-[#f4e7bd]'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-bold leading-4 ${
                  change >= 0 ? 'text-field dark:text-[#c9e7b8]' : 'text-[#b45309] dark:text-[#f4e7bd]'
                }`}
              >
                {change > 0 ? '+' : ''}
                %{change.toLocaleString('tr-TR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-xs leading-4 text-[#96a09a] dark:text-[#ffffff73]">
                {t('home.today') as string}
              </span>
            </span>
          </div>
        </article>

        {/* Chart panel — fills the remaining section */}
        <figure className="flex min-h-[260px] w-full flex-1 flex-col rounded-2xl bg-[#15231d08] p-3 dark:bg-[#ffffff0d]">
          <figcaption className="flex shrink-0 items-center justify-between gap-2 text-xs leading-4 text-[#96a09a] dark:text-[#ffffff73]">
            <div className="flex items-center gap-1 rounded-lg bg-[#15231d0f] p-0.5 dark:bg-[#ffffff14]">
              {(
                [
                  ['daily', 'home.chartDaily'],
                  ['7d', 'home.chart7d'],
                ] as const
              ).map(([mode, key]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRange(mode)}
                  aria-pressed={range === mode}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    range === mode
                      ? 'bg-field text-white dark:bg-[#c9e7b8] dark:text-[#08271d]'
                      : 'text-[#617069] hover:text-ink dark:text-[#ffffff99] dark:hover:text-white'
                  }`}
                >
                  {t(key) as string}
                </button>
              ))}
            </div>
          </figcaption>
          <div className="relative mt-1 min-h-0 w-full flex-1">
            {series.length >= 2 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    key={`${activeName}-${range}`}
                    data={series}
                    margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
                    onMouseMove={(
                      state: { activeTooltipIndex?: number; activeLabel?: unknown } & {
                        chartX?: number;
                        chartY?: number;
                      },
                    ) => {
                      if (
                        typeof state.activeTooltipIndex === 'number' &&
                        series[state.activeTooltipIndex] &&
                        typeof state.chartX === 'number' &&
                        typeof state.chartY === 'number'
                      ) {
                        setTooltip({
                          x: state.chartX,
                          y: state.chartY,
                          point: series[state.activeTooltipIndex],
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <defs>
                      <linearGradient id="pulseAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2e7d4f" stopOpacity={0.3} className="dark:opacity-0" />
                        <stop offset="100%" stopColor="#2e7d4f" stopOpacity={0} className="dark:opacity-0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#15231d14" className="dark:opacity-20" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#617069', fontSize: 10 }}
                      axisLine={{ stroke: '#15231d26' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={8}
                    />
                    <YAxis hide domain={[`dataMin - ${yPadding}`, `dataMax + ${yPadding}`]} />
                    <Tooltip cursor={false} content={() => null} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#2e7d4f"
                      strokeWidth={2.5}
                      fill="url(#pulseAreaFill)"
                      dot={{ r: 2.5, fill: '#2e7d4f', strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: '#2e7d4f', stroke: '#ffffff', strokeWidth: 2 }}
                      isAnimationActive
                      animationDuration={450}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {tooltip && (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-[#08271de6] px-2.5 py-1.5 text-xs shadow-lg ring-1 ring-[#ffffff1a]"
                    style={{ left: tooltip.x, top: tooltip.y }}
                  >
                    <span className="font-bold text-white">{fmt(pricePerKilo(tooltip.point.price))} ₺</span>
                    <span className="ml-1.5 text-[#ffffffb3]">{tooltip.point.label}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="grid h-full place-items-center text-xs text-[#96a09a] dark:text-[#ffffff73]">
                {t('com.noData') as string}
              </div>
            )}
          </div>
        </figure>
      </div>

      {/* Selectable commodity strip */}
      <div className="grid shrink-0 grid-cols-3 border-t border-[#15231d14] dark:border-[#ffffff14]">
        {selectable.slice(0, 3).map((item, i) => {
          const isSelected = item.commodity_name === activeName;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.commodity_name)}
              aria-pressed={isSelected}
              className={`flex h-[73px] min-w-0 items-center px-3 py-2 text-left transition-colors sm:px-5 sm:py-4 ${
                i < Math.min(selectable.length, 3) - 1 ? 'border-r border-[#15231d14] dark:border-[#ffffff14]' : ''
              } ${isSelected ? 'bg-field/10 dark:bg-[#ffffff14]' : 'hover:bg-[#15231d08] dark:hover:bg-[#ffffff0a]'}`}
            >
              <div className="flex min-w-0 flex-col items-start">
                <div className="flex min-w-0 items-center gap-1.5">
                  <h3
                    className={`truncate text-xs font-semibold leading-4 ${
                      isSelected ? 'text-field dark:text-[#c9e7b8]' : 'text-[#617069] dark:text-[#ffffff99]'
                    }`}
                  >
                    {translateCommodity(item.commodity_name, locale)}
                  </h3>
                  <span
                    className={`shrink-0 whitespace-nowrap text-[11px] font-bold leading-4 ${
                      item.change_pct >= 0 ? 'text-field dark:text-[#c9e7b8]' : 'text-[#b45309] dark:text-[#f4e7bd]'
                    }`}
                  >
                    {item.change_pct > 0 ? '+' : ''}
                    %{item.change_pct.toLocaleString('tr-TR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
                <p className="truncate pt-1 text-sm font-bold leading-5 text-ink dark:text-[#f5f3eb]">
                  {pricePerKilo(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
