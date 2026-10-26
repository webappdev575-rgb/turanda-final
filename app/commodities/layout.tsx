import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ürün Fiyatları — Emtia Borsası ve Fiyat Geçmişi',
  description:
    'Tarımsal emtiaların güncel fiyatları, günlük değişim oranları ve geçmiş fiyat grafikleri.',
  alternates: { canonical: '/commodities' },
};

export default function CommoditiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
