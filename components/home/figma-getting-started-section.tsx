'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';
import type { TranslationKey } from '@/lib/i18n';

type GettingStartedItem = {
  number: string;
  title: TranslationKey;
  description: TranslationKey;
  image: string;
  offset: boolean;
};

const gettingStartedItems: GettingStartedItem[] = [
  {
    number: '01',
    title: 'red.start1',
    description: 'red.start1desc',
    image:
      'https://images.pexels.com/photos/39229505/pexels-photo-39229505.jpeg?auto=compress&cs=tinysrgb&w=640',
    offset: false,
  },
  {
    number: '02',
    title: 'red.start2',
    description: 'red.start2desc',
    image:
      'https://images.pexels.com/photos/10838610/pexels-photo-10838610.jpeg?auto=compress&cs=tinysrgb&w=640',
    offset: true,
  },
  {
    number: '03',
    title: 'red.start3',
    description: 'red.start3desc',
    image:
      'https://images.pexels.com/photos/37311051/pexels-photo-37311051.jpeg?auto=compress&cs=tinysrgb&w=640',
    offset: false,
  },
  {
    number: '04',
    title: 'red.start4',
    description: 'red.start4desc',
    image:
      'https://images.pexels.com/photos/33397323/pexels-photo-33397323.jpeg?auto=compress&cs=tinysrgb&w=640',
    offset: true,
  },
];

export function FigmaGettingStartedSection() {
  const { t } = useI18n();
  const [openNumber, setOpenNumber] = useState<string | null>(null);
  const [hoveredNumber, setHoveredNumber] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!openNumber) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setOpenNumber(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openNumber]);

  return (
    <section className="flex w-full flex-col items-start bg-white px-4 py-14 dark:bg-[#0b1611] sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto flex w-full max-w-[1205px] flex-col items-start">
        <Reveal>
          <header className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[28px] font-semibold leading-8 tracking-[-0.7px] text-[#15231d] dark:text-[#f5f3eb] sm:text-4xl sm:leading-10 lg:text-5xl lg:leading-[48px] lg:tracking-[-1.2px]">
            {t('red.startTitle')}
          </h2>
          <p className="max-w-sm text-sm leading-5 text-[#617069] dark:text-[#ffffff99]">
            {t('red.support1')} {t('red.support2')}
          </p>
          </header>
        </Reveal>
        <div className="mt-6 w-full sm:mt-8">
          <Reveal delay={120}>
            <ul ref={listRef} className="grid grid-cols-2 items-start gap-1.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
            {gettingStartedItems.map((item) => {
              const lifted = hoveredNumber === item.number || openNumber === item.number;
              return (
              <li
                className={item.offset ? 'pt-3 sm:pt-6 lg:pt-12' : ''}
                key={item.number}
              >
                <Card
                  onClick={() =>
                    setOpenNumber((current) => (current === item.number ? null : item.number))
                  }
                  onMouseEnter={() => setHoveredNumber(item.number)}
                  onMouseLeave={() => setHoveredNumber((current) => (current === item.number ? null : current))}
                  className={cn(
                    'group relative cursor-pointer overflow-hidden rounded-xl border-0 bg-[#08271d] shadow-none transition-all [transition-duration:400ms] ease-in-out dark:border dark:border-[#ffffff14]',
                    lifted &&
                      'motion-safe:-translate-y-1.5 motion-safe:scale-[1.04] motion-safe:border-white/30 motion-safe:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.15),0_0_24px_rgba(255,255,255,0.12)]'
                  )}
                >
                  <CardContent className="relative aspect-[3/4] h-full p-0">
                    <Image
                      className={cn(
                        'absolute inset-0 h-full w-full object-cover transition-transform [transition-duration:400ms] ease-in-out',
                        lifted && 'motion-safe:scale-[1.04]'
                      )}
                      src={item.image}
                      alt={t(item.title) as string}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex min-h-[132px] flex-col justify-end bg-[linear-gradient(0deg,rgba(8,39,29,0.9)_0%,rgba(8,39,29,0.55)_45%,rgba(8,39,29,0)_100%)] px-3 pb-3 pt-12 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5 lg:pt-16">
                      <span className="text-[10px] leading-4 text-[#ffffffa6] lg:text-xs">
                        {item.number}
                      </span>
                      <h3 className="mt-1 text-sm font-semibold leading-5 tracking-[-0.2px] text-white lg:text-lg lg:leading-7 lg:tracking-[-0.45px]">
                        {t(item.title)}
                      </h3>
                      <div
                        className={cn(
                          'max-h-0 translate-y-3 overflow-hidden opacity-0 transition-all [transition-duration:400ms] ease-in-out',
                          '[@media(hover:hover)]:group-hover:max-h-[8.5rem] [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100',
                          openNumber === item.number &&
                            'max-h-[8.5rem] translate-y-0 opacity-100',
                          'motion-reduce:transition-none'
                        )}
                      >
                        <p className="pt-1 text-[11px] leading-[16px] text-white/90 lg:text-xs lg:leading-[18px]">
                          {t(item.description)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
              );
            })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
