'use client';

import { AdSpace } from '@/components/ads/ad-space';

interface AdSpaceRendererProps {
  position: string;
  className?: string;
  variant?: 'banner' | 'sidebar' | 'inline';
}

const POSITION_MAP: Record<string, { slot: string; page?: string; variant: 'banner' | 'sidebar' | 'inline' }> = {
  'header-banner': { slot: 'header-banner', page: 'home', variant: 'banner' },
  'job-list-in-feed': { slot: 'jobs-inline-1', page: 'jobs', variant: 'inline' },
  'job-sidebar': { slot: 'jobs-sidebar-all', page: 'jobs', variant: 'sidebar' },
  'commodity-sidebar': { slot: 'commodity-sidebar', page: 'commodities', variant: 'sidebar' },
  'news-sidebar': { slot: 'news-sidebar-primary', page: 'news', variant: 'sidebar' },
  'dashboard-sidebar': { slot: 'dashboard-sidebar', page: 'dashboard', variant: 'sidebar' },
  'employer-sidebar': { slot: 'employer-sidebar', page: 'employer', variant: 'sidebar' },
  'home-sidebar-top': { slot: 'home-sidebar-top', page: 'home', variant: 'sidebar' },
  'home-sidebar-bottom': { slot: 'home-sidebar-bottom', page: 'home', variant: 'sidebar' },
  'footer-banner': { slot: 'footer-banner', variant: 'banner' },
};

export function AdSpaceRenderer({ position, className, variant }: AdSpaceRendererProps) {
  const config = POSITION_MAP[position];

  if (!config) {
    return <AdSpace slot={position} variant={variant ?? 'sidebar'} className={className} />;
  }

  return (
    <AdSpace
      slot={config.slot}
      page={config.page}
      variant={variant ?? config.variant}
      className={className}
    />
  );
}
