'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Search, UserRound, LogOut, MessageSquare, LayoutDashboard,
  Megaphone, Settings, ShieldCheck, FileText, Loader2, Users, BarChart3, ChevronUp,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { supabase } from '@/lib/supabase';
import { MessagesBubble } from '@/components/layout/messages-bubble';

type TrayKind = 'none' | 'account' | 'switcher';

const TEST_ACCOUNTS = {
  admin: { email: 'admin@example.com', destination: '/admin/dashboard' },
  candidate: { email: 'user@example.com', destination: '/dashboard' },
  employer: { email: 'employer@example.com', destination: '/employer' },
} as const;

export function MobileDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, profile, loading, signOut, signIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tray, setTray] = useState<TrayKind>('none');
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTray('none');
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isAdmin = profile?.is_admin === true;

  const handleSignOut = async () => {
    setTray('none');
    await signOut();
    router.push('/');
  };

  const handleSwitch = async (role: keyof typeof TEST_ACCOUNTS | 'guest') => {
    if (role === 'guest') {
      setTray('none');
      await signOut();
      router.push('/');
      return;
    }
    setSwitching(role);
    setSwitchError(null);
    const account = TEST_ACCOUNTS[role];
    const { error } = await signIn(account.email, 'Password123!');
    setSwitching(null);
    if (error) {
      setSwitchError(t('dock.seedMissing'));
      return;
    }
    setTray('none');
    router.push(account.destination);
  };

  if (!mounted || loading) return null;

  return (
    <>
      {/* Backdrop */}
      {tray !== 'none' && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => setTray('none')}
          className="fixed inset-0 z-[55] bg-[#08271d66] backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Account tray (signed in) */}
      {tray === 'account' && user && (
        <div className="fixed inset-x-3 bottom-24 z-[60] animate-fade-in-up rounded-2xl border border-[#15231d1a] bg-[#fffdf6f2] p-2 shadow-2xl backdrop-blur-xl lg:hidden dark:border-[#ffffff14] dark:bg-[#0d1a13f2]">
          <div className="mb-1 flex items-center gap-2 border-b border-[#15231d1a] px-3 py-2.5 dark:border-[#ffffff14]">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand">
              <UserRound className="h-4 w-4 text-white" />
            </div>
            <span className="truncate text-sm font-semibold text-[#141f1b] dark:text-[#f5f3eb]">
              {profile?.full_name || user.email?.split('@')[0] || ''}
            </span>
          </div>
          <DockTrayItem icon={MessageSquare} label={t('dock.messages')} href="/messages" onNavigate={() => setTray('none')} />
          <DockTrayItem icon={LayoutDashboard} label={t('nav.dashboard')} href="/dashboard" onNavigate={() => setTray('none')} />
          {isAdmin && (
            <>
              <DockTrayItem icon={Megaphone} label="Ads" href="/admin/ads" onNavigate={() => setTray('none')} />
              <DockTrayItem icon={Settings} label="Admin" href="/admin/dashboard" onNavigate={() => setTray('none')} />
            </>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="h-4 w-4" />
            </span>
            {t('dock.signOut')}
          </button>
        </div>
      )}

      {/* User switcher tray (admins only) */}
      {tray === 'switcher' && (
        <div className="fixed inset-x-3 bottom-24 z-[60] animate-fade-in-up rounded-2xl border border-[#15231d1a] bg-[#fffdf6f2] p-2 shadow-2xl backdrop-blur-xl lg:hidden dark:border-[#ffffff14] dark:bg-[#0d1a13f2]">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold text-[#617069] dark:text-[#9ca5a0]">
            {t('dock.switcherHint')}
          </p>
          <div className="grid grid-cols-2 gap-1.5 p-1">
            <SwitcherTile label={t('dock.previewGuest')} icon={UserRound} loading={switching === 'guest'} onClick={() => handleSwitch('guest')} />
            <SwitcherTile label={t('dock.previewCandidate')} icon={Users} loading={switching === 'candidate'} onClick={() => handleSwitch('candidate')} />
            <SwitcherTile label={t('dock.previewEmployer')} icon={FileText} loading={switching === 'employer'} onClick={() => handleSwitch('employer')} />
            <SwitcherTile label={t('dock.previewAdmin')} icon={ShieldCheck} loading={switching === 'admin'} onClick={() => handleSwitch('admin')} />
          </div>
          {switchError && (
            <p className="px-3 pb-2 text-xs font-semibold text-destructive">{switchError}</p>
          )}
        </div>
      )}

      {/* Dock bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.5rem)] z-50 lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-end gap-1 rounded-2xl border border-[#15231d1a] bg-[#fffdf6f2] px-2 py-1.5 shadow-2xl backdrop-blur-xl dark:border-[#ffffff14] dark:bg-[#0d1a13f2]">
          <LinkTab href="/" icon={Home} label={t('dock.home')} active={isActive('/')} />
          <LinkTab href="/jobs" icon={Search} label={t('dock.browse')} active={isActive('/jobs')} />
          {/* Center action */}
          {user && (
            <div className="flex w-14 shrink-0 justify-center">
              <button
                type="button"
                onClick={() => router.push(isAdmin || profile?.is_moderator === true ? '/admin/news-composer' : '/jobs')}
                aria-label={isAdmin || profile?.is_moderator === true ? t('dock.admin') : t('dock.applyWithDoc')}
                className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-[#14563d] text-white shadow-lg transition-transform hover:scale-105 dark:bg-[#c9e7b8] dark:text-[#14563d]"
              >
                <FileText className="h-6 w-6" />
              </button>
            </div>
          )}

          <LinkTab href="/piyasalar" icon={BarChart3} label={t('nav.marketNews')} active={isActive('/piyasalar')} />

          {/* My Account */}
          <button
            type="button"
            onClick={() => (user ? setTray('account') : router.push('/login'))}
            aria-label={t('dock.account')}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[#617069] transition-colors hover:text-[#14563d] dark:text-[#9ca5a0] dark:hover:text-[#c9e7b8]"
          >
            <UserRound className="h-5 w-5" />
            <span className="text-[10px] font-semibold leading-tight">{t('dock.account')}</span>
          </button>

          {/* Quick switcher - always available on mobile */}
          {user && (
            <button
              type="button"
              onClick={() => setTray('switcher')}
              aria-label={t('dock.switchUser')}
              className="flex w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[#617069] transition-colors hover:text-[#14563d] dark:text-[#9ca5a0] dark:hover:text-[#c9e7b8]"
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-tight">{t('dock.switchUser')}</span>
            </button>
          )}
        </div>
      </nav>

      <div className="fixed right-4 bottom-24 z-50 flex flex-col items-center gap-3 lg:right-6 lg:bottom-6">
        <BackToTopButton />
        <MessagesBubble />
      </div>
    </>
  );
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="flex h-12 w-12 animate-fade-in-up items-center justify-center rounded-full border border-[#15231d1a] bg-[#fffdf6f2] text-[#14563d] shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 active:scale-95 dark:border-[#ffffff14] dark:bg-[#0d1a13f2] dark:text-[#c9e7b8]"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

function LinkTab({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors',
        active
          ? 'bg-[#14563d0d] text-[#14563d] dark:bg-[#c9e7b81a] dark:text-[#c9e7b8]'
          : 'text-[#617069] hover:text-[#14563d] dark:text-[#9ca5a0] dark:hover:text-[#c9e7b8]',
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-semibold leading-tight">{label}</span>
    </Link>
  );
}

function DockTrayItem({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#141f1b] transition-colors hover:bg-[#15231d08] dark:text-[#f5f3eb] dark:hover:bg-[#1c2a22]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#14563d1a] text-[#14563d] dark:bg-[#c9e7b81f] dark:text-[#c9e7b8]">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}

function SwitcherTile({
  label,
  icon: Icon,
  loading,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-center gap-1 rounded-xl border border-[#15231d1a] px-2 py-3 text-center text-[11px] font-semibold text-[#141f1b] transition-colors hover:bg-[#15231d08] disabled:opacity-60 dark:border-[#ffffff14] dark:text-[#f5f3eb] dark:hover:bg-[#1c2a22]"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
      {label}
    </button>
  );
}
