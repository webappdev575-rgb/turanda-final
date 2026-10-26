'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Map, List, Loader2, Inbox, ArrowUpDown, ChevronDown, SlidersHorizontal, Search, X } from 'lucide-react';
import { useJobs } from '@/hooks/use-jobs';
import { useApplications } from '@/hooks/use-applications';
import { JobCard } from '@/components/jobs/job-card';
import { JobCompactRow } from '@/components/jobs/job-compact-row';
import { JobFilters } from '@/components/jobs/job-filters';
import dynamic from 'next/dynamic';

const JobMapView = dynamic(() => import('@/components/jobs/job-map-view').then((m) => m.JobMapView), {
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});
import { ApplyDialog } from '@/components/jobs/apply-dialog';
import { JobDetailDialog } from '@/components/jobs/job-detail-dialog';
import { PredictiveSearch } from '@/components/shared/predictive-search';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAP_CENTER, CITY_COORDS } from '@/lib/constants';
import { resolvePlaceCoords } from '@/lib/turkey-districts';
import { geocodeForward } from '@/lib/geocoding';
import { cn, distanceKm } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';
import { AdSpace } from '@/components/ads/ad-space';
import { JobsAdSidebarCard } from '@/components/jobs/jobs-ad-sidebar-card';
import type { Job } from '@/lib/types';
import type { Locale } from '@/lib/i18n';

function slugifyCategory(cat: string): string {
  const map: Record<string, string> = {
    'Hasat': 'hasat', 'Sürüş': 'surus', 'Hayvan Bakımı': 'hayvan',
    'Ekim': 'ekim', 'Sulama': 'sulama', 'Ekipman Kullanımı': 'ekipman',
    'Genel İşçilik': 'genel', 'İşleme': 'isleme',
  };
  return map[cat] || cat.toLowerCase().replace(/\s+/g, '-');
}

function resolveLocationCoords(location: string): { lat: number; lng: number } | null {
  return resolvePlaceCoords(location, CITY_COORDS);
}

