'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Briefcase, Sprout, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TURKEY_CITIES, CITY_COORDS } from '@/lib/constants';
import { useI18n } from '@/components/i18n-provider';
import { translateJobType } from '@/lib/translations';
import { cn, distanceKm } from '@/lib/utils';
import type { Job } from '@/lib/types';

export interface SearchSuggestion {
  kind: 'job' | 'farm' | 'city';
  label: string;
  sublabel?: string;
  job?: Job;
  city?: string;
}

interface PredictiveSearchProps {
  /** preloaded jobs (optional — component fetches its own when omitted) */
  jobs?: Job[];
  /** navigate to jobs page with query on select (navbar/hero mode) */
  onSearchNavigate?: (params: { q?: string; city?: string }) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** extra classes for the input (e.g. to blend into a styled container) */
  inputClassName?: string;
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 220;
const MAX_SUGGESTIONS = 7;

export function usePredictiveSuggestions(query: string, jobs: Job[] | undefined, enabled: boolean) {
  const { locale } = useI18n();
  const [remoteJobs, setRemoteJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || jobs) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < MIN_QUERY) {
        if (!cancelled) { setRemoteJobs([]); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .or(`title.ilike.%${q}%,farm_name.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(20);
      if (!cancelled) {
        setRemoteJobs((data as Job[]) || []);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, enabled, jobs]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < MIN_QUERY) return [];
    const out: SearchSuggestion[] = [];
    const seen = new Set<string>();

    const source = jobs ?? remoteJobs;
    // farm names first (grouped), then jobs
    for (const job of source) {
      const title = job.title.toLowerCase();
      const farm = job.farm_name.toLowerCase();
      const loc = job.location.toLowerCase();
      if (farm.includes(q) && !seen.has(`farm:${farm}`)) {
        seen.add(`farm:${farm}`);
        out.push({ kind: 'farm', label: job.farm_name, sublabel: job.location, job });
      }
      if (title.includes(q) && out.length < MAX_SUGGESTIONS) {
        out.push({ kind: 'job', label: job.title, sublabel: `${job.farm_name} · ${job.location}`, job });
      } else if (loc.includes(q) && !seen.has(`job:${job.id}`) && out.length < MAX_SUGGESTIONS) {
        out.push({ kind: 'job', label: job.title, sublabel: `${job.farm_name} · ${job.location}`, job });
      }
      seen.add(`job:${job.id}`);
      if (out.length >= MAX_SUGGESTIONS) break;
    }

    // cities
    for (const city of TURKEY_CITIES) {
      if (out.length >= MAX_SUGGESTIONS) break;
      const c = city.toLowerCase();
      const cDeAccented = c.replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o');
      if (c.includes(q) || cDeAccented.includes(q)) {
        out.push({ kind: 'city', label: city, city });
      }
    }

    return out.slice(0, MAX_SUGGESTIONS);
  }, [query, jobs, remoteJobs]);

  return { suggestions, loading };
}

export function PredictiveSearch({
  jobs,
  onSearchNavigate,
  className,
  placeholder,
  autoFocus,
  inputClassName,
}: PredictiveSearchProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const { suggestions, loading } = usePredictiveSuggestions(query, jobs, open);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSelect = (s: SearchSuggestion) => {
    setOpen(false);
    if (s.kind === 'city') {
      onSearchNavigate?.({ city: s.city });
      const params = new URLSearchParams();
      params.set('city', s.city!);
      router.push(`/jobs?${params.toString()}`);
      return;
    }
    if (s.job) {
      // deep-link: jobs page reads ?q= and filters; simplest reliable jump
      const params = new URLSearchParams();
      params.set('q', s.job.title);
      if (onSearchNavigate) {
        onSearchNavigate({ q: s.job.title });
        return;
      }
      router.push(`/jobs?q=${encodeURIComponent(s.job.title)}`);
    }
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    setOpen(false);
    const params = new URLSearchParams();
    params.set('q', query.trim());
    if (onSearchNavigate) {
      onSearchNavigate({ q: query.trim() });
      return;
    }
    router.push(`/jobs?${params.toString()}`);
  };

  const kindIcon = (kind: SearchSuggestion['kind']) => {
    if (kind === 'city') return <MapPin className="h-4 w-4 shrink-0 text-secondary" />;
    if (kind === 'farm') return <Sprout className="h-4 w-4 shrink-0 text-accent" />;
    return <Briefcase className="h-4 w-4 shrink-0 text-primary" />;
  };

  return (
    <div ref={boxRef} className={cn('relative w-full', className)}>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
              else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIdx >= 0 && suggestions[activeIdx]) handleSelect(suggestions[activeIdx]);
                else handleSubmit();
              }
              else if (e.key === 'Escape') setOpen(false);
            }}
            placeholder={placeholder ?? t('jobs.searchPlaceholder')}
            className={cn(
              'h-11 w-full rounded-lg border border-input bg-background py-2 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary',
              inputClassName,
            )}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-autocomplete="list"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl animate-fade-in"
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s.kind}-${s.label}-${i}`}
              type="button"
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                i === activeIdx ? 'bg-muted/70' : 'hover:bg-muted/50'
              )}
            >
              {kindIcon(s.kind)}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{s.label}</span>
                {s.sublabel && (
                  <span className="block truncate text-xs text-muted-foreground">{s.sublabel}</span>
                )}
              </span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {s.kind === 'city' ? t('search.kindCity') : s.kind === 'farm' ? t('search.kindFarm') : t('search.kindJob')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
