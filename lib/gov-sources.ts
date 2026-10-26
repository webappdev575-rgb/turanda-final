/*
 * Government Source Registry
 * Defines the 13 official Turkish agricultural bodies whose RSS feeds,
 * sitemaps, and public announcements are aggregated by the platform.
 */

export type AgencyType =
  | 'Central Ministry'
  | 'State-Owned Enterprise'
  | 'Research & Extension'
  | 'Grants & Financing'
  | 'Water & Infrastructure'
  | 'Insurance & Risk'
  | 'Statistics & Legislation'
  | 'Producer Cooperative'
  | 'Wire Service';

export type Sector =
  | 'Central Policy & Extension'
  | 'Grains & Cereals'
  | 'Livestock & Dairy'
  | 'Seeds & State Farming'
  | 'Research & Disease Control'
  | 'Irrigation & Water'
  | 'Grants & EU IPARD'
  | 'Risk & Disaster Relief'
  | 'Tea & Industrial Crops'
  | 'Sugar & Sweeteners'
  | 'Statistics'
  | 'Legislation'
  | 'Producer Credit & Inputs'
  | 'Wire Coverage';

export interface GovSource {
  key: string;
  name: string;
  shortName: string;
  nameEn: string;
  domain: string;
  website: string;
  agencyType: AgencyType;
  sector: Sector;
  rssFeed: string | null;
  hasLiveFeed: boolean;
  description: string;
  descriptionEn: string;
}

