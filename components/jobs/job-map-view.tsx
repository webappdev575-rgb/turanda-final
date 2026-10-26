'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
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
import { WAGE_UNIT_LABELS, MAP_CENTER, TURKEY_CITIES, CITY_COORDS } from '@/lib/constants';
import { searchPlaces } from '@/lib/turkey-districts';
import { reverseGeocode } from '@/lib/geocoding';
import type { Job } from '@/lib/types';
import type { PlaceMatch } from '@/lib/turkey-districts';
import { cn, distanceKm } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

// Fix default Leaflet marker icon paths (we use circle markers, but keep this safe)
delete (L.Icon.Default.prototype as any)._getIconUrl;

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

// ---- Theme-aware style helpers ---------------------------------------------

function themeStyles(isDark: boolean) {
  return {
    province: isDark
      ? { fillColor: '#1e3a2f', color: '#2E7D4F', weight: 0.8, fillOpacity: 0.55 }
      : { fillColor: '#d4e8d4', color: '#2E7D4F', weight: 1, fillOpacity: 0.5 },
    provinceInRange: isDark
      ? { fillColor: '#14563D', color: '#1a6b48', weight: 1.4, fillOpacity: 0.8 }
      : { fillColor: '#14563D', color: '#0d3f2b', weight: 1.4, fillOpacity: 0.6 },
    provinceHover: isDark
      ? { fillColor: '#2E7D4F', color: '#3a9a62', weight: 1.6, fillOpacity: 0.7 }
      : { fillColor: '#a8d5a8', color: '#1a6b48', weight: 1.6, fillOpacity: 0.7 },
    radiusCircle: isDark
      ? { color: '#1a8a55', weight: 1.5, dashArray: '5,4', fillColor: '#14563D', fillOpacity: 0.08 }
      : { color: '#14563D', weight: 1.5, dashArray: '5,4', fillColor: '#14563D', fillOpacity: 0.08 },
    tooltip: isDark
      ? { backgroundColor: '#1a2a22', textColor: '#f0ead6', borderColor: '#2E7D4F' }
      : { backgroundColor: '#ffffff', textColor: '#1a3a28', borderColor: '#2E7D4F' },
    markerInRange: '#D9A441',
    markerOutOfRange: isDark ? '#6b7280' : '#9ca3af',
    markerRing: '#B8860B',
  };
}

