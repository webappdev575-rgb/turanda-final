'use client';

import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import { Reveal } from '@/components/shared/reveal';

const ACADEMY_STORIES = [
  {
    image: 'https://images.pexels.com/photos/27176067/pexels-photo-27176067.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm1Name', specKey: 'red.academyFarm1Spec', trackKey: 'red.academyFarm1Track', locationKey: 'red.academyFarm1Location',
  },
  {
    image: 'https://images.pexels.com/photos/8747798/pexels-photo-8747798.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm2Name', specKey: 'red.academyFarm2Spec', trackKey: 'red.academyFarm2Track', locationKey: 'red.academyFarm2Location',
  },
  {
    image: 'https://images.pexels.com/photos/39214036/pexels-photo-39214036.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm3Name', specKey: 'red.academyFarm3Spec', trackKey: 'red.academyFarm3Track', locationKey: 'red.academyFarm3Location',
  },
  {
    image: 'https://images.pexels.com/photos/34182297/pexels-photo-34182297.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm4Name', specKey: 'red.academyFarm4Spec', trackKey: 'red.academyFarm4Track', locationKey: 'red.academyFarm4Location',
  },
  {
    image: 'https://images.pexels.com/photos/34182367/pexels-photo-34182367.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm5Name', specKey: 'red.academyFarm5Spec', trackKey: 'red.academyFarm5Track', locationKey: 'red.academyFarm5Location',
  },
  {
    image: 'https://images.pexels.com/photos/36489873/pexels-photo-36489873.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm6Name', specKey: 'red.academyFarm6Spec', trackKey: 'red.academyFarm6Track', locationKey: 'red.academyFarm6Location',
  },
  {
    image: 'https://images.pexels.com/photos/6777855/pexels-photo-6777855.jpeg?auto=compress&cs=tinysrgb&w=1600',
    nameKey: 'red.academyFarm7Name', specKey: 'red.academyFarm7Spec', trackKey: 'red.academyFarm7Track', locationKey: 'red.academyFarm7Location',
  },
];

