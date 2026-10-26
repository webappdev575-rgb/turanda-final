'use client';

import { useState } from 'react';
import { BadgeCheck, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';

export function VerifiedBadge({ className }: { className?: string }) {
  const { profile } = useAuth();
  const { t } = useI18n();

  if (profile?.is_verified) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success', className)}
        title={t('auth.verified')}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {t('auth.verified')}
      </span>
    );
  }
  return null;
}

export function VerificationPrompt({ className }: { className?: string }) {
  const { profile, isGoogleUser, resendEmailVerification } = useAuth();
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!profile || profile.is_verified) return null;

  const handleResend = async () => {
    if (!profile.notification_email && !profile.full_name) return;
    setSending(true);
    const email = profile.notification_email || '';
    if (email) {
      await resendEmailVerification(email);
    }
    setSending(false);
    setSent(true);
  };

  if (isGoogleUser || profile?.phone_verified === false) {
    return (
      <a
        href="/onboarding"
        className={cn('inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning hover:bg-warning/20 transition-colors', className)}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        {t('auth.verifyPhonePrompt')}
      </a>
    );
  }

  return (
    <button
      onClick={handleResend}
      disabled={sending || sent}
      className={cn('inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning hover:bg-warning/20 transition-colors disabled:opacity-60', className)}
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
      {sent ? t('auth.emailSent') : t('auth.verifyEmailPrompt')}
    </button>
  );
}
