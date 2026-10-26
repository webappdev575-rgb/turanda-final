import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reklam Verin — Turanda Tarım',
  description:
    'Turanda Tarım ile binlerce çiftçi ve tarım işverenine ulaşın. Reklam alanları ve sponsorluk seçenekleri hakkında bilgi alın.',
  alternates: { canonical: '/reklam' },
};

export default function ReklamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
