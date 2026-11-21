'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/components/i18n-provider';
import { Reveal } from '@/components/shared/reveal';
import { ACADEMY_PROGRAMMES } from '@/lib/academy-programmes';

export function FigmaGettingStartedSection() {
  const { t, locale } = useI18n();

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
            <ul className="grid grid-cols-2 items-start gap-1.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
              {ACADEMY_PROGRAMMES.map((programme, index) => (
                <li key={programme.slug}>
                  <Link href={`/akademi/${programme.slug}`} className="group block">
                    <Card className="relative overflow-hidden rounded-xl border-0 bg-[#08271d] shadow-none transition-all duration-[400ms] ease-in-out group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] dark:border dark:border-[#ffffff14]">
                      <CardContent className="relative aspect-[3/4] h-full p-0">
                        <Image
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[400ms] ease-in-out group-hover:scale-[1.04]"
                          src={programme.image}
                          alt={programme.title[locale]}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#08271d]/95 via-[#08271d]/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end px-3 pb-3 pt-12 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5">
                          <span className="text-[10px] leading-4 text-[#ffffffa6] lg:text-xs">
                            {programme.duration[locale]}
                          </span>
                          <h3 className="mt-1 text-sm font-semibold leading-5 tracking-[-0.2px] text-white lg:text-lg lg:leading-7 lg:tracking-[-0.45px]">
                            {programme.title[locale]}
                          </h3>
                          <p className="mt-1 line-clamp-3 text-[11px] leading-[16px] text-white/90 lg:text-xs lg:leading-[18px]">
                            {programme.description[locale]}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/reklam" className="group block">
                  <Card className="relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-[#14563d] via-[#1e6b4d] to-[#2e7d4f] shadow-none transition-all duration-[400ms] ease-in-out group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
                    <CardContent className="relative flex aspect-[3/4] h-full flex-col justify-end overflow-hidden p-4 text-white sm:p-5 lg:p-6">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-[#c9e7b8]/15 blur-2xl"
                      />
                      <div className="relative">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[1px] text-[#eef7e6] sm:text-[10px]">
                          <Megaphone className="h-3 w-3" aria-hidden="true" />
                          {t('ads.sponsored')}
                        </span>
                        <h3 className="pt-3 text-base font-semibold leading-5 tracking-[-0.2px] sm:text-lg lg:text-xl lg:leading-6">
                          {t('ads.powerTitle')}
                        </h3>
                        <p className="pt-2 text-[11px] leading-[16px] text-[#eef7e6]/80 sm:text-xs sm:leading-[18px]">
                          {t('ads.powerDesc')}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white sm:text-sm">
                          {t('ads.powerCta')}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
