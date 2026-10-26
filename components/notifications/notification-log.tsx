'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Bell className="h-5 w-5 text-primary" />Email Notifications
        </h2>
        <p className="text-sm text-muted-foreground">Log of email notifications sent to users</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const statusConfig = {
              pending: { icon: Clock, className: 'bg-accent/15 text-accent-foreground border-accent/30', label: 'Pending' },
              sent: { icon: CheckCircle2, className: 'bg-success/15 text-success border-success/30', label: 'Sent' },
              failed: { icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Failed' },
            };
            const config = statusConfig[notif.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <div key={notif.id} className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {notif.notification_type === 'job_application' ? 'Job Application' : 'Application Status'}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px]', config.className)}>
                      <StatusIcon className="mr-0.5 h-3 w-3" />{config.label}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{notif.subject}</p>
                <p className="text-xs text-muted-foreground">To: {notif.recipient_email}</p>
                {notif.error_message && (
                  <p className="text-xs text-destructive">Error: {notif.error_message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
