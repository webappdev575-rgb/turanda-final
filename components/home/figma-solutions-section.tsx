'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { CropCard } from '@/lib/types';
import type { Locale } from '@/lib/i18n';

interface CropSettings {
  crop_heading_tr: string;
  crop_heading_en: string;
  crop_heading_ar: string;
  crop_subtitle_tr: string;
  crop_subtitle_en: string;
  crop_subtitle_ar: string;
}

function localized(value: CropSettings, locale: Locale, prefix: 'heading' | 'subtitle'): string {
  const key = `crop_${prefix}_${locale}` as keyof CropSettings;
  const fallback = `crop_${prefix}_en` as keyof CropSettings;
  return value[key] || value[fallback] || '';
}

function cardText(card: CropCard, locale: Locale, field: 'title' | 'description'): string {
  const key = `${field}_${locale}` as keyof CropCard;
  const fallback = `${field}_en` as keyof CropCard;
  return (card[key] as string) || (card[fallback] as string) || '';
}

export function FigmaSolutionsSection() {
  const { t, locale } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [cards, setCards] = useState<CropCard[]>([]);
  const [settings, setSettings] = useState<CropSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    Promise.all([
      supabase.from('crop_cards').select('*').order('sort_order', { ascending: true }),
      supabase.from('site_settings').select('crop_heading_tr, crop_heading_en, crop_heading_ar, crop_subtitle_tr, crop_subtitle_en, crop_subtitle_ar').eq('id', 1).maybeSingle(),
    ]).then(([cardsRes, settingsRes]) => {
      const all = (cardsRes.data as CropCard[]) || [];
      setCards(all.filter((c) => c.is_visible));
      setSettings((settingsRes.data as CropSettings) || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!openId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(event.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openId]);

  const startPreview = (id: string) => {
    setPreviewing(id);
    videoRefs.current[id]?.play().catch(() => {});
  };

  const stopPreview = (id: string) => {
    setPreviewing((current) => (current === id ? null : current));
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  if (loading) return null;

  const heading = settings ? localized(settings, locale, 'heading') : '';
  const subtitle = settings ? localized(settings, locale, 'subtitle') : '';

  return (
    <section className="flex w-full flex-col items-center bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="flex w-full max-w-[1205px] flex-col items-center px-5 py-14 sm:px-8 sm:py-16 lg:px-0 lg:py-20">
        {/* Centered, balanced header */}
        <Reveal className="w-full">
          <div className="flex w-full flex-col items-center text-center">
            <h2 className="max-w-3xl text-[28px] font-semibold leading-[1.25] tracking-[-0.7px] text-[#15231d] dark:text-[#f5f3eb] sm:text-4xl sm:leading-[1.2] sm:tracking-[-1px] lg:text-[42px] lg:leading-[1.18] lg:tracking-[-1.2px]">
              {heading}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#617069] dark:text-[#ffffff99] sm:text-base sm:leading-7 lg:mt-5 lg:text-[17px] lg:leading-[28px]">
              {subtitle}
            </p>
          </div>
        </Reveal>

        {/* Cards grid */}
        <div className="flex w-full flex-col items-start pt-12 lg:pt-14">
          <Reveal delay={120} className="w-full">
            <div
              ref={gridRef}
              className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            >
              {cards.map((card) => (
                <article
                  key={card.id}
                  onClick={() => {
                    setOpenId((current) => (current === card.id ? null : card.id));
                    if (openId === card.id) {
                      stopPreview(card.id);
                    } else {
                      startPreview(card.id);
                    }
                  }}
                  onMouseEnter={() => startPreview(card.id)}
                  onMouseLeave={() => stopPreview(card.id)}
                  className="group flex w-full cursor-pointer flex-col items-start"
                >
                  <div
                    className={cn(
                      'relative h-[280px] w-full overflow-hidden rounded-3xl lg:h-80',
                      'transition-[height] duration-[400ms] ease-in-out motion-reduce:transition-none',
                      '[@media(hover:hover)]:motion-safe:group-hover:h-[300px]',
                      '[@media(hover:hover)]:motion-safe:lg:group-hover:h-[400px]',
                      openId === card.id && 'h-[300px] lg:h-[400px]'
                    )}
                  >
                    <Image
                      src={card.image_url}
                      alt={cardText(card, locale, 'title')}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={cn(
                        'object-cover transition-opacity duration-500',
                        previewing === card.id ? 'opacity-0' : 'opacity-100'
                      )}
                    />
                    <video
                      ref={(el) => {
                        videoRefs.current[card.id] = el;
                      }}
                      src={card.video_url}
                      muted
                      loop
                      playsInline
                      preload="none"
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
                        previewing === card.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </div>
                  <div className="flex min-h-11 w-full flex-col items-start pt-4">
                    <h3 className="text-xl font-semibold leading-7 tracking-[-0.5px] text-[#15231d] dark:text-[#f5f3eb]">
                      {cardText(card, locale, 'title')}
                    </h3>
                  </div>
                  <p className="w-full pt-2 text-sm font-normal leading-5 text-[#617069] dark:text-[#ffffff99]">
                    {cardText(card, locale, 'description')}
                  </p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="flex w-full items-center pt-8">
          <Button
            type="button"
            variant="ghost"
            asChild
            className="h-auto rounded-xl px-0 py-3 text-sm font-semibold leading-5 text-[#617069] hover:bg-transparent hover:text-[#15231d] dark:text-[#ffffff99] dark:hover:text-[#f5f3eb]"
          >
            <Link href="/dashboard">
              <span>{t('red.manageCta')}</span>
              <ArrowRightIcon
                className="ml-2 h-[17px] w-[17px]"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
