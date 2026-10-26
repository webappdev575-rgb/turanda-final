'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Megaphone, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { appConfig } from '@/lib/app-config';
import { useAuth } from '@/components/auth-provider';

interface AdPlacement {
  id: string;
  business_name: string;
  image_url: string | null;
  target_url: string | null;
  priority: number;
}

interface AdSpaceRecord {
  id: string;
  slot: string;
  label: string;
  width: number;
  height: number;
  adsense_enabled: boolean;
  adsense_slot: string | null;
  category: string | null;
  page: string | null;
}

interface AdSpaceProps {
  slot: string;
  className?: string;
  /** Category context for targeted ads (e.g. job category, news category) */
  category?: string;
  /** Page context for filtering ad spaces */
  page?: string;
  /** Variant: 'banner' for horizontal, 'sidebar' for vertical, 'inline' for compact */
  variant?: 'banner' | 'sidebar' | 'inline';
  /** When true, the empty-slot placeholder is visible to admins only */
  adminPreview?: boolean;
}

function isWithinSchedule(placement: { days_of_week: number[] | null; start_hour: number; end_hour: number }): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  if (placement.days_of_week && placement.days_of_week.length > 0) {
    if (!placement.days_of_week.includes(dayOfWeek)) return false;
  }

  if (placement.start_hour !== 0 || placement.end_hour !== 23) {
    if (hour < placement.start_hour || hour >= placement.end_hour) return false;
  }

  return true;
}

export function AdSpace({ slot, className, category, page, variant = 'sidebar', adminPreview }: AdSpaceProps) {
  const [space, setSpace] = useState<AdSpaceRecord | null>(null);
  const [placement, setPlacement] = useState<AdPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  const showEmptyPreview = adminPreview === true ? isAdmin : true;

  const loadAd = useCallback(async () => {
    if (!appConfig.features.ads) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('ad_spaces')
        .select('id, slot, label, width, height, adsense_enabled, adsense_slot, category, page')
        .eq('slot', slot)
        .eq('available', true);

      if (page) {
        query = query.or(`page.is.null,page.eq.${page}`);
      }

      const { data: spaceData } = await query.maybeSingle();

      if (!spaceData) {
        setLoading(false);
        return;
      }

      setSpace(spaceData as AdSpaceRecord);

      if ((spaceData as AdSpaceRecord).adsense_enabled && (spaceData as AdSpaceRecord).adsense_slot) {
        setLoading(false);
        return;
      }

      const { data: placements } = await supabase
        .from('ad_placements')
        .select('id, business_name, image_url, target_url, priority, days_of_week, start_hour, end_hour')
        .eq('ad_space_id', (spaceData as AdSpaceRecord).id)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (placements && placements.length > 0) {
        const eligible = placements.filter((p) =>
          isWithinSchedule({
            days_of_week: p.days_of_week as number[] | null,
            start_hour: p.start_hour ?? 0,
            end_hour: p.end_hour ?? 23,
          })
        );

        if (eligible.length > 0) {
          const topPriority = eligible[0].priority;
          const topTier = eligible.filter((p) => p.priority === topPriority);
          const selected = topTier[Math.floor(Math.random() * topTier.length)];
          setPlacement(selected as unknown as AdPlacement);

          await supabase
            .from('ad_placements')
            .update({ impressions: ((selected as Record<string, unknown>).impressions as number || 0) + 1 })
            .eq('id', selected.id);
        }
      }
    } catch {
      // Ads are non-critical
    }
    setLoading(false);
  }, [slot, page]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  const handleAdClick = async () => {
    if (placement) {
      try {
        await supabase.rpc('increment_ad_click', { placement_id: placement.id });
      } catch {
        // Non-critical
      }
    }
  };

  if (!appConfig.features.ads || dismissed) return null;
  if (loading) return null;

  // AdSense override
  if (space?.adsense_enabled && space.adsense_slot) {
    return (
      <div className={cn('relative overflow-hidden rounded-lg', className)}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: space.height || 250 }}
          data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
          data-ad-slot={space.adsense_slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-1 top-1 rounded bg-background/60 p-0.5 text-muted-foreground hover:bg-background"
          aria-label="Close ad"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  if (!placement) {
    if (!showEmptyPreview) return null;
    const slotConfig = appConfig.adSpaces.find((a) => a.slot === slot);
    if (!slotConfig || !slotConfig.available) {
      if (!space) return null;
    }

    const label = space?.label || slotConfig?.label || 'Ad Space';
    const h = space?.height || slotConfig?.height || (variant === 'banner' ? 90 : 250);
    const w = space?.width || slotConfig?.width || 0;

    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-center transition-colors hover:border-primary/30 hover:bg-muted/30',
          className,
        )}
        style={{
          minHeight: h > 0 ? h : undefined,
          width: w > 0 ? w : '100%',
        }}
      >
        <Megaphone className="mb-1.5 h-5 w-5 text-muted-foreground/40" />
        <span className="px-2 text-[10px] font-medium text-muted-foreground/50">{label}</span>
        <span className="text-[9px] text-muted-foreground/30">Ad Space Available</span>
        {category && (
          <span className="mt-0.5 text-[9px] text-muted-foreground/20">Category: {category}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      {placement.target_url ? (
        <a
          href={placement.target_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full w-full"
          onClick={handleAdClick}
        >
          {placement.image_url ? (
            <div className="relative h-full w-full" style={{ minHeight: space?.height || 250 }}>
              <Image
                src={placement.image_url}
                alt={`${placement.business_name} advertisement`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/5 p-4 text-center">
              <div>
                <span className="text-sm font-semibold text-foreground">{placement.business_name}</span>
                <ExternalLink className="ml-1 inline h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
        </a>
      ) : (
        <>
          {placement.image_url ? (
            <div className="relative h-full w-full" style={{ minHeight: space?.height || 250 }}>
              <Image
                src={placement.image_url}
                alt={`${placement.business_name} advertisement`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/5 p-4 text-center">
              <span className="text-sm font-semibold text-foreground">{placement.business_name}</span>
            </div>
          )}
        </>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-1 top-1 rounded bg-background/60 p-0.5 text-muted-foreground hover:bg-background"
        aria-label="Close ad"
      >
        <X className="h-3 w-3" />
      </button>
      <span className="absolute bottom-1 left-1 rounded bg-background/60 px-1 text-[8px] text-muted-foreground/50">
        Ad
      </span>
    </div>
  );
}

export function AdSpaceSidebar({ page, category, className, adminPreview }: { page?: string; category?: string; className?: string; adminPreview?: boolean }) {
  const slot = category ? `${page}-sidebar-${category.toLowerCase().replace(/\s+/g, '-').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ğ/g, 'g')}` : `${page}-sidebar-all`;

  return (
    <div className={cn('space-y-4', className)}>
      <AdSpace slot={slot} page={page} category={category} variant="sidebar" adminPreview={adminPreview} />
    </div>
  );
}

export function AdSpaceInline({ page, index = 1, className }: { page?: string; index?: number; className?: string }) {
  const slot = `${page}-inline-${index}`;
  return (
    <AdSpace slot={slot} page={page} variant="inline" className={className} />
  );
}
