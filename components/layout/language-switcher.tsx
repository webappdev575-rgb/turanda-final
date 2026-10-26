'use client';

import { Check, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useI18n } from '@/components/i18n-provider';
import { locales, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const localeLabels: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
};

const localeCodes: Record<Locale, string> = {
  tr: 'TR',
  en: 'EN',
  ar: 'ع',
};

export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { locale, setLocale } = useI18n();

  return (
    <nav aria-label="Language selection" className={cn('inline-flex', className)}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Select language"
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#15231d1a] bg-cream px-3 shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] transition-colors hover:bg-[#15231d08] dark:border-[#ffffff14] dark:bg-[#1c2a22] dark:hover:bg-[#25382c]"
          >
            <span className="text-sm font-semibold text-ink-soft dark:text-[#ffffff99]">
              {compact ? localeCodes[locale] : localeLabels[locale]}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-soft opacity-70 dark:text-[#ffffff99]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-44 rounded-xl border-[#15231d1a] dark:border-[#ffffff14] bg-[#fffdf6f2] backdrop-blur-xl dark:bg-[#0d1a13f2] [&_[role=menuitem]]:font-semibold"
        >
          {locales.map((l: Locale) => (
            <DropdownMenuItem
              key={l}
              onClick={() => setLocale(l)}
              className={cn(
                'cursor-pointer justify-between rounded-lg text-sm',
                l === locale && 'text-brand dark:text-[#c9e7b8]'
              )}
            >
              {localeLabels[l]}
              {l === locale && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
