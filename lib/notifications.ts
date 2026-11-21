'use client';

import { supabase } from '@/lib/supabase';
import type { Job, Application, ApplicationStatus } from '@/lib/types';

const emailTemplates = {
  job_application: {
    tr: (job: Job, app: Application) => ({
      subject: `Yeni Başvuru: ${job.title}`,
      body: `<h2>Yeni İş Başvurusu</h2><p><strong>${app.applicant_name}</strong> isimli aday, <strong>${job.title}</strong> pozisyonuna başvurdu.</p><p><strong>Çiftlik:</strong> ${job.farm_name}</p><p><strong>Telefon:</strong> ${app.applicant_phone}</p><p><strong>E-posta:</strong> ${app.applicant_email}</p>${app.message ? `<p><strong>Mesaj:</strong><br>${app.message}</p>` : ''}<p>Başvuruyu değerlendirmek için panonuza bakın.</p>`,
    }),
    en: (job: Job, app: Application) => ({
      subject: `New Application: ${job.title}`,
      body: `<h2>New Job Application</h2><p><strong>${app.applicant_name}</strong> has applied for <strong>${job.title}</strong>.</p><p><strong>Farm:</strong> ${job.farm_name}</p><p><strong>Phone:</strong> ${app.applicant_phone}</p><p><strong>Email:</strong> ${app.applicant_email}</p>${app.message ? `<p><strong>Message:</strong><br>${app.message}</p>` : ''}<p>Review this application in your dashboard.</p>`,
    }),
    ar: (job: Job, app: Application) => ({
      subject: `طلب جديد: ${job.title}`,
      body: `<h2>طلب وظيفة جديد</h2><p>تقدم <strong>${app.applicant_name}</strong> لوظيفة <strong>${job.title}</strong>.</p><p><strong>المزرعة:</strong> ${job.farm_name}</p><p><strong>الهاتف:</strong> ${app.applicant_phone}</p><p><strong>البريد:</strong> ${app.applicant_email}</p>${app.message ? `<p><strong>الرسالة:</strong><br>${app.message}</p>` : ''}<p>راجع هذا الطلب في لوحتك.</p>`,
    }),
  },
  application_status: {
    tr: (job: Job, status: ApplicationStatus) => ({
      subject: `Başvuru Durumu: ${job.title}`,
      body: status === 'accepted'
        ? `<h2>Başvurunuz Kabul Edildi!</h2><p><strong>${job.title}</strong> pozisyonuna yaptığınız başvuru kabul edildi.</p><p><strong>Çiftlik:</strong> ${job.farm_name}</p><p>İşveren sizinle iletişime geçecek. Tebrikler!</p>`
        : `<h2>Başvuru Durumu Güncellendi</h2><p><strong>${job.title}</strong> pozisyonuna yaptığınız başvuru değerlendirildi.</p><p><strong>Çiftlik:</strong> ${job.farm_name}</p><p>Bu sefer uygun olmadı, ancak diğer fırsatları kaçırmayın.</p>`,
    }),
    en: (job: Job, status: ApplicationStatus) => ({
      subject: `Application Status: ${job.title}`,
      body: status === 'accepted'
        ? `<h2>Application Accepted!</h2><p>Your application for <strong>${job.title}</strong> has been accepted.</p><p><strong>Farm:</strong> ${job.farm_name}</p><p>The employer will contact you. Congratulations!</p>`
        : `<h2>Application Status Updated</h2><p>Your application for <strong>${job.title}</strong> has been reviewed.</p><p><strong>Farm:</strong> ${job.farm_name}</p><p>While this one didn't work out, don't miss other opportunities.</p>`,
    }),
    ar: (job: Job, status: ApplicationStatus) => ({
      subject: `حالة الطلب: ${job.title}`,
      body: status === 'accepted'
        ? `<h2>تم قبول طلبك!</h2><p>تم قبول طلبك لوظيفة <strong>${job.title}</strong>.</p><p><strong>المزرعة:</strong> ${job.farm_name}</p><p>سيتواصل معك صاحب العمل. تهانينا!</p>`
        : `<h2>تم تحديث حالة الطلب</h2><p>تمت مراجعة طلبك لوظيفة <strong>${job.title}</strong>.</p><p><strong>المزرعة:</strong> ${job.farm_name}</p><p>لم تنجح هذه المرة، لكن لا تفوت الفرص الأخرى.</p>`,
    }),
  },
};

