'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  LocateFixed,
  Plus,
  Minus,
  RotateCcw,
  X,
  Banknote,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { RADII, WAGE_UNIT_LABELS, MAP_CENTER, TURKEY_CITIES, CITY_COORDS } from '@/lib/constants';
import { searchPlaces } from '@/lib/turkey-districts';
import type { Job } from '@/lib/types';
import type { PlaceMatch } from '@/lib/turkey-districts';
import { cn, distanceKm } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import {
  TURKEY_PROVINCES,
  PROVINCE_CENTROIDS,
  TR_MAP_VIEWBOX,
  TR_MAP_GEO,
  PIXELS_PER_DEG_LAT,
  latLngToMapPixel,
  mapPixelToLatLng,
} from './turkey-map-data';

interface JobMapViewProps {
  jobs: Job[];
  selectedRadius: number;
  onRadiusChange: (r: number) => void;
  centerLat: number;
  centerLng: number;
  onCenterChange: (lat: number, lng: number) => void;
  onJobSelect?: (job: Job) => void;
  onApply?: (job: Job) => void;
  selectedJobId?: string | null;
}

const MIN_ZOOM = 100;
const MAX_ZOOM = 400;
const ZOOM_FACTOR = 1.3;
const CLICK_SLOP_PX = 6;

