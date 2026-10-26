'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Building2, Search, Loader2, Inbox, Calendar, Bookmark, Download,
  ChevronDown, Landmark, Sprout, FlaskConical, HandCoins, Droplets,
  ShieldAlert, Scale, Users, Radio, X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGovNews, localizedNewsTitle, localizedNewsSummary, type NewsArticle } from '@/hooks/use-news';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';

const agencyTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Central Ministry': Landmark,
  'State-Owned Enterprise': Building2,
  'Research & Extension': FlaskConical,
  'Grants & Financing': HandCoins,
  'Water & Infrastructure': Droplets,
  'Insurance & Risk': ShieldAlert,
  'Statistics & Legislation': Scale,
  'Producer Cooperative': Users,
  'Wire Service': Radio,
};

const BOOKMARKS_KEY = 'kaynaklar-bookmarks';

function loadBookmarks(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export default function KaynaklarPage() {
  const { locale } = useI18n();
  const { articles, loading, error } = useGovNews();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(agencyTypeIcons)));

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sectors = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a) => { if (a.sector) s.add(a.sector); });
    return Array.from(s).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (sectorFilter && a.sector !== sectorFilter) return false;
      if (agencyFilter && a.agency_type !== agencyFilter) return false;
      if (onlyBookmarked && !bookmarks.includes(a.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        const title = localizedNewsTitle(a, locale).toLowerCase();
        const summary = (localizedNewsSummary(a, locale) ?? '').toLowerCase();
        if (!title.includes(q) && !summary.includes(q)) return false;
      }
      if (dateFrom && new Date(a.published_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.published_at) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [articles, sectorFilter, agencyFilter, onlyBookmarked, bookmarks, search, dateFrom, dateTo, locale]);

  const grouped = useMemo(() => {
    const map: Record<string, NewsArticle[]> = {};
    filtered.forEach((a) => {
      const key = a.agency_type || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [filtered]);

  const exportData = (format: 'csv' | 'json') => {
    let content: string;
    let mime: string;
    if (format === 'json') {
      content = JSON.stringify(filtered, null, 2);
      mime = 'application/json';
    } else {
      const header = ['Title', 'Summary', 'Source', 'Agency Type', 'Sector', 'Category', 'Published At'];
      const rows = filtered.map((a) => [
        localizedNewsTitle(a, locale),
        (localizedNewsSummary(a, locale) ?? '').replace(/"/g, '""'),
        a.source ?? '',
        a.agency_type ?? '',
        a.sector ?? '',
        a.category,
        new Date(a.published_at).toISOString(),
      ]);
      content = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
      mime = 'text/csv';
    }
    const blob = new Blob(['\ufeff' + content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaynaklar-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSectorFilter(null);
    setAgencyFilter(null);
    setOnlyBookmarked(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-TR' : locale === 'en' ? 'en-GB' : 'tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const hasActiveFilters = search || dateFrom || dateTo || sectorFilter || agencyFilter || onlyBookmarked;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-700">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {locale === 'en' ? 'Government Agricultural Intelligence' : 'Kamu Tarım Kaynakları'}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {locale === 'en'
                ? 'Official announcements from 13 Turkish agricultural institutions'
                : '13 resmî Türk tarım kuruluşundan güncel duyurular'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar — agencies */}
        <div className="lg:col-span-1">
          <Card className="p-4 lg:sticky lg:top-24">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              {locale === 'en' ? 'Agencies' : 'Kuruluşlar'}
            </h2>
            <div className="space-y-1">
              {Object.entries(agencyTypeIcons).map(([type, Icon]) => {
                const items = articles.filter((a) => (a.agency_type || 'Other') === type);
                if (items.length === 0) return null;
                const isExpanded = expandedGroups.has(type);
                const isSelected = agencyFilter === type;
                return (
                  <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleGroup(type)}>
                    <div className="flex items-center gap-1">
                      <CollapsibleTrigger className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/60">
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-red-700' : 'text-muted-foreground')} />
                        <span className="flex-1 truncate">
                          {locale === 'en' ? type : AGENCY_TYPE_TR[type] || type}
                        </span>
                        <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                      </CollapsibleTrigger>
                      <button
                        onClick={() => setAgencyFilter(isSelected ? null : type)}
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors',
                          isSelected ? 'bg-red-700 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                        aria-label={isSelected ? 'Clear filter' : 'Filter by agency type'}
                      >
                        {items.length}
                      </button>
                    </div>
                    <CollapsibleContent>
                      <div className="ml-6 space-y-0.5 border-l border-border pl-3 pt-0.5">
                        {Array.from(new Set(items.map((a) => a.source).filter(Boolean))).map((src) => (
                          <p key={src} className="truncate py-0.5 text-[11px] text-muted-foreground">{src}</p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Main feed */}
        <div className="space-y-4 lg:col-span-3">
          {/* Search + filters */}
          <Card className="space-y-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={locale === 'en' ? 'Search announcements…' : 'Duyurularda ara…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
              <Button
                variant={onlyBookmarked ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOnlyBookmarked(!onlyBookmarked)}
                className="gap-1.5"
              >
                <Bookmark className={cn('h-3.5 w-3.5', onlyBookmarked && bookmarks.length === 0 && 'opacity-60')} />
                {locale === 'en' ? 'Saved' : 'Kayıtlı'} ({bookmarks.length})
              </Button>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => exportData('csv')} className="flex-1 gap-1">
                  <Download className="h-3.5 w-3.5" />CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportData('json')} className="flex-1 gap-1">
                  <Download className="h-3.5 w-3.5" />JSON
                </Button>
              </div>
            </div>
            {sectors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {locale === 'en' ? 'Sectors:' : 'Sektörler:'}
                </span>
                {sectors.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                      sectorFilter === s
                        ? 'border-red-700 bg-red-700 text-white'
                        : 'border-border text-muted-foreground hover:border-red-400 hover:text-red-700',
                    )}
                  >
                    {s}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                    {locale === 'en' ? 'Clear' : 'Temizle'}
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Feed */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-red-700" />
              <p className="text-sm text-muted-foreground">
                {locale === 'en' ? 'Loading announcements…' : 'Duyurular yükleniyor…'}
              </p>
            </div>
          ) : error ? (
            <Card className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-semibold text-foreground">
                {locale === 'en' ? 'No announcements found' : 'Duyuru bulunamadı'}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === 'en' ? 'Try adjusting your filters.' : 'Filtrelerinizi değiştirmeyi deneyin.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([type, items]) => {
                const Icon = agencyTypeIcons[type] || Sprout;
                return (
                  <div key={type}>
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-red-700" />
                      <h2 className="text-sm font-semibold text-foreground">
                        {locale === 'en' ? type : AGENCY_TYPE_TR[type] || type}
                      </h2>
                      <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((a) => {
                        const isBookmarked = bookmarks.includes(a.id);
                        return (
                          <Card key={a.id} className="p-4 transition-shadow hover:shadow-md">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                                    {a.source}
                                  </Badge>
                                  {a.sector && (
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground">{a.sector}</Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{formatDate(a.published_at)}</span>
                                </div>
                                <h3 className="text-sm font-semibold leading-tight text-foreground">
                                  {localizedNewsTitle(a, locale)}
                                </h3>
                                {localizedNewsSummary(a, locale) && (
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                    {localizedNewsSummary(a, locale)}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => toggleBookmark(a.id)}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-muted"
                                aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                              >
                                <Bookmark className={cn('h-4 w-4', isBookmarked ? 'fill-red-700 text-red-700' : 'text-muted-foreground')} />
                              </button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const AGENCY_TYPE_TR: Record<string, string> = {
  'Central Ministry': 'Merkez Bakanlık',
  'State-Owned Enterprise': 'Kamu İktisadi Teşekkülü',
  'Research & Extension': 'Araştırma ve Yayım',
  'Grants & Financing': 'Hibe ve Finansman',
  'Water & Infrastructure': 'Su ve Altyapı',
  'Insurance & Risk': 'Sigorta ve Risk',
  'Statistics & Legislation': 'İstatistik ve Mevzuat',
  'Producer Cooperative': 'Üretici Kooperatifi',
  'Wire Service': 'Haber Ajansı',
};
