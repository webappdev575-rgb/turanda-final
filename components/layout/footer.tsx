'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useI18n } from '@/components/i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

const SOCIALS: { label: string; href: string; path: string }[] = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/turanda',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4zm0 11a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm7-11.2a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0z',
  },
  {
    label: 'X',
    href: 'https://x.com/turanda',
    path: 'M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.5 22H3.4l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L7.4 3.7H5.6L17.8 20z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@turanda',
    path: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.5 15.5v-7L15.8 12l-6.3 3.5z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/turanda',
    path: 'M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1a3.7 3.7 0 0 1 3.3-1.8c3.5 0 4.2 2.3 4.2 5.4v6.2zM5.3 7.4a2 2 0 1 1 0-4.1 2 2 0 0 1 0 4.1zM7.1 20.4H3.6V9h3.5v11.4z',
  },
];

export function Footer() {
  const { t } = useI18n();

  const navigationGroups: {
    title: TranslationKey;
    links: { label: string; href: string }[];
  }[] = [
    {
      title: 'red.footerCompany',
      links: [
        { label: t('footer.aboutUs') as string, href: '/contact' },
        { label: t('nav.advertise') as string, href: '/reklam' },
      ],
    },
    {
      title: 'red.footerResources',
      links: [
        { label: t('footer.marketNews') as string, href: '/piyasalar' },
        { label: t('home.newsLatest') as string, href: '/haberler' },
        { label: t('nav.akademi') as string, href: '/akademi' },
      ],
    },
    {
      title: 'red.footerCareer',
      links: [
        { label: t('nav.findJobs') as string, href: '/jobs' },
        { label: t('nav.postJob') as string, href: '/employer' },
        { label: t('nav.dashboard') as string, href: '/dashboard' },
      ],
    },
    {
      title: 'red.footerHelp',
      links: [
        { label: t('nav.contact') as string, href: '/contact' },
        { label: t('nav.login') as string, href: '/login' },
        { label: t('footer.cookies') as string, href: '#' },
      ],
    },
  ];

  return (
    <footer className="w-full border-t border-[#15231d14] bg-white text-[#15231d] dark:border-[#ffffff14] dark:bg-[#0b1611] dark:text-[#f5f3eb]">
      <div className="mx-auto grid w-full max-w-[1205px] grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-[minmax(0,445px)_minmax(0,1fr)] lg:px-0">
        {/* Brand block */}
        <section className="flex flex-col items-start">
          <Link href="/" className="flex items-center gap-3 rounded-lg">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
              <Image src="/images/logos/logo-mark.png" alt="Turanda Tarım" fill sizes="48px" className="object-contain dark:hidden" />
              <Image src="/images/logos/logo-mark-dark.png" alt="" aria-hidden="true" fill sizes="48px" className="hidden object-contain dark:block" />
            </span>
            <span className="hidden shrink-0 sm:flex">
              <span aria-hidden="true" className="flex flex-col items-center justify-center leading-none">
                <span className="text-[17px] font-extrabold uppercase tracking-[0.02em] text-[#15231d] dark:text-white">Turanda</span>
                <span className="mt-[3px] text-[10px] font-bold uppercase tracking-[0.55em] text-[#c9962e]">Tarim</span>
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-96 text-sm leading-7 text-[#617069] dark:text-[#ffffff99]">
            {t('footer.tagline')}
          </p>

          {/* Social channels + language switcher on one row */}
          <div className="mt-6 flex w-full max-w-[445px] flex-wrap items-center gap-x-3 gap-y-3">
            <div className="flex items-center gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#15231d1a] text-[#617069] transition-colors hover:border-[#14563d] hover:text-[#14563d] dark:border-[#ffffff26] dark:text-[#ffffff99] dark:hover:border-[#c9e7b8] dark:hover:text-[#c9e7b8]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
            <LanguageSwitcher />
          </div>
        </section>

        {/* Link groups */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {navigationGroups.map((group) => (
            <section key={group.title} className="flex flex-col items-start">
              <h2 className="text-xs font-bold leading-4 tracking-[1.68px] text-[#15231d] dark:text-[#f5f3eb]">
                {t(group.title)}
              </h2>
              <ul className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label} className="flex items-center">
                    <Link
                      href={link.href}
                      className="text-sm font-semibold leading-5 text-[#617069] transition-colors hover:text-[#14563d] dark:text-[#ffffff99] dark:hover:text-[#c9e7b8]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>

      <div className="border-t border-[#15231d14] dark:border-[#ffffff14]">
        <div className="mx-auto flex w-full max-w-[1205px] flex-col gap-3 px-6 py-5 sm:px-0 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs leading-4 text-[#96a09a]">
            © {new Date().getFullYear()} Turanda Tarım. {t('footer.rights')}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/gizlilik"
              className="text-xs leading-4 text-[#96a09a] transition-colors hover:text-[#14563d] dark:hover:text-[#c9e7b8]"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="/kullanim-kosullari"
              className="text-xs leading-4 text-[#96a09a] transition-colors hover:text-[#14563d] dark:hover:text-[#c9e7b8]"
            >
              {t('footer.terms')}
            </Link>
            <span className="text-xs leading-4 text-[#96a09a]">
              &nbsp;· info@turanda.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
