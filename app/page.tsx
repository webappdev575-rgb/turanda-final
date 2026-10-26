'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Leaf } from 'lucide-react';
import Image from 'next/image';
import { useCommodities } from '@/hooks/use-commodities';
import { useNews } from '@/hooks/use-news';
import { useI18n } from '@/components/i18n-provider';
const CommodityChartCard = dynamic(() => import('@/components/home/commodity-chart-card').then(module => module.CommodityChartCard), {
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
});
import { NewsCycleCard } from '@/components/home/news-cycle-card';
import { FigmaHero } from '@/components/home/figma-hero';
import { FigmaInnovationSection } from '@/components/home/figma-innovation-section';
import { FigmaGettingStartedSection } from '@/components/home/figma-getting-started-section';
import { FigmaAcademyPanel } from '@/components/home/figma-academy-panel';
import { FigmaSolutionsSection } from '@/components/home/figma-solutions-section';
import { AnnouncementsSection } from '@/components/home/announcements-section';
import { HomeAdBanner } from '@/components/ads/home-ad-banner';
import { HomeSidebarAds } from '@/components/ads/home-sidebar-ads';
import { MarketTicker } from '@/components/home/market-ticker';
import { Reveal } from '@/components/shared/reveal';
import type { CommodityPrice } from '@/hooks/use-commodities';

const sustainabilityImages = [
  'https://images.pexels.com/photos/17765487/pexels-photo-17765487.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/34182311/pexels-photo-34182311.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/12032548/pexels-photo-12032548.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://images.pexels.com/photos/4975400/pexels-photo-4975400.jpeg?auto=compress&cs=tinysrgb&w=900',
];

function SustainabilityImageCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % sustainabilityImages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-3xl sm:h-60 lg:h-72 lg:w-[420px]">
      {sustainabilityImages.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 420px"
          className={`object-cover transition-opacity duration-[1500ms] ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const { prices, registry, exchanges } = useCommodities();
  const { articles } = useNews();

  const topPrices = useMemo(() => {
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
    return visible.map((name) => latest.get(name)).filter((p): p is CommodityPrice => !!p).slice(0, 4);
  }, [prices, registry]);

  return (
    <div className="bg-[#fffdf6] dark:bg-[#0b1611]">
      {/* ─── Figma hero: headline, preserved search bar + golden-trail button, figure, live stats ─── */}
      <FigmaHero />

      {/* ─── Figma: 2025 innovation statement ─── */}
      <FigmaInnovationSection />

      {/* ─── Figma: Hemen Başlayın gallery ─── */}
      <FigmaGettingStartedSection />

      {/* ─── Figma: academy feature panel ─── */}
      <FigmaAcademyPanel />

      {/* ─── Figma: next-generation solutions ─── */}
      <FigmaSolutionsSection />

      {/* ─── Ad banner: rotate paid placements / in-house CTA ─── */}
      <HomeAdBanner slot="home-between-2" />

      {/* ─── Announcements block above the live data section ─── */}
      <AnnouncementsSection />

      {/* ─── Live data: market & news ─── */}
      <section className="w-full bg-gradient-to-b from-cream via-parchment to-parchment dark:from-[#0b1611] dark:via-[#0d1a13] dark:to-[#0d1a13]">
        <div className="mx-auto flex w-full max-w-[1344px] flex-col px-5 py-14 sm:px-8 lg:px-8 lg:py-20">
          <MarketTicker prices={prices} registry={registry} />
          <header className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <Reveal className="w-full max-w-2xl">
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center gap-2">
                  <span className="h-px w-8 bg-field/40" />
                  <p className="text-xs font-extrabold leading-[18px] tracking-[1.92px] text-field">
                    {t('home.marketKicker') as string}
                  </p>
                </div>
                <h2 className="pt-3 text-3xl font-semibold leading-[1.15] tracking-[-0.9px] text-ink sm:text-4xl">
                  {t('home.marketTitle') as string}
                </h2>
                <p className="pt-3 text-sm leading-6 text-ink-soft sm:text-base sm:leading-[26px]">
                  {t('home.marketSubtitle') as string}
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Link
                href="/piyasalar"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#15231d1a] bg-white/60 px-5 text-sm font-semibold text-ink-soft transition-colors hover:border-[#15231d33] hover:bg-white dark:border-[#ffffff14] dark:bg-[#ffffff0a] dark:hover:bg-[#ffffff14]"
              >
                {t('home.marketCta') as string}
                <ArrowRight className="h-[17px] w-[17px]" aria-hidden="true" />
              </Link>
            </Reveal>
          </header>

          <div className="mt-6 grid w-full grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_260px] lg:gap-5">
            {/* Prices card */}
            <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-[#15231d14] bg-white text-ink shadow-[0px_4px_12px_-4px_#14563d1a,0px_8px_20px_-8px_#14563d1a] transition-transform duration-300 motion-safe:hover:scale-[1.012] dark:border-[#ffffff14] dark:bg-[#10241b] dark:text-[#f5f3eb]">
              <div className="flex items-center justify-between gap-4 border-b border-[#15231d14] px-5 py-4 dark:border-[#ffffff14] sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-[0.6px] text-field dark:text-[#c9e7b8]">
                    {t('home.pricesKicker') as string}
                  </p>
                  <p className="pt-1 text-sm text-[#617069] dark:text-[#ffffff99]">
                    {t('home.pricesSource') as string}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 rounded-full bg-[#15231d08] px-3 py-1.5 dark:bg-[#ffffff1a]">
                  <Leaf className="h-[15px] w-[15px] text-field dark:text-[#c9e7b8]" aria-hidden="true" />
                  <Link href="/commodities" className="text-xs font-bold text-field hover:underline dark:text-[#c9e7b8]">
                    {t('home.pricesView') as string}
                  </Link>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-5 p-5 sm:grid-cols-1 sm:p-6">
                {topPrices.length > 0 ? (
                  <CommodityChartCard
                    prices={prices}
                    headline={topPrices[0]}
                    selectable={topPrices.slice(0, 4)}
                    exchanges={exchanges}
                  />
                ) : (
                  <div className="grid min-h-[182px] place-items-center text-sm text-[#96a09a]">
                    {t('com.loading') as string}
                  </div>
                )}
              </div>
            </div>

            {/* News cycle card */}
            <NewsCycleCard articles={articles} />

            {/* Admin-only sidebar ad slots (hidden from public until placements exist) */}
            <HomeSidebarAds className="hidden xl:flex xl:flex-col" />
          </div>
        </div>
      </section>

      {/* ─── Sustainability statement strip ─── */}
      <section className="w-full bg-[#fcfaf6] dark:bg-[#0d1a13]">
        <div className="mx-auto flex w-full max-w-[1205px] flex-col items-start gap-8 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:gap-14 lg:px-0 lg:py-20">
          <Reveal className="w-full lg:w-auto">
            <SustainabilityImageCarousel />
          </Reveal>
          <Reveal delay={120}>
            <p className="max-w-3xl text-2xl font-semibold leading-snug tracking-[-0.6px] text-[#15231d] dark:text-[#f5f3eb] sm:text-4xl sm:leading-[1.2]">
              {t('red.sustainabilityText')}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
