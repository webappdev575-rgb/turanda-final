'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, Sun, Moon, LayoutDashboard, LogOut, Settings, MessageSquare, DoorOpen, UserRound, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { PredictiveSearch } from '@/components/shared/predictive-search';
import { VerifiedBadge } from '@/components/auth/verified-badge';
import type { TranslationKey } from '@/lib/i18n';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const { user, profile, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks: { href: string; label: TranslationKey }[] = [
    { href: '/employer', label: 'nav.postJob' },
    { href: '/piyasalar', label: 'nav.markets' },
    { href: '/haberler', label: 'nav.newsLink' },
    { href: '/akademi', label: 'nav.akademi' },
    { href: '/jobs', label: 'nav.findJobs' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#15231d0f] bg-[#fffdf6f2] backdrop-blur-xl dark:border-[#ffffff14] dark:bg-[#0d1a13e6]">
      <div className="grid min-h-20 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center gap-3 justify-self-start rounded-lg">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
            <Image src="/images/logos/logo-mark.png" alt="Turanda Tarım" fill sizes="48px" className="object-contain dark:hidden" />
            <Image src="/images/logos/turanda_dark_mode_logo.png" alt="" aria-hidden="true" fill sizes="48px" className="hidden object-contain dark:block" />
          </span>
          <span className="hidden shrink-0 sm:flex">
            <span aria-hidden="true" className="flex flex-col items-center justify-center leading-none">
              <span className="text-[17px] font-extrabold uppercase tracking-[0.02em] text-[#15231d] dark:text-white">Turanda</span>
              <span className="mt-[3px] text-[10px] font-bold uppercase tracking-[0.55em] text-[#c9962e]">Tarim</span>
            </span>
          </span>
        </Link>

        {/* Desktop pill nav */}
        <nav aria-label="Ana navigasyon" className="hidden justify-center lg:flex">
          <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-transparent p-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold leading-5 transition-colors',
                  isActive(link.href)
                    ? 'bg-[#ffffff1a] text-[#141f1b] dark:bg-[#ffffff1a] dark:text-[#c9e7b8]'
                    : 'text-[#141f1b] hover:bg-[#08281d] hover:text-white dark:text-[#9ca5a0] dark:hover:bg-[#ffffff0d] dark:hover:text-[#c9e7b8]'
                )}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>
        </nav>

        <div className="col-start-3 flex shrink-0 items-center justify-end gap-2">
          {/* Expandable sitewide search (desktop) */}
          <div className="hidden items-center md:flex">
            {searchOpen ? (
              <div className="flex items-center gap-1">
                <PredictiveSearch
                  autoFocus
                  className="w-52 lg:w-64"
                  inputClassName="h-10 rounded-full bg-[#15231d08] border-transparent dark:bg-[#ffffff14]"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#617069] transition-colors hover:bg-[#15231d08] hover:text-[#15231d] dark:text-[#ffffff99] dark:hover:bg-[#1c2a22] dark:hover:text-white"
                  aria-label={t('search.clear')}
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#617069] transition-colors hover:bg-[#15231d08] hover:text-[#15231d] dark:text-[#ffffff99] dark:hover:bg-[#1c2a22] dark:hover:text-white"
                aria-label={t('search.expand')}
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>

          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#617069] transition-colors hover:bg-[#15231d08] hover:text-[#15231d] dark:text-[#ffffff99] dark:hover:bg-[#1c2a22] dark:hover:text-white"
              aria-label={t('nav.theme')}
            >
              {theme === 'dark' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            </button>
          )}

          <LanguageSwitcher compact />

          {/* Auth area */}
          {user ? (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
              <div
                onMouseEnter={() => {
                  if (closeTimer.current) window.clearTimeout(closeTimer.current);
                  closeTimer.current = window.setTimeout(() => setMenuOpen(true), 80);
                }}
                onMouseLeave={() => {
                  if (closeTimer.current) window.clearTimeout(closeTimer.current);
                  closeTimer.current = window.setTimeout(() => setMenuOpen(false), 180);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#15231d33] bg-transparent text-[#15231d] transition-colors hover:bg-[#15231d08] lg:inline-flex dark:border-[#ffffff26] dark:bg-transparent dark:text-[#f5f3eb] dark:hover:bg-[#1c2a22]"
                    aria-label={t('nav.welcome', { name: profile?.full_name || user.email?.split('@')[0] || '' })}
                  >
                    <UserRound className="h-[18px] w-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={6}
                  onMouseEnter={() => {
                    if (closeTimer.current) window.clearTimeout(closeTimer.current);
                  }}
                  onMouseLeave={() => {
                    if (closeTimer.current) window.clearTimeout(closeTimer.current);
                    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 180);
                  }}
                  className="w-56 rounded-xl border-[#15231d1a] dark:border-[#ffffff14] bg-[#fffdf6f2] backdrop-blur-xl text-ink-soft dark:bg-[#0d1a13f2] dark:text-[#ffffff99] [&_[role=menuitem]]:font-semibold"
                >
                  <div className="flex items-center gap-2 border-b border-[#15231d1a] px-3 py-2.5 dark:border-[#ffffff14]">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand">
                      <UserRound className="h-4 w-4 text-white" />
                    </div>
                    <span className="truncate text-sm font-semibold text-ink dark:text-[#f5f3eb]">
                      {profile?.full_name || user.email?.split('@')[0] || ''}
                    </span>
                    {profile?.is_verified && <VerifiedBadge className="px-1 py-0" />}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer font-semibold">
                      <MessageSquare className="h-4 w-4" />
                      {t('nav.messages')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer font-semibold">
                      <LayoutDashboard className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  {(profile?.is_admin || profile?.is_moderator) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard" className="cursor-pointer font-semibold">
                        <Settings className="h-4 w-4" />
                        {profile?.is_admin ? 'Admin' : 'Moderator'}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer font-semibold text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 items-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold text-[#617069] transition-colors hover:bg-transparent hover:text-[#15231d] md:inline-flex dark:text-[#ffffff99] dark:hover:text-white"
              >
                <DoorOpen className="mr-2 h-4 w-4 shrink-0" />
                {t('nav.login')}
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="p-2 text-[#14563d] dark:text-[#c9e7b8] lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t('nav.menu')}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="animate-fade-in border-t border-[#15231d0f] bg-[#fffdf6f2] lg:hidden dark:border-[#ffffff14] dark:bg-[#0d1a13f2]">
          <div className="flex flex-col gap-1 px-4 py-4">
            <div className="pb-2">
              <PredictiveSearch
                className="w-full"
                inputClassName="h-11 rounded-xl bg-[#15231d08] border-transparent dark:bg-[#ffffff14]"
              />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                  isActive(link.href)
                    ? 'bg-[#08271d] text-white'
                    : 'text-ink-soft hover:bg-[#15231d08] hover:text-ink'
                )}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
