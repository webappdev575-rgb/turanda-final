'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

let scriptLoaded = false;
let scriptLoading = false;

function loadRecaptchaScript() {
  if (scriptLoaded || scriptLoading) return;
  scriptLoading = true;
  const script = document.createElement('script');
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  script.onload = () => { scriptLoaded = true; scriptLoading = false; };
  script.onerror = () => { scriptLoading = false; };
  document.head.appendChild(script);
}

interface RecaptchaProps {
  onVerify: (token: string) => void;
  action: string;
  className?: string;
  disabled?: boolean;
}

export function Recaptcha({ onVerify, action, className, disabled }: RecaptchaProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'verified' | 'error'>('idle');
  const tokenRef = useRef<string>('');
  const executedRef = useRef(false);

  const runExecute = useCallback(async () => {
    if (executedRef.current) return;
    executedRef.current = true;
    setStatus('loading');
    try {
      if (!window.grecaptcha) { setStatus('error'); return; }
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      tokenRef.current = token;
      onVerify(token);
      setStatus('verified');
    } catch {
      executedRef.current = false;
      setStatus('error');
    }
  }, [action, onVerify]);

  const executeToken = useCallback(async () => {
    if (executedRef.current || disabled) return;
    if (!RECAPTCHA_SITE_KEY) {
      onVerify('no-key-dev-mode');
      setStatus('verified');
      return;
    }

    if (!window.grecaptcha) {
      const waitInterval = setInterval(() => {
        if (window.grecaptcha && scriptLoaded) {
          clearInterval(waitInterval);
          runExecute();
        }
      }, 200);
      setTimeout(() => clearInterval(waitInterval), 10000);
      return;
    }

    runExecute();
  }, [action, disabled, onVerify, runExecute]);

  useEffect(() => {
    loadRecaptchaScript();
    const timer = setTimeout(() => executeToken(), 500);
    return () => clearTimeout(timer);
  }, [executeToken]);

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
