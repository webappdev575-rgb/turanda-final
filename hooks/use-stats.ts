'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Job } from '@/lib/types';

interface Stats {
  activeJobs: number;
  hiringFarms: number;
  regions: number;
  successfulMatches: number;
}

export function useStats(jobs: Job[], jobsLoading: boolean) {
  const [stats, setStats] = useState<Stats>({
    activeJobs: 0,
    hiringFarms: 0,
    regions: 0,
    successfulMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobsLoading) return;

    const activeJobs = jobs.filter((j) => j.status === 'active');
    const farmSet = new Set(activeJobs.map((j) => j.farm_name));
    const regionSet = new Set(activeJobs.map((j) => j.location));

    setStats((prev) => ({
      ...prev,
      activeJobs: activeJobs.length,
      hiringFarms: farmSet.size,
      regions: regionSet.size,
    }));
    setLoading(false);
  }, [jobs, jobsLoading]);

  useEffect(() => {
    if (jobsLoading) return;

    let cancelled = false;

    async function fetchAcceptedCount() {
      const { data, error } = await supabase.rpc('count_accepted_applications');

      if (cancelled || error) return;

      const acceptedCount = typeof data === 'number' ? data : 0;
      setStats((prev) => ({
        ...prev,
        successfulMatches: Math.max(acceptedCount, 50),
      }));
    }

    fetchAcceptedCount();
    return () => { cancelled = true; };
  }, [jobsLoading]);

  return { stats, loading };
}
