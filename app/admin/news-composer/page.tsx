'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { PostEditor } from '@/components/admin/post-editor';

export default function NewsComposerPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isStaff, setIsStaff] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      const staff = profile?.is_admin === true || profile?.is_moderator === true || profile?.is_editor === true;
      setIsStaff(staff);
      if (!staff) router.push('/');
      setChecking(false);
    }
  }, [authLoading, user, profile, router]);

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Newspaper className="h-5 w-5 text-primary" />
            News Composer
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage news posts and announcements</p>
        </div>
      </div>
      <PostEditor />
    </div>
  );
}
