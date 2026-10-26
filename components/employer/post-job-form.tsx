'use client';

import { useState } from 'react';
import { Loader2, Plus, X, CheckCircle2, Star, Pin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { JOB_TYPES, TURKEY_CITIES, CITY_COORDS, WAGE_UNITS, JOB_SKILLS } from '@/lib/constants';
import { useJobCategories } from '@/hooks/use-job-categories';
import type { JobInput, JobLanguage, FeaturedTier } from '@/lib/types';
import { useI18n } from '@/components/i18n-provider';
import { translateJobType } from '@/lib/translations';
import { CheckoutModal, type CheckoutTierInfo } from '@/components/checkout/checkout-modal';
import { Recaptcha } from '@/components/recaptcha';
import { cn } from '@/lib/utils';

const JOB_LANGUAGES: { value: JobLanguage; labelKey: string }[] = [
  { value: 'tr', labelKey: 'joblang.tr' },
  { value: 'en', labelKey: 'joblang.en' },
  { value: 'ar', labelKey: 'joblang.ar' },
];

const TIERS: { value: FeaturedTier; labelKey: string; priceKey: string; price: number; icon: typeof Star }[] = [
  { value: 'standard', labelKey: 'tier.standard', priceKey: 'tier.standardPrice', price: 0, icon: CheckCircle2 },
  { value: 'featured', labelKey: 'tier.featured', priceKey: 'tier.featuredPrice', price: 499, icon: Star },
  { value: 'pinned', labelKey: 'tier.pinned', priceKey: 'tier.pinnedPrice', price: 899, icon: Pin },
];

interface PostJobFormProps {
  onSubmit: (input: JobInput) => Promise<{ error: string | null }>;
  onSuccess?: () => void;
}

export function PostJobForm({ onSubmit, onSuccess }: PostJobFormProps) {
  const { t, locale } = useI18n();
  const { jobTypes } = useJobCategories();
  const [title, setTitle] = useState('');
  const [farmName, setFarmName] = useState('');
  const [jobType, setJobType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [wage, setWage] = useState('');
  const [wageUnit, setWageUnit] = useState('day');
  const [duration, setDuration] = useState('');
  const [openings, setOpenings] = useState('1');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [language, setLanguage] = useState<JobLanguage>('tr');
  const [featuredTier, setFeaturedTier] = useState<FeaturedTier>('standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [pendingInput, setPendingInput] = useState<JobInput | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const addRequirement = () => { if (newRequirement.trim()) { setRequirements([...requirements, newRequirement.trim()]); setNewRequirement(''); } };
  const removeRequirement = (idx: number) => { setRequirements(requirements.filter((_, i) => i !== idx)); };

  const getTierInfo = (tier: FeaturedTier): CheckoutTierInfo => {
    const found = TIERS.find((t) => t.value === tier)!;
    return { tier, price: found.price, labelKey: found.labelKey, priceKey: found.priceKey };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !farmName.trim() || !jobType || !description.trim() || !location || !duration.trim()) { setError(t('form.errorRequired')); return; }
    if (!recaptchaToken) { setError(t('recaptcha.errorRequired')); return; }
    const coords = CITY_COORDS[location] || { lat: 39.0, lng: 35.0 };
    const input: JobInput = {
      title: title.trim(), farm_name: farmName.trim(), job_type: jobType as JobInput['job_type'],
      description: description.trim(), location, latitude: coords.lat, longitude: coords.lng,
      wage: parseFloat(wage) || 0, wage_unit: wageUnit, duration: duration.trim(),
      requirements, openings: parseInt(openings) || 1, skills, language,
      is_featured: featuredTier !== 'standard', featured_tier: featuredTier,
      payment_status: featuredTier === 'standard' ? 'free' : 'pending',
    };

    if (featuredTier === 'standard') {
      setSubmitting(true);
      const result = await onSubmit(input);
      setSubmitting(false);
      if (result.error) { setError(result.error); } else {
        setSuccess(true); resetForm();
        setTimeout(() => { setSuccess(false); onSuccess?.(); }, 2000);
      }
    } else {
      setPendingInput(input);
      setCheckoutOpen(true);
    }
  };

  const resetForm = () => {
    setTitle(''); setFarmName(''); setJobType(''); setDescription(''); setLocation('');
    setWage(''); setWageUnit('day'); setDuration(''); setOpenings('1');
    setRequirements([]); setSkills([]); setLanguage('tr'); setFeaturedTier('standard');
  };

  const handleCheckoutSuccess = async () => {
    if (!pendingInput) return;
    const now = new Date();
    const featuredUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const input: JobInput = {
      ...pendingInput,
      is_featured: true,
      featured_tier: pendingInput.featured_tier,
      featured_until: featuredUntil,
      payment_status: 'paid',
    };
    setSubmitting(true);
    const result = await onSubmit(input);
    setSubmitting(false);
    if (result.error) { setError(result.error); } else {
      setSuccess(true); resetForm(); setPendingInput(null);
      setTimeout(() => { setSuccess(false); onSuccess?.(); }, 2000);
    }
  };

  if (success) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center animate-scale-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15"><CheckCircle2 className="h-8 w-8 text-success" /></div>
        <h3 className="text-lg font-bold text-foreground">{t('form.success')}</h3>
        <p className="text-sm text-muted-foreground">{t('form.successDesc')}</p>
      </Card>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-title">{t('form.jobTitle')}</Label>
            <Input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('form.jobTitlePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="farm-name">{t('form.farmName')}</Label>
            <Input id="farm-name" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder={t('form.farmNamePlaceholder')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('form.jobType')}</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger><SelectValue placeholder={t('form.selectType')} /></SelectTrigger>
              <SelectContent>{jobTypes.map((type) => (<SelectItem key={type} value={type}>{translateJobType(type, locale)}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('form.location')}</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue placeholder={t('form.selectCity')} /></SelectTrigger>
              <SelectContent>{TURKEY_CITIES.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="openings">{t('form.openings')}</Label>
            <Input id="openings" type="number" min="1" value={openings} onChange={(e) => setOpenings(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('joblang.title')}</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as JobLanguage)}>
            <SelectTrigger><SelectValue placeholder={t('joblang.titlePlaceholder')} /></SelectTrigger>
            <SelectContent>
              {JOB_LANGUAGES.map((lang) => (<SelectItem key={lang.value} value={lang.value}>{t(lang.labelKey as 'joblang.tr')}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-description">{t('form.description')}</Label>
          <Textarea id="job-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('form.descriptionPlaceholder')} rows={4} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="wage">{t('form.wage')}</Label>
            <Input id="wage" type="number" min="0" value={wage} onChange={(e) => setWage(e.target.value)} placeholder="850" />
          </div>
          <div className="space-y-2">
            <Label>{t('form.wageUnit')}</Label>
            <Select value={wageUnit} onValueChange={setWageUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{WAGE_UNITS.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">{t('form.duration')}</Label>
            <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={t('form.durationPlaceholder')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('form.requirements')}</Label>
          <div className="flex gap-2">
            <Input value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequirement(); } }} placeholder={t('form.reqPlaceholder')} />
            <Button type="button" variant="outline" onClick={addRequirement}><Plus className="h-4 w-4" /></Button>
          </div>
          {requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirements.map((req, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {req}<button type="button" onClick={() => removeRequirement(i)} className="ml-0.5 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Required Skills (select up to 4)</Label>
          <div className="flex flex-wrap gap-1.5">
            {JOB_SKILLS.map((skill) => {
              const selected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    if (selected) setSkills(skills.filter((s) => s !== skill));
                    else if (skills.length < 4) setSkills([...skills, skill]);
                  }}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-all',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40',
                    !selected && skills.length >= 4 && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier Comparison Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">{t('tier.chooseTier')}</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setComparisonOpen(true)}>
              {t('tier.compare')}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((tier) => {
              const selected = featuredTier === tier.value;
              const Icon = tier.icon;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setFeaturedTier(tier.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                    selected
                      ? tier.value === 'pinned'
                        ? 'border-emerald-400 bg-emerald-50/40'
                        : tier.value === 'featured'
                          ? 'border-amber-400 bg-amber-50/40'
                          : 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <Icon className={cn('h-5 w-5', tier.value === 'pinned' ? 'text-emerald-600' : tier.value === 'featured' ? 'text-amber-600' : 'text-muted-foreground')} />
                  <span className="text-xs font-bold text-foreground">{t(tier.labelKey as 'tier.featured')}</span>
                  <span className="text-sm font-semibold text-primary">{t(tier.priceKey as 'tier.featuredPrice')}</span>
                </button>
              );
            })}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t('tier.benefit')}</th>
                  {TIERS.map((tier) => (
                    <th key={tier.value} className={cn('px-3 py-2 text-center font-semibold', featuredTier === tier.value ? 'text-primary' : 'text-foreground')}>
                      {t(tier.labelKey as 'tier.featured')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{t('tier.topOfFeed')}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground/40">—</td>
                  <td className="px-3 py-2 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                  <td className="px-3 py-2 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{t('tier.highlightBadge')}</td>
                  <td className="px-3 py-2 text-center text-muted-foreground/40">—</td>
                  <td className="px-3 py-2 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                  <td className="px-3 py-2 text-center text-success"><CheckCircle2 className="mx-auto h-4 w-4" /></td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">3x / 5x {t('tier.applicants3x')}</td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground">{t('tier.applicants1x')}</td>
                  <td className="px-3 py-2 text-center text-xs font-medium text-amber-600">{t('tier.applicants3x')}</td>
                  <td className="px-3 py-2 text-center text-xs font-medium text-emerald-600">{t('tier.applicants5x')}</td>
                </tr>
                <tr className="border-t border-border bg-muted/20">
                  <td className="px-3 py-2 font-medium text-foreground">{t('checkout.price')}</td>
                  <td className="px-3 py-2 text-center font-bold text-foreground">{t('tier.standardPrice')}</td>
                  <td className="px-3 py-2 text-center font-bold text-amber-600">{t('tier.featuredPrice')}</td>
                  <td className="px-3 py-2 text-center font-bold text-emerald-600">{t('tier.pinnedPrice')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Recaptcha onVerify={setRecaptchaToken} action="post_job" />
        <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-light" size="lg">
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('form.submitting')}</>) : (
            <>
              {featuredTier !== 'standard' ? <><CreditCard className="mr-2 h-4 w-4" />{t('form.submit')} — {t(TIERS.find((x) => x.value === featuredTier)!.priceKey as 'tier.featuredPrice')}</> : <><Plus className="mr-2 h-4 w-4" />{t('form.submit')}</>}
            </>
          )}
        </Button>
      </form>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        tierInfo={getTierInfo(featuredTier)}
        onSuccess={handleCheckoutSuccess}
      />

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
                  {TIERS.map((tier) => (
                    <th key={tier.value} className={cn('px-4 py-3 text-center font-semibold', featuredTier === tier.value ? 'text-primary' : 'text-foreground')}>
                      {t(tier.labelKey as 'tier.featured')}
                      <div className="mt-0.5 text-xs text-muted-foreground">{t(tier.priceKey as 'tier.featuredPrice')}</div>
                    </th>
                  ))}
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
                  <td className="px-4 py-3 text-muted-foreground">{t('tier.duration')}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground/40">—</td>
                  <td className="px-4 py-3 text-center font-medium text-foreground">{t('tier.duration')}</td>
                  <td className="px-4 py-3 text-center font-medium text-foreground">{t('tier.duration')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button onClick={() => setComparisonOpen(false)} className="w-full">{t('tier.select')}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
