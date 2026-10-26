'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/components/i18n-provider';
import { supabase } from '@/lib/supabase';
import { Recaptcha } from '@/components/recaptcha';
import { cn } from '@/lib/utils';

const PLACEMENT_OPTIONS = [
  { value: 'header-banner', labelKey: 'advertise.placement.header' },
  { value: 'job-list-in-feed', labelKey: 'advertise.placement.jobFeed' },
  { value: 'commodity-sidebar', labelKey: 'advertise.placement.commoditySidebar' },
  { value: 'news-sidebar', labelKey: 'advertise.placement.newsSidebar' },
  { value: 'dashboard-sidebar', labelKey: 'advertise.placement.dashboardSidebar' },
];

interface AdRequestFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function AdRequestForm({ onSuccess, compact }: AdRequestFormProps) {
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [placement, setPlacement] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [designOption, setDesignOption] = useState<'self_provided' | 'custom_design'>('self_provided');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [designNotes, setDesignNotes] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || !email.trim() || !phone.trim() || !placement) {
      setError(t('form.errorRequired'));
      return;
    }
    if (!recaptchaToken) {
      setError(t('recaptcha.errorRequired'));
      return;
    }

    setSubmitting(true);

    try {
      let fileUrl = bannerUrl;

      if (designOption === 'self_provided' && bannerFile) {
        const ext = bannerFile.name.split('.').pop() || 'png';
        const fileName = `ad-requests/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('ads')
          .upload(fileName, bannerFile, { upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('ads').getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }
      }

      const { error: insertError } = await supabase.from('ad_requests').insert([{
        company_name: companyName.trim(),
        contact_email: email.trim(),
        contact_phone: phone.trim(),
        target_placement: placement,
        target_url: targetUrl.trim() || null,
        banner_design_option: designOption,
        banner_file_url: fileUrl || null,
        design_notes: designNotes.trim() || null,
        message: message.trim() || null,
        status: 'pending',
      }]);

      if (insertError) throw insertError;

      setSuccess(true);
      setCompanyName(''); setEmail(''); setPhone(''); setPlacement('');
      setTargetUrl(''); setBannerFile(null); setBannerUrl('');
      setDesignNotes(''); setMessage(''); setDesignOption('self_provided');

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch {
      setError(t('checkout.failedDesc'));
    }

    setSubmitting(false);
  };

  if (success) {
    return (
      <Card className={cn('flex flex-col items-center gap-3 p-8 text-center animate-scale-in', compact && 'p-6')}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t('advertise.success')}</h3>
        <p className="text-sm text-muted-foreground">{t('advertise.successDesc')}</p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ad-company">{t('advertise.companyName')}</Label>
          <Input id="ad-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ad-email">{t('advertise.contactEmail')}</Label>
          <Input id="ad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ad-phone">{t('advertise.contactPhone')}</Label>
          <Input id="ad-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
        </div>
        <div className="space-y-2">
          <Label>{t('advertise.targetPlacement')}</Label>
          <Select value={placement} onValueChange={setPlacement}>
            <SelectTrigger><SelectValue placeholder={t('advertise.targetPlacement')} /></SelectTrigger>
            <SelectContent>
              {PLACEMENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey as 'advertise.placement.header')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ad-url">{t('advertise.targetUrl')}</Label>
        <Input id="ad-url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://" />
      </div>

      <div className="space-y-3">
        <Label>{t('advertise.bannerDesign')}</Label>
        <RadioGroup value={designOption} onValueChange={(v) => setDesignOption(v as 'self_provided' | 'custom_design')}>
          <label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all', designOption === 'self_provided' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
            <RadioGroupItem value="self_provided" className="mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{t('advertise.selfProvided')}</span>
              {designOption === 'self_provided' && (
                <div className="mt-2 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0] ?? null; setBannerFile(f); }}
                    className="hidden"
                    id="ad-banner-upload"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('ad-banner-upload')?.click()}>
                      <Upload className="mr-1 h-3.5 w-3.5" />{t('advertise.uploadBanner')}
                    </Button>
                    {bannerFile && <span className="text-xs text-muted-foreground">{bannerFile.name}</span>}
                  </div>
                  <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="...or paste image URL" />
                </div>
              )}
            </div>
          </label>
          <label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all', designOption === 'custom_design' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
            <RadioGroupItem value="custom_design" className="mt-0.5" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{t('advertise.customDesign')}</span>
              {designOption === 'custom_design' && (
                <Textarea
                  className="mt-2"
                  value={designNotes}
                  onChange={(e) => setDesignNotes(e.target.value)}
                  placeholder={t('advertise.designNotesPlaceholder')}
                  rows={2}
                />
              )}
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ad-message">{t('advertise.message')}</Label>
        <Textarea id="ad-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('advertise.messagePlaceholder')} rows={2} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Recaptcha onVerify={setRecaptchaToken} action="ad_request" />
      <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-light">
        {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('advertise.submitting')}</> : <><ImageIcon className="mr-2 h-4 w-4" />{t('advertise.submit')}</>}
      </Button>
    </form>
  );
}
