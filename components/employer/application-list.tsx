'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Check, X, User, Phone, Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Application, ApplicationStatus } from '@/lib/types';
import { useI18n } from '@/components/i18n-provider';
import { createStatusNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

interface ApplicationListProps {
  applications: Application[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => Promise<{ error: string | null }>;
}

export function ApplicationList({ applications, onUpdateStatus }: ApplicationListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [startingChat, setStartingChat] = useState<string | null>(null);

  const filtered = applications.filter((app) => filter === 'all' ? true : app.status === filter);
  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: t('apps.statusPending'), className: 'bg-accent/15 text-accent-foreground border-accent/30' },
    accepted: { label: t('apps.statusAccepted'), className: 'bg-success/15 text-success border-success/30' },
    rejected: { label: t('apps.statusRejected'), className: 'bg-destructive/10 text-destructive border-destructive/30' },
  };

  const filterLabels: Record<string, string> = {
    all: t('apps.all'), pending: t('apps.pending'), accepted: t('apps.accepted'), rejected: t('apps.rejected'),
  };

  const handleMessage = useCallback(async (app: Application) => {
    if (!app.job) return;
    setStartingChat(app.id);

    const { data: jobData } = await supabase
      .from('jobs')
      .select('employer_id')
      .eq('id', app.job_id)
      .maybeSingle();

    const employerId = jobData?.employer_id;
    if (!employerId) {
      setStartingChat(null);
      return;
    }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('application_id', app.id)
      .maybeSingle();

    if (existing) {
      router.push(`/messages?c=${existing.id}`);
      setStartingChat(null);
      return;
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        job_id: app.job_id,
        employer_id: employerId,
        applicant_id: null,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        application_id: app.id,
      })
      .select('id')
      .maybeSingle();

    setStartingChat(null);
    if (!error && newConv) {
      router.push(`/messages?c=${newConv.id}`);
    }
  }, [router]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}>
            {filterLabels[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <User className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">{t('apps.noApps')}</p>
          <p className="text-xs text-muted-foreground">{t('apps.noAppsDesc')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const config = statusConfig[app.status];
            return (
              <Card key={app.id} className="p-4 animate-fade-in">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{app.applicant_name}</h4>
                      <Badge className={`${config.className} border`} variant="outline">{config.label}</Badge>
                    </div>
                    {app.job && (
                      <p className="text-xs text-muted-foreground">{t('apps.appliedFor')}: <span className="font-medium text-secondary">{app.job.title}</span> — {app.job.farm_name}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-secondary" />{app.applicant_phone}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-secondary" />{app.applicant_email}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-secondary" />{new Date(app.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {app.message && (
                      <div className="flex items-start gap-1.5 rounded-md bg-muted/50 px-3 py-2">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-secondary mt-0.5" />
                        <p className="text-xs text-muted-foreground">{app.message}</p>
                      </div>
                    )}
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-2 sm:flex-col">
                      <Button size="sm" onClick={async () => {
                        const result = await onUpdateStatus(app.id, 'accepted');
                        if (!result.error && app.job) await createStatusNotification(app.job, app, 'accepted');
                      }} className="bg-success hover:bg-success/90"><Check className="h-3.5 w-3.5" />{t('apps.accept')}</Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const result = await onUpdateStatus(app.id, 'rejected');
                        if (!result.error && app.job) await createStatusNotification(app.job, app, 'rejected');
                      }} className="text-destructive hover:text-destructive"><X className="h-3.5 w-3.5" />{t('apps.reject')}</Button>
                    </div>
                  )}
                  {app.status === 'accepted' && app.job && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={startingChat === app.id}
                      onClick={() => handleMessage(app)}
                      className="border-primary/30 text-primary hover:bg-primary/5"
                    >
                      {startingChat === app.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Send className="h-3.5 w-3.5" />}
                      {t('messages.message')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
