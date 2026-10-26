import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const KM_PER_DEG_LAT = 111;
const KM_PER_DEG_LNG = 85;

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * KM_PER_DEG_LAT;
  const dLng = (lng2 - lng1) * KM_PER_DEG_LNG;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export function formatWageRange(
  wageMin: number | null | undefined,
  wageMax: number | null | undefined,
  wage: number | null | undefined,
  unitLabel: string,
): string | null {
  const min = wageMin ?? null;
  const max = wageMax ?? null;
  const legacy = wage && wage > 0 ? wage : null;

  if (min && max) {
    if (min === max) return `₺${min.toLocaleString('tr-TR')}/${unitLabel}`;
    return `₺${min.toLocaleString('tr-TR')} - ₺${max.toLocaleString('tr-TR')}/${unitLabel}`;
  }
  if (min && !max) return `₺${min.toLocaleString('tr-TR')}/${unitLabel}`;
  if (!min && max) return `₺${max.toLocaleString('tr-TR')}/${unitLabel}`;
  if (legacy) return `₺${legacy.toLocaleString('tr-TR')}/${unitLabel}`;
  return null;
}

export function effectiveWage(
  wageMin: number | null | undefined,
  wageMax: number | null | undefined,
  wage: number | null | undefined,
): number {
  const min = wageMin ?? null;
  const max = wageMax ?? null;
  const legacy = wage && wage > 0 ? wage : null;
  return min ?? max ?? legacy ?? 0;
}

export function getJobTranslatedField(
  job: any,
  baseField: 'title' | 'description' | 'location' | 'requirements',
  locale: string,
): string | string[] {
  const language = (job.language as string) || 'tr';
  const localeKey = `${baseField}_${locale}`;
  const originalKey = `${baseField}_${language}`;
  const translated = job[localeKey];
  if (translated != null) return translated as string | string[];
  const originalLang = job[originalKey];
  if (originalLang != null) return originalLang as string | string[];
  return (job[baseField] ?? '') as string | string[];
}
