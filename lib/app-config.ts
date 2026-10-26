/**
 * Central application configuration.
 *
 * This is the single file you edit to customize the app for any country,
 * region, or market. Everything from branding to cities to commodity
 * sources to ad spaces is defined here.
 *
 * To deploy for a new country/region:
 *   1. Change `branding` (name, tagline, currency symbol)
 *   2. Replace `cities` and `cityCoords` with your own
 *   3. Replace `commodities.popular` and `commodities.categories`
 *   4. Add your API sources in `apiSources`
 *   5. Add your news sources in `newsSources`
 *   6. Add your exchanges in `exchanges`
 *   7. Translate strings in lib/i18n.ts
 */

export interface CityConfig {
  lat: number;
  lng: number;
  region?: string;
}

export interface ExchangeConfig {
  name: string;
  shortName: string;
  city: string;
  region: string;
  specialties: string[];
  lat: number;
  lng: number;
}

export interface NewsSourceConfig {
  name: string;
  url: string;
  category: string;
  region: string;
  /** RSS feed URL or API endpoint. If empty, articles are managed manually. */
  feedUrl?: string;
}

export interface ApiSourceConfig {
  /** Unique key for this source */
  key: string;
  /** Display name */
  name: string;
  /** What data this source provides: 'commodities' | 'news' | 'weather' */
  type: 'commodities' | 'news' | 'weather';
  /** Base URL of the API */
  baseUrl: string;
  /** Environment variable name that holds the API key */
  apiKeyEnv: string;
  /** Whether this source is currently enabled */
  enabled: boolean;
}

export interface AdSpaceConfig {
  /** Unique slot identifier */
  slot: string;
  /** Where the ad appears */
  placement: 'sidebar' | 'header' | 'footer' | 'inline' | 'between-sections';
  /** Display label for this slot */
  label: string;
  /** Default width in pixels (0 = responsive) */
  width: number;
  /** Default height in pixels */
  height: number;
  /** Whether this slot is available for purchase */
  available: boolean;
}

export interface CommodityCategoryConfig {
  key: string;
  label: Record<string, string>;
}

export interface JobCategoryConfig {
  /** The category name as stored in the database */
  name: string;
  /** Lucide icon name from lucide-react */
  icon: string;
}