export const GOV_SOURCES: GovSource[] = [
  {
    key: 'tarimorman',
    name: 'T.C. Tarım ve Orman Bakanlığı',
    shortName: 'Tarım ve Orman Bak.',
    nameEn: 'Ministry of Agriculture and Forestry',
    domain: 'tarimorman.gov.tr',
    website: 'https://www.tarimorman.gov.tr',
    agencyType: 'Central Ministry',
    sector: 'Central Policy & Extension',
    rssFeed: 'https://www.tarimorman.gov.tr/rss/bakanlik-haberleri',
    hasLiveFeed: true,
    description: 'Merkezi tarım politikaları, destekleme ödemeleri ve genişleme hizmetleri.',
    descriptionEn: 'Central agricultural policies, subsidy payments, and extension services.',
  },
  {
    key: 'tarimtv',
    name: 'Tarım TV',
    shortName: 'Tarım TV',
    nameEn: 'Tarım TV (Agricultural Television)',
    domain: 'tarimtv.gov.tr',
    website: 'https://www.tarimtv.gov.tr',
    agencyType: 'Central Ministry',
    sector: 'Central Policy & Extension',
    rssFeed: null,
    hasLiveFeed: false,
    description: 'Bakanlığın resmî tarım televizyon kanalı; eğitim ve bilgilendirme yayını.',
    descriptionEn: 'The Ministry\'s official agricultural television channel; educational broadcasts.',
  },
  {
    key: 'tmo',
    name: 'Toprak Mahsulleri Ofisi (TMO)',
    shortName: 'TMO',
    nameEn: 'Turkish Grain Board',
    domain: 'tmo.gov.tr',
    website: 'https://www.tmo.gov.tr',
    agencyType: 'State-Owned Enterprise',
    sector: 'Grains & Cereals',
    rssFeed: 'https://www.tmo.gov.tr/feed',
    hasLiveFeed: true,
    description: 'Hububat alım fiyatları, müdahale alımları ve tahıl ticareti yönetimi.',
    descriptionEn: 'Cereal purchase prices, intervention buying, and grain trade management.',
  },
  {
    key: 'esk',
    name: 'Et ve Süt Kurumu (ESK)',
    shortName: 'ESK',
    nameEn: 'Meat and Milk Board',
    domain: 'esk.gov.tr',
    website: 'https://www.esk.gov.tr',
    agencyType: 'State-Owned Enterprise',
    sector: 'Livestock & Dairy',
    rssFeed: 'https://www.esk.gov.tr/Pages/Rss',
    hasLiveFeed: true,
    description: 'Et ve süt piyasası müdahaleleri, fiyatlandırma ve destekleme alımları.',
    descriptionEn: 'Meat and milk market interventions, pricing, and support purchases.',
  },
  {
    key: 'tigem',
    name: 'TİGEM (Tarım İşletmeleri Genel Müdürlüğü)',
    shortName: 'TİGEM',
    nameEn: 'General Directorate of Agricultural Enterprises',
    domain: 'tigem.gov.tr',
    website: 'https://www.tigem.gov.tr',
    agencyType: 'State-Owned Enterprise',
    sector: 'Seeds & State Farming',
    rssFeed: null,
    hasLiveFeed: false,
    description: 'Devlet tarım işletmeleri, tohum üretimi ve damızlık hayvan yetiştiriciliği.',
    descriptionEn: 'State farming operations, seed production, and breeding livestock management.',
  },
  {
    key: 'tagem',
    name: 'TAGEM (Tarımsal Araştırmalar ve Politikalar)',
    shortName: 'TAGEM',
    nameEn: 'General Directorate of Agricultural Research and Policies',
    domain: 'tarimorman.gov.tr',
    website: 'https://www.tarimorman.gov.tr/Konu/75/tagem',
    agencyType: 'Research & Extension',
    sector: 'Research & Disease Control',
    rssFeed: null,
    hasLiveFeed: false,
    description: 'Tarımsal araştırma, hastalık ve zararlı mücadele, tohum ıslah programları.',
    descriptionEn: 'Agricultural research, pest and disease control, and seed improvement programs.',
  },
  {
    key: 'dsi',
    name: 'Devlet Su İşleri (DSİ)',
    shortName: 'DSİ',
    nameEn: 'State Hydraulic Works',
    domain: 'dsi.gov.tr',
    website: 'https://www.dsi.gov.tr',
    agencyType: 'Water & Infrastructure',
    sector: 'Irrigation & Water',
    rssFeed: 'https://www.dsi.gov.tr/rss',
    hasLiveFeed: true,
    description: 'Sulama projeleri, baraj yönetimi ve su kaynakları planlaması.',
    descriptionEn: 'Irrigation projects, dam management, and water resources planning.',
  },
  {
    key: 'tkdk',
    name: 'TKDK (Tarımsal Kalkınma Kooperatifi)',
    shortName: 'TKDK',
    nameEn: 'Agricultural and Rural Development Support Institution',
    domain: 'tkdk.gov.tr',
    website: 'https://www.tkdk.gov.tr',
    agencyType: 'Grants & Financing',
    sector: 'Grants & EU IPARD',
    rssFeed: 'https://www.tkdk.gov.tr/Default.aspx?RSS',
    hasLiveFeed: true,
    description: 'IPARD fonları, hibe çağrıları ve kırsal kalkınma destekleri.',
    descriptionEn: 'IPARD funds, grant calls, and rural development support.',
  },
  {
    key: 'tarsim',
    name: 'TARSİM (Tarım Sigortaları Havuzu)',
    shortName: 'TARSİM',
    nameEn: 'Agricultural Insurance Pool',
    domain: 'tarsim.gov.tr',
    website: 'https://www.tarsim.gov.tr',
    agencyType: 'Insurance & Risk',
    sector: 'Risk & Disaster Relief',
    rssFeed: 'https://www.tarsim.gov.tr/rss',
    hasLiveFeed: true,
    description: 'Tarım sigortası poliçeleri, hasar ödemeleri ve afet tazminatları.',
    descriptionEn: 'Agricultural insurance policies, damage payments, and disaster compensation.',
  },
  {
    key: 'caykur',
    name: 'ÇAYKUR (Çay İşletmeleri Genel Müdürlüğü)',
    shortName: 'ÇAYKUR',
    nameEn: 'General Directorate of Tea Enterprises',
    domain: 'caykur.gov.tr',
    website: 'https://www.caykur.gov.tr',
    agencyType: 'State-Owned Enterprise',
    sector: 'Tea & Industrial Crops',
    rssFeed: null,
    hasLiveFeed: false,
    description: 'Çay alım fiyatları, işleme ve pazarlama faaliyetleri.',
    descriptionEn: 'Tea purchase prices, processing, and marketing operations.',
  },
  {
    key: 'turkseker',
    name: 'TÜRKŞEKER (Türkiye Şeker Fabrikaları)',
    shortName: 'TÜRKŞEKER',
    nameEn: 'Turkish Sugar Factories Corporation',
    domain: 'turkseker.gov.tr',
    website: 'https://www.turkseker.gov.tr',
    agencyType: 'State-Owned Enterprise',
    sector: 'Sugar & Sweeteners',
    rssFeed: null,
    hasLiveFeed: false,
    description: 'Şeker pancarı alımları, kota yönetimi ve fabrika işletmeciliği.',
    descriptionEn: 'Sugar beet procurement, quota management, and factory operations.',
  },
  {
    key: 'tuik',
    name: 'TÜİK (Türkiye İstatistik Kurumu)',
    shortName: 'TÜİK',
    nameEn: 'Turkish Statistical Institute',
    domain: 'tuik.gov.tr',
    website: 'https://www.tuik.gov.tr',
    agencyType: 'Statistics & Legislation',
    sector: 'Statistics',
    rssFeed: 'https://www.tuik.gov.tr/rss',
    hasLiveFeed: true,
    description: 'Tarım istatistikleri, ürün verim verileri ve gıda fiyat endeksleri.',
    descriptionEn: 'Agricultural statistics, crop yield data, and food price indices.',
  },
  {
    key: 'resmigazete',
    name: 'Resmî Gazete',
    shortName: 'Resmî Gazete',
    nameEn: 'Official Gazette of the Republic of Türkiye',
    domain: 'resmigazete.gov.tr',
    website: 'https://www.resmigazete.gov.tr',
    agencyType: 'Statistics & Legislation',
    sector: 'Legislation',
    rssFeed: 'https://www.resmigazete.gov.tr/rss',
    hasLiveFeed: true,
    description: 'Tarım ile ilgili tebliğler, yönetmelikler ve kanun hükmünde kararnameler.',
    descriptionEn: 'Agriculture-related regulations, directives, and statutory decrees.',
  },
  {
    key: 'tarimkredi',
    name: 'Tarım Kredi Kooperatifleri',
    shortName: 'Tarım Kredi',
    nameEn: 'Agricultural Credit Cooperatives',
    domain: 'tarimkredi.org.tr',
    website: 'https://www.tarimkredi.org.tr',
    agencyType: 'Producer Cooperative',
    sector: 'Producer Credit & Inputs',
    rssFeed: null,
    hasLiveFeed: false,
    description: 'Çiftçi kredileri, girdi temini (gübre, tohum, ilaç) ve kooperatif hizmetleri.',
    descriptionEn: 'Farmer credit, input supply (fertilizer, seed, pesticides), and cooperative services.',
  },
  {
    key: 'aa',
    name: 'Anadolu Ajansı (AA) - Tarım',
    shortName: 'AA Tarım',
    nameEn: 'Anadolu Agency - Agriculture',
    domain: 'aa.com.tr',
    website: 'https://www.aa.com.tr/tr/tarim',
    agencyType: 'Wire Service',
    sector: 'Wire Coverage',
    rssFeed: 'https://www.aa.com.tr/rss/tarim',
    hasLiveFeed: true,
    description: 'Tarım haber ajansı kapsamı, sektör haberi ve güncel gelişmeler.',
    descriptionEn: 'Agriculture wire coverage, sector news, and current developments.',
  },
];