export function FigmaAcademyPanel() {
  const { t } = useI18n();
  const [activeStory, setActiveStory] = useState(0);

  const showPreviousStory = () => {
    setActiveStory((current) =>
      current === 0 ? ACADEMY_STORIES.length - 1 : current - 1,
    );
  };

  const showNextStory = () => {
    setActiveStory((current) => (current + 1) % ACADEMY_STORIES.length);
  };

  const dragStartX = useRef<number | null>(null);
  const dragMoved = useRef(false);

  const onDragStart = (clientX: number) => {
    dragStartX.current = clientX;
    dragMoved.current = false;
  };

  const onDragMove = (clientX: number) => {
    if (dragStartX.current === null) return;
    if (Math.abs(clientX - dragStartX.current) > 10) dragMoved.current = true;
  };

  const onDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const delta = clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) showNextStory();
    else showPreviousStory();
  };

  return (
    <section className="flex w-full flex-col items-start bg-white px-0 py-14 dark:bg-[#0b1611] lg:py-20">
      <div className="flex w-full flex-col items-center">
        <div className="flex w-full max-w-[1205px] flex-col items-center px-4 sm:px-6 lg:px-0">
          <Reveal className="w-full max-w-[810px]">
            <article
              className="relative flex aspect-[3/4] min-h-[380px] w-full cursor-grab touch-pan-y select-none flex-col justify-between overflow-hidden rounded-[32px] bg-[#08271d] transition-transform duration-300 motion-safe:hover:scale-[1.008] active:cursor-grabbing sm:aspect-[4/3] sm:min-h-[420px] lg:aspect-[1205/640]"
              onPointerDown={(e) => onDragStart(e.clientX)}
              onPointerMove={(e) => onDragMove(e.clientX)}
              onPointerUp={(e) => onDragEnd(e.clientX)}
              onPointerCancel={() => {
                dragStartX.current = null;
              }}
              onClickCapture={(e) => {
                if (dragMoved.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  dragMoved.current = false;
                }
              }}
              onDragStart={(e) => e.preventDefault()}
            >
              {ACADEMY_STORIES.map((story, i) => (
                <div
                  key={story.image}
                  aria-hidden={i !== activeStory}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: i === activeStory ? 1 : 0 }}
                >
                  <Image
                    src={story.image}
                    alt=""
                    fill
                    sizes="(max-width: 1200px) 100vw, 1205px"
                    className="object-cover"
                  />
                </div>
              ))}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,39,29,0.85)_0%,rgba(8,39,29,0.25)_55%,rgba(8,39,29,0)_100%)] sm:bg-[linear-gradient(90deg,rgba(8,39,29,0.65)_0%,rgba(8,39,29,0.1)_50%,rgba(8,39,29,0)_100%)]"
              />
              <div className="relative flex w-full flex-col items-center p-5 pt-7 text-center sm:p-10 sm:pt-12 lg:p-12 lg:pt-14">
                <h2 className="max-w-xl text-[22px] font-semibold leading-7 tracking-[-0.5px] text-white sm:text-4xl sm:leading-[48px] sm:tracking-[-1px] lg:text-[41px] lg:leading-[60px] lg:tracking-[-1.2px]">
                  {t('red.academyPanelTitle')}
                </h2>
              </div>
              <div className="relative flex w-full flex-wrap items-end justify-between gap-4 p-5 pt-12 sm:p-8 sm:pt-9 lg:p-10 lg:pt-10">
                <div className="flex max-w-md flex-col items-start gap-2">
                  <div className="rounded-xl">
                    <span className="inline-block rounded-md bg-[#4e8f3e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]">
                      {t(ACADEMY_STORIES[activeStory].trackKey as Parameters<typeof t>[0])}
                    </span>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold leading-5 text-white sm:text-base sm:leading-6">
                        {t(ACADEMY_STORIES[activeStory].nameKey as Parameters<typeof t>[0])}
                      </p>
                      <div className="inline-flex shrink-0 items-center gap-2">
                        <MapPinIcon
                          aria-hidden="true"
                          className="h-[15px] w-[15px] text-white"
                          strokeWidth={2}
                        />
                        <span className="text-xs font-semibold leading-4 text-white">
                          {t(ACADEMY_STORIES[activeStory].locationKey as Parameters<typeof t>[0])}
                        </span>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs leading-4 font-bold text-white sm:text-sm sm:leading-5">
                      {t(ACADEMY_STORIES[activeStory].specKey as Parameters<typeof t>[0])}
                    </p>
                  </div>
                </div>
              </div>
              <nav
                aria-label="Akademi hikayeleri"
                className="pointer-events-none absolute inset-0 z-10"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('hero.slide.prev') as string}
                  onClick={showPreviousStory}
                  className="pointer-events-auto absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/15 text-white backdrop-blur-[8px] hover:bg-white/25 hover:text-white sm:left-5 sm:h-11 sm:w-11 lg:left-6"
                >
                  <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('hero.slide.next') as string}
                  onClick={showNextStory}
                  className="pointer-events-auto absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/15 text-white backdrop-blur-[8px] hover:bg-white/25 hover:text-white sm:right-5 sm:h-11 sm:w-11 lg:right-6"
                >
                  <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
                </Button>
              </nav>
              <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
                {ACADEMY_STORIES.map((story, i) => (
                  <button
                    key={story.image}
                    type="button"
                    onClick={() => setActiveStory(i)}
                    aria-label={`Slide ${i + 1}`}
                    aria-current={i === activeStory}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === activeStory
                        ? 'w-5 bg-[#8fd47a]/90'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </article>
          </Reveal>
          <div className="flex w-full items-center justify-center pt-5">
            <Button
              type="button"
              variant="ghost"
              asChild
              className="h-10 rounded-xl px-4 text-sm font-semibold leading-5 text-[#617069] hover:bg-[#f4f6f4] hover:text-[#617069] dark:text-[#ffffff99] dark:hover:bg-[#1c2a22]"
            >
              <Link href="/akademi">
                {t('red.academyExplore')}
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="ml-2 h-[15px] w-[15px]"
                />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