export const appConfig = {
  /** App branding — change these to rebrand for any market */
  branding: {
    name: 'Turanda',
    tagline: 'Agricultural Job Marketplace',
    currencySymbol: '₺',
    currencyCode: 'TRY',
    locale: 'tr',
    logoIcon: 'Sprout',
  },

  /** Map defaults */
  map: {
    centerLat: 39.0,
    centerLng: 35.0,
    zoom: 6,
  /** Tile provider: 'osm' | 'custom'. If custom, set tileUrl. */
    tileProvider: 'osm' as const,
    tileUrl: '',
  },

  /** Cities — replace with your own country's cities */
  cities: [
    'Antalya', 'İzmir', 'Bursa', 'Konya', 'Adana', 'Tekirdağ', 'Balıkesir',
    'Şanlıurfa', 'Hatay', 'Mersin', 'Manisa', 'Aydın', 'Muğla', 'Çanakkale',
    'Samsun', 'Trabzon', 'Gaziantep', 'Diyarbakır', 'Kayseri', 'Eskişehir',
  ] as string[],

  cityCoords: {
    Antalya: { lat: 36.8969, lng: 30.7133, region: 'Akdeniz' },
    İzmir: { lat: 38.4192, lng: 27.1287, region: 'Ege' },
    Bursa: { lat: 40.1828, lng: 29.0667, region: 'Marmara' },
    Konya: { lat: 37.8746, lng: 32.4932, region: 'İç Anadolu' },
    Adana: { lat: 37.0, lng: 35.3213, region: 'Akdeniz' },
    Tekirdağ: { lat: 40.9833, lng: 27.5119, region: 'Marmara' },
    Balıkesir: { lat: 39.6484, lng: 27.8826, region: 'Ege' },
    Şanlıurfa: { lat: 37.1674, lng: 38.7955, region: 'Güneydoğu Anadolu' },
    Hatay: { lat: 36.4018, lng: 36.3518, region: 'Akdeniz' },
    Mersin: { lat: 36.8121, lng: 34.6415, region: 'Akdeniz' },
    Manisa: { lat: 38.6191, lng: 27.4289, region: 'Ege' },
    Aydın: { lat: 37.8394, lng: 27.8456, region: 'Ege' },
    Muğla: { lat: 37.2155, lng: 28.3636, region: 'Ege' },
    Çanakkale: { lat: 40.1553, lng: 26.4142, region: 'Marmara' },
    Samsun: { lat: 41.2867, lng: 36.33, region: 'Karadeniz' },
    Trabzon: { lat: 41.005, lng: 39.717, region: 'Karadeniz' },
    Gaziantep: { lat: 37.0662, lng: 37.3833, region: 'Güneydoğu Anadolu' },
    Diyarbakır: { lat: 37.9144, lng: 40.2306, region: 'Güneydoğu Anadolu' },
    Kayseri: { lat: 38.7312, lng: 35.4787, region: 'İç Anadolu' },
    Eskişehir: { lat: 39.7767, lng: 30.5206, region: 'İç Anadolu' },
  } as Record<string, CityConfig>,

  /** Job categories — add/remove to match your market */
  jobCategories: [
    { name: 'Hasat', icon: 'Wheat' },
    { name: 'Sürüş', icon: 'Tractor' },
    { name: 'Hayvan Bakımı', icon: 'Milk' },
    { name: 'Ekim', icon: 'Sprout' },
    { name: 'Sulama', icon: 'Droplets' },
    { name: 'Ekipman Kullanımı', icon: 'Cog' },
    { name: 'Genel İşçilik', icon: 'Shovel' },
    { name: 'İşleme', icon: 'Package' },
  ] as JobCategoryConfig[],

  /** Commodity configuration */
  commodities: {
    /** Popular commodities shown in ticker and homepage */
    popular: [
      'Buğday', 'Mısır', 'Arpa', 'Ayçiçeği', 'Fındık', 'Antep Fıstığı',
      'Mercimek', 'Zeytinyağı',
    ],
    categories: [
      { key: 'Grain & Field Crops', label: { tr: 'Tahıl & Tarla', en: 'Grain & Field', ar: 'الحبوب' } },
      { key: 'Specialty Crops', label: { tr: 'Özel Ürünler', en: 'Specialty', ar: 'خاصة' } },
      { key: 'Pulses', label: { tr: 'Baklagiller', en: 'Pulses', ar: 'بقوليات' } },
      { key: 'Oilseeds', label: { tr: 'Yağlı Tohum', en: 'Oilseeds', ar: 'زيتية' } },
    ] as CommodityCategoryConfig[],
  },

  /** Commodity exchanges / market boards — replace with your own */
  exchanges: [
    { name: 'Türkiye Ticaret Borsası (TMEX/TÜRİB)', shortName: 'TMEX', city: 'Ankara', region: 'İç Anadolu', specialties: ['Buğday','Arpa','Mısır','Ayçiçeği','Mercimek','Nohut'], lat: 39.9334, lng: 32.8597 },
    { name: 'İzmir Ticaret Borsası', shortName: 'İZTB', city: 'İzmir', region: 'Ege', specialties: ['Pamuk','Üzüm','İncir','Zeytinyağı','Tütün'], lat: 38.4192, lng: 27.1287 },
    { name: 'Antalya Ticaret Borsası', shortName: 'ATB', city: 'Antalya', region: 'Akdeniz', specialties: ['Narenciye','Muz','Zeytin'], lat: 36.8969, lng: 30.7133 },
    { name: 'Konya Ticaret Borsası', shortName: 'KTB', city: 'Konya', region: 'İç Anadolu', specialties: ['Buğday','Arpa','Şeker Pancarı','Mısır'], lat: 37.8746, lng: 32.4932 },
    { name: 'Gaziantep Ticaret Borsası', shortName: 'GTB', city: 'Gaziantep', region: 'Güneydoğu Anadolu', specialties: ['Antep Fıstığı','Mercimek','Pamuk','Zeytin'], lat: 37.0662, lng: 37.3833 },
  ] as ExchangeConfig[],

  /** External API sources — add your own API keys via environment variables */
  apiSources: [
    {
      key: 'tmex',
      name: 'TMEX/TÜRİB Commodity API',
      type: 'commodities',
      baseUrl: 'https://api.tmex.com.tr/v1',
      apiKeyEnv: 'TMEX_API_KEY',
      enabled: false,
    },
    {
      key: 'custom-commodities',
      name: 'Custom Commodity API',
      type: 'commodities',
      baseUrl: '',
      apiKeyEnv: 'COMMODITY_API_KEY',
      enabled: false,
    },
    {
      key: 'news-rss',
      name: 'News RSS Aggregator',
      type: 'news',
      baseUrl: '',
      apiKeyEnv: 'NEWS_API_KEY',
      enabled: false,
    },
    {
      key: 'weather',
      name: 'Weather API',
      type: 'weather',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      apiKeyEnv: 'WEATHER_API_KEY',
      enabled: false,
    },
  ] as ApiSourceConfig[],

  /** News sources — add RSS feeds or manual sources */
  newsSources: [
    { name: 'TÜRİB', url: 'https://www.turib.org.tr', category: 'market', region: 'all' },
    { name: 'Resmi Gazete', url: 'https://www.resmigazete.gov.tr', category: 'policy', region: 'all' },
    { name: 'Antalya Ticaret Borsası', url: 'https://www.antalyatb.org.tr', category: 'general', region: 'Akdeniz' },
    { name: 'İzmir Ticaret Borsası', url: 'https://www.iztbtb.org.tr', category: 'market', region: 'Ege' },
  ] as NewsSourceConfig[],

  /** Ad space slots — businesses can purchase these */
  adSpaces: [
    { slot: 'sidebar-primary', placement: 'sidebar', label: 'Primary Sidebar Ad', width: 300, height: 250, available: true },
    { slot: 'sidebar-secondary', placement: 'sidebar', label: 'Secondary Sidebar Ad', width: 300, height: 600, available: true },
    { slot: 'header-banner', placement: 'header', label: 'Header Banner Ad', width: 728, height: 90, available: true },
    { slot: 'footer-banner', placement: 'footer', label: 'Footer Banner Ad', width: 728, height: 90, available: true },
    { slot: 'inline-feed', placement: 'inline', label: 'Inline Feed Ad', width: 0, height: 120, available: true },
    { slot: 'between-sections', placement: 'between-sections', label: 'Between Sections Ad', width: 0, height: 150, available: true },
  ] as AdSpaceConfig[],

  /** AI thumbnail generation for news articles */
  aiThumbnails: {
    /** Whether AI thumbnail generation is enabled */
    enabled: false,
    /** Environment variable name for the AI image API key */
    apiKeyEnv: 'AI_IMAGE_API_KEY',
    /** Image generation provider: 'openai' | 'stability' | 'custom' */
    provider: 'openai' as const,
    /** Custom endpoint if provider is 'custom' */
    customEndpoint: '',
  },

  /** Features — toggle on/off for your deployment */
  features: {
    jobs: true,
    commodities: true,
    news: true,
    weather: true,
    academy: false,
    map: true,
    ads: true,
    aiThumbnails: false,
  },
};

