'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';
import type { Notification, NotificationStatus } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';

const typeLabelKeys: Record<Notification['notification_type'], TranslationKey> = {
  job_application: 'alerts.typeJobApplication',
  application_status: 'alerts.typeApplicationStatus',
  new_message: 'alerts.typeNewMessage',
};

const statusConfig: Record<NotificationStatus, { icon: typeof Clock; className: string; labelKey: TranslationKey }> = {
  pending: { icon: Clock, className: 'bg-accent/15 text-accent-foreground border-accent/30', labelKey: 'alerts.statusPending' },
  sent: { icon: CheckCircle2, className: 'bg-success/15 text-success border-success/30', labelKey: 'alerts.statusSent' },
  failed: { icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30', labelKey: 'alerts.statusFailed' },
  uncertain: { icon: Clock, className: 'bg-accent/15 text-accent-foreground border-accent/30', labelKey: 'alerts.statusUncertain' },
};

export function MyAlerts() {
  const { t, locale } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error) setNotifications((data as Notification[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="p-5 lg:col-span-1">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-secondary" />
        <h3 className="text-lg font-semibold text-foreground">{t('alerts.title')}</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{t('alerts.subtitle')}</p>
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <div className="py-6 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">{t('alerts.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = statusConfig[notif.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <div key={notif.id} className="rounded-lg border border-border p-3 space-y-1.5 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {t(typeLabelKeys[notif.notification_type] || 'alerts.typeJobApplication')}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[10px]', config.className)}>
                    <StatusIcon className="mr-0.5 h-3 w-3" />{t(config.labelKey)}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground leading-tight">{notif.subject}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(notif.created_at).toLocaleString(locale === 'ar' ? 'ar' : 'tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
