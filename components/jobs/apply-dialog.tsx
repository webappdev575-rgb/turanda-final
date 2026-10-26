'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Send, CheckCircle2, FileText, Type, LogIn, UserPlus, ArrowRight, MessageSquare,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Job, Application, UserDocument } from '@/lib/types';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import { Recaptcha } from '@/components/recaptcha';
import { createApplicationNotification } from '@/lib/notifications';
import { useDocuments } from '@/hooks/use-documents';

interface ApplyDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: {
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
  }) => Promise<{ error: string | null }>;
  employerEmail?: string;
  employerLang?: 'tr' | 'en' | 'ar';
}

export function ApplyDialog({ job, open, onOpenChange, onApply, employerEmail, employerLang }: ApplyDialogProps) {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCv, setSelectedCv] = useState<UserDocument | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<UserDocument | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const { documents, loading: docsLoading } = useDocuments();

  const cvs = documents.filter((d) => d.document_type === 'cv');
  const coverLetters = documents.filter((d) => d.document_type === 'cover_letter');
  const savedEmployerMessage = profile?.employer_message?.trim() || '';

  // Pre-fill contact info from the account, and default-select the saved documents
  useEffect(() => {
    if (!user) return;
    setName((prev) => prev || profile?.full_name || user.email?.split('@')[0] || '');
    setEmail((prev) => prev || user.email || '');
    setPhone((prev) => prev || profile?.phone || '');
  }, [user, profile]);

  useEffect(() => {
    if (!open || !user || docsLoading) return;
    if (!selectedCv) {
      setSelectedCv(cvs.find((d) => d.is_default) || cvs[0] || null);
    }
    if (!selectedCoverLetter) {
      setSelectedCoverLetter(coverLetters.find((d) => d.is_default) || coverLetters[0] || null);
    }
  }, [open, user, docsLoading, cvs, coverLetters, selectedCv, selectedCoverLetter]);

  const reset = () => {
    setName(''); setPhone(''); setEmail('');
    setSelectedCv(null); setSelectedCoverLetter(null);
    setSuccess(false); setError(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!user && v) {
      onOpenChange(false);
      router.push(`/login?next=/jobs`);
      return;
    }
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!job || !user) return;
    if (!name.trim() || !phone.trim() || !email.trim()) { setError(t('apply.errorRequired')); return; }
    if (!recaptchaToken) { setError(t('recaptcha.errorRequired')); return; }
    if (!selectedCv) { setError(t('docs.cvRequired')); return; }
    setSubmitting(true); setError(null);
    const result = await onApply({
      job_id: job.id,
      applicant_id: user.id,
      applicant_name: name,
      applicant_phone: phone,
      applicant_email: email,
      message: savedEmployerMessage,
      cv_document_id: selectedCv.id,
      cover_letter_document_id: selectedCoverLetter?.id || null,
      cv_method: selectedCv.content_method,
      cv_text: selectedCv.content_method === 'manual' ? selectedCv.manual_text : null,
      cover_letter_text: selectedCoverLetter?.content_method === 'manual' ? selectedCoverLetter.manual_text : null,
    });
    setSubmitting(false);
    if (result.error) { setError(result.error); } else {
      setSuccess(true);
      if (job && employerEmail) {
        const appRecord: Application = {
          id: '', job_id: job.id, applicant_name: name, applicant_phone: phone,
          applicant_email: email, message: savedEmployerMessage, status: 'pending', created_at: new Date().toISOString(),
        };
        createApplicationNotification(job, appRecord, employerEmail, employerLang || 'tr');
      }
      setTimeout(() => { onOpenChange(false); reset(); }, 2000);
    }
  };

  const DocPickerList = ({ docs, type, selected, onSelect }: {
    docs: UserDocument[];
    type: 'cv' | 'cover_letter';
    selected: UserDocument | null;
    onSelect: (doc: UserDocument | null) => void;
  }) => (
    <div className="space-y-1.5">
      {docs.map((doc) => (
        <button
          key={doc.id}
          type="button"
          onClick={() => onSelect(doc)}
          className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
            selected?.id === doc.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20'
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            {doc.content_method === 'pdf' ? (
              <FileText className="h-4 w-4 text-destructive" />
            ) : (
              <Type className="h-4 w-4 text-secondary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {doc.is_default ? t('docs.chosenDefault') : doc.content_method === 'pdf' ? 'PDF' : t('docs.manualText')}
            </p>
          </div>
          {selected?.id === doc.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
        </button>
      ))}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {type === 'cv' ? t('docs.manageOnAccount') : t('docs.manageOnAccountCl')}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center animate-scale-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15"><CheckCircle2 className="h-8 w-8 text-success" /></div>
            <h3 className="text-lg font-bold text-foreground">{t('apply.success')}</h3>
            <p className="text-sm text-muted-foreground">{t('apply.successDesc')}</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center animate-scale-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t('apply.loginRequiredTitle')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{t('apply.loginRequiredDesc')}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => { onOpenChange(false); router.push('/login?next=/jobs'); }} className="bg-primary hover:bg-primary-light">
                <LogIn className="mr-2 h-4 w-4" />{t('apply.loginCta')}
              </Button>
              <Button variant="outline" onClick={() => { onOpenChange(false); router.push('/signup'); }}>
                <UserPlus className="mr-2 h-4 w-4" />{t('apply.signupCta')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">{t('apply.title', { title: job?.title || '' })}</DialogTitle>
              <DialogDescription>{job?.farm_name} · {job?.location}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="applicant-name">{t('apply.name')}</Label>
                  <Input id="applicant-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('apply.namePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applicant-phone">{t('apply.phone')}</Label>
                  <Input id="applicant-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('apply.phonePlaceholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicant-email">{t('apply.email')}</Label>
                <Input id="applicant-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('apply.emailPlaceholder')} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('docs.cv')}<span className="ml-1 text-destructive">*</span>
                </Label>
                {docsLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">{t('docs.loading')}</span>
                  </div>
                ) : cvs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-2">{t('docs.noCvGoToAccount')}</p>
                    <Link href="/dashboard">
                      <Button size="sm" variant="outline">{t('docs.goToAccount')}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
                    </Link>
                  </div>
                ) : (
                  <DocPickerList docs={cvs} type="cv" selected={selectedCv} onSelect={setSelectedCv} />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('docs.coverLetter')}<span className="ml-1 text-[10px] text-muted-foreground">({t('docs.optional')})</span>
                </Label>
                {docsLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">{t('docs.loading')}</span>
                  </div>
                ) : coverLetters.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('docs.noCoverLetterGoToAccount')}</p>
                ) : (
                  <DocPickerList docs={coverLetters} type="cover_letter" selected={selectedCoverLetter} onSelect={setSelectedCoverLetter} />
                )}
              </div>

              {savedEmployerMessage && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-secondary" />
                    <p className="text-xs font-semibold text-foreground">{t('apply.savedMessageAttached')}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{savedEmployerMessage}</p>
                  <Link href="/dashboard" className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    {t('docs.manageMessageOnAccount')}<ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Recaptcha onVerify={setRecaptchaToken} action="apply_job" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>{t('apply.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={submitting || !recaptchaToken || !selectedCv} className="bg-primary hover:bg-primary-light">
                {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('apply.sending')}</>) : (<><Send className="mr-2 h-4 w-4" />{t('apply.submit')}</>)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
