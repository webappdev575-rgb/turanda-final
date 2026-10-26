'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/i18n-provider';
import { supabase } from '@/lib/supabase';

/**
 * Floating messages bubble with unread badge. Always mounted so it shows on
 * desktop too (the mobile dock itself is hidden on large screens); hidden on
 * /messages and for signed-out visitors.
 */
export function MessagesBubble() {
  const { user } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setUnread(0);
    if (!user) return;
    const userId = user.id;

    const fetchUnread = async () => {
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`employer_id.eq.${userId},applicant_id.eq.${userId}`);
      if (cancelled) return;
      if (!convs || convs.length === 0) {
        setUnread(0);
        return;
      }
      const ids = convs.map((c) => c.id);
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .neq('sender_id', userId)
        .eq('is_read', false);
      if (!cancelled) setUnread(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('messages-bubble-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || pathname.startsWith('/messages')) return null;

  const hasUnread = unread > 0;

  return (
    <Link
      href="/messages"
      aria-label={t('dock.messages')}
      className={cn(
        'relative flex h-12 w-12 items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 active:scale-95',
        hasUnread
          ? 'border-transparent bg-[#14563d] text-white dark:bg-[#1d7a54] dark:text-white'
          : 'border-[#15231d1a] bg-[#fffdf6f2] text-[#14563d] dark:border-[#ffffff14] dark:bg-[#0d1a13f2] dark:text-[#c9e7b8]',
      )}
    >
      {hasUnread && (
        <span
          aria-hidden="true"
          className="tura-pulse-ring absolute inset-0 rounded-full bg-[#14563d]/60 dark:bg-[#1d7a54]/60"
        />
      )}
      <MessageSquare className="relative h-5 w-5" />
      {hasUnread && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#fffdf6] bg-[#fb2c36] px-1 text-[10px] font-bold text-white dark:border-[#0d1a13]">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
