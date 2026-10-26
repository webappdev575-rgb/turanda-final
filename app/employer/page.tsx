'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Briefcase, Users, Inbox, Loader2, Trash2, Eye, EyeOff, CheckCircle2,
  Search, Tractor, Star, Pin, X, Megaphone, Clock, TrendingUp,
} from 'lucide-react';
import { useJobs } from '@/hooks/use-jobs';
import { useApplications } from '@/hooks/use-applications';
import { PostJobForm } from '@/components/employer/post-job-form';
import { ApplicationList } from '@/components/employer/application-list';
import { AdRequestForm } from '@/components/ads/ad-request-form';
import { CheckoutModal, type CheckoutTierInfo } from '@/components/checkout/checkout-modal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WAGE_UNIT_LABELS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import type { Job, Application, FeaturedTier } from '@/lib/types';

type Tab = 'overview' | 'post' | 'applications' | 'workers' | 'ads';

function daysLeft(featuredUntil: string | null): number | null {
  if (!featuredUntil) return null;
  const diff = new Date(featuredUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function EmployerPage() {
  const { jobs, loading, createJob, deleteJob, toggleJobStatus, refetch } = useJobs();
  const { applications, loading: appsLoading, updateApplicationStatus } = useApplications();
  const [tab, setTab] = useState<Tab>('post');
  const { t } = useI18n();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [calloutDismissed, setCalloutDismissed] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [upgradeJob, setUpgradeJob] = useState<Job | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<CheckoutTierInfo>({ tier: 'featured', price: 499, labelKey: 'tier.featured', priceKey: 'tier.featuredPrice' });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    try {
      if (localStorage.getItem('employer-callout-dismissed') === 'true') setCalloutDismissed(true);
    } catch { /* Storage may be disabled. */ }
  }, []);

  const dismissCallout = () => {
    setCalloutDismissed(true);
    try { localStorage.setItem('employer-callout-dismissed', 'true'); } catch { /* Keep the in-memory choice. */ }
  };

  if (authLoading || !user) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (profile?.user_type === 'worker') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-4 p-8 text-center animate-fade-in-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/15">
            <Search className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('employer.candidatePrompt')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('employer.candidatePromptDesc')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/jobs"><Button className="bg-primary hover:bg-primary-light"><Search className="mr-2 h-4 w-4" />{t('employer.goToJobs')}</Button></Link>
            <Link href="/dashboard"><Button variant="outline"><Tractor className="mr-2 h-4 w-4" />{t('employer.switchToEmployer')}</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status === 'active');
  const totalOpenings = activeJobs.reduce((sum, j) => sum + j.openings, 0);
  const pendingApps = applications.filter((a) => a.status === 'pending').length;

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: t('employer.overview'), icon: Briefcase },
    { id: 'post', label: t('employer.post'), icon: Plus },
    { id: 'applications', label: t('employer.applicationsTab'), icon: Users, badge: pendingApps },
    { id: 'workers', label: 'Accepted Workers', icon: CheckCircle2 },
    { id: 'ads', label: t('employer.adCampaigns'), icon: Megaphone },
  ];

  const openUpgrade = (job: Job, tier: FeaturedTier) => {
    setUpgradeJob(job);
    setCheckoutTier({
      tier,
      price: tier === 'pinned' ? 899 : 499,
      labelKey: tier === 'pinned' ? 'tier.pinned' : 'tier.featured',
      priceKey: tier === 'pinned' ? 'tier.pinnedPrice' : 'tier.featuredPrice',
    });
    setCheckoutOpen(true);
  };

  const handleUpgradeSuccess = () => {
    refetch();
    setUpgradeJob(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t('employer.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('employer.subtitle')}</p>
      </div>

      {/* Sticky callout banner */}
      {!calloutDismissed && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-50 to-emerald-50 p-4 dark:from-amber-950/20 dark:to-emerald-950/20">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm font-medium text-foreground">{t('employer.calloutTitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setComparisonOpen(true)} className="border-amber-300 text-amber-700 hover:bg-amber-100">
              {t('employer.calloutButton')}
            </Button>
            <button onClick={dismissCallout} className="rounded-md p-1 text-muted-foreground hover:bg-muted/50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Briefcase, label: t('employer.activeJobs'), value: activeJobs.length, color: 'text-primary' },
          { icon: Users, label: t('employer.openPositions'), value: totalOpenings, color: 'text-secondary' },
          { icon: Inbox, label: t('employer.applications'), value: applications.length, color: 'text-accent-foreground' },
          { icon: Plus, label: t('employer.pending'), value: pendingApps, color: 'text-warning' },
        ].map((stat, i) => (
          <Card key={i} className="flex items-center gap-3 p-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{loading ? '—' : stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={cn('relative inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', tab === tb.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <tb.icon className="h-4 w-4" />{tb.label}
            {tb.badge !== undefined && tb.badge > 0 && (
              <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">{tb.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('employer.yourJobs')}</h2>
            <Button size="sm" onClick={() => setTab('post')} className="bg-accent text-accent-foreground hover:bg-accent-light">
              <Plus className="mr-1 h-4 w-4" />{t('employer.newJob')}
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : jobs.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">{t('employer.noJobs')}</p>
              <p className="text-xs text-muted-foreground">{t('employer.noJobsDesc')}</p>
              <Button size="sm" onClick={() => setTab('post')} className="mt-2 bg-accent text-accent-foreground hover:bg-accent-light">
                <Plus className="mr-1 h-4 w-4" />{t('employer.post')}
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const wageUnitLabel = WAGE_UNIT_LABELS[job.wage_unit] || job.wage_unit;
                const remaining = daysLeft(job.featured_until);
                const isPinned = job.featured_tier === 'pinned';
                const isFeatured = job.featured_tier === 'featured';
                const canUpgrade = job.status === 'active' && !isFeatured && !isPinned;

                return (
                  <Card key={job.id} className="group relative p-4 transition-all hover:shadow-md">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          <Badge className={cn('border', job.status === 'active' ? 'bg-success/15 text-success border-success/30' : 'bg-muted text-muted-foreground border-border')} variant="outline">
                            {job.status === 'active' ? t('employer.active') : t('employer.closedStatus')}
                          </Badge>
                          {isPinned && (
                            <Badge className="border bg-emerald-50 text-emerald-700 border-emerald-200 gap-1" variant="outline">
                              <Pin className="h-3 w-3" />{t('employer.pinnedBadge')}
                            </Badge>
                          )}
                          {isFeatured && (
                            <Badge className="border bg-amber-50 text-amber-700 border-amber-200 gap-1" variant="outline">
                              <Star className="h-3 w-3 fill-current" />{t('employer.featuredBadge')}
                            </Badge>
                          )}
                          {remaining !== null && remaining > 0 && (
                            <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {t('employer.daysLeft', { count: remaining })}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{job.farm_name} · {job.location} · {job.openings} · ₺{job.wage.toLocaleString('tr-TR')}/{wageUnitLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Hover upgrade CTA for free listings */}
                        {canUpgrade && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUpgrade(job, 'featured')}
                            className="hidden border-amber-300 text-amber-700 hover:bg-amber-50 group-hover:inline-flex sm:inline-flex"
                          >
                            <Star className="h-3.5 w-3.5" />{t('employer.upgradeToFeatured')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => toggleJobStatus(job.id, job.status === 'active' ? 'closed' : 'active')}>
                          {job.status === 'active' ? (<><EyeOff className="h-3.5 w-3.5" />{t('employer.close')}</>) : (<><Eye className="h-3.5 w-3.5" />{t('employer.reopen')}</>)}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { if (confirm(t('employer.deleteConfirm'))) { deleteJob(job.id); } }} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'post' && (
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <h2 className="mb-1 text-lg font-semibold text-foreground">{t('employer.createTitle')}</h2>
            <p className="mb-5 text-sm text-muted-foreground">{t('employer.createDesc')}</p>
            <PostJobForm onSubmit={createJob} onSuccess={() => setTab('overview')} />
          </Card>
        </div>
      )}

      {tab === 'applications' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('employer.applicationsTitle')}</h2>
          {appsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <ApplicationList applications={applications} onUpdateStatus={updateApplicationStatus} />
          )}
        </div>
      )}

      {tab === 'workers' && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Accepted Workers</h2>
          <AcceptedWorkersList applications={applications} />
        </div>
      )}

      {tab === 'ads' && (
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('employer.adCampaigns')}</h2>
                <p className="text-sm text-muted-foreground">{t('employer.adCampaignsDesc')}</p>
              </div>
            </div>
            <AdRequestForm compact />
          </Card>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t('jobsAdSidebar.description')}</p>
            <Link href="/advertise" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
              <Megaphone className="h-4 w-4" />
              {t('jobsAdSidebar.cta')}
            </Link>
          </div>
          <AdRequestsList userEmail={user.email ?? ''} />
        </div>
      )}

      {/* Checkout modal for upgrading existing job */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        tierInfo={checkoutTier}
        jobId={upgradeJob?.id ?? null}
        onSuccess={handleUpgradeSuccess}
      />

      {/* Tier comparison modal */}
      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('tier.comparisonTitle')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('tier.benefit')}</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">{t('tier.standard')}</th>
                  <th className="px-4 py-3 text-center font-semibold text-amber-600">{t('tier.featured')}</th>
                  <th className="px-4 py-3 text-center font-semibold text-emerald-600">{t('tier.pinned')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{t('tier.topOfFeed')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40">—</td>
                  <td className="px-4 py-3 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                  <td className="px-4 py-3 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{t('tier.highlightBadge')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40">—</td>
                  <td className="px-4 py-3 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                  <td className="px-4 py-3 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{t('tier.applicants3x')}</td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">{t('tier.applicants1x')}</td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-amber-600">{t('tier.applicants3x')}</td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-emerald-600">{t('tier.applicants5x')}</td>
                </tr>
                <tr className="border-t border-border bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{t('checkout.price')}</td>
                  <td className="px-4 py-3 text-center font-bold text-foreground">{t('tier.standardPrice')}</td>
                  <td className="px-4 py-3 text-center font-bold text-amber-600">{t('tier.featuredPrice')}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">{t('tier.pinnedPrice')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button onClick={() => setComparisonOpen(false)} className="w-full">{t('tier.select')}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdRequestsList({ userEmail }: { userEmail: string }) {
  const { t } = useI18n();
  const [requests, setRequests] = useState<Array<{ id: string; company_name: string; target_placement: string; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    supabase
      .from('ad_requests')
      .select('id, company_name, target_placement, status, created_at')
      .or(`contact_email.eq.${userEmail}`)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRequests(data || []);
        setLoading(false);
      });
  }, [userEmail]);

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{t('advertise.yourRequests')}</h3>
      <div className="space-y-2">
        {requests.map((req) => (
          <Card key={req.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{req.company_name}</p>
              <p className="text-xs text-muted-foreground">{req.target_placement}</p>
            </div>
            <Badge variant="outline" className={cn(
              'text-xs',
              req.status === 'pending' && 'bg-warning/10 text-warning border-warning/30',
              req.status === 'approved' && 'bg-success/10 text-success border-success/30',
              req.status === 'rejected' && 'bg-destructive/10 text-destructive border-destructive/30',
              req.status === 'converted' && 'bg-primary/10 text-primary border-primary/30',
            )}>
              {t(`advertise.status${req.status.charAt(0).toUpperCase() + req.status.slice(1)}` as 'advertise.statusPending')}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AcceptedWorkersList({ applications }: { applications: Application[] }) {
  const accepted = applications.filter((a) => a.status === 'accepted');

  if (accepted.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No accepted workers yet</p>
        <p className="text-xs text-muted-foreground">Workers you accept from the Applications tab will appear here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {accepted.map((app) => (
        <Card key={app.id} className="p-4 animate-fade-in">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
                  <span className="text-sm font-bold text-success">{(app.applicant_name || '?')[0].toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{app.applicant_name}</h4>
                  {app.job && (
                    <p className="text-xs text-muted-foreground">Hired for: <span className="font-medium text-secondary">{app.job.title}</span> — {app.job.farm_name}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pl-12">
                <span>Phone: {app.applicant_phone}</span>
                <span>Email: {app.applicant_email}</span>
                <span>Accepted: {new Date(app.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
