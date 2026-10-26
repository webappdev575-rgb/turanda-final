'use client';

import { MapPin, Clock, Users, Banknote, CheckCircle2, Building2, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Job } from '@/lib/types';
import { WAGE_UNIT_LABELS } from '@/lib/constants';
import { useI18n } from '@/components/i18n-provider';
import { translateJobType } from '@/lib/translations';

interface JobDetailDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (job: Job) => void;
}

export function JobDetailDialog({ job, open, onOpenChange, onApply }: JobDetailDialogProps) {
  const { t, locale } = useI18n();
  if (!job) return null;
  const wageUnitLabel = WAGE_UNIT_LABELS[job.wage_unit] || job.wage_unit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <Badge className="w-fit mb-1" variant="outline">{translateJobType(job.job_type, locale)}</Badge>
          <DialogTitle className="text-xl text-primary">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{job.farm_name}</DialogDescription>
        </DialogHeader>

        {job.language && job.language !== locale && (
          <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent-foreground dark:text-[#d9e2dc]">
            <Globe className="h-4 w-4 shrink-0" />
            <span>{t('joblang.translatedNotice', { lang: t(('joblang.' + job.language) as 'joblang.tr') })}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 py-2">
          {[
            { icon: MapPin, label: t('jobdetail.location'), value: job.location },
            { icon: Clock, label: t('jobdetail.duration'), value: job.duration },
            { icon: Users, label: t('jobdetail.openings'), value: `${job.openings}` },
            { icon: Banknote, label: t('jobdetail.wage'), value: `₺${job.wage.toLocaleString('tr-TR')}/${wageUnitLabel}`, highlight: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <item.icon className="h-4 w-4 text-secondary" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-medium ${item.highlight ? 'text-primary' : 'text-foreground'}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{t('jobdetail.description')}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
        </div>

        {job.requirements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">{t('jobdetail.requirements')}</h4>
            <ul className="space-y-1.5">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onApply && job.status === 'active' && (
          <div className="pt-2">
            <Button onClick={() => { onOpenChange(false); onApply(job); }} className="w-full bg-primary hover:bg-primary-light" size="lg">
              {t('jobdetail.applyNow')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
