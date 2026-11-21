import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { ACADEMY_PROGRAMMES, type AcademyLocale } from '@/lib/academy-programmes';
import { verifyRecaptchaToken } from '@/lib/recaptcha-server';

export const runtime = 'nodejs';

const ACADEMY_SENDER = 'turandatarim@gmail.com';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

function isAcademyLocale(value: unknown): value is AcademyLocale {
  return value === 'tr' || value === 'en' || value === 'ar';
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token : '';
  const courseSlug = typeof body.courseSlug === 'string' ? body.courseSlug : '';
  const participantName = typeof body.participantName === 'string' ? body.participantName.trim() : '';
  const participantEmail = typeof body.participantEmail === 'string' ? body.participantEmail.trim() : '';
  const age = Number(body.age);
  const farmingInterest = typeof body.farmingInterest === 'string' ? body.farmingInterest.trim() : '';
  const locale = isAcademyLocale(body.locale) ? body.locale : 'en';
  const programme = ACADEMY_PROGRAMMES.find((item) => item.slug === courseSlug);

  if (!token || !programme || !participantName || participantName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participantEmail) || participantEmail.length > 254 ||
      !Number.isInteger(age) || age < 1 || age > 120 ||
      !farmingInterest || farmingInterest.length > 5000) {
    return NextResponse.json({ ok: false, error: 'Please check the application details and try again.' }, { status: 400 });
  }

  try {
    const captcha = await verifyRecaptchaToken(token, 'academy_booking');
    if (!captcha.success) {
      return NextResponse.json({ ok: false, error: 'CAPTCHA verification failed.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Academy application submission failed: Supabase is not configured.');
      return NextResponse.json({ ok: false, error: 'Application submission is unavailable.' }, { status: 503 });
    }

    const authorization = request.headers.get('authorization');
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (accessToken) {
      const { error: authError } = await supabase.auth.getUser(accessToken);
      if (authError) {
        return NextResponse.json({ ok: false, error: 'Your session has expired. Please sign in again.' }, { status: 401 });
      }
    }

    const bookingClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    });
    const { data: bookingData, error: bookingError } = await bookingClient.rpc('submit_academy_course_booking', {
      p_course_slug: courseSlug,
      p_participant_name: participantName,
      p_participant_email: participantEmail,
      p_age: age,
      p_farming_interest: farmingInterest,
    });

    if (bookingError) {
      console.error('Academy application submission failed:', bookingError.message);
      return NextResponse.json({ ok: false, error: 'Application submission failed. Please try again.' }, { status: 502 });
    }

    const bookingResult = bookingData as { ok?: boolean; reason?: string } | null;
    if (!bookingResult?.ok) {
      return NextResponse.json({ ok: false, reason: bookingResult?.reason || 'submission_failed' });
    }

    const smtpUser = process.env.SMTP_USER?.trim().toLowerCase();
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (smtpUser !== ACADEMY_SENDER || !smtpPassword) {
      console.error('Academy emails not sent: configure SMTP_USER and SMTP_PASSWORD on the server.');
      return NextResponse.json({
        ok: true,
        adminEmailSent: false,
        confirmationEmailSent: false,
        emailError: 'smtp_not_configured',
      });
    }

    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const courseTitle = programme.title[locale];
    const message = {
      tr: `Merhaba ${participantName},\n\n${courseTitle} programı için başvurunuzu aldık. Başvurunuz yönetici onayını bekliyor.\n\nTuranda Tarım`,
      en: `Hello ${participantName},\n\nWe have received your application for ${courseTitle}. It is awaiting administrator approval.\n\nTuranda Tarım`,
      ar: `مرحباً ${participantName}،\n\nلقد استلمنا طلبك للبرنامج ${courseTitle}. طلبك بانتظار موافقة المسؤول.\n\nتوراندا تاريم`,
    }[locale];
    const escapedName = escapeHtml(participantName);
    const escapedTitle = escapeHtml(courseTitle);
    const escapedEmail = escapeHtml(participantEmail);
    const escapedInterest = escapeHtml(farmingInterest).replace(/\n/g, '<br>');
    const htmlMessage = {
      tr: `<p>Merhaba ${escapedName},</p><p><strong>${escapedTitle}</strong> programı için başvurunuzu aldık. Başvurunuz yönetici onayını bekliyor.</p><p>Turanda Tarım</p>`,
      en: `<p>Hello ${escapedName},</p><p>We have received your application for <strong>${escapedTitle}</strong>. It is awaiting administrator approval.</p><p>Turanda Tarım</p>`,
      ar: `<p>مرحباً ${escapedName}،</p><p>لقد استلمنا طلبك للبرنامج <strong>${escapedTitle}</strong>. طلبك بانتظار موافقة المسؤول.</p><p>توراندا تاريم</p>`,
    }[locale];
    const adminSubject = {
      tr: `Yeni Akademi Başvurusu: ${courseTitle}`,
      en: `New Academy Application: ${courseTitle}`,
      ar: `طلب أكاديمية جديد: ${courseTitle}`,
    }[locale];
    const adminText = {
      tr: `Yeni akademi başvurusu\n\nProgram: ${courseTitle}\nAd: ${participantName}\nE-posta: ${participantEmail}\nYaş: ${age}\nİlgi alanı: ${farmingInterest}`,
      en: `New academy application\n\nProgramme: ${courseTitle}\nName: ${participantName}\nEmail: ${participantEmail}\nAge: ${age}\nArea of interest: ${farmingInterest}`,
      ar: `طلب أكاديمية جديد\n\nالبرنامج: ${courseTitle}\nالاسم: ${participantName}\nالبريد الإلكتروني: ${participantEmail}\nالعمر: ${age}\nمجال الاهتمام: ${farmingInterest}`,
    }[locale];
    const adminHtml = `<h2>${escapeHtml(adminSubject)}</h2><p><strong>Programme:</strong> ${escapedTitle}</p><p><strong>Name:</strong> ${escapedName}</p><p><strong>Email:</strong> ${escapedEmail}</p><p><strong>Age:</strong> ${age}</p><p><strong>Area of interest:</strong><br>${escapedInterest}</p>`;
    const confirmationSubject = {
      tr: `Başvuru alındı: ${courseTitle}`,
      en: `Application received: ${courseTitle}`,
      ar: `تم استلام الطلب: ${courseTitle}`,
    }[locale];

    const [adminResult, confirmationResult] = await Promise.allSettled([
      transporter.sendMail({
        from: `Turanda Tarım <${ACADEMY_SENDER}>`,
        to: ACADEMY_SENDER,
        replyTo: participantEmail,
        subject: adminSubject,
        text: adminText,
        html: adminHtml,
      }),
      transporter.sendMail({
        from: `Turanda Tarım <${ACADEMY_SENDER}>`,
        to: participantEmail,
        replyTo: ACADEMY_SENDER,
        subject: confirmationSubject,
        text: message,
        html: htmlMessage,
      }),
    ]);

    const adminEmailSent = adminResult.status === 'fulfilled';
    const confirmationEmailSent = confirmationResult.status === 'fulfilled';
    if (!adminEmailSent) console.error('Academy admin notification email failed:', adminResult.reason);
    if (!confirmationEmailSent) console.error('Academy applicant confirmation email failed:', confirmationResult.reason);

    return NextResponse.json({
      ok: true,
      adminEmailSent,
      confirmationEmailSent,
      ...(!adminEmailSent || !confirmationEmailSent ? { emailError: 'smtp_delivery_failed' } : {}),
    });
  } catch (error) {
    console.error('Academy application request failed:', error);
    return NextResponse.json({ ok: false, error: 'Application submission failed. Please try again.' }, { status: 500 });
  }
}
