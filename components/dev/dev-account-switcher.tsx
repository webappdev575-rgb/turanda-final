'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldCheck, UserRound, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';

const accounts = [
  {
    email: 'admin@example.com',
    label: 'Super Admin',
    description: 'Full access to administration and content management.',
    destination: '/admin/dashboard',
    icon: ShieldCheck,
  },
  {
    email: 'user@example.com',
    label: 'Standard User',
    description: 'Completed worker profile with a verified account.',
    destination: '/dashboard',
    icon: UserRoundCheck,
  },
  {
    email: 'pending@example.com',
    label: 'Pending User',
    description: 'Incomplete onboarding with pending verification.',
    destination: '/onboarding',
    icon: UserRound,
  },
] as const;

export function DevAccountSwitcher() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (email: string, destination: string) => {
    setLoadingEmail(email);
    setError(null);
    const result = await signIn(email, 'Password123!');
    setLoadingEmail(null);
    if (result.error) {
      setError('The test account is not available. Run the development seed command first.');
      return;
    }
    router.push(destination);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Development only</p>
        <h1 className="text-3xl font-bold text-foreground">Test account switcher</h1>
        <p className="mt-3 text-muted-foreground">Use a prepared account to preview each dashboard experience without manually completing the signup flow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {accounts.map((account) => {
          const Icon = account.icon;
          const isLoading = loadingEmail === account.email;
          return (
            <Card key={account.email} className="flex flex-col p-5 transition-shadow hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{account.label}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{account.description}</p>
              <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{account.email}</p>
              <Button className="mt-5 w-full" onClick={() => handleSignIn(account.email, account.destination)} disabled={loadingEmail !== null}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Open dashboard
              </Button>
            </Card>
          );
        })}
      </div>

      {error && <p className="mt-5 text-sm text-destructive">{error}</p>}
      <p className="mt-8 text-xs text-muted-foreground">This page is unavailable when the application runs in production mode.</p>
    </main>
  );
}
