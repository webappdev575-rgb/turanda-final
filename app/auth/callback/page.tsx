'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, phone_verified, is_verified')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile || !profile.onboarded || !profile.phone_verified) {
        router.replace('/onboarding');
      } else {
        router.replace('/dashboard');
      }
    };
    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
