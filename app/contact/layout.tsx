import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İletişim — Turanda Tarım',
  description:
    'Turanda Tarım ile iletişime geçin: sorularınız, iş birliği teklifleri ve destek için bize ulaşın. Antalya, Türkiye.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
