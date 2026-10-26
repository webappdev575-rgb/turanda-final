'use client';

import { useEffect, useState } from 'react';

export interface WeatherData {
  current: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_sum: number[];
  };
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

const weatherDescriptions: Record<number, { en: string; tr: string; ar: string }> = {
  0: { en: 'Clear sky', tr: 'Açık gökyüzü', ar: 'سماء صافية' },
  1: { en: 'Mainly clear', tr: 'Çoğunlukla açık', ar: 'صافٍ غالباً' },
  2: { en: 'Partly cloudy', tr: 'Parçalı bulutlu', ar: 'غائم جزئياً' },
  3: { en: 'Overcast', tr: 'Kapalı', ar: 'غائم' },
  45: { en: 'Fog', tr: 'Sisli', ar: 'ضباب' },
  48: { en: 'Rime fog', tr: 'Kırağı sis', ar: 'ضباب جليدي' },
  51: { en: 'Light drizzle', tr: 'Hafif çisenti', ar: 'رذاذ خفيف' },
  53: { en: 'Drizzle', tr: 'Çisenti', ar: 'رذاذ' },
  55: { en: 'Dense drizzle', tr: 'Yoğun çisenti', ar: 'رذاذ كثيف' },
  61: { en: 'Slight rain', tr: 'Hafif yağmur', ar: 'مطر خفيف' },
  63: { en: 'Rain', tr: 'Yağmur', ar: 'مطر' },
  65: { en: 'Heavy rain', tr: 'Şiddetli yağmur', ar: 'مطر غزير' },
  71: { en: 'Slight snow', tr: 'Hafif kar', ar: 'ثلج خفيف' },
  73: { en: 'Snow', tr: 'Kar', ar: 'ثلج' },
  75: { en: 'Heavy snow', tr: 'Yoğun kar', ar: 'ثلج كثيف' },
  80: { en: 'Rain showers', tr: 'Sağanak yağmur', ar: 'زخات مطر' },
  81: { en: 'Heavy showers', tr: 'Şiddetli sağanak', ar: 'زخات غزيرة' },
  95: { en: 'Thunderstorm', tr: 'Gök gürültülü fırtına', ar: 'عاصفة رعدية' },
  96: { en: 'Thunderstorm + hail', tr: 'Dolu ile fırtına', ar: 'عاصفة مع برد' },
};

export function getWeatherDescription(code: number, locale: string): string {
  const desc = weatherDescriptions[code];
  if (!desc) return weatherDescriptions[1][locale as 'en' | 'tr' | 'ar'] || weatherDescriptions[1].en;
  return desc[locale as 'en' | 'tr' | 'ar'] || desc.en;
}

export function useWeather(lat?: number, lng?: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setWeather(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`;
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();

        let locationName = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        try {
          const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=tr`;
          const geoRes = await fetch(geoUrl, { signal });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address ?? {};
            locationName = addr.city || addr.town || addr.village || addr.county || addr.state || locationName;
          }
        } catch { /* reverse geocoding is optional */ }

        if (signal.aborted) return;
        setWeather({
          current: {
            temperature: data.current?.temperature_2m ?? 0,
            windspeed: data.current?.wind_speed_10m ?? 0,
            weathercode: data.current?.weather_code ?? 0,
            is_day: data.current?.is_day ?? 1,
            time: data.current?.time ?? '',
          },
          daily: {
            time: data.daily?.time ?? [],
            temperature_2m_max: data.daily?.temperature_2m_max ?? [],
            temperature_2m_min: data.daily?.temperature_2m_min ?? [],
            weathercode: data.daily?.weather_code ?? [],
            precipitation_sum: data.daily?.precipitation_sum ?? [],
          },
          location: { name: locationName, latitude: lat, longitude: lng },
        });
      } catch (err) {
        if (signal.aborted) return;
        setWeather(null);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchWeather();
    return () => controller.abort();
  }, [lat, lng]);

  return { weather, loading, error };
}
