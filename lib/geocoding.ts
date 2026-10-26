// OpenStreetMap Nominatim geocoding — mahalle/köy düzeyinde ileri ve geri geocoding.
// Türkiye ile sınırlandırılmıştır; offline DISTRICTS verisi olmadığında yedek olarak kullanılır.

export interface GeoPoint {
  lat: number;
  lng: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** "Nergis", "Karşıyaka, Çanakkale" gibi serbest metni koordinata çevirir. */
export async function geocodeForward(query: string): Promise<GeoPoint | null> {
  try {
    const url = `${NOMINATIM}/search?format=jsonv2&limit=1&countrycodes=tr&accept-language=tr&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0] as { lat?: string; lon?: string };
    const lat = parseFloat(first.lat ?? '');
    const lng = parseFloat(first.lon ?? '');
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** Koordinattan okunabilir adres etiketi üretir: "Mahalle, İlçe, İl". */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&accept-language=tr&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string | undefined> };
    const a = data.address;
    if (!a) return null;
    const parts: string[] = [];
    const push = (v?: string) => {
      if (v && !parts.some((p) => p.toLowerCase() === v.toLowerCase())) parts.push(v);
    };
    push(a.neighbourhood ?? a.quarter ?? a.suburb ?? a.village ?? a.hamlet);
    push(a.town ?? a.city ?? a.municipality);
    push(a.county ?? a.district);
    push(a.state ?? a.province);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}