// ---- Leaflet map component --------------------------------------------------

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [hoveredJob, setHoveredJob] = useState<string | null>(null);
  const [popupJob, setPopupJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceMatch[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const centerMarkerRef = useRef<L.CircleMarker | null>(null);
  const jobMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const provinceLayersRef = useRef<L.Layer[]>([]);
  const provinceLabelsRef = useRef<L.LayerGroup | null>(null);
  const inRangeProvincesRef = useRef<Set<string>>(new Set());
  const suppressMouseUpRef = useRef(false);

  // ---- Derived data ----
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const dist = distanceKm(centerLat, centerLng, job.latitude, job.longitude);
      return dist <= selectedRadius;
    });
  }, [jobs, centerLat, centerLng, selectedRadius]);

  const inRangeProvinces = useMemo(() => {
    const set = new Set<string>();
    const hasActiveCenter =
      Math.abs(centerLat - MAP_CENTER.lat) > 0.01 || Math.abs(centerLng - MAP_CENTER.lng) > 0.01;
    if (!hasActiveCenter) return set;
    for (const [name, c] of Object.entries(PROVINCE_CENTROIDS)) {
      if (distanceKm(centerLat, centerLng, c.lat, c.lng) <= selectedRadius) {
        set.add(name);
      }
    }
    return set;
  }, [centerLat, centerLng, selectedRadius]);

  // Keep a ref copy so Leaflet event handlers (which are bound once) can read it
  inRangeProvincesRef.current = inRangeProvinces;

  const popupJobDist = popupJob
    ? Math.round(distanceKm(centerLat, centerLng, popupJob.latitude, popupJob.longitude))
    : 0;

  // ---- Initialize the Leaflet map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 6,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    // Use explicit panes so province artwork, labels, and job markers never overlap incorrectly.
    map.createPane('provincePane').style.zIndex = '400';
    map.createPane('radiusPane').style.zIndex = '450';
    map.createPane('provinceLabelPane').style.zIndex = '500';
    map.createPane('jobPane').style.zIndex = '600';

    // The province boundary data is the map surface. Omitting global tiles keeps neighboring countries hidden.
    // Add zoom control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Load GeoJSON province boundaries
    fetch('/turkey-provinces.geojson')
      .then((r) => r.json())
      .then((data) => {
        const s = themeStyles(isDark);
        const geo = L.geoJSON(data, {
          pane: 'provincePane',
          style: () => ({ ...s.province }),
          onEachFeature: (feature, layer) => {
            const name = feature.properties?.name ?? '';
            const baseStyle = { ...s.province };
            const hoverStyle = { ...s.provinceHover };
            const inRangeStyle = { ...s.provinceInRange };

            layer.bindTooltip(name, {
              sticky: true,
              direction: 'top',
              className: 'tr-map-tooltip',
              opacity: 1,
            });

            const layerPath = layer as L.Path;
            layer.on({
              mouseover: () => {
                const inRange = inRangeProvincesRef.current.has(name);
                layerPath.setStyle(inRange ? { ...hoverStyle, fillColor: s.provinceInRange.fillColor } : hoverStyle);
              },
              mouseout: () => {
                const inRange = inRangeProvincesRef.current.has(name);
                layerPath.setStyle(inRange ? inRangeStyle : baseStyle);
              },
              click: () => {
                // Close the tooltip so the province name box doesn't linger
                layer.closeTooltip();
              },
            });

            provinceLayersRef.current.push(layer);
          },
        }).addTo(map);
        geoJsonRef.current = geo;
        // Add persistent, high-contrast province labels inside Türkiye.
        const labels = L.layerGroup([], { pane: 'provinceLabelPane' }).addTo(map);
        for (const [name, coords] of Object.entries(PROVINCE_CENTROIDS)) {
          L.marker([coords.lat, coords.lng], {
            pane: 'provinceLabelPane',
            interactive: false,
            icon: L.divIcon({
              className: 'tr-province-label',
              html: `<span>${name}</span>`,
              iconSize: undefined,
            }),
          }).addTo(labels);
        }
        provinceLabelsRef.current = labels;
        map.fitBounds(geo.getBounds(), { padding: [20, 20] });
        map.setMaxBounds(geo.getBounds().pad(0.08));
      })
      .catch(() => setGeoError('Map boundaries could not be loaded. Please refresh the page.'));

    // Map click → set search center and resolve the selected city, district, and neighborhood.
    const syncSearchLocation = async (lat: number, lng: number) => {
      const label = await reverseGeocode(lat, lng);
      if (label) {
        setSearchQuery(label);
        return;
      }
      let nearestCity = 'Türkiye';
      let nearestDistance = Infinity;
      for (const [city, coords] of Object.entries(CITY_COORDS)) {
        const distance = Math.hypot(coords.lat - lat, coords.lng - lng);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCity = city;
        }
      }
      setSearchQuery(nearestCity);
    };

    // Map click → set search center (distinguishes click from drag via move threshold)
    let mouseDownPos: { x: number; y: number } | null = null;
    map.on('mousedown', (e: L.LeafletMouseEvent) => {
      mouseDownPos = { x: e.containerPoint.x, y: e.containerPoint.y };
      suppressMouseUpRef.current = false;
    });
    map.on('mouseup', (e: L.LeafletMouseEvent) => {
      if (!mouseDownPos) return;
      const moved = Math.hypot(
        e.containerPoint.x - mouseDownPos.x,
        e.containerPoint.y - mouseDownPos.y,
      );
      mouseDownPos = null;
      // Close any lingering province tooltips on click/drag
      provinceLayersRef.current.forEach((layer) => {
        (layer as L.Layer & { closeTooltip: () => void }).closeTooltip();
      });
      if (suppressMouseUpRef.current) {
        suppressMouseUpRef.current = false;
        return;
      }
      // If the user barely moved, treat as a click → set center.
      // If they dragged a meaningful distance, set center where they released.
      if (moved < 5) {
        onCenterChange(e.latlng.lat, e.latlng.lng);
        setPopupJob(null);
        void syncSearchLocation(e.latlng.lat, e.latlng.lng);
      } else {
        // After a drag, set the center at the release point so the radius
        // search updates to wherever the user let go.
        onCenterChange(e.latlng.lat, e.latlng.lng);
        setPopupJob(null);
        void syncSearchLocation(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      geoJsonRef.current = null;
      radiusCircleRef.current = null;
      centerMarkerRef.current = null;
      provinceLabelsRef.current = null;
      jobMarkersRef.current.clear();
      provinceLayersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Swap tile layer + restyle provinces when theme changes ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const s = themeStyles(isDark);
    for (const layer of provinceLayersRef.current) {
      const pathLayer = layer as L.Path;
      const name = (pathLayer as L.Path & { feature?: { properties?: { name?: string } } }).feature?.properties?.name ?? '';
      const inRange = inRangeProvincesRef.current.has(name);
      pathLayer.setStyle(inRange ? { ...s.provinceInRange } : { ...s.province });
      // Keep provinces below job markers after restyle
      pathLayer.bringToBack();
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setStyle(s.radiusCircle);
    }
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setStyle({ color: '#14563D', fillColor: '#14563D', fillOpacity: 1 });
    }
    jobMarkersRef.current.forEach((marker, jobId) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      const inRange = filteredJobs.some((j) => j.id === job.id);
      marker.setStyle({ fillColor: inRange ? s.markerInRange : s.markerOutOfRange });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // ---- Update province highlighting when radius/center changes ----
  useEffect(() => {
    const s = themeStyles(isDark);
    for (const layer of provinceLayersRef.current) {
      const pathLayer = layer as L.Path;
      const name = (pathLayer as L.Path & { feature?: { properties?: { name?: string } } }).feature?.properties?.name ?? '';
      const inRange = inRangeProvinces.has(name);
      pathLayer.setStyle(inRange ? { ...s.provinceInRange } : { ...s.province });
      pathLayer.bringToBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRangeProvinces]);

  // ---- Draw / move the radius circle + center marker ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const s = themeStyles(isDark);

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle([centerLat, centerLng], {
        pane: 'radiusPane',
        radius: selectedRadius * 1000,
        ...s.radiusCircle,
      }).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng([centerLat, centerLng]);
      radiusCircleRef.current.setRadius(selectedRadius * 1000);
      radiusCircleRef.current.setStyle(s.radiusCircle);
    }

    if (!centerMarkerRef.current) {
      centerMarkerRef.current = L.circleMarker([centerLat, centerLng], {
        radius: 5,
        color: '#14563D',
        fillColor: '#14563D',
        fillOpacity: 1,
        weight: 1.5,
      }).addTo(map);
    } else {
      centerMarkerRef.current.setLatLng([centerLat, centerLng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, selectedRadius, isDark]);

  // ---- Draw / update job markers ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const s = themeStyles(isDark);

    const currentIds = new Set<string>();
    for (const job of jobs) {
      currentIds.add(job.id);
      const inRange = filteredJobs.some((j) => j.id === job.id);
      const isSelected = selectedJobId === job.id || popupJob?.id === job.id;
      const isHovered = hoveredJob === job.id;
      const radius = isSelected ? 8 : isHovered ? 7 : 5.5;

      let marker = jobMarkersRef.current.get(job.id);
      if (!marker) {
        marker = L.circleMarker([job.latitude, job.longitude], {
          radius,
          color: '#fff',
          weight: 1.2,
          pane: 'jobPane',
          fillColor: inRange ? s.markerInRange : s.markerOutOfRange,
          fillOpacity: 1,
        }).addTo(map);

        marker.on('mouseover', () => setHoveredJob(job.id));
        marker.on('mouseout', () => setHoveredJob(null));
        marker.on('mousedown', () => { suppressMouseUpRef.current = true; });
        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setPopupJob(job);
          onJobSelect?.(job);
        });
        jobMarkersRef.current.set(job.id, marker);
      } else {
        marker.setLatLng([job.latitude, job.longitude]);
        marker.setStyle({
          radius,
          fillColor: inRange ? s.markerInRange : s.markerOutOfRange,
        });
      }
      // Ensure job markers always render above province fills
      marker.bringToFront();

      // Highlight ring on hover/select
      // (Leaflet circleMarker doesn't support a second stroke; we toggle weight)
      if (isSelected || isHovered) {
        marker.setStyle({ color: s.markerRing, weight: 2.5 });
      } else {
        marker.setStyle({ color: '#fff', weight: 1.2 });
      }
    }

    // Remove markers for jobs no longer in the list
    jobMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        jobMarkersRef.current.delete(id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, filteredJobs, selectedJobId, popupJob, hoveredJob]);

  // ---- Search handlers ----
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
    setSearchQuery(place.label);
    setShowResults(false);
    const map = mapRef.current;
    if (map) map.flyTo([place.lat, place.lng], 9, { duration: 0.8 });
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
            setSearchQuery(nearestCity);
            const map = mapRef.current;
            if (map) map.flyTo([coords.lat, coords.lng], 9, { duration: 0.8 });
          }
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    if (geoJsonRef.current) {
      try {
        map.fitBounds(geoJsonRef.current.getBounds(), { padding: [20, 20] });
      } catch {
        map.setView([MAP_CENTER.lat, MAP_CENTER.lng], 6);
      }
    } else {
      map.setView([MAP_CENTER.lat, MAP_CENTER.lng], 6);
    }
    onCenterChange(MAP_CENTER.lat, MAP_CENTER.lng);
    setPopupJob(null);
  };

  const zoomControls = (
    <>
      <button
        type="button"
        onClick={zoomOut}
        aria-label={t('jobs.mapZoomOut')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={zoomIn}
        aria-label={t('jobs.mapZoomIn')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
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
      {/* Leaflet CSS + tooltip styling */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .tr-map-tooltip {
          background: ${isDark ? '#1a2a22' : '#ffffff'} !important;
          border: 1px solid ${isDark ? '#2E7D4F' : '#2E7D4F'} !important;
          color: ${isDark ? '#f0ead6' : '#1a3a28'} !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          white-space: nowrap !important;
        }
        .tr-map-tooltip::before { display: none !important; }
        .tr-province-label {
          color: ${isDark ? '#fff8df' : '#102d20'} !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          line-height: 1.1 !important;
          text-align: center !important;
          text-shadow: -1px -1px 0 ${isDark ? '#102d20' : '#fff'}, 1px -1px 0 ${isDark ? '#102d20' : '#fff'}, -1px 1px 0 ${isDark ? '#102d20' : '#fff'}, 1px 1px 0 ${isDark ? '#102d20' : '#fff'} !important;
          white-space: nowrap !important;
          pointer-events: none !important;
          transform: translate(-50%, -50%) !important;
        }
        .leaflet-container { font-family: inherit !important; }
        .leaflet-control-attribution {
          background: ${isDark ? 'rgba(26,42,34,0.8)' : 'rgba(255,255,255,0.8)'} !important;
          color: ${isDark ? '#8a9a8a' : '#5a6a5a'} !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: ${isDark ? '#5a8a6a' : '#2E7D4F'} !important; }
        .leaflet-bar a {
          background: ${isDark ? '#1a2a22' : '#ffffff'} !important;
          color: ${isDark ? '#f0ead6' : '#1a3a28'} !important;
          border-color: ${isDark ? '#2a3a32' : '#e0e0e0'} !important;
        }
        .leaflet-bar a:hover {
          background: ${isDark ? '#2a3a32' : '#f0f0f0'} !important;
        }
      `}</style>

      {/* Search */}
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
            <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg animate-fade-in">
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

      {/* Radius selector */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 shrink-0 text-secondary" />
            <span className="text-sm font-semibold text-foreground">{t('jobs.radius')}</span>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{selectedRadius} km</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={selectedRadius}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
          aria-label={`${t('jobs.radius')}: ${selectedRadius} km`}
          className="mt-3 h-2 w-full cursor-pointer accent-primary"
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>0 km</span>
          <span>{t('jobs.jobsCount', { count: filteredJobs.length })}</span>
          <span>100 km</span>
        </div>
      </div>

      {/* Map card */}
      <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        {/* Header */}
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

        {/* Map area */}
        <div className="relative">
          <div
            ref={containerRef}
            className="h-[320px] w-full cursor-crosshair sm:h-[420px] lg:h-[500px]"
            style={{ background: isDark ? '#0d1612' : '#e8edea' }}
          />

          {/* Popup */}
          {popupJob && (
            <div className="pointer-events-auto absolute left-1/2 top-3 z-[1000] w-72 -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-background/95 shadow-xl backdrop-blur animate-fade-in">
              <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
                <p className="line-clamp-1 text-sm font-bold text-foreground">{popupJob.title}</p>
                <button
                  onClick={() => setPopupJob(null)}
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
                <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => onJobSelect?.(popupJob)}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  {t('job.details')}
                </Button>
                {onApply && popupJob.status !== 'closed' && (
                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => onApply(popupJob)}>
                    {t('job.apply')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hint chip */}
          <div className="pointer-events-none absolute left-3 top-3 z-[500] hidden max-w-[70%] items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur sm:flex">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            {t('jobs.clickHint')}
          </div>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow backdrop-blur">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-[#D9A441]" />
              <span className="text-muted-foreground">{t('jobs.inRange')}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <div className={cn('h-2 w-2 rounded-full', isDark ? 'bg-gray-500' : 'bg-gray-400')} />
              <span className="text-muted-foreground">{t('jobs.outOfRange')}</span>
            </div>
          </div>

          {/* Mobile floating controls */}
          <div className="absolute bottom-3 right-3 z-[500] flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/95 p-1 shadow-lg backdrop-blur sm:hidden">
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              aria-label={t('jobs.mapLocate')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={zoomIn}
              aria-label={t('jobs.mapZoomIn')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              aria-label={t('jobs.mapZoomOut')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              aria-label={t('jobs.mapReset')}
              className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {geoError && <p className="text-xs text-destructive">{geoError}</p>}
    </div>
  );
}

// Province centroids for radius-based highlighting (moved from turkey-map-data.ts)
const PROVINCE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Adana': { lat: 37.4146, lng: 35.6184 },
  'Adıyaman': { lat: 37.8055, lng: 38.304 },
  'Afyonkarahisar': { lat: 38.6496, lng: 30.6716 },
  'Ağrı': { lat: 39.5516, lng: 43.2482 },
  'Aksaray': { lat: 38.4255, lng: 33.8585 },
  'Amasya': { lat: 40.7099, lng: 35.7201 },
  'Ankara': { lat: 39.7999, lng: 32.5981 },
  'Antalya': { lat: 36.8231, lng: 30.9481 },
  'Ardahan': { lat: 41.1158, lng: 42.8237 },
  'Artvin': { lat: 41.1193, lng: 41.826 },
  'Aydın': { lat: 37.7353, lng: 28.0316 },
  'Balıkesir': { lat: 39.6533, lng: 27.9188 },
  'Bartın': { lat: 41.5768, lng: 32.524 },
  'Batman': { lat: 37.9816, lng: 41.3448 },
  'Bayburt': { lat: 40.2472, lng: 40.2233 },
  'Bilecik': { lat: 40.0997, lng: 30.1194 },
  'Bingöl': { lat: 39.0479, lng: 40.6439 },
  'Bitlis': { lat: 38.5265, lng: 42.3747 },
  'Bolu': { lat: 40.6306, lng: 31.6423 },
  'Burdur': { lat: 37.4231, lng: 30.0862 },
  'Bursa': { lat: 40.1168, lng: 29.0455 },
  'Çanakkale': { lat: 39.9577, lng: 26.6974 },
  'Çankırı': { lat: 40.7319, lng: 33.363 },
  'Çorum': { lat: 40.562, lng: 34.6934 },
  'Denizli': { lat: 37.7406, lng: 29.293 },
  'Diyarbakır': { lat: 38.1063, lng: 40.3454 },
  'Düzce': { lat: 40.8867, lng: 31.1305 },
  'Edirne': { lat: 41.2506, lng: 26.6028 },
  'Elazığ': { lat: 38.6597, lng: 39.4025 },
  'Erzincan': { lat: 39.6682, lng: 39.2924 },
  'Erzurum': { lat: 40.063, lng: 41.5507 },
  'Eskişehir': { lat: 39.6018, lng: 31.0918 },
  'Gaziantep': { lat: 37.0936, lng: 37.3669 },
  'Giresun': { lat: 40.5809, lng: 38.5788 },
  'Gümüşhane': { lat: 40.3326, lng: 39.4168 },
  'Hakkâri': { lat: 37.4631, lng: 44.0558 },
  'Hatay': { lat: 36.4513, lng: 36.2585 },
  'Mersin': { lat: 36.6938, lng: 33.8597 },
  'Iğdır': { lat: 39.8933, lng: 43.9841 },
  'Isparta': { lat: 37.95, lng: 30.9567 },
  'Istanbul': { lat: 41.147, lng: 28.8357 },
  'İzmir': { lat: 38.478, lng: 27.2954 },
  'Kahramanmaraş': { lat: 37.8928, lng: 36.965 },
  'Karabük': { lat: 41.2724, lng: 32.6706 },
  'Karaman': { lat: 37.0159, lng: 33.0883 },
  'Kars': { lat: 40.436, lng: 43.0576 },
  'Kastamonu': { lat: 41.4875, lng: 33.7048 },
  'Kayseri': { lat: 38.6166, lng: 35.8628 },
  'Kilis': { lat: 36.7954, lng: 37.1576 },
  'Kırıkkale': { lat: 39.8687, lng: 33.7134 },
  'Kırklareli': { lat: 41.6735, lng: 27.4457 },
  'Kırşehir': { lat: 39.3234, lng: 34.1284 },
  'Kocaeli': { lat: 40.8408, lng: 29.8931 },
  'Konya': { lat: 38.0184, lng: 32.6966 },
  'Kütahya': { lat: 39.2998, lng: 29.5866 },
  'Malatya': { lat: 38.5263, lng: 38.1191 },
  'Manisa': { lat: 38.7586, lng: 28.1309 },
  'Mardin': { lat: 37.3352, lng: 40.8217 },
  'Muğla': { lat: 37.0052, lng: 28.4916 },
  'Muş': { lat: 38.9966, lng: 41.8452 },
  'Nevşehir': { lat: 38.8169, lng: 34.7466 },
  'Niğde': { lat: 37.9333, lng: 34.7122 },
  'Ordu': { lat: 40.7907, lng: 37.4956 },
  'Osmaniye': { lat: 37.2649, lng: 36.3144 },
  'Rize': { lat: 40.9261, lng: 40.8673 },
  'Sakarya': { lat: 40.7423, lng: 30.5069 },
  'Samsun': { lat: 41.2101, lng: 36.017 },
  'Şanlıurfa': { lat: 37.2489, lng: 39.1037 },
  'Siirt': { lat: 37.9047, lng: 42.0723 },
  'Sinop': { lat: 41.6168, lng: 34.8867 },
  'Şırnak': { lat: 37.4558, lng: 42.4875 },
  'Sivas': { lat: 39.5645, lng: 37.296 },
  'Tekirdağ': { lat: 41.0758, lng: 27.3807 },
  'Tokat': { lat: 40.3649, lng: 36.5745 },
  'Trabzon': { lat: 40.7951, lng: 39.8288 },
  'Tunceli': { lat: 39.198, lng: 39.4744 },
  'Uşak': { lat: 38.576, lng: 29.3648 },
  'Van': { lat: 38.4683, lng: 43.5843 },
  'Yalova': { lat: 40.5838, lng: 29.1452 },
  'Yozgat': { lat: 39.6641, lng: 35.2681 },
  'Zonguldak': { lat: 41.2617, lng: 31.8437 },
};
