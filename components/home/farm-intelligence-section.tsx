'use client';

import { Sprout } from 'lucide-react';
import { FarmDashboard } from '@/components/home/farm-dashboard';
import { IpadFrame } from '@/components/home/ipad-frame';
import { useI18n } from '@/components/i18n-provider';

const APP_STORE_URL = 'https://apps.apple.com/app/turanda/id6745252949';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.turanda.turanda';

export function FarmIntelligenceSection() {
  const { t } = useI18n();

  return (
    <section id="farm-intelligence" className="scroll-mt-20 relative w-full overflow-hidden bg-evergreen">
      <div className="mx-auto w-full max-w-[1344px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        {/* Hero */}
        <div className="flex flex-col items-start">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffffff14]">
            <Sprout className="h-6 w-6 text-[#c9e7b8]" aria-hidden="true" />
          </span>
          <p className="pt-6 text-xs font-extrabold leading-[18px] tracking-[1.92px] text-[#c9e7b8]">
            {t('farm.kicker') as string}
          </p>
          <h2 className="max-w-[768px] pt-3 text-3xl font-semibold leading-[42px] tracking-[-1.2px] text-white sm:text-4xl lg:text-5xl lg:leading-[48px]">
            {t('farm.title') as string}
          </h2>
          <p className="max-w-[672px] pt-4 text-base leading-[26px] text-[#ffffffa6]">
            {t('farm.subtitle') as string}
            <br />
          </p>
        </div>

        {/* Device mockup — silver iPad Pro landscape frame housing the app */}
        <IpadFrame>
          <FarmDashboard />
        </IpadFrame>

        {/* Download call to action */}
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('farm.appStore') as string}
              className="inline-flex h-[46px] items-center gap-2.5 rounded-lg bg-cream px-4 text-ink shadow-[0px_1px_3px_#00000033] transition-transform hover:scale-[1.03]"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px]">{t('farm.downloadOn') as string}</span>
                <span className="text-sm font-semibold">{t('farm.appStore') as string}</span>
              </span>
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('farm.googlePlay') as string}
              className="inline-flex h-[46px] items-center gap-2.5 rounded-lg bg-cream px-4 text-ink shadow-[0px_1px_3px_#00000033] transition-transform hover:scale-[1.03]"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path fill="#EA4335" d="M3.6 1.8 13.7 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" />
                <path fill="#FBBC04" d="m17.2 8.4-3.5 3.6L3.6 1.8c.1-.1.3-.2.4-.2.2 0 .3 0 .5.1l12.7 6.7z" />
                <path fill="#34A853" d="M17.2 15.6 4.5 22.3c-.2.1-.3.1-.5.1-.1 0-.3-.1-.4-.2l10.1-10.2 3.5 3.6z" />
                <path fill="#4285F4" d="m17.2 8.4 3.3 1.7c.9.5.9 1.7 0 2.2l-3.3 1.7-3.6-3.6 3.6-3.7z" />
              </svg>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px]">{t('farm.getItOn') as string}</span>
                <span className="text-sm font-semibold">{t('farm.googlePlay') as string}</span>
              </span>
            </a>
          </div>
          <p className="text-xs text-[#ffffff73]">{t('farm.freeTry') as string}</p>
        </div>
      </div>
    </section>
  );
}
