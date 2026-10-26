'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Sprout, Mail, Lock, Search, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { safeRedirect } from '@/lib/safe-redirect';
import { Recaptcha } from '@/components/recaptcha';
import { GoogleSignInButton, OrDivider } from '@/components/auth/google-sign-in-button';
import { cn } from '@/lib/utils';

type LoginRole = 'candidate' | 'employer';

function LoginContent() {
  const { signIn, profile } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginRole, setLoginRole] = useState<LoginRole>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  useEffect(() => {
    if (profile?.user_type === 'farmer' || profile?.user_type === 'business') {
      setLoginRole('employer');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError(t('recaptcha.errorRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error.includes('Invalid') || result.error.includes('credentials') ? t('auth.errorCredentials') : result.error);
    } else {
      router.push(safeRedirect(searchParams.get('next'), loginRole === 'employer' ? '/employer' : '/jobs'));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Role toggle */}
        <div className="mb-6">
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">{t('auth.loginAs')}</p>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setLoginRole('candidate')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
                loginRole === 'candidate' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Search className="h-4 w-4" />
              {t('auth.roleCandidate')}
            </button>
            <button
              type="button"
              onClick={() => setLoginRole('employer')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
                loginRole === 'employer' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Tractor className="h-4 w-4" />
              {t('auth.roleEmployer')}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">{t('auth.loginToggleHint')}</p>
        </div>

        <GoogleSignInButton />
        <OrDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} className="pl-10" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} className="pl-10" required />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Recaptcha onVerify={setRecaptchaToken} action="login" />
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light" size="lg">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loading')}</> : t('auth.loginButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link href={{ pathname: '/signup', query: searchParams.toString() ? `?${searchParams.toString()}` : '' } as never} className="font-semibold text-primary hover:underline">{t('auth.signUpHere')}</Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}><LoginContent /></Suspense>;
}
