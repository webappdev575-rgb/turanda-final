'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/components/i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

type ThemeKey = 'organic' | 'automated' | 'biomedical';

const themeContent: Record<
  ThemeKey,
  { title: TranslationKey; desc: TranslationKey; support1: TranslationKey; support2: TranslationKey; image: string; alt: string }
> = {
  organic: {
    title: 'red.themeOrganicTitle',
    desc: 'red.themeOrganicDesc',
    support1: 'red.themeOrganicSupport1',
    support2: 'red.themeOrganicSupport2',
    image:
      'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Farm workers harvesting crops in a field',
  },
  automated: {
    title: 'red.themeAutomatedTitle',
    desc: 'red.themeAutomatedDesc',
    support1: 'red.themeAutomatedSupport1',
    support2: 'red.themeAutomatedSupport2',
    image:
      'https://images.pexels.com/photos/38261515/pexels-photo-38261515.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Turkish bazaar vendor with fresh vegetables',
  },
  biomedical: {
    title: 'red.themeBiomedicalTitle',
    desc: 'red.themeBiomedicalDesc',
    support1: 'red.themeBiomedicalSupport1',
    support2: 'red.themeBiomedicalSupport2',
    image:
      'https://images.pexels.com/photos/3807683/pexels-photo-3807683.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Farmer learning with a tablet in a greenhouse',
  },
};

const themeOrder: ThemeKey[] = ['organic', 'automated', 'biomedical'];

export function FigmaInnovationSection() {
  const { t } = useI18n();
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('organic');

  const active = themeContent[selectedTheme];

  return (
    <section className="flex w-full flex-col items-center bg-[#fcfaf6] dark:bg-[#0d1a13]">
      <div className="w-full max-w-[1205px] px-5 py-14 sm:px-8 sm:py-16 lg:px-0 lg:py-20">
        {/* Tabs — same centered pill row on all breakpoints */}
        <nav aria-label="Platform özellikleri" className="flex w-full flex-wrap items-center justify-center gap-6">
          {themeOrder.map((key) => {
            const label: TranslationKey = key === 'organic' ? 'red.themeOrganic' : key === 'automated' ? 'red.themeAutomated' : 'red.themeBiomedical';
            const isActive = selectedTheme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTheme(key)}
                onMouseEnter={() => setSelectedTheme(key)}
                onFocus={() => setSelectedTheme(key)}
                aria-current={isActive}
                className={`text-sm leading-5 transition-colors ${
                  isActive
                    ? 'font-bold text-[#15231d] dark:text-[#f5f3eb]'
                    : 'font-normal text-[#96a09a] hover:text-[#15231d] dark:hover:text-[#f5f3eb]'
                }`}
              >
                {t(label)}
              </button>
            );
          })}
        </nav>

        <div className="flex w-full flex-col items-center gap-6 pt-6">
          {/* Image — full-width, shared layout on all breakpoints */}
          <div className="relative h-48 w-full overflow-hidden rounded-3xl sm:h-60 lg:h-72">
            {themeOrder.map((key) => (
              <Image
                key={key}
                src={themeContent[key].image}
                alt={selectedTheme === key ? themeContent[key].alt : ''}
                fill
                sizes="(max-width: 768px) 100vw, 719px"
                aria-hidden={selectedTheme !== key}
                className={`object-cover transition-opacity duration-500 ${
                  selectedTheme === key ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>

          {/* Description — animates on change, same on all breakpoints */}
          <div className="flex w-full max-w-[719px] flex-col items-center">
            <h2
              key={`title-${selectedTheme}`}
              className="animate-fade-in text-center text-2xl font-semibold leading-[1.25] tracking-[-1px] text-[#15231d] dark:text-[#f5f3eb] sm:text-3xl sm:leading-[1.2] lg:text-4xl lg:leading-[1.2]"
            >
              {t(active.title)}
            </h2>
            <p
              key={`desc-${selectedTheme}`}
              className="animate-fade-in pt-3 text-center text-sm leading-6 text-[#3f5148] dark:text-[#c9d4cd] sm:text-base sm:leading-7 lg:pt-4"
            >
              {t(active.desc)}
            </p>
            <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-5">
              <p className="text-xs font-semibold leading-4 text-[#15231d] dark:text-[#f5f3eb]">
                {t(active.support1)}
              </p>
              <p className="text-xs font-semibold leading-4 text-[#15231d] dark:text-[#f5f3eb]">
                {t(active.support2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