export const GOV_SOURCES_BY_KEY: Record<string, GovSource> = Object.fromEntries(
  GOV_SOURCES.map((s) => [s.key, s]),
);

export const AGENCY_TYPES: AgencyType[] = [
  'Central Ministry',
  'State-Owned Enterprise',
  'Research & Extension',
  'Grants & Financing',
  'Water & Infrastructure',
  'Insurance & Risk',
  'Statistics & Legislation',
  'Producer Cooperative',
  'Wire Service',
];

export const SECTORS: Sector[] = [
  'Central Policy & Extension',
  'Grains & Cereals',
  'Livestock & Dairy',
  'Seeds & State Farming',
  'Research & Disease Control',
  'Irrigation & Water',
  'Grants & EU IPARD',
  'Risk & Disaster Relief',
  'Tea & Industrial Crops',
  'Sugar & Sweeteners',
  'Statistics',
  'Legislation',
  'Producer Credit & Inputs',
  'Wire Coverage',
];

// Group sources by agency type for sidebar rendering
export const SOURCES_BY_AGENCY_TYPE: Record<AgencyType, GovSource[]> = AGENCY_TYPES.reduce(
  (acc, type) => {
    acc[type] = GOV_SOURCES.filter((s) => s.agencyType === type);
    return acc;
  },
  {} as Record<AgencyType, GovSource[]>,
);

// Seed article definitions for all 13 organizations
export interface GovSeedArticle {
  title: string;
  title_en: string;
  summary: string;
  summary_en: string;
  category: string;
  region: string;
  source: string;
  source_key: string;
  agency_type: AgencyType;
  sector: Sector;
  published_at: string;
}

