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
