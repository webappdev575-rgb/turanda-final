'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const SCRIPT_SRC = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;

let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(): Promise<void> {
  if (window.grecaptcha) return new Promise((resolve) => window.grecaptcha!.ready(resolve));
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) window.grecaptcha.ready(resolve);
      else reject(new Error('reCAPTCHA unavailable'));
    };
    script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error('reCAPTCHA unavailable')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface RecaptchaProps {
  onVerify: (token: string) => void;
  action: string;
  className?: string;
  disabled?: boolean;
}

export function Recaptcha({ onVerify, action, className, disabled }: RecaptchaProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'error'>('idle');
  const onVerifyRef = useRef(onVerify);
  useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const verify = async () => {
      if (cancelled) return;
      onVerifyRef.current('');
      if (disabled) { setStatus('idle'); return; }
      if (!RECAPTCHA_SITE_KEY) {
        if (process.env.NODE_ENV !== 'production') {
          onVerifyRef.current('no-key-dev-mode');
          setStatus('verified');
        } else setStatus('error');
        return;
      }
      setStatus('loading');
      try {
        await loadRecaptchaScript();
        if (cancelled) return;
        const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action });
        const response = await fetch('/api/recaptcha-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Verification failed');
        if (cancelled) return;
        onVerifyRef.current(token);
        setStatus('verified');
        // v3 tokens expire after two minutes. Refresh while long forms stay open.
        refreshTimer = setTimeout(verify, 90000);
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void verify();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(refreshTimer);
    };
  }, [action, disabled]);

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-colors',
      status === 'verified' && 'border-success/30 bg-success/5 text-success',
      status === 'loading' && 'border-border bg-muted/30 text-muted-foreground',
      status === 'error' && 'border-destructive/30 bg-destructive/5 text-destructive',
      status === 'idle' && 'border-border bg-muted/30 text-muted-foreground',
      className,
    )}>
      {status === 'loading' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5" />
      )}
      <span className="font-medium">
        {status === 'verified' && 'reCAPTCHA Verified'}
        {status === 'loading' && 'Verifying...'}
        {status === 'error' && 'Verification failed — please reload'}
        {status === 'idle' && 'Preparing verification...'}
      </span>
    </div>
  );
}

export function isRecaptchaConfigured(): boolean {
  return !!RECAPTCHA_SITE_KEY;
}
