'use client';

import { ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/components/i18n-provider';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t('terms.title')}
          </DialogTitle>
          <DialogDescription>{t('terms.subtitle')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h3 className="mb-1 font-semibold text-foreground">{t('terms.section1Title')}</h3>
              <p>{t('terms.section1Body')}</p>
            </section>
            <section>
              <h3 className="mb-1 font-semibold text-foreground">{t('terms.section2Title')}</h3>
              <p>{t('terms.section2Body')}</p>
            </section>
            <section>
              <h3 className="mb-1 font-semibold text-foreground">{t('terms.section3Title')}</h3>
              <p>{t('terms.section3Body')}</p>
            </section>
            <section>
              <h3 className="mb-1 font-semibold text-foreground">{t('terms.section4Title')}</h3>
              <p>{t('terms.section4Body')}</p>
            </section>
            <section>
              <h3 className="mb-1 font-semibold text-foreground">{t('terms.section5Title')}</h3>
              <p>{t('terms.section5Body')}</p>
            </section>
            <section>
              <h3 className="mb-1 font-semibold text-foreground">{t('terms.section6Title')}</h3>
              <p>{t('terms.section6Body')}</p>
            </section>
            <p className="pt-2 text-xs text-muted-foreground">{t('terms.effectiveDate')}</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
