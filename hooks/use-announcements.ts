'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  is_active: boolean;
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setAnnouncements((data as Announcement[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { announcements, loading, error, reload: load };
}

export async function uploadPostImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const MAX_SIZE_MB = 5;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: 'Only JPG, PNG, WebP, or GIF images are allowed.' };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { url: null, error: `Image must be smaller than ${MAX_SIZE_MB}MB.` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('post-images')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadErr) return { url: null, error: uploadErr.message };

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
