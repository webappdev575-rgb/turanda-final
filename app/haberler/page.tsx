'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Newspaper, Search, Loader2, Inbox, Calendar, MapPin, ExternalLink,
  TrendingUp, Cloud, FileText, Globe,
} from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNews, localizedNewsTitle, localizedNewsSummary, articleHref } from '@/hooks/use-news';
import { useI18n } from '@/components/i18n-provider';
import { AdSpace } from '@/components/ads/ad-space';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  market: { icon: TrendingUp, color: 'border-accent/30 bg-accent/10 text-accent-foreground dark:border-[#e8c96a40] dark:bg-[#e8c96a1f] dark:text-[#f0d382]' },
  weather: { icon: Cloud, color: 'border-blue-300/30 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  policy: { icon: FileText, color: 'border-primary/30 bg-primary/10 text-primary' },
  general: { icon: Globe, color: 'border-secondary/30 bg-secondary/10 text-secondary' },
};

const regionList = [
  'all', 'İç Anadolu', 'Ege', 'Akdeniz', 'Karadeniz', 'Marmara', 'Güneydoğu Anadolu',
];

const regionLabels: Record<string, { tr: string; en: string; ar: string }> = {
  'all': { tr: 'Tüm Bölgeler', en: 'All Regions', ar: 'جميع المناطق' },
  'İç Anadolu': { tr: 'İç Anadolu', en: 'Central Anatolia', ar: 'وسط الأناضول' },
  'Ege': { tr: 'Ege', en: 'Aegean', ar: 'بحر إيجه' },
  'Akdeniz': { tr: 'Akdeniz', en: 'Mediterranean', ar: 'البحر الأبيض المتوسط' },
  'Karadeniz': { tr: 'Karadeniz', en: 'Black Sea', ar: 'البحر الأسود' },
  'Marmara': { tr: 'Marmara', en: 'Marmara', ar: 'مرمرة' },
  'Güneydoğu Anadolu': { tr: 'Güneydoğu Anadolu', en: 'Southeastern Anatolia', ar: 'جنوب شرق الأناضول' },
};

export default function NewsPage() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');

  const { articles, loading, error } = useNews(region === 'all' ? undefined : region);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (category !== 'all' && a.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          localizedNewsTitle(a, locale).toLowerCase().includes(q) ||
          (localizedNewsSummary(a, locale)?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [articles, category, search, locale]);

  // Featured article (first)
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-TR' : locale === 'en' ? 'en-GB' : 'tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (locale === 'en') {
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    } else if (locale === 'ar') {
      if (hours < 1) return 'الآن';
      if (hours < 24) return `قبل ${hours} ساعة`;
      if (days === 1) return 'أمس';
      return `قبل ${days} أيام`;
    } else {
      if (hours < 1) return 'Az önce';
      if (hours < 24) return `${hours} saat önce`;
      if (days === 1) return 'Dün';
      return `${days} gün önce`;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col items-center gap-2">
          <div>
            <h1 className="text-center text-3xl font-bold text-foreground">{t('news.title')}</h1>
            <p className="mt-0.5 text-center text-sm text-muted-foreground">{t('news.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('news.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Category filters */}
          {['all', 'market', 'weather', 'policy', 'general'].map((cat) => {
            const catKey = cat === 'all' ? 'news.all' : `news.${cat}`;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  category === cat
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'
                )}
              >
                {t(catKey as 'news.all')}
              </button>
            );
          })}
          <div className="mx-1 h-4 w-px bg-border" />
          {/* Region filters */}
          {regionList.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                region === r
                  ? 'border-secondary bg-secondary text-secondary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-secondary/40 hover:text-secondary'
              )}
            >
              {regionLabels[r]?.[locale] || r}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('news.loading')}</p>
        </div>
      ) : error ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-semibold text-foreground">{t('news.noResults')}</p>
          <p className="text-sm text-muted-foreground">{t('news.noResultsDesc')}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Featured Article */}
          {featured && (
            <Card className="overflow-hidden animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative min-h-[200px] bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10">
                  {featured.thumbnail_url ? (
                    <Image
                      src={featured.thumbnail_url}
                      alt={featured.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full min-h-[200px] items-center justify-center p-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                        {(() => {
                          const Icon = categoryConfig[featured.category]?.icon || Newspaper;
                          return <Icon className="h-10 w-10 text-primary" />;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className={cn('border', categoryConfig[featured.category]?.color || categoryConfig.general.color)} variant="outline">
                      {(() => {
                        const Icon = categoryConfig[featured.category]?.icon || Newspaper;
                        return <><Icon className="mr-1 h-3 w-3" />{t(`news.${featured.category}` as 'news.general')}</>;
                      })()}
                    </Badge>
                    {featured.region !== 'all' && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{regionLabels[featured.region]?.[locale] || featured.region}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatRelative(featured.published_at)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{localizedNewsTitle(featured, locale)}</h2>
                  {localizedNewsSummary(featured, locale) && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{localizedNewsSummary(featured, locale)}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {featured.source && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />{featured.source}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatDate(featured.published_at)}
                      </span>
                    </div>
                    <Link href={articleHref(featured)}>
                      <Button size="sm" variant="outline">
                        {t('news.readMore')}<span className="ml-1.5">→</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Article Grid + Sidebar */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
            {rest.map((article, i) => {
              const config = categoryConfig[article.category] || categoryConfig.general;
              const Icon = config.icon;
              return (
                <Card
                  key={article.id}
                  className="group flex cursor-pointer flex-col overflow-hidden transition-all hover:shadow-md hover:border-primary/20 animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => (window.location.href = articleHref(article))}
                >
                  {article.thumbnail_url ? (
                    <div className="relative h-40 w-full bg-muted">
                      <Image
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/5">
                      <Icon className="h-8 w-8 text-secondary/60" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge className={cn('border', config.color)} variant="outline">
                      {t(`news.${article.category}` as 'news.general')}
                    </Badge>
                    {article.region !== 'all' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />{regionLabels[article.region]?.[locale] || article.region}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground leading-tight">{localizedNewsTitle(article, locale)}</h3>
                  {localizedNewsSummary(article, locale) && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">{localizedNewsSummary(article, locale)}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {article.source || '—'} · {formatDate(article.published_at)}
                    </span>
                    {article.url && (
                      <span className="text-primary transition-transform group-hover:translate-x-0.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  </div>
                </Card>
              );
            })}
            </div>

            {/* Sidebar with Ad Space */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <AdSpace slot="news-sidebar-primary" page="news" variant="sidebar" className="h-[250px]" />
                <AdSpace slot="news-sidebar-secondary" page="news" variant="sidebar" className="h-[600px]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