export function JobMapView({
  jobs,
  selectedRadius,
  onRadiusChange,
  centerLat,
  centerLng,
  onCenterChange,
  onJobSelect,
  onApply,
  selectedJobId,
}: JobMapViewProps) {
  const { t } = useI18n();
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);
  const [popupJob, setPopupJob] = useState<Job | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceMatch[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [locating, setLocating] = useState(false);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const dragRef = useRef({ down: false, moved: false, lastX: 0, lastY: 0, startX: 0, startY: 0 });
  const suppressClickRef = useRef(false);
  const pinchRef = useRef<{ dist: number; zoom: number; vx: number; vy: number } | null>(null);
  const transformRef = useRef({ zoom, pan });
  transformRef.current = { zoom, pan };

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setAreaSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const center = latLngToMapPixel(centerLat, centerLng);
  // 111 km per degree latitude; longitude degrees are shorter, so the circle is
  // drawn as an ellipse using the mercator x-scale at the center latitude
  const radiusKm = selectedRadius;
  const radiusY = radiusKm / 111 * PIXELS_PER_DEG_LAT;
  const kmPerDegLng = 111 * Math.cos((centerLat * Math.PI) / 180);
  const scaleX = TR_MAP_VIEWBOX.width / (TR_MAP_GEO.maxLng - TR_MAP_GEO.minLng);
  const radiusX = kmPerDegLng > 0 ? radiusKm / kmPerDegLng * scaleX : radiusY;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const dist = distanceKm(centerLat, centerLng, job.latitude, job.longitude);
      return dist <= selectedRadius;
    });
  }, [jobs, centerLat, centerLng, selectedRadius]);

  // Provinces highlighted once the user actively sets a search center;
  // the untouched default center keeps the whole map neutral
  const inRangeProvinces = useMemo(() => {
    const set = new Set<string>();
    const hasActiveCenter =
      Math.abs(centerLat - MAP_CENTER.lat) > 0.01 || Math.abs(centerLng - MAP_CENTER.lng) > 0.01;
    if (!hasActiveCenter) return set;
    for (const [title, c] of Object.entries(PROVINCE_CENTROIDS)) {
      if (distanceKm(centerLat, centerLng, c.lat, c.lng) <= selectedRadius) {
        set.add(title);
      }
    }
    return set;
  }, [centerLat, centerLng, selectedRadius]);

  const popupJobDist = popupJob
    ? Math.round(distanceKm(centerLat, centerLng, popupJob.latitude, popupJob.longitude))
    : 0;

  // Letterbox fit: the wide Turkey viewBox is centered inside the taller
  // container. All pointer math must go through this or taps land wrong.
  const fit =
    areaSize.width > 0
      ? Math.min(areaSize.width / TR_MAP_VIEWBOX.width, areaSize.height / TR_MAP_VIEWBOX.height)
      : 0;
  const mapScale = zoom / 100;

  const containerToVb = useCallback(
    (px: number, py: number) => {
      if (fit <= 0) return { x: TR_MAP_VIEWBOX.width / 2, y: TR_MAP_VIEWBOX.height / 2 };
      return {
        x: (px - areaSize.width / 2 - pan.x) / (fit * mapScale) + TR_MAP_VIEWBOX.width / 2,
        y: (py - areaSize.height / 2 - pan.y) / (fit * mapScale) + TR_MAP_VIEWBOX.height / 2,
      };
    },
    [areaSize, fit, mapScale, pan.x, pan.y],
  );

  const vbToContainer = useCallback(
    (vx: number, vy: number) => {
      if (fit <= 0) return { x: areaSize.width / 2, y: areaSize.height / 2 };
      return {
        x: areaSize.width / 2 + (vx - TR_MAP_VIEWBOX.width / 2) * fit * mapScale + pan.x,
        y: areaSize.height / 2 + (vy - TR_MAP_VIEWBOX.height / 2) * fit * mapScale + pan.y,
      };
    },
    [areaSize, fit, mapScale, pan.x, pan.y],
  );

  const clampPan = useCallback(
    (x: number, y: number, s: number, f: number): { x: number; y: number } => {
      const maxX = (TR_MAP_VIEWBOX.width * f * (s - 1)) / 2;
      const maxY = (TR_MAP_VIEWBOX.height * f * (s - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [],
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const q = query.toLowerCase().trim();
    const matches = searchPlaces(q, TURKEY_CITIES, CITY_COORDS, 7);
    setSearchResults(matches);
    setShowResults(true);
  };

  const selectPlace = (place: PlaceMatch) => {
    onCenterChange(place.lat, place.lng);
    setPan({ x: 0, y: 0 });
    setSearchQuery(place.label);
    setShowResults(false);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearestCity = '';
        let minDist = Infinity;
        for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
          const d = Math.sqrt((coords.lat - latitude) ** 2 + (coords.lng - longitude) ** 2);
          if (d < minDist) {
            minDist = d;
            nearestCity = cityName;
          }
        }
        if (nearestCity) {
          const coords = CITY_COORDS[nearestCity];
          if (coords) {
            onCenterChange(coords.lat, coords.lng);
            setPan({ x: 0, y: 0 });
            setSearchQuery(nearestCity);
          }
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (fit <= 0) return;
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const vb = containerToVb(e.clientX - rect.left, e.clientY - rect.top);
      const { lat, lng } = mapPixelToLatLng(vb.x, vb.y);
      onCenterChange(lat, lng);
      setPopupJob(null);
    },
    [containerToVb, fit, onCenterChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    suppressClickRef.current = false;
    dragRef.current = { down: true, moved: false, lastX: e.clientX, lastY: e.clientY, startX: e.clientX, startY: e.clientY };
    try {
      areaRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // capture unavailable — drag still works within the container
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.down) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < CLICK_SLOP_PX) return;
    d.moved = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    setPanning(true);
    setPan((p) => clampPan(p.x + dx, p.y + dy, mapScale, fit));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.down) return;
    d.down = false;
    setPanning(false);
    if (d.moved) {
      suppressClickRef.current = true;
      try {
        areaRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // pointer may already be released
      }
    }
  };


  const zoomAtContainerPoint = useCallback(
    (px: number, py: number, factor: number) => {
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect || fit <= 0) return;
      const { zoom: z, pan: p } = transformRef.current;
      const s = z / 100;
      const f = Math.min(rect.width / TR_MAP_VIEWBOX.width, rect.height / TR_MAP_VIEWBOX.height);
      const vx = (px - rect.width / 2 - p.x) / (f * s) + TR_MAP_VIEWBOX.width / 2;
      const vy = (py - rect.height / 2 - p.y) / (f * s) + TR_MAP_VIEWBOX.height / 2;
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
      const ns = nz / 100;
      const next = clampPan(
        px - rect.width / 2 - (vx - TR_MAP_VIEWBOX.width / 2) * f * ns,
        py - rect.height / 2 - (vy - TR_MAP_VIEWBOX.height / 2) * f * ns,
        ns,
        f,
      );
      setZoom(nz);
      setPan(next);
    },
    [clampPan, fit],
  );

  const zoomIn = () => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect) zoomAtContainerPoint(rect.width / 2, rect.height / 2, ZOOM_FACTOR);
  };
  const zoomOut = () => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect) zoomAtContainerPoint(rect.width / 2, rect.height / 2, 1 / ZOOM_FACTOR);
  };
  const resetView = () => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setPopupJob(null);
    onCenterChange(MAP_CENTER.lat, MAP_CENTER.lng);
  };

  // Wheel zoom (desktop) — native listener so preventDefault works
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAtContainerPoint(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAtContainerPoint]);

  // Pinch zoom (touch) — native listeners so preventDefault works
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;

    const touchDist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) {
        pinchRef.current = null;
        return;
      }
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const { zoom: z, pan: p } = transformRef.current;
      const s = z / 100;
      const f = Math.min(rect.width / TR_MAP_VIEWBOX.width, rect.height / TR_MAP_VIEWBOX.height);
      pinchRef.current = {
        dist: touchDist(e.touches),
        zoom: z,
        vx: (midX - rect.width / 2 - p.x) / (f * s) + TR_MAP_VIEWBOX.width / 2,
        vy: (midY - rect.height / 2 - p.y) / (f * s) + TR_MAP_VIEWBOX.height / 2,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = pinchRef.current;
      if (!g || e.touches.length !== 2) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const nz = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, g.zoom * (touchDist(e.touches) / g.dist)));
      const ns = nz / 100;
      const f = Math.min(rect.width / TR_MAP_VIEWBOX.width, rect.height / TR_MAP_VIEWBOX.height);
      const next = clampPan(
        midX - rect.width / 2 - (g.vx - TR_MAP_VIEWBOX.width / 2) * f * ns,
        midY - rect.height / 2 - (g.vy - TR_MAP_VIEWBOX.height / 2) * f * ns,
        ns,
        f,
      );
      setZoom(nz);
      setPan(next);
    };

    const onTouchEnd = () => {
      pinchRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [clampPan]);

  const zoomControls = (
    <>
      <button
        type="button"
        onClick={zoomOut}
        disabled={zoom <= MIN_ZOOM}
        aria-label={t('jobs.mapZoomOut')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-11 text-center text-[11px] font-semibold tabular-nums text-foreground">
        {Math.round(zoom)}%
      </span>
      <button
        type="button"
        onClick={zoomIn}
        disabled={zoom >= MAX_ZOOM}
        aria-label={t('jobs.mapZoomIn')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={resetView}
        aria-label={t('jobs.mapReset')}
        title={t('jobs.mapReset')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </>
  );

  return (
    <div className="space-y-3">
      {/* Şehir/Adres Arama */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => showResults && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder={t('jobs.searchCity')}
            className="h-11 w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg animate-fade-in">
              {searchResults.map((place) => (
                <button
                  key={`${place.kind}-${place.label}`}
                  onMouseDown={() => selectPlace(place)}
                  className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-secondary" />
                  <span className="truncate">{place.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Yarıçap seçici */}
      <div className="flex flex-wrap items-center gap-2">
        <Navigation className="h-4 w-4 shrink-0 text-secondary" />
        <span className="text-sm font-semibold text-foreground">{t('jobs.radius')}:</span>
        <div className="flex flex-wrap gap-2">
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                selectedRadius === r
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40'
              )}
            >
              {r} km
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {t('jobs.jobsCount', { count: filteredJobs.length })}
        </span>
      </div>

      {/* Harita Kartı (Figma) */}
      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        {/* Kart başlığı */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{t('jobs.mapTitle')}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t('jobs.mapJobCount', { count: filteredJobs.length })}
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              aria-label={t('jobs.mapLocate')}
              title={t('jobs.mapLocate')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            </button>
            <div className="mx-0.5 flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5">
              {zoomControls}
            </div>
          </div>
        </div>

        {/* Harita alanı */}
        <div
          ref={areaRef}
          className={cn(
            'relative h-[320px] w-full cursor-crosshair touch-none select-none overflow-hidden bg-muted/40 sm:h-[420px] lg:h-[500px]',
            panning && 'cursor-grabbing',
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          onClick={handleMapClick}
        >
          <svg
            className="absolute inset-0 h-full w-full origin-center"
            viewBox={`0 0 ${TR_MAP_VIEWBOX.width} ${TR_MAP_VIEWBOX.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${mapScale})`,
              willChange: 'transform',
            }}
          >
              {/* İller — nötr tema dolgusu, yarıçap içindekiler primary */}
              {TURKEY_PROVINCES.map((p) => {
                const inRange = inRangeProvinces.has(p.title);
                return (
                  <path
                    key={p.id}
                    d={p.d}
                    className={cn(
                      'transition-[fill] duration-500 hover:opacity-80',
                      inRange ? 'fill-primary' : 'fill-secondary-lighter dark:fill-secondary-lighter/60'
                    )}
                    stroke="hsl(var(--card))"
                    strokeWidth="0.9"
                  />
                );
              })}

              {/* Yarıçap dairesi */}
              <ellipse
                cx={center.x}
                cy={center.y}
                rx={radiusX}
                ry={radiusY}
                className="fill-primary/10 stroke-primary"
                strokeWidth="1.2"
                strokeDasharray="3,2"
                fillOpacity="0.15"
              />

              {/* Merkez noktası */}
              <circle cx={center.x} cy={center.y} r="2.4" className="fill-primary stroke-card" strokeWidth="0.8" />
              <circle cx={center.x} cy={center.y} r="3.2" className="fill-none stroke-primary" strokeWidth="0.6" opacity="0.5">
                <animate attributeName="r" from="2.4" to="8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* İş işaretleri */}
              {jobs.map((job) => {
                const { x, y } = latLngToMapPixel(job.latitude, job.longitude);
                const inRange = filteredJobs.some((j) => j.id === job.id);
                const isSelected = selectedJobId === job.id || popupJob?.id === job.id;
                const isHovered = hoveredJob === job.id;
                return (
                  <g key={job.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 4.4 : isHovered ? 4 : 3.2}
                      className={cn(
                        'cursor-pointer transition-all',
                        inRange
                          ? 'fill-[#D9A441] stroke-background'
                          : 'fill-muted-foreground stroke-background',
                      )}
                      strokeWidth="1"
                      strokeOpacity={inRange ? 1 : 0.55}
                      onMouseEnter={() => setHoveredJob(job.id)}
                      onMouseLeave={() => setHoveredJob(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        setPopupJob(job);
                        onJobSelect?.(job);
                      }}
                    />
                    {(isHovered || isSelected) && (
                      <circle cx={x} cy={y} r="6.5" className="fill-none stroke-[#B8860B]" strokeWidth="0.7" opacity="0.6" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Pop-up: harita alanına göre konumlanır, zoom + pan hesaba katılır */}
          {popupJob && fit > 0 && (() => {
            const f = latLngToMapPixel(popupJob.latitude, popupJob.longitude);
            const pos = vbToContainer(f.x, f.y);
            const leftPct = Math.min(Math.max((pos.x / areaSize.width) * 100, 18), 82);
            const topPct = Math.min(Math.max((pos.y / areaSize.height) * 100, 18), 78);
            return (
            <div
              className="pointer-events-auto absolute z-30 w-56 overflow-hidden rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur animate-fade-in"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: 'translate(-50%, -110%)',
              }}
            >
              <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
                <p className="line-clamp-1 text-sm font-bold text-foreground">{popupJob.title}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setPopupJob(null); }}
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t('jobs.mapClose')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 px-3 py-2 text-xs">
                <p className="font-medium text-secondary">{popupJob.farm_name}</p>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{popupJob.location}</span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                    ~{popupJobDist} km
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Banknote className="h-3 w-3 shrink-0" />
                  ₺{popupJob.wage.toLocaleString('tr-TR')}/{WAGE_UNIT_LABELS[popupJob.wage_unit] || popupJob.wage_unit}
                </div>
              </div>
              <div className="flex gap-1.5 px-3 pb-2.5">
                <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={(e) => { e.stopPropagation(); onJobSelect?.(popupJob); }}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  {t('job.details')}
                </Button>
                {onApply && popupJob.status !== 'closed' && (
                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={(e) => { e.stopPropagation(); onApply(popupJob); }}>
                    {t('job.apply')}
                  </Button>
                )}
              </div>
            </div>
            );
          })()}

          {/* Üst sol bilgi çipi */}
          <div className="absolute left-3 top-3 z-10 hidden max-w-[70%] items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur sm:flex">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            {t('jobs.clickHint')}
          </div>

          {/* Alt sol lejant (frosted) */}
          <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow backdrop-blur">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-[#D9A441]" />
              <span className="text-muted-foreground">{t('jobs.inRange')}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-secondary-lighter" />
              <span className="text-muted-foreground">{t('jobs.outOfRange')}</span>
            </div>
          </div>

          {/* Mobil yüzen kontroller — başlık çubuğu kontrolleri sm+ ekranlarda görünür */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/95 p-1 shadow-lg backdrop-blur sm:hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleLocate(); }}
              disabled={locating}
              aria-label={t('jobs.mapLocate')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); zoomIn(); }}
              disabled={zoom >= MAX_ZOOM}
              aria-label={t('jobs.mapZoomIn')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); zoomOut(); }}
              disabled={zoom <= MIN_ZOOM}
              aria-label={t('jobs.mapZoomOut')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); resetView(); }}
              aria-label={t('jobs.mapReset')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
