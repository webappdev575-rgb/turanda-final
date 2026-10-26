'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { AdsAdminTab } from '@/components/ads/ads-admin-tab';

export default function AdminAdsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user || !profile?.is_admin) { router.push('/'); return null; }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Ad Management</h1>
        <p className="mt-1 text-muted-foreground">Manage ad spaces, schedule placements, and review ad requests</p>
      </div>
      <AdsAdminTab />
    </div>
  );
}
