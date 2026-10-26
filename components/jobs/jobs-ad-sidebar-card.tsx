'use client';

import Link from 'next/link';
import { Megaphone, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';

interface JobsAdSidebarCardProps {
  className?: string;
}

export function JobsAdSidebarCard({ className }: JobsAdSidebarCardProps) {
  const { t } = useI18n();

  return (
    <Card className={cn(
      'relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-5 transition-all hover:shadow-lg',
      className,
    )}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative flex flex-col gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground leading-tight">
            {t('jobsAdSidebar.title')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('jobsAdSidebar.description')}
          </p>
        </div>
        <Link
          href="/advertise"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-light hover:shadow-sm w-fit"
        >
          {t('jobsAdSidebar.cta')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
