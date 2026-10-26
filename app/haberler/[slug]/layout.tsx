import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haber Detayı',
  description: 'Tarım haberinin tam metni, güncel ürün fiyatları ve piyasa bilgileri.',
  alternates: { canonical: '/haberler' },
};

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}