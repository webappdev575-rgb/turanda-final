import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turanda Akademi — Tarım Eğitimleri ve Kurslar',
  description:
    'Sektör uzmanlarından yapılandırılmış tarım kursları: ürün yönetimi, hayvancılık, sulama, makine kullanımı ve daha fazlası.',
  alternates: { canonical: '/akademi' },
};

export default function AkademiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
