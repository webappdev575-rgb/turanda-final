'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Job, JobInput } from '@/lib/types';

export function useJobs(scope: 'all' | 'owned' = 'all') {
  const { user } = useAuth();
  const ownerId = scope === 'owned' ? user?.id : undefined;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (scope === 'owned' && !ownerId) { setJobs([]); setLoading(false); return; }
    let query = supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (scope === 'owned') query = query.eq('employer_id', ownerId!);
    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setJobs(data as Job[]);
    }
    setLoading(false);
  }, [scope, ownerId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = useCallback(
    async (input: JobInput): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('jobs').insert([input]);
      if (error) return { error: error.message };
      await fetchJobs();
      return { error: null };
    },
    [fetchJobs]
  );

  const deleteJob = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) return { error: error.message };
      await fetchJobs();
      return { error: null };
    },
    [fetchJobs]
  );

  const toggleJobStatus = useCallback(
    async (id: string, status: string): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', id);
      if (error) return { error: error.message };
      await fetchJobs();
      return { error: null };
    },
    [fetchJobs]
  );

  return { jobs, loading, error, refetch: fetchJobs, createJob, deleteJob, toggleJobStatus };
}
