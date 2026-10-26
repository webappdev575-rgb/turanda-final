'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Bell,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CloudRain,
  Droplets,
  Eye,
  LineChart,
  Sprout,
  Sun,
  Thermometer,
  TriangleAlert,
  CircleUserRound,
  Moon,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/components/auth-provider';
import { useFieldsWithLatestTemp, tempHasAlert } from '@/hooks/use-fields-with-temp';
import type { FieldWithLatest } from '@/hooks/use-fields-with-temp';
import { TuraAssistant } from '@/components/home/tura-assistant';
import type { TranslationKey } from '@/lib/i18n';

const FIELD_PHOTO = '/images/hero/aerial-fields.png';

type FieldHealth = 'clear' | 'watch' | 'urgent';

interface DemoField {
  key: TranslationKey;
  area: string;
  health: FieldHealth;
  alertMain: TranslationKey;
  decision: TranslationKey;
}
const DEMO_FIELDS: DemoField[] = [
  {
    key: 'farm.cropCorn', area: '8,4', health: 'clear',
    alertMain: 'farm.demoCornAlertMain', decision: 'farm.demoCornDecision',
  },
  {
    key: 'farm.cropChickpea', area: '6,7', health: 'watch',
    alertMain: 'farm.demoChickpeaAlertMain', decision: 'farm.demoChickpeaDecision',
  },
  {
    key: 'farm.cropWheat', area: '5,2', health: 'urgent',
    alertMain: 'farm.demoWheatAlertMain', decision: 'farm.demoWheatDecision',
  },
  {
    key: 'farm.cropSunflower', area: '11,6', health: 'watch',
    alertMain: 'farm.alertMain', decision: 'farm.decisionMain',
  },
  {
    key: 'farm.cropCanola', area: '9,1', health: 'clear',
    alertMain: 'farm.demoCanolaAlertMain', decision: 'farm.demoCanolaDecision',
  },
  {
    key: 'farm.cropBarley', area: '14,3', health: 'clear',
    alertMain: 'farm.demoBarleyAlertMain', decision: 'farm.demoBarleyDecision',
  },
];

/** Health status → overlay color: green = all clear, yellow = watch, red = urgent. */
const HEALTH_STYLES: Record<FieldHealth, { fill: string; fillOpacity: number }> = {
  clear: { fill: '#2E7D4F', fillOpacity: 0.5 },
  watch: { fill: '#FFD230', fillOpacity: 0.4 },
  urgent: { fill: '#FB2C36', fillOpacity: 0.4 },
};

/** Field parcel outlines, exact coordinates exported from Figma (viewBox 554×415,
 *  matching the aerial photo's 554×416 frame) so borders sit on the real field edges. */
const PARCEL_SHAPES: { health: FieldHealth; points: string; label: { left: string; top: string; centerX?: boolean } }[] = [
  // Mısır — top-left vineyard block
  { health: 'clear', points: '1,11.7 7.9,0 241,0 221,68.3 208,104.3 193,137.3 95.2,76.1 28,29.3', label: { left: '13%', top: '6%' } },
  // Nohut — left yellow wedge below the vineyard block
  { health: 'watch', points: '0,22.3 137,116.7 58.5,188.3 0,242.3', label: { left: '2%', top: '30%' } },
  // Buğday — red harvested strip between the hedges
  { health: 'urgent', points: '243.5,0.4 300.5,0.4 284,194.8 194.5,137.3 222,69.3 232,38.3', label: { left: '47%', top: '22%', centerX: true } },
  // Ayçiçeği — tall yellow strip center-right
  { health: 'watch', points: '304,1.3 419,1.3 400,273.3 287,196.8 296.5,100.8', label: { left: '55%', top: '27%' } },
  // Kanola — right green field down to the hedge line
  { health: 'clear', points: '422,0 544.5,0 531,276.5 402,276.5 416.9,78.2', label: { left: '77%', top: '29%' } },
  // Arpa — large bottom field under the tree line
  { health: 'clear', points: '257,209.2 313.5,254.4 366.2,287.9 401.5,308.3 544.5,301.4 553.5,301.4 553.5,414.9 85,414.9 84.7,366.9', label: { left: '46%', top: '82%' } },
];

