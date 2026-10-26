'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Calendar, FileText, Loader2, MapPin, Newspaper, TrendingUp, Cloud,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdSpace } from '@/components/ads/ad-space';
import { ArticleCommodityChips } from '@/components/news/article-commodity-chips';
import {
  useNewsArticle, useArticleCommodityPrices, localizedNewsTitle, localizedNewsBody,
  localizedNewsSummary,
} from '@/hooks/use-news';
import { useI18n } from '@/components/i18n-provider';
import { translateCommodity } from '@/lib/translations';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  market: { icon: TrendingUp, color: 'border-accent/30 bg-accent/10 text-accent-foreground dark:border-[#e8c96a40] dark:bg-[#e8c96a1f] dark:text-[#f0d382]' },
  weather: { icon: Cloud, color: 'border-blue-300/30 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  policy: { icon: FileText, color: 'border-primary/30 bg-primary/10 text-primary' },
  general: { icon: Newspaper, color: 'border-secondary/30 bg-secondary/10 text-secondary' },
};

// Splits paragraphs and inserts the inline ad banner after roughly 1/3 and
// 2/3 of the body — the natural mid-article break points.
function splitBodyWithAds(paragraphs: string[]) {
  if (paragraphs.length < 4) return [{ type: 'text' as const, text: paragraphs[0] ?? '' }];
  const firstAdAfter = Math.max(1, Math.round(paragraphs.length / 3));
  const secondAdAfter = Math.max(firstAdAfter + 1, Math.round((paragraphs.length * 2) / 3));
  const out: { type: 'text' | 'ad'; text?: string; adIndex?: number }[] = [];
  paragraphs.forEach((p, i) => {
    out.push({ type: 'text', text: p });
    if (i === firstAdAfter - 1) out.push({ type: 'ad', adIndex: 1 });
    else if (i === secondAdAfter - 1) out.push({ type: 'ad', adIndex: 2 });
  });
  return out;
}

export default function NewsArticlePage({ params }: { params: { slug: string } }) {
  const { locale, t } = useI18n();
  const { article, loading, error } = useNewsArticle(params.slug);

  const paragraphs = useMemo(
    () => (article ? (localizedNewsBody(article, locale) ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : []),
    [article, locale],
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-TR' : locale === 'en' ? 'en-GB' : 'tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error === 'not_found' || !article) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-5 py-24 text-center">
        <Newspaper className="h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-xl font-bold text-foreground">{t('news.articleNotFound')}</h1>
        <p className="text-sm text-muted-foreground">{t('news.articleNotFoundDesc')}</p>
        <Button asChild variant="outline" className="min-h-10">
          <Link href="/haberler">
            <ArrowLeft className="mr-2 h-4 w-4" />{t('news.backToNews')}
          </Link>
        </Button>
      </div>
    );
  }

  const config = categoryConfig[article.category] || categoryConfig.general;
  const Icon = config.icon;
  const bodyBlocks = paragraphs.length > 0
    ? splitBodyWithAds(paragraphs)
    : (localizedNewsSummary(article, locale) ? [{ type: 'text' as const, text: localizedNewsSummary(article, locale)! }] : []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-8">
      <Link
        href="/haberler"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />{t('news.backToNews')}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <article className="min-w-0 lg:col-span-3">
          <Card className="overflow-hidden">
            {article.thumbnail_url && (
              <div className="relative aspect-[16/7] w-full bg-muted">
                <Image
                  src={article.thumbnail_url}
                  alt={localizedNewsTitle(article, locale)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  priority
                />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className={cn('border', config.color)} variant="outline">
                  <Icon className="mr-1 h-3 w-3" />{t(`news.${article.category}` as 'news.general')}
                </Badge>
                {article.region !== 'all' && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{article.region}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />{formatDate(article.published_at)}
                </span>
              </div>

              <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {localizedNewsTitle(article, locale)}
              </h1>

              {article.source && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('news.sourceCredit').replace('{source}', article.source)}
                </p>
              )}

              {article.id && <ArticleCommodityChips articleId={article.id} />}

              <div className="mt-2 space-y-5">
                {bodyBlocks.map((block, i) =>
                  block.type === 'text' ? (
                    <p key={i} className="text-[15px] leading-[1.8] text-foreground/90">
                      {block.text}
                    </p>
                  ) : (
                    <AdSpace
                      key={`ad-${i}`}
                      slot={`article-inline-${block.adIndex}`}
                      page="article"
                      variant="banner"
                      className="my-6 min-h-[120px]"
                    />
                  ),
                )}
              </div>

              {article.source && (
                <div className="mt-8 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    {t('news.sourceFooter').replace('{source}', article.source)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </article>

        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <AdSpace slot="article-sidebar-primary" page="article" variant="sidebar" className="h-[250px]" />
            <AdSpace slot="article-sidebar-secondary" page="article" variant="sidebar" className="h-[600px]" />
          </div>
        </aside>
      </div>
    </div>
  );
}