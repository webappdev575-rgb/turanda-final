'use client';

import { Search, X, SlidersHorizontal, Globe, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobCategories } from '@/hooks/use-job-categories';
import { useI18n } from '@/components/i18n-provider';
import { translateJobType, getJobTypeIcon } from '@/lib/translations';
import { IconRenderer } from '@/components/shared/icon-renderer';
import { LocateMeButton } from '@/components/shared/locate-me-button';
import type { JobLanguage } from '@/lib/types';

interface JobFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  selectedTypes: string[];
  toggleType: (type: string) => void;
  clearFilters: () => void;
  selectedLanguage: string;
  setSelectedLanguage: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
}

const LANGUAGE_FILTERS: { value: string; labelKey: string }[] = [
  { value: 'all', labelKey: 'joblang.all' },
  { value: 'tr', labelKey: 'joblang.tr' },
  { value: 'en', labelKey: 'joblang.en' },
  { value: 'ar', labelKey: 'joblang.ar' },
];

export function JobFilters({ search, setSearch, selectedTypes, toggleType, clearFilters, selectedLanguage, setSelectedLanguage, location, setLocation }: JobFiltersProps) {
  const { t, locale } = useI18n();
  const { jobTypes } = useJobCategories();
  const hasActiveFilters = selectedTypes.length > 0 || search.length > 0 || selectedLanguage !== 'all' || location.length > 0;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t('jobs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-secondary" />
          <span className="text-sm font-semibold text-foreground">{t('hero.locationPlaceholder')}</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('hero.locationPlaceholder')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
          <LocateMeButton onLocate={setLocation} size="md" showLabel={false} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-secondary" />
          <span className="text-sm font-semibold text-foreground">{t('jobs.jobType')}</span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-3 w-3" />{t('jobs.clear')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {jobTypes.map((type) => {
            const isActive = selectedTypes.includes(type);
            const iconInfo = getJobTypeIcon(type);
            return (
              <button key={type} onClick={() => toggleType(type)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'}`}>
                <IconRenderer icon={iconInfo} className="h-3 w-3" fallback="Briefcase" />
                {translateJobType(type, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="mb-2 flex items-center gap-2">
          <Globe className="h-4 w-4 text-secondary" />
          <span className="text-sm font-semibold text-foreground">{t('joblang.filterByLang')}</span>
        </div>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGE_FILTERS.map((lf) => <SelectItem key={lf.value} value={lf.value}>{t(lf.labelKey as 'joblang.all')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t('jobs.activeFilters')}</span>
          {selectedTypes.map((type) => (
            <span key={type} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {translateJobType(type, locale)}
              <button onClick={() => toggleType(type)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
