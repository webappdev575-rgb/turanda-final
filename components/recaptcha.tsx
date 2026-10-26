'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
let scriptPromise: Promise<void> | undefined;
function loadScript() {
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => window.grecaptcha ? window.grecaptcha.ready(resolve) : reject(new Error('Unavailable'));
    script.onerror = () => { scriptPromise = undefined; reject(new Error('Unavailable')); };
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
  const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading');
  const callback = useRef(onVerify);
  useEffect(() => { callback.current = onVerify; }, [onVerify]);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const verify = async () => {
      callback.current('');
      if (disabled) return;
      setStatus('loading');
      try {
        if (!siteKey) throw new Error('Verification not configured');
        await loadScript();
        const token = await window.grecaptcha!.execute(siteKey, { action });
        const response = await fetch('/api/recaptcha-verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action }), signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error('Verification failed');
        if (!cancelled) { callback.current(token); setStatus('verified'); }
      } catch {
        if (!cancelled) { callback.current(''); setStatus('error'); }
      }
    };
    void verify();
    const timer = setInterval(() => void verify(), 90000);
    return () => { cancelled = true; controller.abort(); clearInterval(timer); callback.current(''); };
  }, [action, disabled]);
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs',
      status === 'error' ? 'border-destructive/30 text-destructive' : 'border-border text-muted-foreground', className)}>
      {status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
      <span>{status === 'verified' ? 'reCAPTCHA Verified' : status === 'error' ? 'Verification unavailable — please reload' : 'Verifying...'}</span>
    </div>
  );
}
export function isRecaptchaConfigured() { return !!siteKey; }
