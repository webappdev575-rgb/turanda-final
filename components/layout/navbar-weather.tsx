'use client';

import { useMemo, useState } from 'react';
import { Cloud, CloudRain, CloudSun, Sun, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { useWeather, getWeatherDescription } from '@/hooks/use-weather';
import { CITY_COORDS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const weatherIcons: Record<number, React.ComponentType<{ className?: string }>> = {
  0: Sun, 1: Sun, 2: CloudSun, 3: Cloud, 45: Cloud, 48: Cloud,
  51: CloudRain, 53: CloudRain, 55: CloudRain, 61: CloudRain, 63: CloudRain,
  65: CloudRain, 71: CloudRain, 73: CloudRain, 75: CloudRain,
  80: CloudRain, 81: CloudRain, 95: CloudRain, 96: CloudRain,
};

export function NavbarWeatherWidget({ className }: { className?: string }) {
  const { profile } = useAuth();
  const { t, locale } = useI18n();
  const [showPopover, setShowPopover] = useState(false);

  const coords = useMemo(() => {
    if (profile?.weather_location && CITY_COORDS[profile.weather_location]) {
      return CITY_COORDS[profile.weather_location];
    }
    if (profile?.latitude && profile?.longitude) {
      return { lat: profile.latitude, lng: profile.longitude };
    }
    if (profile?.city && CITY_COORDS[profile.city]) {
      return CITY_COORDS[profile.city];
    }
    return null;
  }, [profile]);

  const { weather, loading } = useWeather(coords?.lat, coords?.lng);

  if (!coords || loading || !weather) {
    if (loading && coords) {
      return (
        <div className={cn('hidden items-center gap-1.5 md:flex', className)}>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  const temp = Math.round(weather.current.temperature);
  const Icon = weatherIcons[weather.current.weathercode] || CloudSun;
  const desc = getWeatherDescription(weather.current.weathercode, locale);

  return (
    <div
      className={cn('relative hidden items-center gap-1.5 md:flex', className)}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted">
        <Icon className="h-4 w-4 text-secondary" />
        <span className="font-medium text-foreground">{temp}°</span>
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="max-w-[80px] truncate text-xs text-muted-foreground">{weather.location.name}</span>
      </div>

      {showPopover && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-popover p-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{temp}°C</p>
              <p className="text-[10px] text-muted-foreground">{weather.location.name}</p>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{desc}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {t('dash.weatherWind')}: {Math.round(weather.current.windspeed)} km/h
          </p>
        </div>
      )}
    </div>
  );
}
