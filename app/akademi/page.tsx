'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, User, ArrowRight, Loader2, BookOpen, PlayCircle, FileText, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/components/i18n-provider';
import { useAcademyCourses } from '@/hooks/use-academy';
import { cn } from '@/lib/utils';
import type { AcademyDifficulty } from '@/lib/types';

type LocalizedText = { tr: string; en: string; ar: string };
type ScheduleRow = [string, LocalizedText];
type MonthRow = [string, LocalizedText, LocalizedText];

type AcademyProgramme = {
  id: string;
  title: LocalizedText;
  duration: LocalizedText;
  time?: string;
  participants: LocalizedText;
  image: string;
  schedule?: ScheduleRow[];
  note?: LocalizedText;
  months?: MonthRow[];
  outcomes?: LocalizedText[];
};

const COURSE_CATEGORIES = [
  'Crop Management', 'Livestock', 'Machinery', 'Irrigation',
  'Soil & Fertilizer', 'Pest Control', 'General',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/30',
  intermediate: 'bg-accent/15 text-accent-foreground border-accent/30',
  advanced: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function AkademiPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }>
      <AkademiPageContent />
    </Suspense>
  );
}

const PROGRAMMES: AcademyProgramme[] = [
  {
    id: 'farmer-for-a-day',
    title: { tr: 'Bir Günlük Çiftçi', en: 'Farmer for a Day', ar: 'يوم كمزارع' },
    duration: { tr: 'Bir gün', en: 'One-day experience', ar: 'تجربة لمدة يوم واحد' },
    time: '08:00–17:00',
    participants: {
      tr: 'Şehir sakinleri, aileler, ziyaretçiler, öğrenciler ve tarımla ilgilenen kişiler.',
      en: 'Urban residents, families, visitors, students and people interested in agriculture.',
      ar: 'سكان المدن والعائلات والزوار والطلاب والأشخاص المهتمون بالزراعة.',
    },
    image: '/images/academy/farmer-for-a-day.png',
    schedule: [
      ['08:00–09:00', { tr: 'Karşılama, köy kahvaltısı ve hoş geldiniz', en: 'Arrival, village breakfast and welcome', ar: 'الوصول وإفطار القرويين والاستقبال' }],
      ['09:00–09:30', { tr: 'Çiftçiliğe giriş ve güvenlik bilgilendirmesi', en: 'Introduction to farming and safety briefing', ar: 'مقدمة في الزراعة وإرشادات السلامة' }],
      ['09:30–10:30', { tr: 'Tarım makinelerine giriş', en: 'Introduction to agricultural machinery', ar: 'مقدمة في الآلات الزراعية' }],
      ['10:30–12:00', { tr: 'Uygulamalı tarla faaliyetleri', en: 'Hands-on field activities', ar: 'أنشطة ميدانية عملية' }],
      ['12:00–13:00', { tr: 'Geleneksel köy öğle yemeği', en: 'Traditional village lunch', ar: 'غداء ريفي تقليدي' }],
      ['13:00–14:30', { tr: 'Ekme, sulama ve mevsimlik tarla işleri', en: 'Planting, irrigation and seasonal fieldwork', ar: 'الزراعة والري والعمل الموسمي في الحقل' }],
      ['14:30–15:30', { tr: 'Çiftliği keşfetme ve mahsul gözlemi', en: 'Farm exploration and crop observation', ar: 'استكشاف المزرعة ومراقبة المحاصيل' }],
      ['15:30–16:30', { tr: 'Pratik tarım meydan okuması', en: 'Practical farming challenge', ar: 'تحدٍ عملي في الزراعة' }],
      ['16:30–17:00', { tr: 'Sertifika takdimi ve ayrılış', en: 'Certificate presentation and departure', ar: 'تقديم الشهادات والانصراف' }],
    ],
    note: {
      tr: 'Faaliyetler tarımsal mevsime göre değişir.',
      en: 'Activities change according to the agricultural season.',
      ar: 'تتغير الأنشطة حسب الموسم الزراعي.',
    },
  },
  {
    id: 'weekend-farming',
    title: { tr: 'Hafta Sonu Tarım Programı', en: 'Weekend Farming Programme', ar: 'برنامج الزراعة لوقت نهاية الأسبوع' },
    duration: { tr: 'İki gün', en: 'Two-day practical course', ar: 'دورة عملية لمدة يومين' },
    participants: {
      tr: 'Başlangıç seviyesindeki kişiler, çiftçilik yapmak isteyenler, tarım meraklıları ve pratik tarım becerilerini geliştirmek isteyenler.',
      en: 'Beginners, aspiring farmers, agricultural enthusiasts and people wishing to develop practical farming skills.',
      ar: 'المبتدئون والمهتمون بالزراعة والطامحون لأن يصبحوا مزارعين والأشخاص الراغبون في تطوير مهاراتهم الزراعية العملية.',
    },
    image: '/images/academy/recreational-program.png',
    schedule: [
      ['Saturday', { tr: 'Çiftliği Anlamak', en: 'Understanding the Farm', ar: 'فهم المزرعة' }],
      ['09:00–10:00', { tr: 'Modern tarıma giriş', en: 'Introduction to modern agriculture', ar: 'مقدمة في الزراعة الحديثة' }],
      ['10:00–11:00', { tr: 'Toprak hazırlama ve toprak analizi', en: 'Soil preparation and soil analysis', ar: 'تحضير التربة وتحليلها' }],
      ['11:00–12:30', { tr: 'Mahsul seçimi, ekim ve tohumlama', en: 'Crop selection, planting and seeding', ar: 'اختيار المحاصيل والزراعة والبذر' }],
      ['12:30–13:30', { tr: 'Öğle yemeği', en: 'Lunch', ar: 'الغداء' }],
      ['13:30–15:00', { tr: 'Traktör ve tarım makinesi gösterimleri', en: 'Tractor and agricultural machinery demonstrations', ar: 'عروض الجرارات والآلات الزراعية' }],
      ['15:00–16:30', { tr: 'Uygulamalı tarla hazırlama', en: 'Practical field preparation', ar: 'التحضير العملي للحقل' }],
      ['Sunday', { tr: 'Toprağı İşlemek', en: 'Working the Land', ar: 'العمل في الأرض' }],
      ['09:00–10:00', { tr: 'Sulama sistemleri ve su yönetimi', en: 'Irrigation systems and water management', ar: 'أنظمة الري وإدارة المياه' }],
      ['10:00–11:30', { tr: 'Sulama ekipmanının kurulumu ve kullanımı', en: 'Installation and operation of irrigation equipment', ar: 'تركيب وتشغيل معدات الري' }],
      ['11:30–12:30', { tr: 'Gübreleme ve bitki besleme', en: 'Fertilisation and crop nutrition', ar: 'التسميد وتغذية المحاصيل' }],
      ['12:30–13:30', { tr: 'Öğle yemeği', en: 'Lunch', ar: 'الغداء' }],
      ['13:30–15:00', { tr: 'Mahsul izleme ve tarla yönetimi', en: 'Crop monitoring and field management', ar: 'مراقبة المحاصيل وإدارة الحقل' }],
      ['15:00–16:00', { tr: 'Makine kullanımı ve bakımı', en: 'Machinery operation and maintenance', ar: 'تشغيل الآلات وصيانتها' }],
      ['16:00–16:30', { tr: 'Değerlendirme ve sertifika takdimi', en: 'Assessment and certificate presentation', ar: 'التقييم وتقديم الشهادات' }],
    ],
  },
  {
    id: 'professional-farming',
    title: { tr: 'Altı Aylık Profesyonel Çiftçilik Programı', en: 'Six-Month Professional Farming Programme', ar: 'برنامج الزراعة المهنية لمدة ستة أشهر' },
    duration: { tr: 'Altı aylık eğitim', en: 'Six-month paid training', ar: 'تدريب مدفوع لمدة ستة أشهر' },
    participants: {
      tr: 'Profesyonel çiftçi olmak isteyenler, tarıma başlayan gençler ve tarım işletmesi kurmak veya yönetmek isteyen kişiler.',
      en: 'Aspiring professional farmers, young people entering agriculture and individuals wishing to establish or manage agricultural operations.',
      ar: 'المزارعون الطموحون والشباب المقبلون على مجال الزراعة والأفراد الراغبون في إنشاء أو إدارة عمليات زراعية.',
    },
    image: '/images/academy/seasonal-program.png',
    months: [
      ['1', { tr: 'Toprak Bilimi ve Arazi Hazırlama', en: 'Soil Science & Land Preparation', ar: 'علم التربة وتجهيز الأرض' }, { tr: 'Toprak testi, toprak yapısı, sürüm, işleme ve tarla hazırlama', en: 'Soil testing, soil structure, ploughing, cultivation and field preparation', ar: 'اختبار التربة وبنية التربة والحرث والتهيئة وتجهيز الحقل' }],
      ['2', { tr: 'Mahsul Üretimi ve Ekim', en: 'Crop Production & Planting', ar: 'إنتاج المحاصيل والزراعة' }, { tr: 'Tohum seçimi, ekim teknikleri, münavebe ve gübreleme', en: 'Seed selection, planting techniques, crop rotation and fertilisation', ar: 'اختيار البذور وتقنيات الزراعة ودوران المحاصيل والتسميد' }],
      ['3', { tr: 'Sulama ve Su Yönetimi', en: 'Irrigation & Water Management', ar: 'الري وإدارة المياه' }, { tr: 'Damla sulama, yağmurlama sulama, su basıncı, otomasyon ve su tasarrufu', en: 'Drip irrigation, sprinklers, water pressure, automation and water conservation', ar: 'الري بالتنقيط والرش وضغط المياه والأتمتة والحفاظ على المياه' }],
      ['4', { tr: 'Tarım Makineleri ve Teknolojisi', en: 'Agricultural Machinery & Technology', ar: 'الآلات والتكنولوجيا الزراعية' }, { tr: 'Traktör kullanımı, makine kalibrasyonu, bakım ve modern ekipman', en: 'Tractor operation, machinery calibration, maintenance and modern equipment', ar: 'تشغيل الجرار ومعايرة الآلات والصيانة والمعدات الحديثة' }],
      ['5', { tr: 'Mahsul Koruma ve Çiftlik Yönetimi', en: 'Crop Protection & Farm Management', ar: 'حماية المحاصيل وإدارة المزرعة' }, { tr: 'Zararlı ve hastalık tespiti, yabancı ot kontrolü, mahsul izleme ve çiftlik planlama', en: 'Pest and disease identification, weed control, crop monitoring and farm planning', ar: 'تحديد الآفات والأمراض ومكافحة الأعشاب ومراقبة المحاصيل وتخطيط المزرعة' }],
      ['6', { tr: 'Hasat, Ekonomi ve Profesyonel Çiftlik Yönetimi', en: 'Harvesting, Economics & Professional Farm Management', ar: 'الحصاد والاقتصاد والإدارة الزراعية المهنية' }, { tr: 'Hasat, depolama, pazarlama, maliyet hesapları ve çiftlik iş planı hazırlama', en: 'Harvesting, storage, marketing, cost calculations and preparation of a farm business plan', ar: 'الحصاد والتخزين والتسويق وحساب التكاليف وإعداد خطة عمل للمزرعة' }],
    ],
    outcomes: [
      { tr: 'Pratik yeterlilik değerlendirmesi', en: 'Practical competency assessment', ar: 'تقييم الكفاءة العملية' },
      { tr: 'Bireysel çiftlik yönetimi projesi', en: 'Individual farm-management project', ar: 'مشروع فردي لإدارة المزرعة' },
      { tr: 'Tarım bilgisi değerlendirmesi', en: 'Evaluation of agricultural knowledge', ar: 'تقييم المعرفة الزراعية' },
      { tr: 'Tamamlama sertifikası', en: 'Certificate of completion', ar: 'شهادة إكمال البرنامج' },
    ],
  },
];

