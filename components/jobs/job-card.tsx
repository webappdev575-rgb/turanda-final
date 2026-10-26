'use client';

import { MapPin, Clock, Users, Banknote, CheckCircle2, Globe, Star, Pin } from 'lucide-react';
import type { Job } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WAGE_UNIT_LABELS } from '@/lib/constants';
import { useI18n } from '@/components/i18n-provider';
import { translateJobType, getJobTypeColor, getJobTypeIcon } from '@/lib/translations';
import { IconRenderer } from '@/components/shared/icon-renderer';

interface JobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
  onView?: (job: Job) => void;
}

export function JobCard({ job, onApply, onView }: JobCardProps) {
  const { t, locale } = useI18n();
  const typeColor = getJobTypeColor(job.job_type);
  const typeIcon = getJobTypeIcon(job.job_type);
  const wageUnitLabel = WAGE_UNIT_LABELS[job.wage_unit] || job.wage_unit;
  const tier = job.featured_tier ?? 'standard';
  const isPinned = tier === 'pinned';
  const isFeatured = tier === 'featured';

  const cardClass = isPinned
    ? 'group relative overflow-hidden border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50/40 to-transparent p-5 transition-all hover:shadow-xl hover:border-emerald-400/70 animate-fade-in-up motion-safe:hover:scale-[1.015]'
    : isFeatured
      ? 'group relative overflow-hidden border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/40 to-transparent p-5 transition-all hover:shadow-xl hover:border-amber-400/70 animate-fade-in-up motion-safe:hover:scale-[1.015]'
      : 'group relative overflow-hidden border-border p-5 transition-all hover:shadow-lg hover:border-primary/30 animate-fade-in-up motion-safe:hover:scale-[1.015]';

  return (
    <Card className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {isPinned && (
              <Badge className="border bg-emerald-50 text-emerald-700 border-emerald-200 gap-1" variant="outline">
                <Pin className="h-3 w-3" />{t('employer.pinnedBadge')}
              </Badge>
            )}
            {isFeatured && !isPinned && (
              <Badge className="border bg-amber-50 text-amber-700 border-amber-200 gap-1" variant="outline">
                <Star className="h-3 w-3 fill-current" />{t('employer.featuredBadge')}
              </Badge>
            )}
            <Badge className={`${typeColor} border inline-flex items-center gap-1 dark:text-[#dfe8e1]`} variant="outline">
              <IconRenderer icon={typeIcon} className="h-3 w-3" fallback="Briefcase" />
              {translateJobType(job.job_type, locale)}
            </Badge>
            {job.language && (
              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                <Globe className="h-3 w-3" />{job.language.toUpperCase()}
              </Badge>
            )}
            {job.status === 'closed' && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">{t('job.closed')}</Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground leading-tight">{job.title}</h3>
          <p className="mt-0.5 text-sm font-medium text-secondary">{job.farm_name}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4 text-secondary" /><span>{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4 text-secondary" /><span>{job.duration}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4 text-secondary" /><span>{t('job.openings', { count: job.openings })}</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <Banknote className="h-4 w-4" /><span>₺{job.wage.toLocaleString('tr-TR')}/{wageUnitLabel}</span>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

      {job.requirements.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.requirements.slice(0, 3).map((req, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" />{req}
            </span>
          ))}
          {job.requirements.length > 3 && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {t('job.more', { count: job.requirements.length - 3 })}
            </span>
          )}
        </div>
      )}

      {job.skills && job.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.skills.map((skill, i) => (
            <span key={i} className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {onView && (
          <Button variant="outline" size="sm" onClick={() => onView(job)} className="flex-1">{t('job.details')}</Button>
        )}
        {onApply && (
          <Button size="sm" onClick={() => onApply(job)} className="flex-1 bg-primary hover:bg-primary-light" disabled={job.status === 'closed'}>
            {job.status === 'closed' ? t('job.closed') : t('job.apply')}
          </Button>
        )}
      </div>
    </Card>
  );
}
