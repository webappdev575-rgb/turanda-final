'use client';

import { MapPin, Banknote, Star, Pin, Navigation } from 'lucide-react';
import type { Job } from '@/lib/types';
import { cn, formatWageRange, getJobTranslatedField } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WAGE_UNIT_LABELS } from '@/lib/constants';
import { useI18n } from '@/components/i18n-provider';

interface JobCompactRowProps {
  job: Job;
  distanceKm?: number;
  selected?: boolean;
  onHover?: (id: string | null) => void;
  onView: (job: Job) => void;
}

export function JobCompactRow({ job, distanceKm, selected, onHover, onView }: JobCompactRowProps) {
  const { t, locale } = useI18n();
  const tier = job.featured_tier ?? 'standard';
  const isPinned = tier === 'pinned';
  const isFeatured = tier === 'featured';
  const wageUnitLabel = WAGE_UNIT_LABELS[job.wage_unit] || job.wage_unit;
  const wageText = formatWageRange(job.wage_min, job.wage_max, job.wage, wageUnitLabel);

  return (
    <button
      onMouseEnter={() => onHover?.(job.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onView(job)}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border bg-background p-3 text-left transition-all hover:shadow-md [@media(hover:hover)]:motion-safe:hover:scale-[1.015]',
        selected
          ? 'border-primary ring-1 ring-primary/30 shadow-sm'
          : 'border-border hover:border-primary/30',
        isPinned && 'border-emerald-400/40 dark:border-emerald-400/30',
        isFeatured && !isPinned && 'border-amber-400/40 dark:border-amber-400/30'
      )}
    >
      {isPinned && <span className="absolute inset-y-0 left-0 w-1 bg-emerald-400" aria-hidden />}
      {isFeatured && !isPinned && <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" aria-hidden />}

      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isPinned && <Pin className="h-3 w-3 shrink-0 text-emerald-500" />}
            {isFeatured && !isPinned && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
            <p className="truncate text-sm font-bold text-foreground leading-tight">{getJobTranslatedField(job, 'title', locale) as string}</p>
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-secondary">{job.farm_name}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{getJobTranslatedField(job, 'location', locale) as string}</span>
            </span>
            {typeof distanceKm === 'number' && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 font-semibold text-foreground">
                <Navigation className="h-2.5 w-2.5" />
                ~{Math.round(distanceKm)} km
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          {wageText && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              <Banknote className="h-3.5 w-3.5" />
              {wageText}
            </span>
          )}
          <span className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
            {t('job.details')}
          </span>
        </div>
      </div>
    </button>
  );
}