export const GOV_SEED_ARTICLES: GovSeedArticle[] = [
  // --- T.C. Tarım ve Orman Bakanlığı ---
  {
    title: '2026 Tarımsal Destekleme Ödemeleri İçin Başvurular Başladı',
    title_en: '2026 Agricultural Support Payment Applications Open',
    summary: 'Tarım ve Orman Bakanlığı, 2026 yılı tarımsal destekleme ödemeleri için başvuruların 1 Kasım itibarıyla başladığını duyurdu. Çiftçiler e-Devlet üzerinden veya il müdürlüklerine başvuru yapabilir.',
    summary_en: 'The Ministry of Agriculture and Forestry announced that applications for 2026 agricultural support payments have opened as of November 1. Farmers can apply via e-Government or provincial directorates.',
    category: 'policy',
    region: 'all',
    source: 'T.C. Tarım ve Orman Bakanlığı',
    source_key: 'tarimorman',
    agency_type: 'Central Ministry',
    sector: 'Central Policy & Extension',
    published_at: '2026-10-22T09:00:00Z',
  },
  {
    title: 'Bakanlık\'tan Kırsal Kalkınma Yeni Strateji Belgesi Yayımlandı',
    title_en: 'New Rural Development Strategy Document Published by the Ministry',
    summary: '2026-2030 dönemini kapsayan Ulusal Kırsal Kalkınma Strateji Belgesi Resmî Gazete\'de yayımlandı. Belge kırsal istihdam, dijital tarım ve kadın girişimciliğe odaklanıyor.',
    summary_en: 'The National Rural Development Strategy Document covering 2026-2030 was published in the Official Gazette. The document focuses on rural employment, digital agriculture, and women entrepreneurs.',
    category: 'policy',
    region: 'all',
    source: 'T.C. Tarım ve Orman Bakanlığı',
    source_key: 'tarimorman',
    agency_type: 'Central Ministry',
    sector: 'Central Policy & Extension',
    published_at: '2026-10-18T14:30:00Z',
  },
  {
    title: 'Tarım TV Yeni Yayın Dönemi: Akıllı Tarım Uygulamaları Serisi',
    title_en: 'Tarım TV New Season: Smart Agriculture Applications Series',
    summary: 'Tarım TV, yeni yayın döneminde akıllı tarım uygulamaları, hassas tarım teknolojileri ve dijital çiftlik yönetimi konularında eğitim serisi başlatıyor.',
    summary_en: 'Tarım TV launches an educational series on smart agriculture applications, precision farming technologies, and digital farm management for the new broadcast season.',
    category: 'general',
    region: 'all',
    source: 'Tarım TV',
    source_key: 'tarimtv',
    agency_type: 'Central Ministry',
    sector: 'Central Policy & Extension',
    published_at: '2026-10-15T10:00:00Z',
  },

  // --- TMO ---
  {
    title: 'TMO 2026/2027 Hububat Alım Fiyatları Açıklandı',
    title_en: 'TMO 2026/2027 Cereal Purchase Prices Announced',
    summary: 'Toprak Mahsulleri Ofisi, 2026/2027 sezonu hububat alım fiyatlarını açıkladı. Kırmızı sert buğday ton başına 13.250 TL, beyaz sert buğday 13.000 TL olarak belirlendi.',
    summary_en: 'The Turkish Grain Board announced 2026/2027 season cereal purchase prices. Red hard wheat is set at 13,250 TL per ton, white hard wheat at 13,000 TL per ton.',
    category: 'market',
    region: 'İç Anadolu',
    source: 'Toprak Mahsulleri Ofisi (TMO)',
    source_key: 'tmo',
    agency_type: 'State-Owned Enterprise',
    sector: 'Grains & Cereals',
    published_at: '2026-10-21T11:00:00Z',
  },
  {
    title: 'TMO Müdahale Alımları: Mısır Stokları Güvenli Seviyede',
    title_en: 'TMO Intervention Purchases: Corn Stocks at Safe Levels',
    summary: 'TMO, iç talebi karşılamak üzere mısır müdahale alımlarını sürdürüyor. Mevcut stokların 2.8 milyon ton ile güvenli seviyede olduğu bildirildi.',
    summary_en: 'TMO continues corn intervention purchases to meet domestic demand. Current stocks are reported at a safe level of 2.8 million tons.',
    category: 'market',
    region: 'Marmara',
    source: 'Toprak Mahsulleri Ofisi (TMO)',
    source_key: 'tmo',
    agency_type: 'State-Owned Enterprise',
    sector: 'Grains & Cereals',
    published_at: '2026-10-19T08:15:00Z',
  },

  // --- ESK ---
  {
    title: 'ESK Et Fiyatlarındaki Düşüşün Ardından Müdahale Alımı Kararı Aldı',
    title_en: 'ESK Decides on Intervention Purchases After Meat Price Decline',
    summary: 'Et ve Süt Kurumu, kırmızı et fiyatlarındaki düşüşü dengelemek amacıyla müdahale alımlarına başlayacağını açıkladı. Haftalık 5.000 ton sığır eti alımı planlanıyor.',
    summary_en: 'The Meat and Milk Board announced it will begin intervention purchases to stabilize red meat prices following a decline. A weekly purchase of 5,000 tons of beef is planned.',
    category: 'market',
    region: 'all',
    source: 'Et ve Süt Kurumu (ESK)',
    source_key: 'esk',
    agency_type: 'State-Owned Enterprise',
    sector: 'Livestock & Dairy',
    published_at: '2026-10-22T15:00:00Z',
  },
  {
    title: 'ESK Süt Tozu İhracatında Yeni Rekora Doğru',
    title_en: 'ESK Approaching New Record in Milk Powder Exports',
    summary: 'Et ve Süt Kurumu destekleriyle süt tozu üretimi 180.000 tona yaklaştı. İhracat gelirinin 950 milyon dolara ulaşması bekleniyor.',
    summary_en: 'With Meat and Milk Board support, milk powder production is approaching 180,000 tons. Export revenue is expected to reach 950 million dollars.',
    category: 'market',
    region: 'all',
    source: 'Et ve Süt Kurumu (ESK)',
    source_key: 'esk',
    agency_type: 'State-Owned Enterprise',
    sector: 'Livestock & Dairy',
    published_at: '2026-10-16T12:00:00Z',
  },

  // --- TİGEM ---
  {
    title: 'TİGEM 2026 Tohumluk Dağıtım Programı Yayında',
    title_en: 'TİGEM 2026 Seed Distribution Program Published',
    summary: 'Tarım İşletmeleri Genel Müdürlüğü, 2026 yılı sertifikalı tohumluk dağıtım programını yayımladı. Buğday, arpa ve ayçiçeği tohumları 15 Kasım\'dan itibaren dağıtılacak.',
    summary_en: 'The General Directorate of Agricultural Enterprises published its 2026 certified seed distribution program. Wheat, barley, and sunflower seeds will be distributed starting November 15.',
    category: 'policy',
    region: 'İç Anadolu',
    source: 'TİGEM',
    source_key: 'tigem',
    agency_type: 'State-Owned Enterprise',
    sector: 'Seeds & State Farming',
    published_at: '2026-10-20T09:30:00Z',
  },
  {
    title: 'TİGEM Damızlık Sığır Satış İhalesi Sonuçlandı',
    title_en: 'TİGEM Breeding Cattle Sale Auction Concluded',
    summary: 'TİGEM\'in Ceylanpınar Tarım İşletmesi\'ndeki damızlık Holstein satış ihalesi tamamlandı. Ortalama satış fiyatı başına 68.500 TL olarak gerçekleşti.',
    summary_en: 'TİGEM\'s breeding Holstein sale auction at Ceylanpınar Agricultural Enterprise was completed. The average sale price was 68,500 TL per head.',
    category: 'market',
    region: 'Güneydoğu Anadolu',
    source: 'TİGEM',
    source_key: 'tigem',
    agency_type: 'State-Owned Enterprise',
    sector: 'Seeds & State Farming',
    published_at: '2026-10-14T16:00:00Z',
  },

  // --- TAGEM ---
  {
    title: 'TAGEM Buğday Pas Hastalığı Erken Uyarı Sistemi Devrede',
    title_en: 'TAGEM Wheat Rust Disease Early Warning System Operational',
    summary: 'Tarımsal Araştırmalar Genel Müdürlüğü, İç Anadolu\'da buğday pas hastalığı için yeni erken uyarı sistemini devreye aldı. Sistem tarla sensörleri ve uydu verisi kullanıyor.',
    summary_en: 'The General Directorate of Agricultural Research activated a new early warning system for wheat rust disease in Central Anatolia. The system uses field sensors and satellite data.',
    category: 'policy',
    region: 'İç Anadolu',
    source: 'TAGEM',
    source_key: 'tagem',
    agency_type: 'Research & Extension',
    sector: 'Research & Disease Control',
    published_at: '2026-10-21T13:45:00Z',
  },
  {
    title: 'TAGEM Yeni Domates Çeşidi: \"Anatolia F1\" Tescil Edildi',
    title_en: 'TAGEM New Tomato Variety: "Anatolia F1" Registered',
    summary: 'TAGEM araştırmacıları, kuraklığa dayanıklı ve yüksek verimli \"Anatolia F1\" domates çeşidini tescilledi. Çeşit dekara 8-10 ton verim potansiyeline sahip.',
    summary_en: 'TAGEM researchers registered the drought-resistant, high-yield "Anatolia F1" tomato variety. The variety has a yield potential of 8-10 tons per decare.',
    category: 'general',
    region: 'Akdeniz',
    source: 'TAGEM',
    source_key: 'tagem',
    agency_type: 'Research & Extension',
    sector: 'Research & Disease Control',
    published_at: '2026-10-12T11:20:00Z',
  },

  // --- DSİ ---
  {
    title: 'DSİ 2026 Sulama Sezonu Açılış Tarihi Açıklandı',
    title_en: 'DSİ 2026 Irrigation Season Opening Date Announced',
    summary: 'Devlet Su İşleri, 2026 sulama sezonunun 15 Nisan\'da açılacağını duyurdu. Konya Ovası, Harran Ovası ve GAP sulama şebekeleri için hazırlıklar sürüyor.',
    summary_en: 'The State Hydraulic Works announced that the 2026 irrigation season will open on April 15. Preparations continue for Konya Plain, Harran Plain, and GAP irrigation networks.',
    category: 'policy',
    region: 'İç Anadolu',
    source: 'Devlet Su İşleri (DSİ)',
    source_key: 'dsi',
    agency_type: 'Water & Infrastructure',
    sector: 'Irrigation & Water',
    published_at: '2026-10-20T10:00:00Z',
  },
  {
    title: 'DSİ\'den Sulamada Tasarruf: Damla Sulama Hibeleri Genişletildi',
    title_en: 'DSİ Water Savings: Drip Irrigation Grants Expanded',
    summary: 'Devlet Su İşleri, damla sulama sistemleri için hibe oranını %60\'dan %75\'e çıkardı. Hedef yıllık 2 milyar m³ su tasarrufu sağlamak.',
    summary_en: 'The State Hydraulic Works raised the grant rate for drip irrigation systems from 60% to 75%. The target is to save 2 billion cubic meters of water annually.',
    category: 'policy',
    region: 'all',
    source: 'Devlet Su İşleri (DSİ)',
    source_key: 'dsi',
    agency_type: 'Water & Infrastructure',
    sector: 'Irrigation & Water',
    published_at: '2026-10-17T14:00:00Z',
  },

  // --- TKDK ---
  {
    title: 'TKDK 13. IPARD Çağrısı: 4.2 Milyar TL Hibe Duyuruldu',
    title_en: 'TKDK 13th IPARD Call: 4.2 Billion TL Grant Announced',
    summary: 'Tarımsal Kalkınma Kooperatifi, 13. IPARD çağrısı kapsamında 4.2 milyar TL hibe desteği duyurdu. Süt üretimi, meyve işleme ve kırsal turizm yatırımları desteklenecek.',
    summary_en: 'The Agricultural and Rural Development Support Institution announced 4.2 billion TL in grant support under the 13th IPARD call. Milk production, fruit processing, and rural tourism investments will be supported.',
    category: 'policy',
    region: 'all',
    source: 'TKDK',
    source_key: 'tkdk',
    agency_type: 'Grants & Financing',
    sector: 'Grants & EU IPARD',
    published_at: '2026-10-22T10:30:00Z',
  },
  {
    title: 'TKDK IPARD Başvuru Başvuru Eğitimleri Kasımda Başlıyor',
    title_en: 'TKDK IPARD Application Trainings Start in November',
    summary: 'TKDK, 13. çağrı dönemi için ücretsiz başvuru eğitim seminerlerini 81 ilde başlatıyor. Eğitimlerde proje hazırlama, bütçe planlama ve raporlama konuları işlenecek.',
    summary_en: 'TKDK is launching free application training seminars in all 81 provinces for the 13th call period. Topics include project preparation, budget planning, and reporting.',
    category: 'general',
    region: 'all',
    source: 'TKDK',
    source_key: 'tkdk',
    agency_type: 'Grants & Financing',
    sector: 'Grants & EU IPARD',
    published_at: '2026-10-18T09:00:00Z',
  },

  // --- TARSİM ---
  {
    title: 'TARSİM 2026 Kuraklık Tazminat Ödemeleri Devam Ediyor',
    title_en: 'TARSİM 2026 Drought Compensation Payments Continue',
    summary: 'Tarım Sigortaları Havuzu, 2026 yılı kuraklık hasar ödemelerini sürdürüyor. Şu ana kadar 38 ilde 12.500 çiftçiye 420 milyon TL ödeme yapıldı.',
    summary_en: 'The Agricultural Insurance Pool continues 2026 drought damage payments. To date, 420 million TL has been paid to 12,500 farmers in 38 provinces.',
    category: 'policy',
    region: 'İç Anadolu',
    source: 'TARSİM',
    source_key: 'tarsim',
    agency_type: 'Insurance & Risk',
    sector: 'Risk & Disaster Relief',
    published_at: '2026-10-21T16:00:00Z',
  },
  {
    title: 'TARSİM Poliçe Kapsamı Dolu Yağışı ve Sel İçin Genişletildi',
    title_en: 'TARSİM Policy Coverage Expanded for Hail and Flood',
    summary: 'TARSİM, 2026 yılı poliçelerinde dolu yağışı ve sel hasarını da kapsayan yeni sigorta paketi tanıttı. Prim desteği %50 ile %65 arasında değişiyor.',
    summary_en: 'TARSİM introduced a new insurance package covering hail and flood damage in 2026 policies. Premium support ranges from 50% to 65%.',
    category: 'policy',
    region: 'all',
    source: 'TARSİM',
    source_key: 'tarsim',
    agency_type: 'Insurance & Risk',
    sector: 'Risk & Disaster Relief',
    published_at: '2026-10-13T11:00:00Z',
  },

  // --- ÇAYKUR ---
  {
    title: 'ÇAYKUR 2026 Çay Alım Fiyatları Yükseltildi',
    title_en: 'ÇAYKUR 2026 Tea Purchase Prices Increased',
    summary: 'Çay İşletmeleri Genel Müdürlüğü, 2026 yılı yaş çay alım fiyatını kilogramda 14.50 TL\'ye yükseltti. Bu, geçen yıla göre %18 oranında artış anlamına geliyor.',
    summary_en: 'The General Directorate of Tea Enterprises raised the 2026 fresh tea purchase price to 14.50 TL per kilogram. This represents an 18% increase over last year.',
    category: 'market',
    region: 'Karadeniz',
    source: 'ÇAYKUR',
    source_key: 'caykur',
    agency_type: 'State-Owned Enterprise',
    sector: 'Tea & Industrial Crops',
    published_at: '2026-10-19T10:00:00Z',
  },
  {
    title: 'ÇAYKUR Yeni Çay İşleme Tesisi Rize\'de Açıldı',
    title_en: 'ÇAYKUR New Tea Processing Facility Opened in Rize',
    summary: 'ÇAYKUR\'un Rize\'de kurduğu yeni çay işleme tesisi açıldı. Günlük 250 ton yaş çay işleme kapasitesine sahip tesis, bölgede 400 kişiye istihdam sağlıyor.',
    summary_en: 'ÇAYKUR\'s new tea processing facility in Rize has opened. The facility has a daily processing capacity of 250 tons of fresh tea and provides employment for 400 people in the region.',
    category: 'general',
    region: 'Karadeniz',
    source: 'ÇAYKUR',
    source_key: 'caykur',
    agency_type: 'State-Owned Enterprise',
    sector: 'Tea & Industrial Crops',
    published_at: '2026-10-11T14:30:00Z',
  },

  // --- TÜRKŞEKER ---
  {
    title: 'TÜRKŞEKER 2026 Şeker Pancarı Alım Fiyatı: 2.150 TL/Ton',
    title_en: 'TÜRKŞEKER 2026 Sugar Beet Purchase Price: 2,150 TL/Ton',
    summary: 'Türkiye Şeker Fabrikaları, 2026 kampanya dönemi şeker pancarı alım fiyatını ton başına 2.150 TL olarak açıkladı. Geçen yıla göre %22 artış.',
    summary_en: 'Turkish Sugar Factories announced the 2026 campaign sugar beet purchase price at 2,150 TL per ton. A 22% increase over last year.',
    category: 'market',
    region: 'İç Anadolu',
    source: 'TÜRKŞEKER',
    source_key: 'turkseker',
    agency_type: 'State-Owned Enterprise',
    sector: 'Sugar & Sweeteners',
    published_at: '2026-10-20T15:00:00Z',
  },
  {
    title: 'TÜRKŞEKER Pancar Kampanyası 20 Ekim\'de Başladı',
    title_en: 'TÜRKŞEKER Beet Campaign Started on October 20',
    summary: 'TÜRKŞEKER\'in 2026-2027 şeker pancarı kampanyası 20 Ekim\'de başladı. 25 fabrikanın tamamı kesintisiz üretim için hazır duruma getirildi.',
    summary_en: 'TÜRKŞEKER\'s 2026-2027 sugar beet campaign started on October 20. All 25 factories were prepared for continuous production.',
    category: 'general',
    region: 'all',
    source: 'TÜRKŞEKER',
    source_key: 'turkseker',
    agency_type: 'State-Owned Enterprise',
    sector: 'Sugar & Sweeteners',
    published_at: '2026-10-20T06:00:00Z',
  },

  // --- TÜİK ---
  {
    title: 'TÜİK 2026 Üçüncü Çeyrek Tarımsal GSYH: %3.8 Büyüme',
    title_en: 'TÜİK Q3 2026 Agricultural GDP: 3.8% Growth',
    summary: 'Türkiye İstatistik Kurumu verilerine göre tarım sektörü 2026 üçüncü çeyrekte %3.8 büyüdü. Hayvancılık alt sektörü %6.2 ile en yüksek katkıyı sağladı.',
    summary_en: 'According to Turkish Statistical Institute data, the agricultural sector grew 3.8% in Q3 2026. The livestock sub-sector contributed the most at 6.2%.',
    category: 'market',
    region: 'all',
    source: 'TÜİK',
    source_key: 'tuik',
    agency_type: 'Statistics & Legislation',
    sector: 'Statistics',
    published_at: '2026-10-22T10:00:00Z',
  },
  {
    title: 'TÜİK Gıda Enflasyonu Eylülde %1.2 Geriledi',
    title_en: 'TÜİK Food Inflation Declined 1.2% in September',
    summary: 'TÜİK verilerine göre eylül ayında gıda ve alkolsüz içecek fiyatları aylık %1.2 düştü. Meyve-sebze grubunda fiyat düşüşü belirgin oldu.',
    summary_en: 'According to TÜİK data, food and non-alcoholic beverage prices fell 1.2% monthly in September. Price declines were notable in the fruit-vegetable group.',
    category: 'market',
    region: 'all',
    source: 'TÜİK',
    source_key: 'tuik',
    agency_type: 'Statistics & Legislation',
    sector: 'Statistics',
    published_at: '2026-10-17T09:00:00Z',
  },

  // --- Resmî Gazete ---
  {
    title: 'Resmî Gazete: Tarımsal Destekleme Kanununda Değişiklik Yapıldı',
    title_en: 'Official Gazette: Agricultural Support Law Amended',
    summary: '5488 sayılı Tarım Kanununda değişiklik yapan tebliğ Resmî Gazete\'de yayımlandı. Değişiklik dijital tarım uygulamaları için yeni destek kalemi ekliyor.',
    summary_en: 'A directive amending Agricultural Law No. 5488 was published in the Official Gazette. The amendment adds a new support line for digital agriculture applications.',
    category: 'policy',
    region: 'all',
    source: 'Resmî Gazete',
    source_key: 'resmigazete',
    agency_type: 'Statistics & Legislation',
    sector: 'Legislation',
    published_at: '2026-10-22T08:00:00Z',
  },
  {
    title: 'Resmî Gazete: Organik Tarım Tebliği Yürürlüğe Girdi',
    title_en: 'Official Gazette: Organic Agriculture Directive Entered into Force',
    summary: 'Organik Tarımın Esasları ve Uygulanmasına İlişkin Tebliğ Resmî Gazete\'de yayımlanarak yürürlüğe girdi. Tebliğ sertifikasyon süreçlerini kolaylaştırıyor.',
    summary_en: 'The Directive on the Principles and Implementation of Organic Agriculture was published in the Official Gazette and entered into force. The directive simplifies certification processes.',
    category: 'policy',
    region: 'all',
    source: 'Resmî Gazete',
    source_key: 'resmigazete',
    agency_type: 'Statistics & Legislation',
    sector: 'Legislation',
    published_at: '2026-10-14T08:30:00Z',
  },

  // --- Tarım Kredi ---
  {
    title: 'Tarım Kredi\'den Gübre Fiyatlarında %15 İndirim',
    title_en: 'Agricultural Credit Cooperative Announces 15% Fertilizer Price Cut',
    summary: 'Tarım Kredi Kooperatifleri, gübre fiyatlarında ortalama %15 indirim yaptığını açıkladı. İndirim DAP, üre ve ASN gübrelerini kapsıyor.',
    summary_en: 'Agricultural Credit Cooperatives announced an average 15% price reduction on fertilizers. The reduction covers DAP, urea, and ASN fertilizers.',
    category: 'market',
    region: 'all',
    source: 'Tarım Kredi Kooperatifleri',
    source_key: 'tarimkredi',
    agency_type: 'Producer Cooperative',
    sector: 'Producer Credit & Inputs',
    published_at: '2026-10-21T09:00:00Z',
  },
  {
    title: 'Tarım Kredi Düşük Faizli Çiftçi Kredisi Paketi Yayında',
    title_en: 'Agricultural Credit Launches Low-Interest Farmer Credit Package',
    summary: 'Tarım Kredi Kooperatifleri, ekim dönemi için düşük faizli çiftçi kredisi paketi yayınladı. 100.000 TL\'ye kadar krediler aylık %0.89 faizle sağlanıyor.',
    summary_en: 'Agricultural Credit Cooperatives released a low-interest farmer credit package for the planting season. Credits up to 100,000 TL are offered at 0.89% monthly interest.',
    category: 'policy',
    region: 'all',
    source: 'Tarım Kredi Kooperatifleri',
    source_key: 'tarimkredi',
    agency_type: 'Producer Cooperative',
    sector: 'Producer Credit & Inputs',
    published_at: '2026-10-16T10:00:00Z',
  },

  // --- Anadolu Ajansı ---
  {
    title: 'AA: Türkiye\'nin Buğday Üretimi 2026\'da Rekor Bekleniyor',
    title_en: 'AA: Turkey\'s Wheat Production Expected to Hit Record in 2026',
    summary: 'Anadolu Ajansı\'nın tarım muhabirlerinin derlediği bilgilere göre, 2026 buğday üretiminin 22.5 milyon tona ulaşarak rekor kırması bekleniyor.',
    summary_en: 'According to information compiled by Anadolu Agency\'s agriculture correspondents, 2026 wheat production is expected to reach 22.5 million tons, a new record.',
    category: 'market',
    region: 'all',
    source: 'Anadolu Ajansı',
    source_key: 'aa',
    agency_type: 'Wire Service',
    sector: 'Wire Coverage',
    published_at: '2026-10-22T12:00:00Z',
  },
  {
    title: 'AA: İhracatçılar Antep Fıstığı Pazarında Yeni Pazarlar Arıyor',
    title_en: 'AA: Exporters Seek New Markets for Pistachios',
    summary: 'Anadolu Ajansı\'na göre, Gaziantepli Antep fıstığı ihracatçıları Avrupa ve Uzakdoğu pazarlarına açılıyor. 2026 ihracat hedefi 220 milyon dolar.',
    summary_en: 'According to Anadolu Agency, pistachio exporters from Gaziantep are expanding into European and Far Eastern markets. The 2026 export target is 220 million dollars.',
    category: 'general',
    region: 'Güneydoğu Anadolu',
    source: 'Anadolu Ajansı',
    source_key: 'aa',
    agency_type: 'Wire Service',
    sector: 'Wire Coverage',
    published_at: '2026-10-18T13:00:00Z',
  },
];