type SupportedLocale = 'tr' | 'en' | 'ar';

const messageEmailTemplates = {
  tr: (senderName: string, jobTitle: string, preview: string, conversationUrl: string) => ({
    subject: `Yeni Mesaj: ${senderName}`,
    body: `<h2>Yeni Mesajınız Var</h2><p><strong>${senderName}</strong> size bir mesaj gönderdi.</p><p><strong>İş:</strong> ${jobTitle}</p><p><strong>Mesaj:</strong><br>${preview}</p><p>Mesajı görmek ve yanıtlamak için <a href="${conversationUrl}">buraya tıklayın</a>.</p>`,
  }),
  en: (senderName: string, jobTitle: string, preview: string, conversationUrl: string) => ({
    subject: `New Message: ${senderName}`,
    body: `<h2>You Have a New Message</h2><p><strong>${senderName}</strong> sent you a message.</p><p><strong>Job:</strong> ${jobTitle}</p><p><strong>Message:</strong><br>${preview}</p><p><a href="${conversationUrl}">Click here</a> to view and reply.</p>`,
  }),
  ar: (senderName: string, jobTitle: string, preview: string, conversationUrl: string) => ({
    subject: `رسالة جديدة: ${senderName}`,
    body: `<h2>لديك رسالة جديدة</h2><p>أرسل لك <strong>${senderName}</strong> رسالة.</p><p><strong>الوظيفة:</strong> ${jobTitle}</p><p><strong>الرسالة:</strong><br>${preview}</p><p><a href="${conversationUrl}">انقر هنا</a> لعرض والرد.</p>`,
  }),
};

export async function createMessageNotification(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  jobTitle: string,
  messagePreview: string,
  conversationId: string,
  recipientLang: SupportedLocale = 'tr'
) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://turanda.com';
  const conversationUrl = `${origin}/messages?c=${conversationId}`;
  const preview = messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview;
  const template = messageEmailTemplates[recipientLang](senderName, jobTitle, preview, conversationUrl);

  const { data, error } = await supabase.from('notifications').insert({
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    notification_type: 'new_message',
    subject: template.subject,
    body: template.body,
    status: 'pending',
  }).select('id').maybeSingle();

  if (data?.id) {
    try {
      await supabase.functions.invoke('send-notification', {
        body: { notificationId: data.id },
      });
    } catch { /* notification stays pending for batch processing */ }
  }
  return { error: error?.message || null };
}

export async function createApplicationNotification(job: Job, application: Application, employerEmail: string, employerLang: SupportedLocale = 'tr') {
  const template = emailTemplates.job_application[employerLang](job, application);
  const { data, error } = await supabase.from('notifications').insert({
    recipient_email: employerEmail,
    recipient_name: job.farm_name,
    notification_type: 'job_application',
    subject: template.subject,
    body: template.body,
    related_job_id: job.id,
    related_application_id: application.id,
    status: 'pending',
  }).select('id').maybeSingle();

  if (data?.id) {
    try {
      await supabase.functions.invoke('send-notification', {
        body: { notificationId: data.id },
      });
    } catch { /* notification stays pending for batch processing */ }
  }
  return { error: error?.message || null };
}

export async function createStatusNotification(job: Job, application: Application, status: ApplicationStatus, applicantLang: SupportedLocale = 'tr') {
  const template = emailTemplates.application_status[applicantLang](job, status);
  const { data, error } = await supabase.from('notifications').insert({
    recipient_email: application.applicant_email,
    recipient_name: application.applicant_name,
    notification_type: 'application_status',
    subject: template.subject,
    body: template.body,
    related_job_id: job.id,
    related_application_id: application.id,
    status: 'pending',
  }).select('id').maybeSingle();

  if (data?.id) {
    try {
      await supabase.functions.invoke('send-notification', {
        body: { notificationId: data.id },
      });
    } catch { /* notification stays pending for batch processing */ }
  }
  return { error: error?.message || null };
}
