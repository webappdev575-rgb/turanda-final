'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

type TranslationKey = Parameters<ReturnType<typeof useI18n>['t']>[0];

const SLIDES: { image: string; badgeKey: TranslationKey }[] = [
  {
    image: 'https://images.unsplash.com/photo-1535090467336-9501f96eef89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200',
    badgeKey: 'akademi.badgeLabel',
  },
  {
    image: 'https://images.unsplash.com/photo-1713952160156-bb59cac789a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200',
    badgeKey: 'akademi.slideDrone',
  },
  {
    image: 'https://images.unsplash.com/photo-1758524057756-7dc8ce53d88c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200',
    badgeKey: 'akademi.slideGreenhouse',
  },
  {
    image: 'https://images.unsplash.com/photo-1761839257946-4616bcfafec7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200',
    badgeKey: 'akademi.slideProduction',
  },
];

export function AcademySection() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  const go = useCallback((delta: number) => {
    setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => go(1), 6000);
    return () => clearInterval(timer);
  }, [go]);

  return (
    <section className="w-full bg-evergreen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1344px] grid-cols-1 overflow-hidden rounded-[32px] bg-cream lg:grid-cols-2">
        {/* Slider column */}
        <figure className="relative min-h-[360px] overflow-hidden lg:min-h-[544px]">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(8,39,29,0.55)_0%,rgba(8,39,29,0)_100%)]" />

          <figcaption className="absolute bottom-6 left-6 rounded-full bg-cream/90 px-4 py-2 text-xs font-bold text-brand backdrop-blur-[8px]">
            {t(SLIDES[index].badgeKey) as string}
          </figcaption>

          {/* Prev / next controls */}
          <div className="absolute right-6 top-6 flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t('hero.slide.prev') as string}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-brand shadow-md transition hover:bg-cream"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('hero.slide.next') as string}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-brand shadow-md transition hover:bg-cream"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Pagination dots */}
          <div className="absolute bottom-7 right-6 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-cream' : 'w-2 bg-cream/50 hover:bg-cream/80'
                )}
              />
            ))}
          </div>
        </figure>

        {/* Content column */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
          <Reveal>
            <p className="text-xs font-extrabold leading-[18px] tracking-[1.92px] text-field">
              {t('akademi.kicker') as string}
            </p>
            <h2 className="pt-3 text-3xl font-semibold leading-10 tracking-[-0.9px] text-ink sm:text-4xl">
              {t('akademi.homeTitle') as string}
            </h2>
            <p className="max-w-[543px] pt-5 text-base leading-[26px] text-ink-soft">
              {t('akademi.homeDesc') as string}
            </p>

            <Link
              href="/akademi"
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] hover:bg-brand-hover sm:w-[220px]"
            >
              {t('akademi.homeCta') as string}
              <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
