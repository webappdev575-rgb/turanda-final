'use client';

import { useState } from 'react';
import { CreditCard, Lock, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useI18n } from '@/components/i18n-provider';
import { Recaptcha } from '@/components/recaptcha';
import type { FeaturedTier } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export interface CheckoutTierInfo {
  tier: FeaturedTier;
  price: number;
  labelKey: string;
  priceKey: string;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierInfo: CheckoutTierInfo;
  jobId?: string | null;
  onSuccess?: (result: { tier: FeaturedTier; transactionId: string }) => void;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function CheckoutModal({ open, onOpenChange, tierInfo, jobId, onSuccess }: CheckoutModalProps) {
  const { t } = useI18n();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const isTestMode = !process.env.NEXT_PUBLIC_STRIPE_ENABLED;

  const resetForm = () => {
    setCardName('');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setProcessing(false);
    setSuccess(false);
    setError(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const handlePayment = async () => {
    setError(null);

    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 16 || expiry.length < 5 || cvc.length < 3) {
      setError(t('checkout.failedDesc'));
      return;
    }
    if (!recaptchaToken) {
      setError(t('recaptcha.errorRequired'));
      return;
    }

    setProcessing(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('process-payment', {
        body: JSON.stringify({
          tier: tierInfo.tier,
          amount: tierInfo.price,
          job_id: jobId ?? null,
          provider: isTestMode ? 'test' : 'stripe',
          card_name: cardName.trim(),
          card_last4: cardNumber.replace(/\s/g, '').slice(-4),
        }),
      });

      if (fnError) throw fnError;

      const result = data as { success: boolean; transaction_id: string; status: string };
      const transactionId = result?.transaction_id ?? `test-${Date.now()}`;

      if (jobId) {
        const now = new Date();
        const featuredUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from('jobs')
          .update({
            is_featured: true,
            featured_tier: tierInfo.tier,
            featured_until: featuredUntil,
            payment_status: 'paid',
          })
          .eq('id', jobId);

        await supabase.from('job_payments').insert([{
          job_id: jobId,
          amount: tierInfo.price,
          tier: tierInfo.tier,
          provider: isTestMode ? 'test' : 'stripe',
          transaction_id: transactionId,
          status: 'paid',
        }]);
      }

      setProcessing(false);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.({ tier: tierInfo.tier, transactionId });
        handleClose(false);
      }, 1800);
    } catch {
      setProcessing(false);
      setError(t('checkout.failedDesc'));
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t('checkout.success')}</h3>
            <p className="text-sm text-muted-foreground">{t('checkout.successDesc')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('checkout.title')}
          </DialogTitle>
        </DialogHeader>

        {isTestMode && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium text-[#141f1b] dark:text-warning-foreground">{t('checkout.testMode')}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t('checkout.summary')}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    'border',
                    tierInfo.tier === 'featured'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}
                  variant="outline"
                >
                  {t(tierInfo.labelKey as 'tier.featured')}
                </Badge>
                <span className="text-sm text-muted-foreground">{t('tier.duration')}</span>
              </div>
              <span className="text-xl font-bold text-foreground">{t(tierInfo.priceKey as 'tier.featuredPrice')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-name">{t('checkout.cardName')}</Label>
            <Input
              id="card-name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder={t('checkout.cardNamePlaceholder')}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-number">{t('checkout.cardNumber')}</Label>
            <Input
              id="card-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="card-expiry">{t('checkout.expiry')}</Label>
              <Input
                id="card-expiry"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-cvc">{t('checkout.cvc')}</Label>
              <InputOTP maxLength={3} value={cvc} onChange={(v) => setCvc(v)}>
                <InputOTPGroup>
                  <InputOTPSlot className="h-9 w-12" index={0} />
                  <InputOTPSlot className="h-9 w-12" index={1} />
                  <InputOTPSlot className="h-9 w-12" index={2} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <Recaptcha onVerify={setRecaptchaToken} action="checkout" />
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button
            onClick={handlePayment}
            disabled={processing || !recaptchaToken}
            className="w-full bg-primary hover:bg-primary-light"
            size="lg"
          >
            {processing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('checkout.processing')}</>
            ) : (
              <><Lock className="mr-2 h-4 w-4" />{t('checkout.payNow')} — {t(tierInfo.priceKey as 'tier.featuredPrice')}</>
            )}
          </Button>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={processing} className="w-full">
            {t('checkout.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
