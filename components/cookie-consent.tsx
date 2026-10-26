'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

const STORAGE_KEY = 'turanda-cookie-consent';

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
    setVisible(false);
  };

  const handleDecline = () => {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] animate-fade-in-up p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t('cookie.title')}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t('cookie.message')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              className="text-xs sm:text-sm"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              {t('cookie.decline')}
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-primary text-primary-foreground hover:bg-primary-light text-xs sm:text-sm"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {t('cookie.accept')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
