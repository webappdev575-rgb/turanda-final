'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, Sprout, Mail, Lock, User, Search, Tractor,
  MapPin, Briefcase, BarChart3, Plus, X, SkipForward,
  MailCheck, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { Recaptcha } from '@/components/recaptcha';
import { GoogleSignInButton, OrDivider } from '@/components/auth/google-sign-in-button';
import { TermsModal } from '@/components/terms-modal';
import { TURKEY_CITIES, CITY_COORDS, JOB_TYPES } from '@/lib/constants';
import { appConfig } from '@/lib/app-config';
import { cn } from '@/lib/utils';

type Role = 'worker' | 'employer';
type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced';

const TURKISH_REGIONS = [
  'Akdeniz', 'Ege', 'Marmara', 'İç Anadolu', 'Karadeniz',
  'Güneydoğu Anadolu', 'Doğu Anadolu',
];

export default function SignupPage() {
  const { signUp } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<Role>('worker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Employer onboarding
  const [farmName, setFarmName] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState<string[]>([]);
  const [cropInput, setCropInput] = useState('');
  const [employerCity, setEmployerCity] = useState('');

  // Candidate onboarding
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [preferredJobs, setPreferredJobs] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (!skipped) {
      const onboardingIsComplete = role === 'employer'
        ? farmName.trim() && primaryCrops.length > 0 && employerCity
        : preferredRegions.length > 0 && preferredJobs.length > 0 && experienceLevel;
      if (!onboardingIsComplete) {
        setError(t('auth.onboardingRequired'));
        return;
      }
    }
    if (!agreedToTerms) {
      setError(t('terms.errorNotAgreed'));
      return;
    }
    if (!recaptchaToken) {
      setError(t('recaptcha.errorRequired'));
      return;
    }
    setLoading(true);
    setError(null);

    const employerCoords = employerCity ? CITY_COORDS[employerCity] : null;

    const options: Parameters<typeof signUp>[3] = {
      userType: role === 'employer' ? 'farmer' : 'worker',
      farmName: role === 'employer' ? farmName.trim() || undefined : undefined,
      city: role === 'employer' ? employerCity || undefined : undefined,
      region: role === 'employer' ? (employerCity ? (appConfig.cityCoords[employerCity] as any)?.region : undefined) : undefined,
      latitude: role === 'employer' ? employerCoords?.lat : undefined,
      longitude: role === 'employer' ? employerCoords?.lng : undefined,
      preferredRegions: role === 'worker' && preferredRegions.length ? preferredRegions : undefined,
      preferredJobs: role === 'worker' && preferredJobs.length ? preferredJobs : undefined,
      experienceLevel: role === 'worker' && experienceLevel ? experienceLevel : undefined,
      primaryCrops: role === 'employer' && primaryCrops.length ? primaryCrops : undefined,
      skipOnboarding: skipped,
    };

    const result = await signUp(email, password, fullName, options);
    setLoading(false);
    if (result.error) {
      setError(result.error.includes('already') ? t('auth.errorExists') : result.error);
    } else if (result.needsEmailVerification) {
      setShowVerification(true);
    } else {
      router.push(searchParams.get('next') || (skipped ? '/dashboard' : role === 'employer' ? '/employer' : '/jobs'));
    }
  };

  const handleSkip = () => {
    setError(null);
    setSkipped(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 animate-fade-in-up">
        {showVerification ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center animate-scale-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t('auth.verifyEmailTitle')}</h1>
            <p className="text-sm text-muted-foreground max-w-sm">{t('auth.verifyEmailDesc')}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={() => router.push('/dashboard')} className="bg-primary hover:bg-primary-light">
                {t('auth.goToProfile')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('auth.haveAccount')} {t('auth.signInHere')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{t('auth.signupTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.signupSubtitle')}</p>
            </div>

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

            <GoogleSignInButton />
            <OrDivider />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.fullName')} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.namePlaceholder')} className="pl-10" required />
                </div>
              </div>
              {role === 'employer' && (
                <div className="space-y-2">
                  <Label htmlFor="farm-name">{t('auth.farmName')} <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="farm-name" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder={t('auth.farmNamePlaceholder')} className="pl-10" required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} className="pl-10" required minLength={6} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('auth.confirmPassword')} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} className="pl-10" required minLength={6} />
                </div>
              </div>

              {/* Onboarding questionnaire */}
              <div className={cn(
                'rounded-xl border border-border bg-muted/30 p-4 space-y-4 transition-all',
                skipped && 'opacity-60',
              )}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {role === 'employer' ? <Briefcase className="h-4 w-4 text-secondary" /> : <BarChart3 className="h-4 w-4 text-secondary" />}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('auth.onboarding')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('auth.onboardingDesc')}</p>
                    </div>
                  </div>
                  {!skipped ? (
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50"
                    >
                      <SkipForward className="h-3.5 w-3.5" />{t('auth.skipForNow')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSkipped(false)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-primary hover:border-primary/30 transition-colors"
                    >
                      {t('auth.fillLater')}
                    </button>
                  )}
                </div>

                {skipped ? (
                  <p className="text-xs text-muted-foreground italic">{t('auth.skippedDesc')}</p>
                ) : (
                  <>
                    {role === 'employer' ? (
                      <>
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
                  </>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="agree-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(v) => setAgreedToTerms(v === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="agree-terms" className="text-xs font-normal leading-relaxed text-muted-foreground">
                    {t('terms.agree')}{' '}
                    <button type="button" onClick={() => setTermsOpen(true)} className="font-semibold text-primary hover:underline">
                      {t('terms.viewTerms')}
                    </button>
                  </Label>
                </div>
                <Recaptcha onVerify={setRecaptchaToken} action="signup" />
              </div>
              <Button type="submit" disabled={loading || !agreedToTerms} className="w-full bg-primary hover:bg-primary-light" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loading')}</> : t('auth.signupButton')}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t('auth.haveAccount')}{' '}
              <Link href={{ pathname: '/login', query: searchParams.toString() ? `?${searchParams.toString()}` : '' } as never} className="font-semibold text-primary hover:underline">{t('auth.signInHere')}</Link>
            </p>
          </>
        )}
      </Card>
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
