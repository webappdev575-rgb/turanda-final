'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Sprout, Search, Tractor, Briefcase, BarChart3,
  Plus, X, Phone, ShieldCheck, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { supabase } from '@/lib/supabase';
import { TURKEY_CITIES, CITY_COORDS, JOB_TYPES } from '@/lib/constants';
import { appConfig } from '@/lib/app-config';
import { cn } from '@/lib/utils';

type Role = 'worker' | 'employer';
type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced';
type Step = 'profile' | 'phone';

const TURKISH_REGIONS = [
  'Akdeniz', 'Ege', 'Marmara', 'İç Anadolu', 'Karadeniz',
  'Güneydoğu Anadolu', 'Doğu Anadolu',
];

export default function OnboardingPage() {
  const { user, profile, loading: authLoading, updateProfile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState<Step>('profile');
  const [role, setRole] = useState<Role>('worker');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [farmName, setFarmName] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState<string[]>([]);
  const [cropInput, setCropInput] = useState('');
  const [employerCity, setEmployerCity] = useState('');

  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [preferredJobs, setPreferredJobs] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      if (profile.user_type === 'farmer' || profile.user_type === 'business') {
        setRole('employer');
      }
      if (profile.phone_verified) {
        setPhoneVerified(true);
        setPhone(profile.phone || '');
      }
      if (profile.onboarded && profile.phone_verified) {
        router.replace('/dashboard');
      } else if (profile.onboarded && !profile.phone_verified) {
        setStep('phone');
      }
    }
  }, [profile, router]);

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const addCrop = () => {
    const trimmed = cropInput.trim();
    if (trimmed && !primaryCrops.includes(trimmed)) {
      setPrimaryCrops([...primaryCrops, trimmed]);
      setCropInput('');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const onboardingIsComplete = role === 'employer'
      ? farmName.trim() && primaryCrops.length > 0 && employerCity
      : preferredRegions.length > 0 && preferredJobs.length > 0 && experienceLevel;

    if (!onboardingIsComplete) {
      setError(t('auth.onboardingRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    const employerCoords = employerCity ? CITY_COORDS[employerCity] : null;
    const updates: Record<string, unknown> = {
      full_name: fullName || profile?.full_name,
      user_type: role === 'employer' ? 'farmer' : 'worker',
      farm_name: role === 'employer' ? farmName.trim() || null : null,
      city: role === 'employer' ? employerCity || null : null,
      region: role === 'employer' ? (employerCity ? (appConfig.cityCoords[employerCity] as unknown as { region?: string })?.region : null) : null,
      latitude: role === 'employer' ? employerCoords?.lat ?? null : null,
      longitude: role === 'employer' ? employerCoords?.lng ?? null : null,
      preferred_regions: role === 'worker' && preferredRegions.length ? preferredRegions : null,
      preferred_jobs: role === 'worker' && preferredJobs.length ? preferredJobs : null,
      experience_level: role === 'worker' && experienceLevel ? experienceLevel : null,
      primary_crops: role === 'employer' && primaryCrops.length ? primaryCrops : null,
      onboarded: true,
    };

    const result = await updateProfile(updates as any);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('phone');
    }
  };

  const normalizePhone = (raw: string) => {
    const trimmed = raw.replace(/[\s\-().]/g, '');
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  };

  const callPhoneOtp = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-phone-otp`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok && response.status !== 400 && response.status !== 429) {
      throw new Error(`verification_unavailable`);
    }
    return response.json() as Promise<{ error?: string; sent?: boolean; verified?: boolean; dev_code?: string; attempts_left?: number }>;
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError(t('auth.phoneRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await callPhoneOtp({ action: 'send', phone: normalizePhone(phone) });
      if (result.error === 'cooldown') {
        setError(t('auth.otpCooldown'));
      } else if (result.error === 'rate_limited') {
        setError(t('auth.otpRateLimited'));
      } else if (result.error) {
        setError(t('auth.otpSendFailed'));
      } else {
        setOtpSent(true);
        setSentTo(normalizePhone(phone));
        setResendIn(60);
        setDevCode(result.dev_code ?? null);
      }
    } catch {
      setError(t('auth.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError(t('auth.otpRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await callPhoneOtp({ action: 'verify', phone: normalizePhone(phone), code: otpCode.trim() });
      if (result.error === 'expired') {
        setError(t('auth.otpExpired'));
      } else if (result.error === 'wrong_code') {
        setError(t('auth.otpWrong'));
      } else if (result.error === 'too_many_attempts') {
        setError(t('auth.otpTooManyAttempts'));
      } else if (result.error === 'no_code' || result.error === 'already_used') {
        setError(t('auth.otpExpired'));
      } else if (result.error) {
        setError(t('auth.otpSendFailed'));
      } else {
        setPhoneVerified(true);
        await refreshProfile();
        setTimeout(() => router.push(role === 'employer' ? '/employer' : '/dashboard'), 1500);
      }
    } catch {
      setError(t('auth.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 'profile' ? t('auth.onboardingTitle') : t('auth.phoneVerificationTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'profile' ? t('auth.onboardingSubtitle') : t('auth.phoneVerificationSubtitle')}
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all', step === 'profile' ? 'bg-primary text-white' : 'bg-primary/20 text-primary')}>
            1
          </div>
          <div className={cn('h-1 w-12 rounded-full transition-all', step === 'phone' ? 'bg-primary' : 'bg-muted')} />
          <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all', step === 'phone' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
            2
          </div>
        </div>

        {step === 'profile' ? (
          <>
            {/* Role selector */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('worker')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                  role === 'worker' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
                )}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', role === 'worker' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('auth.roleCandidate')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t('auth.roleCandidateDesc')}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                  role === 'employer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
                )}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', role === 'employer' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                  <Tractor className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('auth.roleEmployer')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t('auth.roleEmployerDesc')}</p>
                </div>
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.fullName')} <span className="text-destructive">*</span></Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.namePlaceholder')} required />
              </div>

              {role === 'employer' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="farm-name">{t('auth.farmName')} <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="farm-name" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder={t('auth.farmNamePlaceholder')} className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('auth.primaryCrops')} <span className="text-destructive">*</span></Label>
                    <div className="flex gap-2">
                      <Input value={cropInput} onChange={(e) => setCropInput(e.target.value)} placeholder={t('auth.primaryCropsPlaceholder')} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCrop(); } }} />
                      <Button type="button" size="sm" variant="outline" onClick={addCrop}><Plus className="h-4 w-4" /></Button>
                    </div>
                    {primaryCrops.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {primaryCrops.map((c) => (
                          <Badge key={c} variant="secondary" className="gap-1">{c}<button type="button" onClick={() => setPrimaryCrops(primaryCrops.filter((x) => x !== c))}><X className="h-3 w-3" /></button></Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('dash.location')} <span className="text-destructive">*</span></Label>
                    <Select value={employerCity} onValueChange={setEmployerCity}>
                      <SelectTrigger><SelectValue placeholder={t('form.selectCity')} /></SelectTrigger>
                      <SelectContent>{TURKEY_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('auth.preferredRegions')} <span className="text-destructive">*</span></Label>
                    <div className="flex flex-wrap gap-1.5">
                      {TURKISH_REGIONS.map((r) => (
                        <button key={r} type="button" onClick={() => toggleArrayItem(preferredRegions, r, setPreferredRegions)}
                          className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all', preferredRegions.includes(r) ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/30')}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('auth.preferredJobs')} <span className="text-destructive">*</span></Label>
                    <div className="flex flex-wrap gap-1.5">
                      {JOB_TYPES.map((j) => (
                        <button key={j} type="button" onClick={() => toggleArrayItem(preferredJobs, j, setPreferredJobs)}
                          className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all', preferredJobs.includes(j) ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary/30')}>
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('auth.experienceLevel')} <span className="text-destructive">*</span></Label>
                    <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as ExperienceLevel)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t('auth.expBeginner')}</SelectItem>
                        <SelectItem value="intermediate">{t('auth.expIntermediate')}</SelectItem>
                        <SelectItem value="experienced">{t('auth.expExperienced')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-light" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loading')}</> : <>{t('auth.continue')} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </>
        ) : (
          /* Phone verification step */
          <div className="space-y-6">
            {phoneVerified ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center animate-scale-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{t('auth.phoneVerified')}</h2>
                <p className="text-sm text-muted-foreground">{t('auth.phoneVerifiedDesc')}</p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('auth.enterPhone')} <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+90 5xx xxx xx xx"
                        className="pl-10"
                        disabled={otpSent}
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <Button onClick={handleSendOtp} disabled={loading} className="w-full bg-primary hover:bg-primary-light" size="lg">
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loading')}</> : <><ShieldCheck className="mr-2 h-4 w-4" />{t('auth.sendCode')}</>}
                    </Button>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {t('auth.codeSentTo', { phone: sentTo })}
                      </p>

                      {devCode && (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm text-primary">
                          {t('auth.devCodeNotice')}: <span className="font-bold tracking-widest">{devCode}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>{t('auth.enterCode')}</Label>
                        <InputOTP maxLength={6} value={otpCode} onChange={(v) => setOtpCode(v)}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-primary hover:bg-primary-light" size="lg">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loading')}</> : <>{t('auth.verify')} <ShieldCheck className="ml-2 h-4 w-4" /></>}
                      </Button>
                      <div className="flex items-center justify-between text-sm">
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpCode(''); setDevCode(null); setError(null); }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {t('auth.changePhone')}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={resendIn > 0 || loading}
                          className="font-medium text-primary transition-colors hover:text-primary-light disabled:cursor-not-allowed disabled:text-muted-foreground"
                        >
                          {resendIn > 0 ? t('auth.resendIn', { seconds: resendIn }) : t('auth.resendCode')}
                        </button>
                      </div>
                      <p className="text-center text-xs text-muted-foreground">{t('auth.otpExpiryNotice')}</p>
                    </>
                  )}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('auth.phoneRequiredNotice')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