function AkademiPageContent() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const { courses, loading } = useAcademyCourses(category, difficulty);
  const labels = {
    tr: {
      pageTitle: 'Turanda Tarım Akademisi – Eğitim Programları',
      intro: 'İlk kez gelen ziyaretçiler, gelişmekte olan çiftçiler ve geleceğin tarım profesyonelleri için pratik, çiftlik içi programlar.',
      duration: 'Süre',
      participants: 'Hedef katılımcılar',
      schedule: 'Program takvimini görüntüle',
      time: 'Saat',
      activity: 'Faaliyet',
      curriculum: 'Altı aylık müfredatı görüntüle',
      month: 'Ay',
      subject: 'Eğitim konusu',
      practical: 'Pratik faaliyetler',
      concludes: 'Program sonunda:',
    },
    en: {
      pageTitle: 'Turanda Agri Academy – Training Programmes',
      intro: 'Practical, on-farm programmes for first-time visitors, developing farmers and future agricultural professionals.',
      duration: 'Duration',
      participants: 'Target participants',
      schedule: 'View programme schedule',
      time: 'Time',
      activity: 'Activity',
      curriculum: 'View six-month curriculum',
      month: 'Month',
      subject: 'Training subject',
      practical: 'Practical activities',
      concludes: 'The programme concludes with:',
    },
    ar: {
      pageTitle: 'أكاديمية توراندا الزراعية – البرامج التدريبية',
      intro: 'برامج عملية داخل المزارع للزوار الجدد والمزارعين الطموحين والمهنيين الزراعيين المستقبليين.',
      duration: 'المدة',
      participants: 'الفئات المستهدفة',
      schedule: 'عرض جدول البرنامج',
      time: 'الوقت',
      activity: 'النشاط',
      curriculum: 'عرض المنهج لمدة ستة أشهر',
      month: 'الشهر',
      subject: 'الموضوع التدريبي',
      practical: 'الأنشطة العملية',
      concludes: 'يختتم البرنامج بما يلي:',
    },
  }[locale];

  const filteredCourses = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.instructor_name || '').toLowerCase().includes(q)
    );
  }, [courses, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[32px] ring-1 ring-[#15231d1a] shadow-[0px_25px_50px_-12px_#00000026] dark:ring-[#ffffff14]">
        <div className="relative h-[180px] w-full overflow-hidden bg-white sm:h-[220px] lg:h-[260px]">
          <img
            src="/images/turanda_academy_header.png"
            alt="Turanda Tarım Akademisi"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Turanda Agri Academy training programmes */}
      <section className="mt-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{labels.pageTitle}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>
        </div>
        <div className="mt-6 space-y-6">
          {PROGRAMMES.map((programme, index) => (
            <Card key={programme.id} className="overflow-hidden border-border">
              <div className="grid md:grid-cols-[280px_1fr]">
                <div className="relative min-h-52 overflow-hidden">
                  <img src={programme.image} alt={programme.title[locale]} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <Badge className="absolute bottom-4 left-4 bg-cream/95 text-brand border-0">
                    {index + 1}. {programme.duration[locale]}
                  </Badge>
                </div>
                <div className="p-5 sm:p-6">
                  <h2 className="text-2xl font-bold text-foreground">{programme.title[locale]}</h2>
                  {programme.time && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <CalendarDays className="h-4 w-4" /> {labels.duration}: {programme.time}
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">{labels.participants}:</span>{' '}
                    {programme.participants?.[locale]}
                  </p>
                  {programme.note && (
                    <p className="mt-3 text-sm italic text-muted-foreground">{programme.note[locale]}</p>
                  )}
                  <Link href={`/akademi/${programme.id}`} className="mt-5 inline-flex">
                    <Button className="bg-primary hover:bg-primary-light">
                      {locale === 'tr' ? 'Programı İncele ve Katıl' : locale === 'ar' ? 'عرض البرنامج والمشاركة' : 'View Programme & Participate'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  {programme.schedule && (
                    <details className="mt-5 rounded-xl border border-border">
                      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-foreground">
                        {labels.schedule}
                      </summary>
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="w-32 px-4 py-3 font-semibold text-foreground">{labels.time}</th>
                              <th className="px-4 py-3 font-semibold text-foreground">{labels.activity}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programme.schedule.map(([time, activity]) => (
                              time === 'Saturday' || time === 'Sunday' ? (
                                <tr key={time} className="bg-primary/5">
                                  <th colSpan={2} className="px-4 py-3 font-bold text-primary">
                                    {locale === 'tr'
                                      ? (time === 'Saturday' ? 'Cumartesi' : 'Pazar')
                                      : locale === 'ar'
                                        ? (time === 'Saturday' ? 'السبت' : 'الأحد')
                                        : time} – {activity[locale]}
                                  </th>
                                </tr>
                              ) : (
                                <tr key={`${time}-${activity}`} className="border-t border-border/70">
                                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{time}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{activity[locale]}</td>
                                </tr>
                              )
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}

                  {programme.months && (
                    <details className="mt-5 rounded-xl border border-border" open>
                      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-foreground">
                        {labels.curriculum}
                      </summary>
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="w-20 px-4 py-3 font-semibold text-foreground">{labels.month}</th>
                              <th className="px-4 py-3 font-semibold text-foreground">{labels.subject}</th>
                              <th className="px-4 py-3 font-semibold text-foreground">{labels.practical}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programme.months.map(([month, subject, activities]) => (
                              <tr key={month} className="border-t border-border/70 align-top">
                                <td className="px-4 py-3 font-bold text-primary">{month}</td>
                                <td className="px-4 py-3 font-medium text-foreground">{subject[locale]}</td>
                                <td className="px-4 py-3 text-muted-foreground">{activities[locale]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-border px-4 py-4">
                        <p className="text-sm font-semibold text-foreground">{labels.concludes}</p>
                        <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          {programme.outcomes?.map((outcome) => (
                            <li key={outcome.en} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{outcome[locale]}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-10 mb-6 flex flex-wrap items-center gap-3">
        <h2 className="mr-2 text-2xl font-bold text-foreground">{t('akademi.courseLibrary') as string}</h2>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">{t('akademi.onlineBadge') as string}</Badge>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-48 rounded-xl bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('akademi.categoryAll')}</SelectItem>
            {COURSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="h-11 w-40 rounded-xl bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('akademi.difficultyAll')}</SelectItem>
            <SelectItem value="beginner">{t('akademi.beginner')}</SelectItem>
            <SelectItem value="intermediate">{t('akademi.intermediate')}</SelectItem>
            <SelectItem value="advanced">{t('akademi.advanced')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-semibold text-foreground">{t('akademi.noCourses')}</p>
          <p className="text-sm text-muted-foreground">{t('akademi.noCoursesDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Link key={course.id} href={`/akademi/${course.id}`}>
              <Card className="group h-full overflow-hidden border-border transition-all hover:shadow-lg hover:border-primary/30 animate-fade-in-up">
                {course.thumbnail_url && (
                  <div className="relative h-40 overflow-hidden">
                    <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
                    <Badge variant="outline" className={cn('text-[10px]', DIFFICULTY_COLORS[course.difficulty])}>
                      {t(('akademi.' + course.difficulty) as 'akademi.beginner')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">{t('akademi.onlineBadge') as string}</Badge>
                  </div>
                  <h3 className="font-bold text-foreground leading-tight">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {course.estimated_minutes > 0 && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.estimated_minutes} {t('akademi.minutes')}</span>
                    )}
                    {course.instructor_name && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{course.instructor_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    {t('akademi.startLearning')}<ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
