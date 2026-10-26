'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Megaphone, Sparkles } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AdPlacement {
  id: string;
  business_name: string;
  image_url: string | null;
  target_url: string | null;
  priority: number;
}

const ROTATE_MS = 9000;

/**
 * Homepage banner shown between sections. Renders a paid ad from the
 * `ad_placements` table when one exists (rotating among equal-priority
 * placements), otherwise falls back to the in-house "Power your business"
 * banner advertising the ad marketplace itself.
 */
export function HomeAdBanner({
  slot,
  className,
}: {
  slot: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [rotation, setRotation] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('ad_spaces')
          .select('id')
          .eq('slot', slot)
          .eq('available', true)
          .maybeSingle();
        if (!active) return;
        if (data) {
          const { data: ads } = await supabase
            .from('ad_placements')
            .select('id, business_name, image_url, target_url, priority')
            .eq('ad_space_id', (data as { id: string }).id)
            .eq('is_active', true)
            .order('priority', { ascending: false });
          if (active && ads && ads.length > 0) {
            setPlacements(ads as AdPlacement[]);
          }
        }
      } catch {
        // ads are non-critical
      }
      if (active) setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [slot]);

  const topTier = useMemo(() => {
    if (placements.length === 0) return [];
    const top = placements[0].priority;
    return placements.filter((p) => p.priority === top);
  }, [placements]);

  useEffect(() => {
    if (topTier.length < 2) return;
    const timer = setInterval(() => {
      setRotation((r) => (r + 1) % topTier.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [topTier.length]);

  const activeAd = topTier.length > 0 ? topTier[rotation % topTier.length] : null;

  if (!loaded) return <div className={cn('h-40 w-full', className)} aria-hidden="true" />;

  if (activeAd) {
    return (
      <section className={cn('w-full bg-[#fcfaf6] dark:bg-[#0d1a13]', className)} aria-label={t('ads.sponsored') as string}>
        <div className="mx-auto w-full max-w-[1205px] px-5 sm:px-8 lg:px-0">
          <div className="relative overflow-hidden rounded-3xl border border-[#15231d14] bg-white shadow-[0px_4px_12px_-4px_#14563d1a,0px_8px_20px_-8px_#14563d1a] dark:border-[#ffffff14] dark:bg-[#10241b]">
            <a
              href={activeAd.target_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full min-h-[160px] w-full items-center gap-5 p-5 sm:min-h-[180px] sm:gap-8 sm:p-7"
            >
              {activeAd.image_url ? (
                <div className="relative hidden h-24 w-40 shrink-0 overflow-hidden rounded-2xl sm:block sm:h-28 sm:w-48">
                  <Image
                    src={activeAd.image_url}
                    alt={activeAd.business_name}
                    fill
                    sizes="192px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="hidden h-24 w-40 shrink-0 place-items-center rounded-2xl bg-field/10 sm:grid sm:h-28 sm:w-48 dark:bg-[#c9e7b826]">
                  <Megaphone className="h-8 w-8 text-field dark:text-[#c9e7b8]" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#15231d08] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[1.2px] text-[#617069] dark:bg-[#ffffff14] dark:text-[#ffffff99]">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t('ads.sponsored') as string}
                </span>
                <h3 className="truncate pt-2.5 text-lg font-semibold leading-6 text-[#15231d] dark:text-[#f5f3eb] sm:text-xl sm:leading-7">
                  {activeAd.business_name}
                </h3>
              </div>
              <ArrowRight className="hidden h-5 w-5 shrink-0 text-[#617069] transition-transform duration-300 group-hover:translate-x-1 sm:block dark:text-[#ffffff99]" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  // In-house fallback: advertise the (upcoming) ad marketplace
  return (
    <section className={cn('w-full bg-[#fcfaf6] dark:bg-[#0d1a13]', className)} aria-label={t('ads.powerTitle') as string}>
      <div className="mx-auto w-full max-w-[1205px] px-5 sm:px-8 lg:px-0">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14563d] via-[#1e6b4d] to-[#2e7d4f] shadow-[0px_8px_24px_-6px_#14563d66]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#c9e7b8]/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#f5e6c8]/10 blur-2xl"
          />
          <div className="relative flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[1.2px] text-[#eef7e6]">
                {t('ads.powerNote') as string}
              </span>
              <h3 className="pt-3 text-xl font-semibold leading-7 tracking-[-0.4px] text-white sm:text-2xl sm:leading-8">
                {t('ads.powerTitle') as string}
              </h3>
              <p className="pt-2 text-sm leading-6 text-[#eef7e6]/80 sm:leading-6">
                {t('ads.powerDesc') as string}
              </p>
            </div>
            <Link
              href="/reklam"
              className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#14563d] shadow-[0px_4px_12px_rgba(0,0,0,0.15)] transition-all hover:bg-[#f5f3eb] hover:shadow-[0px_6px_16px_rgba(0,0,0,0.2)]"
            >
              {t('ads.powerCta') as string}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