function JobsPageContent() {
  const searchParams = useSearchParams();
  const { jobs, loading, error } = useJobs();
  const { submitApplication } = useApplications();
  const { t, locale } = useI18n();

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedRadius, setSelectedRadius] = useState(50);
  const [centerLat, setCenterLat] = useState(MAP_CENTER.lat);
  const [centerLng, setCenterLng] = useState(MAP_CENTER.lng);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Konum metni offline veri setinde yoksa (mahalle/köy vb.) online geocoding ile çöz.
  useEffect(() => {
    let cancelled = false;
    const q = location.trim();
    if (!q || resolvePlaceCoords(q, CITY_COORDS)) { setGeoCoords(null); return; }
    const timer = setTimeout(async () => {
      const coords = await geocodeForward(q);
      if (!cancelled) setGeoCoords(coords);
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [location]);

  // Harita merkezini online çözülmüş koordinata taşı (harita görünümü için).
  useEffect(() => {
    if (geoCoords) { setCenterLat(geoCoords.lat); setCenterLng(geoCoords.lng); }
  }, [geoCoords]);

  useEffect(() => {
    if (window.innerWidth < 768) setFiltersOpen(false);
  }, []);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && !selectedTypes.includes(type)) { setSelectedTypes([type]); }
    const mapParam = searchParams.get('map');
    if (mapParam === 'true') { setViewMode('map'); }
    const q = searchParams.get('q');
    if (q) { setSearch(q); }
    const loc = searchParams.get('location');
    if (loc) {
      setLocation(loc);
      const coords = resolveLocationCoords(loc);
      if (coords) { setCenterLat(coords.lat); setCenterLng(coords.lng); }
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const clearFilters = () => { setSearch(''); setLocation(''); setSelectedTypes([]); setSelectedLanguage('all'); };

  const activeFilterCount =
    selectedTypes.length +
    (search ? 1 : 0) +
    (location ? 1 : 0) +
    (selectedLanguage !== 'all' ? 1 : 0);

  const languageRank: Record<string, number> = { [locale]: 0, tr: 1, en: 2, ar: 3 };

  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      if (job.status !== 'active') return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(job.job_type)) return false;
      if (selectedLanguage !== 'all' && job.language !== selectedLanguage) return false;
      if (search) {
        const q = search.toLowerCase();
        return job.title.toLowerCase().includes(q) || job.farm_name.toLowerCase().includes(q) || job.description.toLowerCase().includes(q);
      }
      if (location) {
        const loc = location.toLowerCase();
        const districtHit = job.location.toLowerCase().includes(loc);
        const refCoords = geoCoords ?? resolvePlaceCoords(location, CITY_COORDS);
        const nearRef = refCoords ? distanceKm(refCoords.lat, refCoords.lng, job.latitude, job.longitude) <= 35 : false;
        return districtHit || nearRef;
      }
      return true;
    });

    const refCoords = geoCoords ?? resolveLocationCoords(location);
    const tierOrder = (tier: string | undefined) => {
      if (tier === 'pinned') return 0;
      if (tier === 'featured') return 1;
      return 2;
    };
    const distFromRef = (job: Job) =>
      refCoords ? distanceKm(refCoords.lat, refCoords.lng, job.latitude, job.longitude) : 0;

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'wageDesc': return b.wage - a.wage;
        case 'wageAsc': return a.wage - b.wage;
        case 'openings': return b.openings - a.openings;
        case 'recommended': {
          const tierA = tierOrder(a.featured_tier);
          const tierB = tierOrder(b.featured_tier);
          if (tierA !== tierB) return tierA - tierB;
          const distA = distFromRef(a);
          const distB = distFromRef(b);
          if (distA !== distB) return distA - distB;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [jobs, selectedTypes, search, location, selectedLanguage, locale, sortBy, geoCoords]);

  const handleApplyClick = (job: Job) => { setApplyJob(job); setApplyOpen(true); };
  const handleViewClick = (job: Job) => { setDetailJob(job); setDetailOpen(true); };
  const handleApply = async (data: {
    job_id: string;
    applicant_id: string;
    applicant_name: string;
    applicant_phone: string;
    applicant_email: string;
    message: string;
    cv_document_id?: string | null;
    cover_letter_document_id?: string | null;
    cv_method?: 'pdf' | 'manual' | null;
    cv_text?: string | null;
    cover_letter_text?: string | null;
  }) => submitApplication(data);

  // Predictive search selection — set query and optionally jump to city center
  const handleSearchNavigate = ({ q, city }: { q?: string; city?: string }) => {
    if (q) setSearch(q);
    if (city) {
      setLocation(city);
      const coords = CITY_COORDS[city];
      if (coords) { setCenterLat(coords.lat); setCenterLng(coords.lng); }
    }
  };

  const jobsWithDistance = useMemo(() => {
    const list = filteredJobs.map((job) => ({
      job,
      distance: distanceKm(centerLat, centerLng, job.latitude, job.longitude),
    }));
    const tierOrder = (tier: string | undefined) => {
      if (tier === 'pinned') return 0;
      if (tier === 'featured') return 1;
      return 2;
    };

    const cmp: Record<string, ((a: typeof list[0], b: typeof list[0]) => number) | undefined> = {
      wageDesc: (a, b) => b.job.wage - a.job.wage,
      wageAsc: (a, b) => a.job.wage - b.job.wage,
      openings: (a, b) => b.job.openings - a.job.openings,
      recommended: (a, b) =>
        tierOrder(a.job.featured_tier) - tierOrder(b.job.featured_tier) || a.distance - b.distance,
    };
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime());
    } else if (cmp[sortBy]) {
      list.sort(cmp[sortBy]);
    } else {
      list.sort((a, b) => a.distance - b.distance);
    }
    return list;
  }, [filteredJobs, centerLat, centerLng, viewMode, sortBy]);

  const jobsInRadius = useMemo(
    () => jobsWithDistance.filter(({ distance }) => distance <= selectedRadius),
    [jobsWithDistance, selectedRadius]
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('jobs.title')}</h1>
        <p className="mt-1.5 text-muted-foreground">{t('jobs.subtitle', { count: jobs.filter((j) => j.status === 'active').length })}</p>
      </div>

      {/* Toolbar: view toggle, expandable predictive search, sort */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-background p-1">
          <button onClick={() => setViewMode('list')} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-primary')}>
            <List className="h-4 w-4" />{t('jobs.listView')}
          </button>
          <button onClick={() => setViewMode('map')} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all', viewMode === 'map' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-primary')}>
            <Map className="h-4 w-4" />{t('jobs.mapView')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] sm:w-[200px]">
              <SelectValue placeholder={t('jobs.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('jobs.sort.newest' as 'jobs.sort.newest')}</SelectItem>
              <SelectItem value="recommended">{t('jobs.sort.recommended' as 'jobs.sort.recommended')}</SelectItem>
              <SelectItem value="wageDesc">{t('jobs.sort.wageDesc' as 'jobs.sort.wageDesc')}</SelectItem>
              <SelectItem value="wageAsc">{t('jobs.sort.wageAsc' as 'jobs.sort.wageAsc')}</SelectItem>
              <SelectItem value="openings">{t('jobs.sort.openings' as 'jobs.sort.openings')}</SelectItem>
            </SelectContent>
          </Select>
          {/* Expandable predictive search — button expands into a search bar */}
          <div className="flex items-center">
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-out',
                searchExpanded ? 'w-56 sm:w-72 opacity-100' : 'w-0 opacity-0'
              )}
            >
              {searchExpanded && (
                <div className="relative">
                  <PredictiveSearch
                    jobs={jobs}
                    onSearchNavigate={handleSearchNavigate}
                    autoFocus
                    className="min-w-0"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (searchExpanded && search) { setSearch(''); }
                else if (searchExpanded) { setSearchExpanded(false); }
                else { setSearchExpanded(true); }
              }}
              aria-label={searchExpanded ? t('search.clear') : t('search.expand')}
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-all',
                searchExpanded
                  ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'
              )}
            >
              {searchExpanded ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">{searchExpanded ? t('search.clear') : t('search.expand')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Desktop: sticky filter sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="p-4">
              <JobFilters search={search} setSearch={setSearch} selectedTypes={selectedTypes} toggleType={toggleType} clearFilters={clearFilters} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} location={location} setLocation={setLocation} />
            </Card>
            <JobsAdSidebarCard />
            <AdSpace
              slot={selectedTypes.length === 1 ? `jobs-sidebar-${slugifyCategory(selectedTypes[0])}` : 'jobs-sidebar-all'}
              page="jobs"
              category={selectedTypes.length === 1 ? selectedTypes[0] : undefined}
              variant="sidebar"
              className="h-[250px]"
            />
          </div>
        </aside>

        {/* Mobile: collapsible filters above content */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-2 lg:hidden">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="mb-2 inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-secondary" />
              {t('jobs.filters')}
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-4">
              <JobFilters search={search} setSearch={setSearch} selectedTypes={selectedTypes} toggleType={toggleType} clearFilters={clearFilters} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} location={location} setLocation={setLocation} />
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Main content column */}
        <div className="min-w-0 flex-1">
        {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('jobs.loading')}</p>
        </div>
      ) : error ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">{t('jobs.refresh')}</p>
        </Card>
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="xl:sticky xl:top-24 xl:self-start">
            <JobMapView jobs={filteredJobs} selectedRadius={selectedRadius} onRadiusChange={setSelectedRadius} centerLat={centerLat} centerLng={centerLng} onCenterChange={(lat, lng) => { setCenterLat(lat); setCenterLng(lng); }} onJobSelect={(job) => { setSelectedJobId(job.id); setDetailJob(job); setDetailOpen(true); }} onApply={handleApplyClick} selectedJobId={selectedJobId} />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{t('jobs.jobsInRange', { radius: selectedRadius })}</span>
              <span className="text-xs font-medium text-muted-foreground">{t('jobs.sortBy')}: {t((`jobs.sort.${sortBy}`) as 'jobs.sort.newest')}</span>
            </div>
            {jobsInRadius.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-semibold text-foreground">{t('jobs.noJobsInRadius')}</p>
                <Button variant="outline" size="sm" onClick={() => setSelectedRadius(100)} className="mt-1">{t('jobs.radius')}: 100 km</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {jobsInRadius.map(({ job, distance }) => (
                  <JobCompactRow
                    key={job.id}
                    job={job}
                    distanceKm={distance}
                    selected={selectedJobId === job.id || hoveredJobId === job.id}
                    onHover={setHoveredJobId}
                    onView={handleViewClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-semibold text-foreground">{t('jobs.noResults')}</p>
          <p className="text-sm text-muted-foreground">{t('jobs.noResultsDesc')}</p>
          <Button variant="outline" onClick={clearFilters} className="mt-2">{t('jobs.clearFilters')}</Button>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredJobs.map((job, i) => (
              <React.Fragment key={job.id}>
                {i === 4 && (
                  <div className="sm:col-span-2">
                    <AdSpace slot="jobs-inline-1" page="jobs" variant="inline" className="h-[120px]" />
                  </div>
                )}
                {i === 8 && (
                  <div className="sm:col-span-2">
                    <AdSpace slot="jobs-inline-2" page="jobs" variant="inline" className="h-[120px]" />
                  </div>
                )}
                <JobCard job={job} onApply={handleApplyClick} onView={handleViewClick} />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
        </div>
      </div>

      <ApplyDialog job={applyJob} open={applyOpen} onOpenChange={setApplyOpen} onApply={handleApply} />
      <JobDetailDialog job={detailJob} open={detailOpen} onOpenChange={setDetailOpen} onApply={handleApplyClick} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <JobsPageContent />
    </Suspense>
  );
}
