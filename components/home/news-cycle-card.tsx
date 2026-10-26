'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Radio } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { localizedNewsTitle, localizedNewsSummary, articleHref, type NewsArticle } from '@/hooks/use-news';

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/32648648/pexels-photo-32648648.jpeg?auto=compress&cs=tinysrgb&w=1200';

const AUTO_ROTATE_MS = 7000;
const WORDS_PER_MINUTE = 200;

function estimateReadingMinutes(article?: NewsArticle): number {
  if (!article) return 1;
  const words = `${article.title} ${article.summary ?? ''}`
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function NewsCycleCard({ articles }: { articles: NewsArticle[] }) {
  const { t, locale } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ordered = useMemo(() => {
    const breaking = articles.filter((a) => a.is_breaking);
    const rest = articles.filter((a) => !a.is_breaking);
    return [...breaking, ...rest];
  }, [articles]);

  useEffect(() => {
    setIndex((current) =>
      ordered.length > 0 ? current % ordered.length : 0,
    );
  }, [ordered.length]);

  useEffect(() => {
    if (paused || ordered.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % ordered.length);
    }, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, ordered.length]);

  const goTo = (next: number) => {
    if (ordered.length === 0) return;
    setIndex(((next % ordered.length) + ordered.length) % ordered.length);
  };

  const current = ordered[index];

  return (
    <div
      className="grid w-full min-w-0 grid-rows-[auto_auto] overflow-hidden rounded-3xl border border-[#15231d14] bg-white text-ink shadow-[0px_4px_12px_-4px_#14563d1a,0px_8px_20px_-8px_#14563d1a] dark:border-[#ffffff14] dark:bg-[#10241b] dark:text-[#f5f3eb]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Featured story */}
      <div className="relative h-[300px] min-w-0 overflow-hidden sm:h-[340px] lg:h-auto lg:min-h-[260px]">
        <Image
          key={current?.id ?? 'fallback'}
          src={current?.thumbnail_url || FALLBACK_IMAGE}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="animate-fade-in object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,22,26,0.92)_0%,rgba(20,22,26,0.4)_55%,rgba(20,22,26,0.05)_100%)] dark:bg-[linear-gradient(0deg,rgba(8,10,13,0.96)_0%,rgba(8,10,13,0.45)_55%,rgba(8,10,13,0.08)_100%)]" />

        {current?.is_breaking && (
          <div className="absolute left-6 top-6 z-20 inline-flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1.5 shadow-[0px_4px_12px_rgba(220,38,38,0.45)]">
            <Radio className="h-3.5 w-3.5 fill-current text-white" aria-hidden="true" />
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-white">
              {t('home.newsBreaking') as string}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          </div>
        )}

        <div className="absolute right-6 top-6 z-20 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 backdrop-blur dark:bg-[#0d1a13]/80">
          <Clock className="h-3.5 w-3.5 text-field dark:text-[#c9e7b8]" aria-hidden="true" />
          <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#141f1b] dark:text-[#f5f3eb]">
            {(t('home.newsReadTime') as string).replace('{min}', String(estimateReadingMinutes(current)))}
          </span>
        </div>

        <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur dark:bg-[#0d1a13]/80">
            <span className="text-xs font-bold text-field dark:text-[#c9e7b8]">
              {current?.category || (t('home.newsCategory') as string)}
            </span>
          </div>
          <h3
            key={`title-${current?.id ?? 'fallback'}`}
            className="animate-fade-in-up max-w-xl pt-4 text-xl font-semibold leading-8 tracking-[-0.6px] text-white sm:text-2xl sm:leading-9"
          >
            {current ? localizedNewsTitle(current, locale) : (t('home.newsFallbackTitle') as string)}
          </h3>
          {current && localizedNewsSummary(current, locale) && (
            <p className="animate-fade-in-up max-w-xl pt-2 text-sm leading-5 text-[#ffffffa6] line-clamp-2">
              {localizedNewsSummary(current, locale)}
            </p>
          )}
          <p className="pt-3 text-xs text-[#ffffff80]">
            {current
              ? new Date(current.published_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : (t('home.newsFallbackDate') as string)}
          </p>
        </div>
        <Link
          href={current ? articleHref(current) : '/haberler'}
          aria-label={current ? localizedNewsTitle(current, locale) : (t('home.newsFallbackTitle') as string)}
          className="absolute inset-0 z-30"
        />
      </div>

      {/* Latest list + controls */}
      <div className="flex min-h-0 min-w-0 flex-col border-t border-[#15231d14] bg-white dark:border-[#ffffff14] dark:bg-[#0d1a13]">
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <p className="text-xs font-extrabold uppercase tracking-[1.6px] text-field dark:text-[#c9e7b8]">
            {t('home.newsLatest') as string}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={t('home.newsPrev') as string}
              onClick={() => goTo(index - 1)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#15231d0f] text-[#15231d] transition-colors hover:bg-[#15231d1a] dark:bg-[#ffffff14] dark:text-white dark:hover:bg-[#ffffff26]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t('home.newsNext') as string}
              onClick={() => goTo(index + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#15231d0f] text-[#15231d] transition-colors hover:bg-[#15231d1a] dark:bg-[#ffffff14] dark:text-white dark:hover:bg-[#ffffff26]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <ul
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 pt-2 [scrollbar-width:thin] [scrollbar-color:#2e7d4f66_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2e7d4f66]"
        >
          {ordered.slice(0, 6).map((article, i) => (
            <li key={article.id}>
              <Link
                href={articleHref(article)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === index ? 'bg-[#15231d0f] dark:bg-[#ffffff1a]' : 'hover:bg-[#15231d08] dark:hover:bg-[#ffffff0d]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    i === index ? 'bg-field dark:bg-[#c9e7b8]' : 'bg-[#15231d33] dark:bg-[#ffffff40]'
                  }`}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    i === index ? 'font-semibold text-ink dark:text-white' : 'text-[#617069] dark:text-[#ffffffb3]'
                  }`}
                >
                  {article ? localizedNewsTitle(article, locale) : ''}
                </span>
                {article.is_breaking && (
                  <span className="shrink-0 rounded-md bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    {t('home.newsBreaking') as string}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <p className="shrink-0 px-4 pb-3 text-[10px] text-[#96a09a] sm:px-6 dark:text-[#ffffff59]">
          {t('home.newsAutoPlay') as string}
        </p>
      </div>
    </div>
  );
}
