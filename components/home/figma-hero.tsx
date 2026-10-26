'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocateMeButton } from '@/components/shared/locate-me-button';
import { PredictiveSearch } from '@/components/shared/predictive-search';
import { TURKEY_CITIES } from '@/lib/constants';
import { HeroFloatLayer } from '@/components/home/hero-float-layer';
import { Reveal } from '@/components/shared/reveal';
import { useJobs } from '@/hooks/use-jobs';
import { useStats } from '@/hooks/use-stats';
import { useI18n } from '@/components/i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

const HERO_VIDEO =
  'https://videos.pexels.com/video-files/1620050/1620050-hd_1920_1080_25fps.mp4';

const HERO_IMAGE =
  'https://images.pexels.com/photos/9276463/pexels-photo-9276463.jpeg?auto=compress&cs=tinysrgb&w=1600';

export function FigmaHero() {
  const { t } = useI18n();
  const router = useRouter();
  const { jobs, loading } = useJobs();
  const { stats } = useStats(jobs, loading);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement | null>(null);

  const heroPhrases: TranslationKey[] = useMemo(
    () => ['red.heroPhrase1', 'red.heroPhrase2', 'red.heroPhrase3', 'red.heroPhrase4'],
    [],
  );
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % heroPhrases.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [heroPhrases.length]);

  const TR_CHARS: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  const normalizeTr = (s: string) =>
    s
      .toLocaleLowerCase('tr-TR')
      .replace(/[çğıöşü]/g, (ch) => TR_CHARS[ch] ?? ch);

  const citySuggestions = useMemo(() => {
    const query = normalizeTr(searchCity.trim());
    if (!query) return [];
    return TURKEY_CITIES.filter((c) => normalizeTr(c).includes(query)).slice(0, 7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCity]);

  useEffect(() => {
    if (!cityOpen) return;
    const onDown = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [cityOpen]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    if (searchCity.trim()) params.set('location', searchCity.trim());
    router.push(`/jobs?${params.toString()}`);
  };

  const handlePredictiveNavigate = ({ q, city }: { q?: string; city?: string }) => {
    if (city) {
      setSearchCity(city);
      const params = new URLSearchParams();
      if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
      params.set('location', city);
      router.push(`/jobs?${params.toString()}`);
      return;
    }
    if (q) {
      setSearchKeyword(q);
      const params = new URLSearchParams();
      params.set('q', q);
      if (searchCity.trim()) params.set('location', searchCity.trim());
      router.push(`/jobs?${params.toString()}`);
    }
  };

  const handlePillClick = (label: string) => {
    router.push(`/jobs?q=${encodeURIComponent(label)}`);
  };

  const pills: TranslationKey[] = [
    'hero.pillSeasonal',
    'hero.pillTractor',
    'hero.pillFieldEngineer',
    'hero.pillGreenhouse',
  ];

  const statItems = [
    { value: `${stats.activeJobs.toLocaleString('tr-TR')}+`, label: t('stats.activeJobs') },
    { value: `${stats.hiringFarms}`, label: t('stats.hiringFarms') },
    { value: `${stats.regions}`, label: t('stats.regions') },
    { value: `${stats.successfulMatches.toLocaleString('tr-TR')}+`, label: t('stats.successfulMatches') },
  ];

  return (
    <section className="relative flex w-full flex-col items-stretch overflow-hidden bg-[#fffdf6] dark:bg-[#0b1611]">
      {/* Wind-drifting dandelions, petals and specks across the dark header area */}
      <HeroFloatLayer />
      {/* Heading — badge removed, moved up */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1024px] flex-col items-center px-4 pt-[54px] sm:px-8 lg:px-0">
        <div className="flex w-full flex-col items-center pt-2">
          <h1 className="w-full max-w-[896px] text-center text-[clamp(2.25rem,7vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-[#15231d] dark:text-[#f5f3eb]">
            {t('red.heroTitle')}
          </h1>
        </div>
        <div className="relative flex h-7 w-full max-w-[576px] items-center justify-center pt-4">
          {heroPhrases.map((phrase, i) => (
            <p
              key={phrase}
              className="absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-wide text-field transition-opacity duration-700 ease-in-out dark:text-[#c9e7b8]"
              style={{ opacity: i === phraseIndex ? 1 : 0 }}
              aria-hidden={i !== phraseIndex}
            >
              {t(phrase)}
            </p>
          ))}
        </div>
        <p className="w-full max-w-[576px] pt-6 text-center text-base leading-6 text-[#617069] dark:text-[#ffffff99]">
          {t('red.heroSubtitle')}
        </p>

        {/* Preserved search bar — keyword + location with suggestions + golden-trail search button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="mt-12 flex w-full max-w-4xl flex-col gap-2 rounded-2xl border border-[#15231d1a] bg-cream/95 p-2 shadow-[0px_25px_50px_-12px_#00000026] dark:border-[#ffffff14] sm:flex-row sm:items-center"
        >
          <div className="relative flex min-h-12 flex-[1.5] items-center rounded-xl border border-[#15231d1a] bg-cream shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] dark:border-[#ffffff14]">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 z-10 h-[18px] w-[18px] shrink-0 text-ink-faint" />
            <PredictiveSearch
              jobs={jobs}
              onSearchNavigate={handlePredictiveNavigate}
              placeholder={t('hero.searchPlaceholder') as string}
              inputClassName="h-12 rounded-xl border-0 bg-transparent pl-11 pr-3 focus:border-0 focus:ring-0"
              className="flex-1"
            />
          </div>
          <div
            ref={cityRef}
            className="relative flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-[#15231d1a] bg-cream px-4 shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] dark:border-[#ffffff14]"
          >
            <MapPin aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-ink-faint" />
            <span className="sr-only">{t('hero.locationPlaceholder')}</span>
            <input
              value={searchCity}
              onChange={(e) => {
                setSearchCity(e.target.value);
                setCityOpen(true);
              }}
              onFocus={() => setCityOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setCityOpen(false);
              }}
              placeholder={t('hero.locationPlaceholder') as string}
              className="h-12 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <LocateMeButton
              onLocate={(city) => {
                setSearchCity(city);
                setCityOpen(false);
              }}
              size="sm"
              showLabel={false}
              className="h-8 w-8 shrink-0 rounded-lg border-0 bg-transparent px-0 text-ink-faint hover:border-transparent hover:bg-[#f2dfa4] hover:text-[#3a2f10]"
            />
            {cityOpen && citySuggestions.length > 0 && (
              <div
                role="listbox"
                className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-[220px] w-full min-w-[200px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#c9e7b8_transparent] rounded-xl border border-[#15231d14] bg-cream shadow-lg dark:border-[#ffffff26] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9e7b8]"
              >
                {citySuggestions.map((city) => (
                  <button
                    key={city}
                    type="button"
                    role="option"
                    aria-selected={normalizeTr(city) === normalizeTr(searchCity.trim())}
                    onClick={() => {
                      setSearchCity(city);
                      setCityOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-[#f2dfa4]"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="gold-trail-btn h-12 shrink-0 gap-2 rounded-xl bg-[#08271d] px-6 text-sm font-semibold text-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] hover:bg-[#123d2e] dark:bg-brand dark:hover:bg-brand-hover"
          >
            {t('hero.searchButton')}
            <ArrowUpRight aria-hidden="true" className="h-[18px] w-[18px]" />
          </Button>
        </form>

        <div className="flex min-h-[46px] w-full max-w-[896px] flex-wrap items-center justify-center gap-2 pt-4">
          <span className="text-xs text-[#96a09a]">{t('hero.popular')}</span>
          {pills.map((pill) => (
            <button
              key={pill}
              onClick={() => handlePillClick(t(pill) as string)}
              className="rounded-full border border-[#15231d26] bg-transparent px-3 py-1.5 text-xs text-[#617069] transition-colors hover:border-[#c88a3566] hover:bg-[#c88a3526] hover:text-[#15231d] dark:border-[#ffffff26] dark:text-[#ffffff99] dark:hover:text-white"
            >
              {t(pill)}
            </button>
          ))}
        </div>
      </header>

      {/* Boxed figure + statistics container — shared rounded frame over the full-width dark backdrop */}
      <div className="relative z-10 mt-10 w-full lg:mt-12">
        <div className="overflow-hidden rounded-none bg-[#fffdf6] dark:bg-[#0b1611]">
          <figure className="relative h-[380px] w-full overflow-hidden sm:h-[420px] lg:h-[490px]">
            <video
              className="hero-video"
              src={HERO_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={HERO_IMAGE}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,#fffdf6_0%,#fffdf6_35%,rgba(255,253,246,0)_100%)] dark:bg-[linear-gradient(180deg,#0b1611_0%,#0b1611_35%,rgba(11,22,17,0)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,rgba(8,39,29,0.8)_0%,rgba(8,39,29,0.25)_55%,rgba(8,39,29,0)_100%)] dark:bg-[linear-gradient(0deg,rgba(3,15,10,0.85)_0%,rgba(3,15,10,0.3)_55%,rgba(3,15,10,0)_100%)]" />
            <figcaption className="relative z-10 flex h-full w-full flex-col items-center justify-end px-4 pb-10 sm:px-8">
              <Reveal className="w-full max-w-[1205px]" delay={150}>
                <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-16">
                  <h2 className="max-w-sm text-center text-3xl font-semibold leading-[0.95] text-white sm:text-4xl">
                    {t('red.figureTitle')}
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/hizmetler')}
                    className="h-auto min-h-10 shrink-0 rounded-full border-[#ffffff59] bg-[#ffffff1a] px-4 text-white shadow-[0_0_0_1px_#ffffff14] backdrop-blur-[8px] hover:bg-[#ffffff2b] hover:text-white"
                  >
                    <span className="text-sm font-semibold leading-5">{t('red.figureCta')}</span>
                    <ArrowUpRight className="h-[15px] w-[15px]" aria-hidden="true" />
                  </Button>
                </div>
              </Reveal>
            </figcaption>
          </figure>

          {/* Live statistics strip */}
          <dl className="grid grid-cols-2 bg-[#fffdf6] dark:bg-[#0b1611] sm:grid-cols-4">
            {statItems.map((statistic, index) => (
              <div
                key={statistic.label}
                className={`flex min-h-[108px] flex-col items-center px-4 py-7 text-center ${
                  index < statItems.length - 1 ? 'border-r border-[#15231d1a] dark:border-[#ffffff14]' : ''
                }`}
              >
                <dt className="text-2xl font-medium leading-8 text-[#15231d] dark:text-[#f5f3eb]">
                  {statistic.value}
                </dt>
                <dd className="pt-1 text-xs font-normal leading-4 text-[#617069] dark:text-[#ffffff99]">
                  {statistic.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
