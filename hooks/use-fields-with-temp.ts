'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CropField, TemperatureLog } from '@/lib/types';

export interface FieldWithLatest extends CropField {
  latest_temp?: number | null;
}

export function useFieldsWithLatestTemp(userId: string | undefined) {
  const [fields, setFields] = useState<FieldWithLatest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setFields([]); setLoading(false); return; }
    setLoading(true);
    let cancelled = false;
    (async () => {
      const { data: fieldsData } = await supabase
        .from('crop_fields')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }) as { data: CropField[] | null };

      if (cancelled) return;
      if (!fieldsData || fieldsData.length === 0) {
        setFields([]);
        setLoading(false);
        return;
      }

      const fieldIds = fieldsData.map((f) => f.id);
      const { data: logsData } = await supabase
        .from('temperature_logs')
        .select('field_id, temperature, recorded_at')
        .in('field_id', fieldIds)
        .order('recorded_at', { ascending: false }) as { data: TemperatureLog[] | null };
      if (cancelled) return;

      const latestByField: Record<string, number> = {};
      (logsData || []).forEach((log) => {
        if (latestByField[log.field_id] === undefined) {
          latestByField[log.field_id] = log.temperature;
        }
      });

      setFields(fieldsData.map((f) => ({ ...f, latest_temp: latestByField[f.id] ?? null })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { fields, loading };
}

export function tempHasAlert(field: FieldWithLatest): boolean {
  return field.latest_temp != null
    && (field.latest_temp < field.temp_min_threshold || field.latest_temp > field.temp_max_threshold);
}
