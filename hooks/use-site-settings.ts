'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CropCard } from '@/lib/types';

export interface SiteSettings {
  id: number;
  hero_background_type: string;
  hero_background_value: string;
  hero_background_opacity: number;
  news_section_categories: string[];
  news_section_post_ids: string[];
  news_section_count: number;
  news_section_mode: 'auto' | 'manual';
  marquee_mode: 'auto' | 'manual';
  marquee_post_ids: string[];
  crop_heading_tr: string;
  crop_heading_en: string;
  crop_heading_ar: string;
  crop_subtitle_tr: string;
  crop_subtitle_en: string;
  crop_subtitle_ar: string;
}

export interface AcademyTile {
  id: string;
  tile_key: string;
  icon_name: string;
  image1_url: string | null;
  image2_url: string | null;
  video_url: string | null;
  description: string | null;
  animation_direction: string;
}

export interface CommodityExchangeMeta {
  id: string;
  exchange_id: string;
  icon_name: string;
  display_title: string | null;
  specialties_override: string[] | null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    setSettings(data as SiteSettings | null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
}

export function useAcademyTiles() {
  const [tiles, setTiles] = useState<AcademyTile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiles = useCallback(async () => {
    const { data } = await supabase.from('academy_tiles').select('*').order('tile_key');
    setTiles(data as AcademyTile[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTiles(); }, [fetchTiles]);

  return { tiles, loading, refetch: fetchTiles };
}

export function useCropCards() {
  const [cards, setCards] = useState<CropCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    const { data } = await supabase
      .from('crop_cards')
      .select('*')
      .order('sort_order', { ascending: true });
    setCards((data as CropCard[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  return { cards, loading, refetch: fetchCards };
}

export function useExchangeMeta() {
  const [meta, setMeta] = useState<CommodityExchangeMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeta = useCallback(async () => {
    const { data } = await supabase.from('commodity_exchange_meta').select('*');
    setMeta(data as CommodityExchangeMeta[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  return { meta, loading, refetch: fetchMeta };
}
