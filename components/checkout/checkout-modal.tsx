'use client';

import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import type { FeaturedTier } from '@/lib/types';

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

export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('checkout.title')}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{t('checkout.unavailable')}</p>
        <Button asChild><Link href="/contact">{t('nav.contact')}</Link></Button>
      </DialogContent>
    </Dialog>
  );
}
