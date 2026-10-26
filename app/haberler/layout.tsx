import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarım Haberleri — Sektörden Güncel Gelişmeler',
  description:
    'Tarım sektöründen son dakika haberleri, bölgesel gelişmeler, hava durumu etkileri ve politika güncellemeleri.',
  alternates: { canonical: '/haberler' },
};

export default function HaberlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