/** Real fields: clear inside thresholds, watch just outside, urgent far outside. */
function fieldHealth(field: FieldWithLatest): FieldHealth {
  if (!tempHasAlert(field)) return 'clear';
  const margin = (field.temp_max_threshold - field.temp_min_threshold) / 2;
  if (
    field.latest_temp != null
    && (field.latest_temp > field.temp_max_threshold + margin || field.latest_temp < field.temp_min_threshold - margin)
  ) {
    return 'urgent';
  }
  return 'watch';
}

/** Sun behind a cloud (overcast) icon */
function SunCloudIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="#f2b23e" strokeWidth="1.5" strokeLinecap="round">
        <line x1="7.5" y1="2.2" x2="7.5" y2="0.9" />
        <line x1="2.2" y1="7.5" x2="0.9" y2="7.5" />
        <line x1="3.7" y1="3.7" x2="2.8" y2="2.8" />
        <line x1="11.3" y1="3.7" x2="12.2" y2="2.8" />
        <line x1="3.7" y1="11.3" x2="2.8" y2="12.2" />
      </g>
      <circle cx="7.5" cy="7.5" r="3.2" fill="#f2b23e" />
      <path
        d="M17.5 20.5H9.4a5.4 5.4 0 1 1 5.18-6.94h.42a3.87 3.87 0 1 1 0 7.74Z"
        fill="#efeadb"
        stroke="#a8a293"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FarmDashboard() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { fields: realFields } = useFieldsWithLatestTemp(user?.id);
  const hasRealFields = realFields.length > 0;

  const [demoSelected, setDemoSelected] = useState(3);
  const [realSelectedId, setRealSelectedId] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<string | null>(null); // picker id: field id or "demo-<i>"
  const [mapExpanded, setMapExpanded] = useState(false);
  const [turaOpen, setTuraOpen] = useState(false);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const turaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openPicker && !turaOpen) return;
    const onDown = (e: MouseEvent) => {
      if (openPicker && alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setOpenPicker(null);
      }
      if (turaOpen && turaRef.current && !turaRef.current.contains(e.target as Node)) {
        setTuraOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openPicker, turaOpen]);

  const selectedReal = realFields.find((f) => f.id === realSelectedId) ?? realFields[0] ?? null;

  const selectedDemo = DEMO_FIELDS[demoSelected];

  const selectedHealth: FieldHealth = hasRealFields && selectedReal
    ? fieldHealth(selectedReal)
    : selectedDemo.health;
  const alertTitle = hasRealFields && selectedReal
    ? `${selectedReal.name} · ${selectedReal.field_size.toLocaleString('tr-TR')} ${selectedReal.size_unit}`
    : `${t(selectedDemo.key)} · ${selectedDemo.area} ha`;
  const alertMain = hasRealFields && selectedReal
    ? selectedReal.status === 'ready'
      ? t('farm.alertReady')
      : tempHasAlert(selectedReal)
        ? t('farm.alertTempOut', { min: String(selectedReal.temp_min_threshold), max: String(selectedReal.temp_max_threshold) })
        : t('farm.alertAllClear')
    : t(selectedDemo.alertMain);
  const alertSecondary = hasRealFields && selectedReal
    ? selectedReal.city
    : t('farm.alertSecondary');

  const decisionMain = hasRealFields && selectedReal
    ? selectedReal.status === 'ready'
      ? t('farm.decisionHarvest')
      : tempHasAlert(selectedReal)
        ? selectedReal.latest_temp != null && selectedReal.latest_temp > selectedReal.temp_max_threshold
          ? t('farm.decisionHot', { temp: String(selectedReal.latest_temp) })
          : t('farm.decisionCold', { temp: String(selectedReal.latest_temp ?? 0) })
        : t('farm.decisionNormal')
    : t(selectedDemo.decision);

  const latestTempLabel = hasRealFields && selectedReal && selectedReal.latest_temp != null
    ? `${selectedReal.latest_temp}°C`
    : null;

  interface PickerEntry {
    id: string;
    name: string;
    area: string;
    selected: boolean;
    health: FieldHealth;
    /** Real rows link to the field's record; demo rows show a disabled demo link. */
    real: boolean;
  }
  const pickerEntries: PickerEntry[] = hasRealFields
    ? [
      ...(selectedReal ? [{ id: selectedReal.id, name: selectedReal.name, area: `${selectedReal.field_size.toLocaleString('tr-TR')} ${selectedReal.size_unit}`, selected: true, health: fieldHealth(selectedReal), real: true }] : []),
      ...realFields.filter((f) => f.id !== selectedReal?.id).map((f) => ({ id: f.id, name: f.name, area: `${f.field_size.toLocaleString('tr-TR')} ${f.size_unit}`, selected: false, health: fieldHealth(f), real: true })),
    ]
    : [
      { id: 'demo-3', name: t(selectedDemo.key), area: `${selectedDemo.area} ha`, selected: true, health: selectedDemo.health, real: false },
      ...DEMO_FIELDS.map((f, i) => ({ id: `demo-${i}`, name: t(f.key), area: `${f.area} ha`, selected: false, health: f.health, real: false })).filter((entry) => entry.id !== `demo-${demoSelected}`),
    ];

  const selectField = (id: string) => {
    if (id.startsWith('demo-')) {
      setDemoSelected(Number(id.slice(5)));
    } else {
      setRealSelectedId(id);
    }
    setOpenPicker(null);
  };

  const selectedParcelId = hasRealFields
    ? selectedReal?.id ?? null
    : `demo-${demoSelected}`;

  const mapParcels = (hasRealFields
    ? realFields.slice(0, 6).map((f) => ({ id: f.id, label: `${f.name} · ${f.field_size.toLocaleString('tr-TR')} ${f.size_unit}` }))
    : DEMO_FIELDS.map((f, i) => ({ id: `demo-${i}`, label: `${t(f.key)} · ${f.area} ha` })))
    .slice(0, PARCEL_SHAPES.length);

  const navItems = [
    { icon: 'sprout', labelKey: 'farm.navCrops' as TranslationKey, active: true, badge: true },
    { icon: 'chart', labelKey: 'farm.navMarket' as TranslationKey, active: false },
    { icon: 'scout', labelKey: 'farm.navScout' as TranslationKey, active: false },
    { icon: 'user', labelKey: 'farm.navAccount' as TranslationKey, active: false },
  ];

  const navIcons: Record<string, typeof Sprout> = {
    sprout: Sprout,
    chart: Briefcase,
    scout: Camera,
    user: CircleUserRound,
  };

  return (
    <div className="relative flex h-auto flex-col overflow-hidden rounded-3xl bg-parchment shadow-[0px_25px_50px_-12px_#00000026] lg:h-[820px]">
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#15231d14] dark:border-[#ffffff14] bg-cream px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint">
            <Sprout className="h-5 w-5 text-brand" aria-hidden="true" />
          </span>
          <div>
            <strong className="block text-sm text-ink">{t('farm.greeting')}</strong>
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
              <span>{t('farm.farmName')}</span>
              <span
                className="flex items-center gap-1 font-semibold text-brand"
              >
                {t('farm.manageFarm')}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme toggle — matches the navbar's round light/dark button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('nav.theme')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-parchment-deep text-ink shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a] transition-colors hover:bg-cream dark:bg-[#1c2a22] dark:text-white dark:hover:bg-[#25382c]"
          >
            {theme === 'dark' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>
          {/* Weather pill — theme-aware so the text stays readable in light and dark */}
          <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink shadow-[0px_1px_2px_-1px_#0000001a] dark:bg-[#1c2a22] dark:text-white">
            <SunCloudIcon className="h-4 w-4" aria-hidden="true" />
            28°C
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-field">
            <span className="h-2 w-2 rounded-full bg-[#2e7d4f]" />
            {t('farm.satelliteLive')}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:#c9e7b8_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9e7b8]">
        {/* Map heading */}
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold leading-[18px] tracking-[1.92px] text-field">
              {t('farm.mapKicker')}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.6px] text-ink">
              {t('farm.mapTitle')}
            </h3>
            <p className="mt-1 text-sm text-ink-soft">{t('farm.mapSubtitle')}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-field">
            <span className="h-2 w-2 rounded-full bg-[#2e7d4f]" />
            {t('farm.scanReady')}
          </span>
        </div>

        <div className={`mt-4 shrink-0 gap-4 ${mapExpanded ? '' : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px]'}`}>
          <div className={`relative w-full overflow-hidden rounded-2xl bg-brand ${mapExpanded ? 'h-[70vh] min-h-[420px]' : 'aspect-[554/415]'}`}>
            <button
              type="button"
              onClick={() => setMapExpanded((v) => !v)}
              aria-label={t(mapExpanded ? 'farm.mapCollapse' : 'farm.mapExpand')}
              title={t(mapExpanded ? 'farm.mapCollapse' : 'farm.mapExpand') as string}
              className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-lg bg-cream text-ink shadow-[0px_2px_6px_#00000033] transition-colors hover:bg-parchment-deep dark:bg-[#1c2a22] dark:text-white dark:hover:bg-[#25382c]"
            >
              {mapExpanded ? <Minimize2 className="h-[18px] w-[18px]" aria-hidden="true" /> : <Maximize2 className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>
            <Image
              src={FIELD_PHOTO}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 554px"
              className="object-fill"
            />
            <div className="absolute inset-0 bg-[#08271d1a]" />
            <svg
              viewBox="0 0 554 415"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              {mapParcels.map((parcel, i) => {
                const shape = PARCEL_SHAPES[i];
                if (!shape) return null;
                const isSelected = parcel.id === selectedParcelId;
                return (
                  <g
                    key={parcel.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={parcel.label}
                    className="parcel-hit outline-none"
                    onClick={() => selectField(parcel.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectField(parcel.id);
                      }
                    }}
                  >
                    <polygon
                      points={shape.points}
                      fill={HEALTH_STYLES[shape.health].fill}
                      fillOpacity={HEALTH_STYLES[shape.health].fillOpacity}
                      stroke="#ffffff"
                      strokeOpacity={isSelected ? 1 : 0.8}
                      strokeWidth={isSelected ? 5 : 2.5}
                      strokeLinejoin="round"
                      className={`parcel-stroke ${isSelected ? 'parcel-stroke-selected' : ''}`}
                    />
                    {isSelected && (
                      <polygon
                        points={shape.points}
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity={0.4}
                        strokeWidth={10}
                        strokeLinejoin="round"
                        className="parcel-glow pointer-events-none"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
            {mapParcels.map((parcel, i) => {
              const pos = PARCEL_SHAPES[i]?.label;
              if (!pos) return null;
              const isSelected = parcel.id === selectedParcelId;
              return (
                <button
                  key={parcel.id}
                  type="button"
                  onClick={() => selectField(parcel.id)}
                  className={`absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold shadow-md transition-colors duration-200 ${
                    isSelected ? 'bg-brand text-white' : 'bg-[#08271dcc] text-[#fffdf6] hover:bg-[#08271df2]'
                  }`}
                  style={{ left: pos.left, top: pos.top, transform: pos.centerX ? 'translateX(-50%)' : undefined }}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSelected ? 'bg-white' : 'bg-[#fffdf6]/60'}`}
                  />
                  {parcel.label}
                </button>
              );
            })}
          </div>

          <div className={mapExpanded ? 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2' : 'flex flex-col gap-3 overflow-hidden max-lg:h-auto'}>
            {/* Crop alert */}
          <div ref={alertRef} className="relative rounded-2xl bg-cream p-4 shadow-sm">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              selectedHealth === 'clear'
                ? 'bg-mint text-field'
                : selectedHealth === 'watch'
                  ? 'bg-[#f4e7bd] text-[#765b17]'
                  : 'bg-[#fadcdc] text-[#8f1d1d]'
            }`}>
              {selectedHealth === 'clear'
                ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                : selectedHealth === 'watch'
                  ? <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  : <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
              {selectedHealth === 'clear'
                ? t('farm.okBadge')
                : selectedHealth === 'watch'
                  ? t('farm.watchBadge')
                  : t('farm.urgentBadge')}
            </span>
            <div className="relative mt-3">
              <button
                type="button"
                onClick={() => setOpenPicker(openPicker ? null : 'alert')}
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-haspopup="listbox"
                aria-expanded={openPicker === 'alert'}
              >
                <span className="min-w-0 truncate text-lg font-semibold text-ink">{alertTitle}</span>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#f2dfa4] text-[#3a2f10]">
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${openPicker === 'alert' ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </span>
              </button>
              {openPicker === 'alert' && (
                <div
                  role="listbox"
                  className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-[240px] w-full min-w-[200px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#c9e7b8_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9e7b8] rounded-xl border border-[#15231d14] bg-cream shadow-lg dark:border-[#ffffff26]"
                >
                  {pickerEntries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={item.selected}
                      onClick={() => selectField(item.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left ${
                        item.selected
                          ? 'bg-[#f2dfa4]'
                          : 'hover:bg-parchment'
                      }`}
                    >
                      {item.health === 'clear'
                        ? <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${item.selected ? 'text-[#2e7d4f]' : 'text-[#2e7d4f]'}`} aria-hidden="true" />
                        : item.health === 'watch'
                          ? <Eye className={`h-3.5 w-3.5 shrink-0 ${item.selected ? 'text-[#765b17]' : 'text-[#c9a227]'}`} aria-hidden="true" />
                          : <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-[#fb2c36]" aria-hidden="true" />}
                      <span className="flex min-w-0 flex-1 flex-col leading-4">
                        <strong className={`truncate text-xs font-bold ${item.selected ? 'text-[#3a2f10]' : 'text-ink'}`}>{item.name}</strong>
                        <span className={`truncate text-[10px] ${item.selected ? 'text-[#765b17]' : 'text-ink-soft'}`}>{item.area}</span>
                      </span>
                      {item.real ? (
                        <Link
                          href="/dashboard"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 text-[10px] font-semibold text-brand underline-offset-2 hover:underline"
                        >
                          {t('docs.edit')}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="shrink-0 cursor-not-allowed text-[10px] font-semibold text-ink-faint"
                        >
                          {t('docs.edit')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold leading-5 text-ink">{alertMain}</p>
            {latestTempLabel && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-field">
                <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                {t('farm.latestTemp')} {latestTempLabel}
              </p>
            )}
            <p className="mt-2 text-sm leading-5 text-ink-soft">{alertSecondary}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              {hasRealFields && selectedReal
                ? `${t('farm.logsCount')} ${selectedReal.field_size > 0 ? selectedReal.city : ''}`
                : t('farm.alertTimestamp')}
            </div>
          </div>

          {/* Active team */}
          <div className="rounded-2xl bg-cream p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-extrabold tracking-[0.6px] text-field">
                  {t('farm.teamKicker')}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">{t('farm.teamSubtitle')}</p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                {t('farm.teamManage')}
                <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { initials: 'AY', nameKey: 'farm.teamWorker1', taskKey: 'farm.teamTask1' },
                  { initials: 'MK', nameKey: 'farm.teamWorker2', taskKey: 'farm.teamTask2' },
                  { initials: 'HD', nameKey: 'farm.teamWorker3', taskKey: 'farm.teamTask3' },
                ] as const
              ).map((worker) => (
                <div
                  key={worker.initials}
                  className="flex h-[60px] items-center gap-3 rounded-2xl bg-parchment p-3"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white"
                  >
                    {worker.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-bold text-ink">
                      {t(worker.nameKey)}
                    </strong>
                    <span className="block truncate text-xs text-ink-soft">
                      {t(worker.taskKey)}
                    </span>
                  </span>
                  <span aria-label={t('farm.teamActive') as string} className="h-2 w-2 shrink-0 rounded-full bg-[#2e7d4f]" />
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
        <div className="mt-4 shrink-0 rounded-2xl bg-cream p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[1.92px] text-field">
                {t('farm.decisionKicker')}
              </p>
              <h4 className="mt-1.5 text-lg font-semibold text-ink">
                {t('farm.decisionTitle')}
              </h4>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint">
              <Droplets className="h-4 w-4 text-brand" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="rounded-xl bg-parchment p-3">
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div>
                  <div className="h-2 rounded-full bg-[#c4a7a4]" />
                  <span className="mt-1 block text-ink-faint">{t('farm.irrigationThirsty')}</span>
                </div>
                <div>
                  <div className="h-2 rounded-full bg-[#2e7d4f]" />
                  <strong className="mt-1 block text-ink">{t('farm.irrigationIdeal')}</strong>
                </div>
                <div>
                  <div className="h-2 rounded-full bg-[#cfc0ab]" />
                  <span className="mt-1 block text-ink-faint">{t('farm.irrigationFull')}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-start gap-2">
                  <Thermometer className="mt-0.5 h-4 w-4 shrink-0 text-field" aria-hidden="true" />
                  <p className="text-[11px] leading-4 text-ink-soft">{hasRealFields && selectedReal ? t('farm.decisionHeatGeneric') : t('farm.decisionHeat')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-field" aria-hidden="true" />
                  <p className="text-[11px] leading-4 text-ink-soft">{t('farm.decisionRain')}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-parchment p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-field">
                <Droplets className="h-4 w-4" aria-hidden="true" />
                {t('farm.decisionPrompt')}
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-ink">{decisionMain}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="flex shrink-0 items-center justify-between gap-2 border-t border-[#15231d14] dark:border-[#ffffff14] bg-cream px-4 py-3">
        <div className="flex min-w-0 flex-1 justify-center gap-1 overflow-x-auto text-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const Icon = navIcons[item.icon];
            return (
              <span
                key={item.labelKey}
                className={`relative flex min-w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${
                  item.active ? 'bg-mint text-brand' : 'text-ink-soft'
                }`}
              >
                <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
                {t(item.labelKey)}
                {item.badge && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#fb2c36]" />
                )}
              </span>
            );
          })}
        </div>
        <div ref={turaRef} className="relative hidden shrink-0 sm:block">
          <button
            type="button"
            onClick={() => setTuraOpen((v) => !v)}
            aria-expanded={turaOpen}
            className={`flex items-center gap-2 rounded-2xl bg-brand px-2 py-1.5 transition-all hover:scale-[1.02] ${turaOpen ? 'ring-2 ring-[#c9e7b8] ring-offset-1 ring-offset-cream' : ''}`}
          >
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-[#c9e7b8]">
              <span
                aria-hidden="true"
                className="tura-pulse-ring absolute inset-0 rounded-full bg-[#c9e7b8]"
              />
              <Bell className="tura-icon-pulse relative h-4 w-4 text-brand" aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-xs text-white">{t('farm.assistantReady')}</strong>
              <span className="block text-[10px] text-white/60">{t('farm.assistantReadySub')}</span>
            </span>
          </button>
          {turaOpen && (
            <div className="absolute bottom-[calc(100%+10px)] right-0 z-30 h-[520px] max-h-[70vh] w-[min(340px,calc(100vw-3rem))]">
              <TuraAssistant onClose={() => setTuraOpen(false)} />
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
