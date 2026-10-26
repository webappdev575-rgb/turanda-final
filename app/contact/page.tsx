'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/components/i18n-provider';
import { Recaptcha } from '@/components/recaptcha';

export default function ContactPage() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) return;
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: Mail, label: t('contact.email'), value: 'info@turanda.com', href: 'mailto:info@turanda.com' },
    { icon: Phone, label: t('contact.phone'), value: '+90 850 000 00 00', href: 'tel:+908500000000' },
    { icon: MapPin, label: t('contact.address'), value: 'Antalya, Türkiye' },
    { icon: Clock, label: t('contact.hours'), value: t('contact.hoursValue') },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t('contact.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Contact info cards */}
        <div className="space-y-4 lg:col-span-2">
          {contactInfo.map((info, i) => (
            <Card key={i} className="p-5 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                  <info.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{info.label}</p>
                  {info.href ? (
                    <a href={info.href} className="text-base font-semibold text-foreground transition-colors hover:text-primary">
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-base font-semibold text-foreground">{info.value}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Contact form */}
        <div className="lg:col-span-3">
          <Card className="p-6 sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center animate-scale-in">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t('contact.success')}</h3>
                <p className="max-w-sm text-sm text-muted-foreground">{t('contact.successDesc')}</p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  {t('contact.sendAnother')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.name')} *</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t('contact.namePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.emailLabel')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contact.subject')} *</Label>
                  <Input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder={t('contact.subjectPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.message')} *</Label>
                  <Textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </div>
                <Recaptcha onVerify={setRecaptchaToken} action="contact" className="w-full" />
                <Button type="submit" disabled={!recaptchaToken} className="w-full bg-primary hover:bg-primary-light">
                  <Send className="mr-2 h-4 w-4" />
                  {t('contact.submit')}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
