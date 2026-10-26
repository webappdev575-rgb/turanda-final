import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarım Piyasaları — Güncel Ürün Fiyatları ve Haberler',
  description:
    'Bölgesel tarım ürünü fiyatlarını canlı takip edin: buğday, süt, domates ve daha fazlası. Günlük fiyat hareketleri ve piyasa haberleri.',
  alternates: { canonical: '/piyasalar' },
};

export default function PiyasalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
