'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, GraduationCap, Loader2, User, Clock, BookOpen, PlayCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import { useAcademyCourseAvailability, submitAcademyCourseBooking, useCourse, useEnrollment } from '@/hooks/use-academy';
import { useToast } from '@/hooks/use-toast';
import { ACADEMY_PROGRAMMES, type AcademyLocale, type AcademyProgramme } from '@/lib/academy-programmes';

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <CourseDetailContent />
    </Suspense>
  );
}

function CourseDetailContent() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const programme = ACADEMY_PROGRAMMES.find((item) => item.slug === courseId);
  const legacy = useCourse(programme ? null : courseId);
  const legacyEnrollment = useEnrollment(programme ? null : courseId);
  const { availability, loading: availabilityLoading, refetch } = useAcademyCourseAvailability(programme?.slug || null);
  const [open, setOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    participantName: '',
    participantEmail: '',
    age: '',
    farmingInterest: '',
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      participantName: profile?.full_name || current.participantName,
      participantEmail: user?.email || current.participantEmail,
    }));
  }, [profile, user]);

  useEffect(() => {
    if (!programme || availabilityLoading || searchParams.get('enroll') !== '1') return;
    if ((availability?.remaining ?? 0) > 0) setOpen(true);
    router.replace(`/akademi/${programme.slug}`, { scroll: false });
  }, [programme, router, searchParams, availabilityLoading, availability?.remaining]);

  useEffect(() => {
    if (!programme) return;
    const interval = window.setInterval(() => refetch(), 15000);
    return () => window.clearInterval(interval);
  }, [programme, refetch]);

  if (!programme) {
    if (legacy.loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!legacy.course) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-lg font-semibold text-foreground">Programme not found</p>
          <Link href="/akademi"><Button variant="outline" className="mt-4">Back to Akademi</Button></Link>
        </div>
      );
    }
    const course = legacy.course;
    const enrollment = legacyEnrollment.enrollment;
    const handleLegacyEnroll = async () => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      await legacyEnrollment.enroll(user.id, course.id);
    };
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/akademi" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />All Courses
        </Link>
        {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="mb-6 h-72 w-full rounded-2xl object-cover" />}
        <h1 className="mb-3 text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="mb-4 text-muted-foreground">{course.description}</p>
        <div className="mb-6 flex gap-4 text-sm text-muted-foreground">
          {course.estimated_minutes > 0 && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.estimated_minutes} minutes</span>}
          {course.instructor_name && <span className="flex items-center gap-1"><User className="h-4 w-4" />{course.instructor_name}</span>}
        </div>
        {!enrollment && <Button onClick={handleLegacyEnroll} className="mb-8"><GraduationCap className="mr-2 h-4 w-4" />Enroll</Button>}
        <h2 className="mb-3 text-xl font-bold text-foreground">Lessons</h2>
        <div className="space-y-3">
          {legacy.lessons.map((lesson) => {
            const LessonIcon = lesson.lesson_type === 'video' ? PlayCircle : FileText;
            return (
              <Card key={lesson.id} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><LessonIcon className="h-5 w-5 text-primary" /></div>
                <div className="flex-1"><p className="font-medium">{lesson.title}</p>{lesson.duration_minutes > 0 && <p className="text-xs text-muted-foreground">{lesson.duration_minutes} minutes</p>}</div>
                {enrollment?.completed_lessons?.includes(legacy.lessons.indexOf(lesson)) && <CheckCircle2 className="h-5 w-5 text-success" />}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const lang = locale as AcademyLocale;
  const remaining = availability?.remaining ?? 0;
  const isFull = !availabilityLoading && remaining <= 0;
  const labels = {
    tr: { schedule: 'Program Takvimi', instructors: 'Eğitmenler', prerequisites: 'Ön Koşullar', seats: 'Kalan Kontenjan', participate: 'Katıl', full: 'Kontenjan Doldu', submitted: 'Başvurunuz iletildi', submitDesc: 'Başvurunuz yönetici onayı bekliyor.', name: 'Katılımcı adı', email: 'E-posta', age: 'Yaş', interest: 'Tarım ilgi alanı', submit: 'Başvuru Gönder', description: 'Açıklama', month: 'Ay', subject: 'Eğitim konusu', activities: 'Pratik faaliyetler', concludes: 'Program sonunda:', all: 'Tüm Kurslar', compare: 'Programları karşılaştır', compareTitle: 'Eğitim programlarını karşılaştırın', duration: 'Süre', participants: 'Kimler için', curriculum: 'Müfredat', enrollNow: 'Hemen kayıt olun', noCurriculum: 'Müfredat bilgisi yakında paylaşılacaktır.', spotsRemaining: 'yer kaldı', registered: 'kayıtlı', loadingSeats: 'Kontenjan yükleniyor' },
    en: { schedule: 'Course Schedule', instructors: 'Instructors', prerequisites: 'Prerequisites', seats: 'Places Remaining', participate: 'Participate', full: 'Full', submitted: 'Booking request submitted', submitDesc: 'Your request is awaiting administrator approval.', name: 'Participant Name', email: 'Email', age: 'Age', interest: 'Area of Interest / Farming Interest', submit: 'Submit Registration', description: 'Description', month: 'Month', subject: 'Training subject', activities: 'Practical activities', concludes: 'The programme concludes with:', all: 'All Courses', compare: 'Compare programmes', compareTitle: 'Compare training programmes', duration: 'Duration', participants: 'Who it is for', curriculum: 'Curriculum', enrollNow: 'Enroll now', noCurriculum: 'Curriculum details will be shared soon.', spotsRemaining: 'spots remaining', registered: 'registered', loadingSeats: 'Loading availability' },
    ar: { schedule: 'جدول البرنامج', instructors: 'المدربون', prerequisites: 'المتطلبات السابقة', seats: 'المقاعد المتبقية', participate: 'المشاركة', full: 'مكتمل', submitted: 'تم إرسال طلب الحجز', submitDesc: 'طلبك بانتظار موافقة المسؤول.', name: 'اسم المشارك', email: 'البريد الإلكتروني', age: 'العمر', interest: 'مجال الاهتمام / الاهتمام بالزراعة', submit: 'إرسال التسجيل', description: 'الوصف', month: 'الشهر', subject: 'الموضوع التدريبي', activities: 'الأنشطة العملية', concludes: 'يختتم البرنامج بما يلي:', all: 'جميع الدورات', compare: 'قارن البرامج', compareTitle: 'قارن البرامج التدريبية', duration: 'المدة', participants: 'الفئة المستهدفة', curriculum: 'المنهج الدراسي', enrollNow: 'سجّل الآن', noCurriculum: 'سيتم مشاركة تفاصيل المنهج قريباً.', spotsRemaining: 'مقاعد متبقية', registered: 'مسجلون', loadingSeats: 'جارٍ تحميل المقاعد' },
  }[lang];

  const submit = async () => {
    const age = parseInt(form.age, 10);
    if (!form.participantName.trim() || !form.participantEmail.trim() || !form.farmingInterest.trim() || !age) {
      toast({ title: lang === 'tr' ? 'Lütfen tüm alanları doldurun' : lang === 'ar' ? 'يرجى تعبئة جميع الحقول' : 'Please complete every field', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitAcademyCourseBooking({
        courseSlug: programme.slug,
        participantName: form.participantName,
        participantEmail: form.participantEmail,
        age,
        farmingInterest: form.farmingInterest,
      });
      if (!result.ok) {
        const reason = result.reason === 'full'
          ? (lang === 'tr' ? 'Kontenjan doldu' : lang === 'ar' ? 'المقاعد ممتلئة' : 'This course is full')
          : result.reason === 'duplicate'
            ? (lang === 'tr' ? 'Bu e-posta ile zaten başvuru yapılmış' : lang === 'ar' ? 'يوجد طلب سابق بهذا البريد الإلكتروني' : 'A request already exists for this email')
            : (lang === 'tr' ? 'Başvuru gönderilemedi' : lang === 'ar' ? 'تعذر إرسال الطلب' : 'Could not submit booking');
        toast({ title: reason, variant: 'destructive' });
        return;
      }
      toast({ title: labels.submitted, description: labels.submitDesc });
      setOpen(false);
      setForm({ participantName: profile?.full_name || '', participantEmail: user?.email || '', age: '', farmingInterest: '' });
      await refetch();
    } catch {
      toast({ title: lang === 'tr' ? 'Başvuru gönderilemedi' : lang === 'ar' ? 'تعذر إرسال الطلب' : 'Could not submit booking', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Link href="/akademi" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />{labels.all}
      </Link>

      <Card className="overflow-hidden">
        <div className="relative h-64 sm:h-80">
          <img src={programme.image} alt={programme.title[lang]} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <Badge className="absolute bottom-5 left-5 border-0 bg-cream/95 text-brand">{programme.duration[lang]}</Badge>
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-foreground">{programme.title[lang]}</h1>
              <p className="mt-3 leading-relaxed text-muted-foreground">{programme.description[lang]}</p>
              {programme.time && (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                  <CalendarDays className="h-4 w-4" />{programme.time}
                </p>
              )}
            </div>
            <Card className="min-w-52 p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground">{labels.seats}</p>
              {availabilityLoading ? (
                <Loader2 className="mx-auto mt-2 h-6 w-6 animate-spin text-primary" />
              ) : (
                <div className="mt-1">
                  <p className="text-4xl font-bold text-primary">{remaining}</p>
                  <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                    {remaining} {labels.spotsRemaining} — {availability?.accepted ?? 0}/{availability?.capacity ?? 0} {labels.registered}
                  </p>
                </div>
              )}
              <Button className="mt-4 w-full" disabled={isFull || availabilityLoading} onClick={() => setOpen(true)}>
                <GraduationCap className="mr-2 h-4 w-4" />{isFull ? labels.full : labels.participate}
              </Button>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="text-xl font-bold text-foreground">{labels.instructors}</h2>
              <div className="mt-3 space-y-3">
                {programme.instructors.map((instructor) => (
                  <Card key={instructor.name} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-semibold text-foreground">{instructor.name}</p><p className="text-xs text-primary">{instructor.role[lang]}</p><p className="mt-1 text-sm text-muted-foreground">{instructor.bio[lang]}</p></div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold text-foreground">{labels.prerequisites}</h2>
              <ul className="mt-3 space-y-2">
                {programme.prerequisites.map((item) => (
                  <li key={item.en} className="rounded-lg border border-border p-3 text-sm text-muted-foreground">{item[lang]}</li>
                ))}
              </ul>
            </section>
          </div>

          {programme.schedule && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-foreground">{labels.schedule}</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50"><tr><th className="px-4 py-3">{lang === 'tr' ? 'Saat' : lang === 'ar' ? 'الوقت' : 'Time'}</th><th className="px-4 py-3">{lang === 'tr' ? 'Faaliyet' : lang === 'ar' ? 'النشاط' : 'Activity'}</th></tr></thead>
                  <tbody>{programme.schedule.map((row) => <tr key={row.time} className="border-t border-border"><td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{row.time}</td><td className="px-4 py-3 text-muted-foreground">{row.activity[lang]}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}

          {programme.months && (
            <section className="mt-8">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50"><tr><th className="px-4 py-3">{labels.month}</th><th className="px-4 py-3">{labels.subject}</th><th className="px-4 py-3">{labels.activities}</th></tr></thead>
                  <tbody>{programme.months.map((row) => <tr key={row.month} className="border-t border-border align-top"><td className="px-4 py-3 font-bold text-primary">{row.month}</td><td className="px-4 py-3 font-medium text-foreground">{row.subject[lang]}</td><td className="px-4 py-3 text-muted-foreground">{row.activities[lang]}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}

          {programme.outcomes && programme.outcomes.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-foreground">{labels.concludes}</h2>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {programme.outcomes.map((outcome) => <li key={outcome.en} className="rounded-lg border border-border p-3">{outcome[lang]}</li>)}
              </ul>
            </section>
          )}

          <section className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-semibold text-foreground">{programme.title[lang]}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{programme.duration[lang]}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setCompareOpen(true)}>
                {labels.compare}
              </Button>
              <Button disabled={isFull || availabilityLoading} onClick={() => setOpen(true)}>
                <GraduationCap className="mr-2 h-4 w-4" />
                {isFull ? labels.full : labels.enrollNow}
              </Button>
            </div>
          </section>
        </div>
      </Card>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{labels.compareTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
            {ACADEMY_PROGRAMMES.map((item) => (
              <ProgrammeComparisonCard
                key={item.slug}
                programme={item}
                lang={lang}
                labels={labels}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{labels.participate} — {programme.title[lang]}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1"><Label>{labels.name}</Label><Input value={form.participantName} onChange={(e) => setForm({ ...form, participantName: e.target.value })} /></div>
            <div className="space-y-1"><Label>{labels.email}</Label><Input type="email" value={form.participantEmail} onChange={(e) => setForm({ ...form, participantEmail: e.target.value })} /></div>
            <div className="space-y-1"><Label>{labels.age}</Label><Input type="number" min={1} max={120} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
            <div className="space-y-1"><Label>{labels.interest}</Label><Textarea value={form.farmingInterest} onChange={(e) => setForm({ ...form, farmingInterest: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{labels.submit}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgrammeComparisonCard({
  programme,
  lang,
  labels,
}: {
  programme: AcademyProgramme;
  lang: AcademyLocale;
  labels: {
    duration: string;
    participants: string;
    prerequisites: string;
    curriculum: string;
    month: string;
    subject: string;
    activities: string;
    concludes: string;
    enrollNow: string;
    noCurriculum: string;
    spotsRemaining: string;
    registered: string;
    loadingSeats: string;
    full: string;
  };
}) {
  const { availability, loading, refetch } = useAcademyCourseAvailability(programme.slug);
  const remaining = availability?.remaining ?? 0;
  const isFull = !loading && remaining <= 0;

  useEffect(() => {
    const timer = window.setInterval(() => refetch(), 15000);
    return () => window.clearInterval(timer);
  }, [refetch]);

  const curriculum = programme.months
    ? programme.months.map((row) => `${labels.month} ${row.month}: ${row.subject[lang]} — ${row.activities[lang]}`)
    : programme.schedule?.map((row) => `${row.time}: ${row.activity[lang]}`) ?? [];

  return (
    <Card className="min-w-0 p-4 md:row-span-9 md:grid md:grid-rows-[subgrid]">
      <h3 className="flex items-start text-lg font-bold leading-tight text-foreground md:pb-3 md:border-b md:border-border/60">
        {programme.title[lang]}
      </h3>
      <p className="mt-2 text-sm leading-5 text-muted-foreground md:mt-0 md:py-3 md:border-b md:border-border/60">
        {programme.description[lang]}
      </p>
      {loading ? (
        <div className="mt-4 flex min-h-10 items-center gap-2 text-sm text-muted-foreground md:mt-0 md:py-3 md:border-b md:border-border/60">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          {labels.loadingSeats}
        </div>
      ) : (
        <p className="mt-4 min-h-10 text-sm font-medium leading-5 text-primary md:mt-0 md:flex md:items-center md:py-3 md:border-b md:border-border/60" aria-live="polite">
          {remaining} {labels.spotsRemaining} — {availability?.accepted ?? 0}/{availability?.capacity ?? 0} {labels.registered}
        </p>
      )}
      <dl className="contents text-sm">
        <div className="mt-4 border-t border-border/60 pt-3 md:m-0">
          <dt className="font-semibold text-foreground">{labels.duration}</dt>
          <dd className="mt-1 text-muted-foreground">{programme.duration[lang]}</dd>
        </div>
        <div className="mt-3 border-t border-border/60 pt-3 md:m-0">
          <dt className="font-semibold text-foreground">{labels.participants}</dt>
          <dd className="mt-1 text-muted-foreground">{programme.participants[lang]}</dd>
        </div>
        <div className="mt-3 border-t border-border/60 pt-3 md:m-0">
          <dt className="font-semibold text-foreground">{labels.prerequisites}</dt>
          <dd>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {programme.prerequisites.map((item) => <li key={item.en}>{item[lang]}</li>)}
            </ul>
          </dd>
        </div>
        <div className="mt-3 border-t border-border/60 pt-3 md:m-0">
          <dt className="font-semibold text-foreground">{labels.curriculum}</dt>
          {curriculum.length > 0 ? (
            <ul className="mt-1 space-y-2 text-muted-foreground">
              {curriculum.map((item) => <li key={item} className="border-l-2 border-primary/20 pl-2">{item}</li>)}
            </ul>
          ) : (
            <dd className="mt-1 text-muted-foreground">{labels.noCurriculum}</dd>
          )}
        </div>
        <div className="mt-3 border-t border-border/60 pt-3 md:m-0">
          <dt className="font-semibold text-foreground">{labels.concludes}</dt>
          {programme.outcomes && programme.outcomes.length > 0 ? (
            <dd>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                {programme.outcomes.map((item) => <li key={item.en}>{item[lang]}</li>)}
              </ul>
            </dd>
          ) : (
            <dd className="mt-1 text-muted-foreground">—</dd>
          )}
        </div>
      </dl>
      {loading || isFull ? (
        <Button className="mt-5 w-full md:mt-3" disabled>
          <GraduationCap className="mr-2 h-4 w-4" />
          {isFull ? labels.full : labels.enrollNow}
        </Button>
      ) : (
        <Button asChild className="mt-5 w-full md:mt-3">
          <Link href={`/akademi/${programme.slug}?enroll=1`}>
            <GraduationCap className="mr-2 h-4 w-4" />
            {labels.enrollNow}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </Card>
  );
}
