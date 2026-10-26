import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarım İş İlanları — Çiftlik İşlerinde Ara ve Başvur',
  description:
    'Türkiye genelinde doğrulanmış tarım iş ilanları: hasat, sera, traktör, tarla mühendisliği ve daha fazlası. Konuma göre ara, tek tıkla başvur.',
  alternates: { canonical: '/jobs' },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
