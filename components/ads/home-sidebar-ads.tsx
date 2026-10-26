'use client';

import { AdSpace } from '@/components/ads/ad-space';

/**
 * Homepage sidebar ad containers. The slots exist in the database
 * (home-sidebar-top / home-sidebar-bottom); the dashed "available" preview
 * placeholders render for signed-in administrators only, so the public
 * never sees ad infrastructure before placements are sold.
 */
export function HomeSidebarAds({ className }: { className?: string }) {
  return (
    <div className={className}>
      <AdSpace slot="home-sidebar-top" page="home" variant="sidebar" adminPreview />
      <div className="mt-4">
        <AdSpace slot="home-sidebar-bottom" page="home" variant="sidebar" adminPreview />
      </div>
    </div>
  );
}
