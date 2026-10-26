'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, ArrowRight, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNews, localizedNewsTitle, localizedNewsSummary } from '@/hooks/use-news';
import { useI18n } from '@/components/i18n-provider';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  market: 'border-amber-300/50 bg-amber-100 text-amber-900 dark:border-amber-400/50 dark:bg-amber-950/50 dark:text-amber-200',
  weather: 'border-blue-300/30 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  policy: 'border-emerald-300/50 bg-emerald-100 text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-950/50 dark:text-emerald-200',
  general: 'border-secondary/40 bg-secondary-lighter text-secondary-foreground dark:border-secondary-light/50 dark:bg-secondary/20 dark:text-secondary-lighter',
};

function articleHref(article: { id: string; slug: string | null }): string {
  return article.slug ? `/haberler/${article.slug}` : `/haberler/a-${article.id}`;
}

export function HomeNewsSection({ embedded = false }: { embedded?: boolean }) {
  const { articles, loading } = useNews();
  const { t, locale } = useI18n();
  const { settings } = useSiteSettings();

  const filteredArticles = (() => {
    // Manual mode: exact posts, capped at 5
    if (settings?.news_section_mode === 'manual') {
      if (settings.news_section_post_ids && settings.news_section_post_ids.length > 0) {
        const idSet = new Set(settings.news_section_post_ids);
        const picked = articles.filter((a) => idSet.has(a.id));
        picked.sort((a, b) => settings.news_section_post_ids.indexOf(a.id) - settings.news_section_post_ids.indexOf(b.id));
        return picked.slice(0, 5);
      }
      return [];
    }
    // Auto mode: category filter, otherwise display_locations homepage tag
    let result = articles;
    if (settings?.news_section_categories && settings.news_section_categories.length > 0) {
      result = result.filter((a) => settings.news_section_categories.includes(a.category));
    } else {
      const withHomepage = result.filter((a) => (a.display_locations ?? []).includes('homepage'));
      if (withHomepage.length > 0) result = withHomepage;
    }
    const maxCount = settings?.news_section_count || 5;
    return result.slice(0, maxCount);
  })();

  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1, 5);

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

  const sectionClass = embedded ? '' : 'mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8';

  if (loading) {
    return (
      <section className={sectionClass}>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t('news.title')}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/40" />
          ))}
        </div>
      </section>
    );
  }

  if (filteredArticles.length === 0) return null;

  return (
    <section className={sectionClass}>
      {true && (
        <div className="mb-8 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Newspaper className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">{t('news.title')}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t('news.subtitle')}</p>
            </div>
          </div>
          <Link href="/haberler" className="hidden sm:block">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t('news.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Featured article with large thumbnail */}
        {featured && (() => {
          return (
            <Link href={articleHref(featured)} className="group">
              <Card className="h-64 overflow-hidden transition-all hover:shadow-lg hover:border-primary/20">
                <div className="relative h-64 w-full">
                  {featured.thumbnail_url ? (
                    <Image
                      src={featured.thumbnail_url}
                      alt={featured.title}
                      fill
                      className="rounded-t-lg object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-200/60 to-neutral-100/30 dark:from-neutral-800/60 dark:to-neutral-900/30">
                      <Newspaper className="h-12 w-12 text-neutral-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <Badge
                      className={cn('mb-2 border', categoryColors[featured.category] || categoryColors.general)}
                      variant="outline"
                    >
                      {t(`news.${featured.category}` as 'news.general')}
                    </Badge>
                    <h3 className="text-xl font-bold text-white leading-tight">{localizedNewsTitle(featured, locale)}</h3>
                    {localizedNewsSummary(featured, locale) && (
                      <p className="mt-1.5 text-sm text-white/80 line-clamp-2">{localizedNewsSummary(featured, locale)}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                      {featured.source && <span>{featured.source}</span>}
                      <span>·</span>
                      <span>{formatRelative(featured.published_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })()}

        {/* Secondary articles with small thumbnails */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.map((article) => {
            return (
              <Link key={article.id} href={articleHref(article)} className="group">
                <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
                  <div className="relative h-32 w-full">
                    {article.thumbnail_url ? (
                      <Image
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        className="rounded-t-lg object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-200/60 to-neutral-100/30 dark:from-neutral-800/60 dark:to-neutral-900/30">
                        <Newspaper className="h-8 w-8 text-neutral-400" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge
                        className={cn('border text-[10px]', categoryColors[article.category] || categoryColors.general)}
                        variant="outline"
                      >
                        {t(`news.${article.category}` as 'news.general')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {localizedNewsTitle(article, locale)}
                    </h4>
                    <div className="mt-auto pt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {article.region !== 'all' && (
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />{article.region}
                        </span>
                      )}
                      <span>·</span>
                      <span>{formatRelative(article.published_at)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {true && (
        <div className="mt-6 text-center sm:hidden">
          <Link href="/haberler">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t('news.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
