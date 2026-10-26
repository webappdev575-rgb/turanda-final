import './globals.css';
import type { Metadata } from 'next';
import { Manrope, Noto_Sans_Arabic } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { MobileDock } from '@/components/layout/mobile-dock';
import { Footer } from '@/components/layout/footer';
import { MarketPulse } from '@/components/home/market-pulse';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { AuthProvider } from '@/components/auth-provider';
import { CookieConsent } from '@/components/cookie-consent';

// Canonical domain comes from NEXT_PUBLIC_SITE_URL so the site works on any host without code edits.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.turanda.com').replace(/\/+$/, '');

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
});
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-arabic',
  preload: false,
});

// Replace the verification value with your Google Search Console token.
const GSC_VERIFICATION = 'google-search-console-verification-code-here';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Turanda Tarım — Tarım İş Pazarı ve Tarımsal Piyasa Bilgileri',
    template: '%s | Turanda Tarım',
  },
  description:
    'Türkiye genelinde tarım işleri bulun. Çiftlik ilanlarına göz atın, tek tıkla başvurun, güncel tarım ürünü fiyatlarını izleyin ve Turanda Akademi ile gelişin.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Turanda Tarım',
    title: 'Turanda Tarım — Tarım İş Pazarı ve Tarımsal Piyasa Bilgileri',
    description:
      'Türkiye genelinde tarım işleri bulun. Çiftlik ilanlarına göz atın, tek tıkla başvurun, güncel tarım ürünü fiyatlarını izleyin ve Turanda Akademi ile gelişin.',
    locale: 'tr_TR',
    images: [
      {
        url: '/images/logos/logo-mark.png',
        width: 405,
        height: 393,
        alt: 'Turanda Tarım logosu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turanda Tarım — Tarım İş Pazarı ve Tarımsal Piyasa Bilgileri',
    description:
      'Türkiye genelinde tarım işleri bulun. Çiftlik ilanlarına göz atın, tek tıkla başvurun, güncel tarım ürünü fiyatlarını izleyin ve Turanda Akademi ile gelişin.',
    images: ['/images/logos/logo-mark.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/logos/logo-mark.png',
    apple: '/images/logos/logo-mark.png',
  },
  verification: {
    google: GSC_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('turanda-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${SITE_URL}/#organization`,
                  name: 'Turanda Tarım',
                  url: SITE_URL,
                  logo: `${SITE_URL}/images/logos/logo-mark.png`,
                  email: 'info@turanda.com',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Antalya',
                    addressCountry: 'TR',
                  },
                  sameAs: [
                    'https://instagram.com/turanda',
                    'https://x.com/turanda',
                    'https://youtube.com/@turanda',
                    'https://linkedin.com/company/turanda',
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: 'Turanda Tarım',
                  inLanguage: 'tr',
                  publisher: { '@id': `${SITE_URL}/#organization` },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${notoSansArabic.variable} font-sans min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <MarketPulse />
              <Navbar />
              <main className="flex-1 pb-24 lg:pb-0">{children}</main>
              <Footer />
              <MobileDock />
              <CookieConsent />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
