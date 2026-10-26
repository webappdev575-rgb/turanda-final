import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kamu Kaynakları — Resmî Tarım Kuruluşlarından Güncel Bilgiler',
  description:
    '13 resmî Türk tarım kuruluşundan güncel duyurular, fiyat bildirimleri, hibe çağrıları ve mevzuat güncellemeleri.',
  alternates: { canonical: '/kaynaklar' },
};

export default function KaynaklarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
