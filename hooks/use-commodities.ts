'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CommodityExchange {
  id: string;
  name: string;
  short_name: string | null;
  city: string;
  region: string;
  specialties: string[];
  latitude: number;
  longitude: number;
  latest_price_date: string | null;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
}

export interface CommodityPrice {
  id: string;
  exchange_id: string;
  commodity_name: string;
  commodity_category: string;
  unit: string;
  price: number;
  min_price: number | null;
  max_price: number | null;
  currency: string;
  change_pct: number;
  recorded_date: string;
}

export interface CommodityPriceWithExchange extends CommodityPrice {
  exchange: CommodityExchange | null;
}

export interface CommoditySource {
  id: string;
  name: string;
  source_type: 'rss_xml' | 'json_api' | 'manual_json' | 'tobb_html';
  url: string;
  api_key_env: string | null;
  exchange_id: string | null;
  fetch_interval: 'hourly' | 'daily' | 'weekly';
  is_active: boolean;
  field_mapping: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CommoditySourceLog {
  id: string;
  source_id: string;
  status: 'success' | 'failed';
  records_ingested: number;
  error_message: string | null;
  created_at: string;
}

export interface CommodityIconOverride {
  commodity_name: string;
  icon_name: string;
  icon_type: 'lucide' | 'custom';
  icon_svg_path: string | null;
}

export interface CommodityRegistryEntry {
  commodity_name: string;
  category: string;
  unit: string;
  translation_tr: string;
  translation_en: string;
  translation_ar: string;
  icon_name: string;
  icon_type: 'lucide' | 'custom';
  icon_svg_path: string | null;
  display_order: number;
  is_visible: boolean;
  is_featured: boolean;
}

export function useCommodities() {
  const [exchanges, setExchanges] = useState<CommodityExchange[]>([]);
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [sources, setSources] = useState<CommoditySource[]>([]);
  const [sourceLogs, setSourceLogs] = useState<CommoditySourceLog[]>([]);
  const [iconOverrides, setIconOverrides] = useState<Record<string, { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null }>>({});
  const [registry, setRegistry] = useState<CommodityRegistryEntry[]>([]);
  const [commodityCategories, setCommodityCategories] = useState<{ key: string; translation_tr: string; translation_en: string; translation_ar: string; sort_order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [exRes, priceRes, srcRes, logRes, iconRes, regRes, catRes] = await Promise.all([
      supabase.from('commodity_exchanges').select('*').order('name'),
      supabase.from('commodity_prices').select('*').order('recorded_date', { ascending: true }),
      supabase.from('commodity_sources').select('*').order('created_at', { ascending: false }),
      supabase.from('commodity_source_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('commodity_icon_overrides').select('commodity_name, icon_name, icon_type, icon_svg_path'),
      supabase.from('commodity_registry').select('*').order('commodity_name'),
      supabase.from('commodity_categories').select('*').order('sort_order'),
    ]);

    if (exRes.error) {
      setError(exRes.error.message);
    } else {
      setExchanges(exRes.data as CommodityExchange[]);
    }

    if (priceRes.error) {
      setError(priceRes.error.message);
    } else {
      setPrices(priceRes.data as CommodityPrice[]);
    }

    if (srcRes.data) setSources(srcRes.data as CommoditySource[]);
    if (logRes.data) setSourceLogs(logRes.data as CommoditySourceLog[]);

    if (iconRes.data) {
      const map: Record<string, { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null }> = {};
      (iconRes.data as CommodityIconOverride[]).forEach((o) => {
        map[o.commodity_name] = { icon_name: o.icon_name, icon_type: o.icon_type || 'lucide', icon_svg_path: o.icon_svg_path || null };
      });
      setIconOverrides(map);
    }

    if (regRes.data) setRegistry(regRes.data as CommodityRegistryEntry[]);
    if (catRes.data) setCommodityCategories((catRes.data as { key: string; translation_tr: string; translation_en: string; translation_ar: string; sort_order: number }[]) || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    exchanges,
    prices,
    sources,
    sourceLogs,
    iconOverrides,
    registry,
    commodityCategories,
    loading,
    error,
    refetch: fetchAll,
  };
}
