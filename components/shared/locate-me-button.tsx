'use client';

import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CITY_COORDS } from '@/lib/constants';
import { reverseGeocode } from '@/lib/geocoding';
import { useI18n } from '@/components/i18n-provider';

interface LocateMeButtonProps {
  onLocate: (city: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function LocateMeButton({ onLocate, className, size = 'md', showLabel = true }: LocateMeButtonProps) {
  const { t } = useI18n();
  const [detecting, setDetecting] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse-geocode to a real neighborhood-level address; fall back to the nearest province.
        let placed = false;
        try {
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            onLocate(address);
            placed = true;
          }
        } catch {
          // fall through to nearest-city fallback
        }
        if (!placed) {
          let nearestCity = '';
          let minDist = Infinity;
          for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
            const dist = Math.sqrt(
              (coords.lat - latitude) ** 2 + (coords.lng - longitude) ** 2
            );
            if (dist < minDist) {
              minDist = dist;
              nearestCity = cityName;
            }
          }
          if (nearestCity) onLocate(nearestCity);
        }
        setDetecting(false);
      },
      () => setDetecting(false),
      { timeout: 10000 }
    );
  };

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-sm',
  };

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={detecting}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary disabled:opacity-60',
        sizeClasses[size],
        className
      )}
      title={t('locateMe.title')}
    >
      {detecting ? (
        <Loader2 className={cn(iconSize, 'animate-spin')} />
      ) : (
        <LocateFixed className={iconSize} />
      )}
      {showLabel && (
        <span className="hidden sm:inline">
          {detecting ? t('locateMe.detecting') : t('locateMe.title')}
        </span>
      )}
    </button>
  );
}
