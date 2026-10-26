'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus } from '@/lib/types';

interface ApplicationInput {
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  message: string;
  cv_document_id?: string | null;
  cover_letter_document_id?: string | null;
  cv_method?: 'pdf' | 'manual' | null;
  cv_text?: string | null;
  cover_letter_text?: string | null;
}

export function useApplications(jobId?: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!userId) { setApplications([]); setLoading(false); return; }
    let query = supabase
      .from('applications')
      .select('*, job:jobs(*)')
      .order('created_at', { ascending: false });
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }, [jobId, userId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const submitApplication = useCallback(
    async (input: ApplicationInput): Promise<{ error: string | null }> => {
      if (!input.applicant_id) return { error: 'You must be signed in to apply.' };
      const { error } = await supabase.from('applications').insert([input]);
      if (error) return { error: error.message };
      await fetchApplications();
      return { error: null };
    },
    [fetchApplications]
  );

  const updateApplicationStatus = useCallback(
    async (id: string, status: ApplicationStatus): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      if (error) return { error: error.message };
      await fetchApplications();
      return { error: null };
    },
    [fetchApplications]
  );

  return { applications, loading, error, refetch: fetchApplications, submitApplication, updateApplicationStatus };
}
