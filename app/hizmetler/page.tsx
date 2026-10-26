'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Droplets, Plane, Cog, Smartphone, ArrowUpRight } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const serviceImages = [
  'https://images.pexels.com/photos/12532707/pexels-photo-12532707.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/34182315/pexels-photo-34182315.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/4975400/pexels-photo-4975400.jpeg?auto=compress&cs=tinysrgb&w=1200',
];

export default function ServicesPage() {
  const { t } = useI18n();

  const services = [
    { icon: Droplets, title: t('svc.irrigationTitle'), desc: t('svc.irrigationDesc'), image: serviceImages[0], comingSoon: false },
    { icon: Plane, title: t('svc.droneTitle'), desc: t('svc.droneDesc'), image: serviceImages[1], comingSoon: false },
    { icon: Cog, title: t('svc.automationTitle'), desc: t('svc.automationDesc'), image: serviceImages[2], comingSoon: false },
    { icon: Smartphone, title: t('svc.appTitle'), desc: t('svc.appDesc'), image: null, comingSoon: true },
  ];

  return (
    <div className="bg-[#fffdf6] pb-20 dark:bg-[#0b1611]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#14563d] py-20 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image src={serviceImages[0]} alt="" fill className="object-cover" sizes="100vw" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1a13]/90 to-[#14563d]/70" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t('svc.title')}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">{t('svc.subtitle')}</p>
        </div>
      </section>

      {/* Service sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-16 pt-16">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-3xl sm:h-80 lg:h-96 lg:w-[520px]">
                {service.image ? (
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#14563d] to-[#0d1a13] text-white">
                    <service.icon className="h-16 w-16 text-[#c9e7b8]" aria-hidden="true" />
                    <Badge className="border-[#c9e7b8]/40 bg-[#c9e7b8]/15 text-[#c9e7b8]" variant="outline">
                      {t('svc.appComingSoon')}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="max-w-xl">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14563d0d] dark:bg-[#c9e7b81a]">
                  <service.icon className="h-6 w-6 text-[#14563d] dark:text-[#c9e7b8]" aria-hidden="true" />
                </div>
                <h2 className="mt-5 flex flex-wrap items-center gap-3 text-2xl font-bold text-[#15231d] dark:text-[#f5f3eb] sm:text-3xl">
                  {service.title}
                  {service.comingSoon && (
                    <Badge className="border-[#14563d]/30 bg-[#14563d0d] text-[#14563d] dark:border-[#c9e7b8]/30 dark:bg-[#c9e7b81a] dark:text-[#c9e7b8]" variant="outline">
                      {t('svc.appComingSoon')}
                    </Badge>
                  )}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[#617069] dark:text-[#ffffff99]">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-[#14563d] px-6 py-14 text-center text-white">
          <h2 className="max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">{t('svc.ctaTitle')}</h2>
          <p className="max-w-xl text-base leading-relaxed text-white/80">{t('svc.ctaSubtitle')}</p>
          <Link href="/contact">
            <Button className="h-auto min-h-12 rounded-full bg-white px-8 text-base font-semibold text-[#14563d] shadow-lg transition-transform hover:scale-105 hover:bg-white">
              {t('svc.ctaButton')}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
