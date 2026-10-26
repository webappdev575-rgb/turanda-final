import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hizmetler — Turanda Tarım',
  description:
    'Akıllı sulama, tarım dronları ve otomasyon çözümleriyle tarlanızı geleceğe taşıyın. MyField uygulaması yakında.',
  alternates: { canonical: '/hizmetler' },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