/** Helper: get job category names as a simple array (replaces JOB_TYPES) */
export const JOB_TYPES = appConfig.jobCategories.map((c) => c.name);

/** Helper: job category icon map (replaces JOB_TYPE_ICONS) */
export const JOB_TYPE_ICONS: Record<string, string> = Object.fromEntries(
  appConfig.jobCategories.map((c) => [c.name, c.icon]),
);

/** Helper: cities list (replaces TURKEY_CITIES) */
export const CITIES = appConfig.cities;

/** Helper: city coordinates (replaces CITY_COORDS) */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  Object.entries(appConfig.cityCoords).map(([name, c]) => [name, { lat: c.lat, lng: c.lng }]),
);

/** Helper: map center (replaces MAP_CENTER / MAP_ZOOM) */
export const MAP_CENTER = { lat: appConfig.map.centerLat, lng: appConfig.map.centerLng };
export const MAP_ZOOM = appConfig.map.zoom;

/** Helper: popular commodities (replaces POPULAR_COMMODITIES) */
export const POPULAR_COMMODITIES = appConfig.commodities.popular;

/** Helper: wage units */
export const WAGE_UNITS: { value: string; label: string }[] = [
  { value: 'day', label: 'Günlük' },
  { value: 'week', label: 'Haftalık' },
  { value: 'month', label: 'Aylık' },
  { value: 'hour', label: 'Saatlik' },
];

export const WAGE_UNIT_LABELS: Record<string, string> = {
  day: 'gün',
  week: 'hafta',
  month: 'ay',
  hour: 'saat',
};

export const JOB_STATUSES = ['active', 'closed'] as const;
export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'] as const;
export const RADII = [10, 25, 50, 100] as const;

export const JOB_SKILLS = [
  'Tractor Operation',
  'Irrigation Systems',
  'Harvest Equipment',
  'Livestock Handling',
  'Crop Scouting',
  'Pesticide Application',
  'Soil Management',
  'Greenhouse Operations',
  'Food Safety',
  'Machinery Repair',
  'Forklift Operation',
  'Quality Control',
  'Packaging',
  'Logistics',
  'Team Leadership',
] as const;
