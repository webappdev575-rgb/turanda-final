import type { Locale } from '@/lib/i18n';
import type { CommodityRegistryEntry } from '@/hooks/use-commodities';

export const jobTypeTranslations: Record<string, Record<Locale, string>> = {
  'Hasat': { tr: 'Hasat', en: 'Harvest', ar: 'الحصاد' },
  'Sürüş': { tr: 'Sürüş', en: 'Driving', ar: 'القيادة' },
  'Hayvan Bakımı': { tr: 'Hayvan Bakımı', en: 'Livestock Care', ar: 'رعاية الحيوان' },
  'Ekim': { tr: 'Ekim', en: 'Planting', ar: 'الزراعة' },
  'Sulama': { tr: 'Sulama', en: 'Irrigation', ar: 'الري' },
  'Ekipman Kullanımı': { tr: 'Ekipman Kullanımı', en: 'Equipment Operation', ar: 'تشغيل المعدات' },
  'Genel İşçilik': { tr: 'Genel İşçilik', en: 'General Labor', ar: 'عمالة عامة' },
  'İşleme': { tr: 'İşleme', en: 'Processing', ar: 'المعالجة' },
};

export const commodityTranslations: Record<string, Record<Locale, string>> = {
  'Buğday': { tr: 'Buğday', en: 'Wheat', ar: 'القمح' },
  'Mısır': { tr: 'Mısır', en: 'Corn', ar: 'الذرة' },
  'Arpa': { tr: 'Arpa', en: 'Barley', ar: 'الشعير' },
  'Ayçiçeği': { tr: 'Ayçiçeği', en: 'Sunflower', ar: 'دوار الشمس' },
  'Fındık': { tr: 'Fındık', en: 'Hazelnut', ar: 'البندق' },
  'Antep Fıstığı': { tr: 'Antep Fıstığı', en: 'Pistachio', ar: 'الفستق' },
  'Mercimek': { tr: 'Mercimek', en: 'Lentils', ar: 'العدس' },
  'Zeytinyağı': { tr: 'Zeytinyağı', en: 'Olive Oil', ar: 'زيت الزيتون' },
  'Pamuk': { tr: 'Pamuk', en: 'Cotton', ar: 'القطن' },
  'Üzüm': { tr: 'Üzüm', en: 'Grapes', ar: 'العنب' },
  'İncir': { tr: 'İncir', en: 'Figs', ar: 'التين' },
  'Tütün': { tr: 'Tütün', en: 'Tobacco', ar: 'التبغ' },
  'Narenciye': { tr: 'Narenciye', en: 'Citrus', ar: 'الحمضيات' },
  'Muz': { tr: 'Muz', en: 'Banana', ar: 'الموز' },
  'Zeytin': { tr: 'Zeytin', en: 'Olives', ar: 'الزيتون' },
  'Şeker Pancarı': { tr: 'Şeker Pancarı', en: 'Sugar Beet', ar: 'البنجر السكري' },
  'Nohut': { tr: 'Nohut', en: 'Chickpeas', ar: 'الحمص' },
  'Domates': { tr: 'Domates', en: 'Tomato', ar: 'الطماطم' },
  'Çilek': { tr: 'Çilek', en: 'Strawberry', ar: 'الفراولة' },
  'Şeftali': { tr: 'Şeftali', en: 'Peach', ar: 'الخوخ' },
};

export function translateJobType(type: string, locale: Locale): string {
  return dynamicJobTypeOverrides[type]?.[locale]
    || jobTypeTranslations[type]?.[locale]
    || type;
}

let dynamicJobTypeOverrides: Record<string, Record<Locale, string>> = {};
let dynamicJobTypeIconMap: Record<string, { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null }> = {};
let dynamicJobTypeColorMap: Record<string, string> = {};

export function setDynamicJobTypeOverrides(map: Record<string, Record<Locale, string>>): void {
  dynamicJobTypeOverrides = map;
}

export function setDynamicJobTypeIcons(map: Record<string, { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null }>): void {
  dynamicJobTypeIconMap = map;
}

export function setDynamicJobTypeColors(map: Record<string, string>): void {
  dynamicJobTypeColorMap = map;
}

export function getJobTypeIcon(type: string): { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null } {
  return dynamicJobTypeIconMap[type]
    || { icon_type: 'lucide', icon_name: 'Briefcase', icon_svg_path: null };
}

export function getJobTypeColor(type: string): string {
  return dynamicJobTypeColorMap[type] || 'bg-muted text-muted-foreground border-border';
}

let dynamicTranslationOverrides: Record<string, Record<Locale, string>> = {};
let dynamicIconOverrides: Record<string, { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null }> = {};

export function setDynamicTranslationOverrides(registry: CommodityRegistryEntry[]): void {
  const map: Record<string, Record<Locale, string>> = {};
  registry.forEach((entry) => {
    map[entry.commodity_name] = {
      tr: entry.translation_tr,
      en: entry.translation_en,
      ar: entry.translation_ar,
    };
  });
  dynamicTranslationOverrides = map;
}

export function setDynamicIconOverrides(overrides: Record<string, { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null }>): void {
  dynamicIconOverrides = overrides;
}

export function translateCommodity(name: string, locale: Locale): string {
  return dynamicTranslationOverrides[name]?.[locale]
    || commodityTranslations[name]?.[locale]
    || name;
}

export function getCommodityIcon(name: string): { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null } {
  const override = dynamicIconOverrides[name];
  if (override) {
    return { icon_type: override.icon_type || 'lucide', icon_name: override.icon_name, icon_svg_path: override.icon_svg_path || null };
  }
  return { icon_type: 'lucide', icon_name: commodityIcons[name] || 'Wheat', icon_svg_path: null };
}

export const commodityIcons: Record<string, string> = {
  'Buğday': 'Wheat',
  'Mısır': 'Sprout',
  'Arpa': 'Wheat',
  'Ayçiçeği': 'Sun',
  'Fındık': 'Nut',
  'Antep Fıstığı': 'Nut',
  'Mercimek': 'LeafyGreen',
  'Zeytinyağı': 'FlaskRound',
  'Pamuk': 'Cloud',
  'Üzüm': 'Grape',
  'İncir': 'Flower',
  'Tütün': 'Leaf',
  'Narenciye': 'Citrus',
  'Muz': 'Banana',
  'Zeytin': 'TreePalm',
  'Şeker Pancarı': 'Carrot',
  'Nohut': 'LeafyGreen',
  'Domates': 'Cherry',
  'Çilek': 'Cherry',
  'Şeftali': 'Cherry',
};
