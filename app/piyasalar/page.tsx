'use client';

import { useI18n } from '@/components/i18n-provider';
import { MarketPanelWrapper } from '@/components/commodities/market-panel';
import { HomeNewsSection } from '@/components/home/news-section';

export default function PiyasalarPage() {
  const { t } = useI18n();

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('piyasalar.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('piyasalar.subtitle')}
          </p>
        </div>
      </section>

      {/* Commodity Markets Section */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground">
          {t('piyasalar.marketSection')}
        </h2>
        <MarketPanelWrapper />
      </section>

      {/* News Section */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-foreground">
            {t('piyasalar.newsSection')}
          </h2>
          <HomeNewsSection embedded />
        </div>
      </section>
    </div>
  );
}
