'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { JobCategory } from '@/lib/types';
import {
  setDynamicJobTypeOverrides,
  setDynamicJobTypeIcons,
  setDynamicJobTypeColors,
} from '@/lib/translations';

export function useJobCategories() {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('job_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (err) {
      setError(err.message);
    } else if (data) {
      const cats = data as JobCategory[];
      setCategories(cats);

      const activeCats = cats.filter((c) => c.is_active);
      const transMap: Record<string, Record<'tr' | 'en' | 'ar', string>> = {};
      const iconMap: Record<string, { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null }> = {};
      const colorMap: Record<string, string> = {};
      activeCats.forEach((c) => {
        transMap[c.name] = { tr: c.translation_tr, en: c.translation_en, ar: c.translation_ar };
        iconMap[c.name] = { icon_type: c.icon_type, icon_name: c.icon_name, icon_svg_path: c.icon_svg_path };
        colorMap[c.name] = c.color;
      });
      setDynamicJobTypeOverrides(transMap);
      setDynamicJobTypeIcons(iconMap);
      setDynamicJobTypeColors(colorMap);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    activeCategories: categories.filter((c) => c.is_active),
    jobTypes: categories.filter((c) => c.is_active).map((c) => c.name),
    loading,
    error,
    refetch: fetchCategories,
  };
}
