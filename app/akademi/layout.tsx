import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turanda Agri Academy — Tarım Eğitim Programları',
  description:
    'Bir Günlük Çiftçi, Hafta Sonu Tarım Programı ve Altı Aylık Profesyonel Çiftçilik Eğitimlerini keşfedin.',
  alternates: { canonical: '/akademi' },
};

export default function AkademiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
