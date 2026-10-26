'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { useAnnouncements } from '@/hooks/use-announcements';
import { Reveal } from '@/components/shared/reveal';

export function AnnouncementsSection() {
  const { announcements, loading } = useAnnouncements();

  if (loading || announcements.length === 0) return null;

  return (
    <section className="w-full bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto flex w-full max-w-[1344px] flex-col gap-5 px-6 pb-6 pt-20 sm:px-8 lg:px-8 lg:pb-8 lg:pt-24">
        {announcements.map((announcement, i) => (
          <Reveal key={announcement.id} delay={i * 80}>
            <article className="overflow-hidden rounded-3xl border border-[#15231d14] bg-white shadow-[0px_8px_10px_-6px_#14563d1a,0px_20px_25px_-5px_#14563d1a] dark:border-[#ffffff14] dark:bg-[#10241b] sm:flex">
              {announcement.image_url && (
                <div className="relative h-48 w-full shrink-0 sm:h-auto sm:w-64">
                  <Image
                    src={announcement.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#14563d0f] px-3 py-1.5 dark:bg-[#c9e7b81a]">
                  <Megaphone className="h-3.5 w-3.5 text-field dark:text-[#c9e7b8]" aria-hidden="true" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-field dark:text-[#c9e7b8]">
                    Duyuru
                  </span>
                </div>
                <h3 className="text-xl font-semibold leading-8 tracking-[-0.6px] text-ink dark:text-[#f5f3eb]">
                  {announcement.title}
                </h3>
                <p className="whitespace-pre-line text-sm leading-6 text-[#617069] dark:text-[#ffffff99]">
                  {announcement.body}
                </p>
                {announcement.link_url && (
                  <div className="pt-1">
                    <Link
                      href={announcement.link_url}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#08271d] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#c9e7b8] dark:text-[#0d1a13]"
                    >
                      {announcement.link_label || 'Detaylar'}
                    </Link>
                  </div>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
