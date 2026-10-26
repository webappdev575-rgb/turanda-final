'use client';

import { Megaphone, TrendingUp, Users, Eye, MapPin, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdRequestForm } from '@/components/ads/ad-request-form';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import { Reveal } from '@/components/shared/reveal';

const PLACEMENTS: { key: 'advertise.placement.header' | 'advertise.placement.jobFeed' | 'advertise.placement.commoditySidebar' | 'advertise.placement.newsSidebar' | 'advertise.placement.dashboardSidebar' | 'advertise.placement.articleSidebar' | 'advertise.placement.articleInline'; span: string }[] = [
  { key: 'advertise.placement.header', span: 'sm:col-span-2' },
  { key: 'advertise.placement.jobFeed', span: '' },
  { key: 'advertise.placement.commoditySidebar', span: '' },
  { key: 'advertise.placement.newsSidebar', span: '' },
  { key: 'advertise.placement.dashboardSidebar', span: '' },
  { key: 'advertise.placement.articleSidebar', span: '' },
  { key: 'advertise.placement.articleInline', span: 'sm:col-span-2' },
];

export default function ReklamPage() {
  const { t } = useI18n();
  const { session, loading: authLoading } = useAuth();
  const signedIn = !!session;

  const stats = [
    { icon: Users, label: 'Farmers & Workers', value: '10,000+' },
    { icon: Eye, label: 'Monthly Impressions', value: '500,000+' },
    { icon: TrendingUp, label: 'Avg. CTR', value: '2.5%' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <header className="max-w-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#08271d] dark:bg-[#c9e7b826]">
            <Megaphone className="h-6 w-6 text-[#c9e7b8]" />
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-1px] text-ink dark:text-[#f5f3eb] sm:text-4xl">
            {t('advertise.title')}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink-soft dark:text-[#ffffff99]">
            {t('advertise.subtitle')}
          </p>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-4 border-border p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-6 text-foreground">{stat.value}</p>
                <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-[1.5px] text-muted-foreground">
              {t('advertise.targetPlacement').replace(' *', '')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLACEMENTS.map((p) => (
              <div
                key={p.key}
                className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 ${p.span}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-sm font-semibold text-foreground">{t(p.key)}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal delay={200}>
        {authLoading ? (
          <Card className="mt-10 grid min-h-[200px] place-items-center">
            <span className="text-sm text-muted-foreground">...</span>
          </Card>
        ) : signedIn ? (
          <Card className="mt-10 p-6 sm:p-8">
            <AdRequestForm />
          </Card>
        ) : (
          <Card className="mt-10 flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {t('advertise.signinRequiredTitle')}
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {t('advertise.signinRequiredDesc')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="min-h-10 bg-primary hover:bg-primary-light">
                <Link href={`/login?next=/reklam`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('nav.login')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-10">
                <Link href={`/signup?next=/reklam`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('nav.signup')}
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </Reveal>
    </div>
  );
}
