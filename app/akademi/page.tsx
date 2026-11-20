'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, User, ArrowRight, Loader2, BookOpen, PlayCircle, FileText, CalendarDays, MapPin, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/components/i18n-provider';
import { useAcademyCourses } from '@/hooks/use-academy';
import { cn } from '@/lib/utils';
import type { AcademyDifficulty } from '@/lib/types';

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

const PROGRAMMES = [
  {
    id: 'farmer-for-a-day',
    title: { tr: 'Bir Günlük Çiftçi', en: 'Farmer for a Day', ar: 'يوم كمزارع' },
    duration: { tr: 'Bir gün', en: 'One-day experience', ar: 'تجربة لمدة يوم واحد' },
    time: '08:00–17:00',
    participants: 'Urban residents, families, visitors, students and people interested in agriculture.',
    image: '/images/academy/farmer-for-a-day.png',
    schedule: [
      ['08:00–09:00', 'Arrival, village breakfast and welcome'],
      ['09:00–09:30', 'Introduction to farming and safety briefing'],
      ['09:30–10:30', 'Introduction to agricultural machinery'],
      ['10:30–12:00', 'Hands-on field activities'],
      ['12:00–13:00', 'Traditional village lunch'],
      ['13:00–14:30', 'Planting, irrigation and seasonal fieldwork'],
      ['14:30–15:30', 'Farm exploration and crop observation'],
      ['15:30–16:30', 'Practical farming challenge'],
      ['16:30–17:00', 'Certificate presentation and departure'],
    ],
    note: 'Activities change according to the agricultural season.',
  },
  {
    id: 'weekend-farming',
    title: { tr: 'Hafta Sonu Tarım Programı', en: 'Weekend Farming Programme', ar: 'برنامج الزراعة لوقت نهاية الأسبوع' },
    duration: { tr: 'İki gün', en: 'Two-day practical course', ar: 'دورة عملية لمدة يومين' },
    participants: 'Beginners, aspiring farmers, agricultural enthusiasts and people wishing to develop practical farming skills.',
    image: '/images/academy/recreational-program.png',
    schedule: [
      ['Saturday', 'Understanding the Farm'],
      ['09:00–10:00', 'Introduction to modern agriculture'],
      ['10:00–11:00', 'Soil preparation and soil analysis'],
      ['11:00–12:30', 'Crop selection, planting and seeding'],
      ['12:30–13:30', 'Lunch'],
      ['13:30–15:00', 'Tractor and agricultural machinery demonstrations'],
      ['15:00–16:30', 'Practical field preparation'],
      ['Sunday', 'Working the Land'],
      ['09:00–10:00', 'Irrigation systems and water management'],
      ['10:00–11:30', 'Installation and operation of irrigation equipment'],
      ['11:30–12:30', 'Fertilisation and crop nutrition'],
      ['12:30–13:30', 'Lunch'],
      ['13:30–15:00', 'Crop monitoring and field management'],
      ['15:00–16:00', 'Machinery operation and maintenance'],
      ['16:00–16:30', 'Assessment and certificate presentation'],
    ],
  },
  {
    id: 'professional-farming',
    title: { tr: 'Altı Aylık Profesyonel Çiftçilik Programı', en: 'Six-Month Professional Farming Programme', ar: 'برنامج الزراعة المهنية لمدة ستة أشهر' },
    duration: { tr: 'Altı aylık eğitim', en: 'Six-month paid training', ar: 'تدريب مدفوع لمدة ستة أشهر' },
    participants: 'Aspiring professional farmers, young people entering agriculture and individuals wishing to establish or manage agricultural operations.',
    image: '/images/academy/seasonal-program.png',
    months: [
      ['1', 'Soil Science & Land Preparation', 'Soil testing, soil structure, ploughing, cultivation and field preparation'],
      ['2', 'Crop Production & Planting', 'Seed selection, planting techniques, crop rotation and fertilisation'],
      ['3', 'Irrigation & Water Management', 'Drip irrigation, sprinklers, water pressure, automation and water conservation'],
      ['4', 'Agricultural Machinery & Technology', 'Tractor operation, machinery calibration, maintenance and modern equipment'],
      ['5', 'Crop Protection & Farm Management', 'Pest and disease identification, weed control, crop monitoring and farm planning'],
      ['6', 'Harvesting, Economics & Professional Farm Management', 'Harvesting, storage, marketing, cost calculations and preparation of a farm business plan'],
    ],
    outcomes: [
      'Practical competency assessment',
      'Individual farm-management project',
      'Evaluation of agricultural knowledge',
      'Certificate of completion',
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
          <h1 className="text-3xl font-bold text-foreground">Turanda Agri Academy – Training Programmes</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Practical, on-farm programmes for first-time visitors, developing farmers and future agricultural professionals.
          </p>
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
                      <CalendarDays className="h-4 w-4" /> Duration: {programme.time}
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Target participants:</span> {programme.participants}
                  </p>
                  {programme.note && (
                    <p className="mt-3 text-sm italic text-muted-foreground">{programme.note}</p>
                  )}

                  {programme.schedule && (
                    <details className="mt-5 rounded-xl border border-border">
                      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-foreground">
                        View programme schedule
                      </summary>
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="w-32 px-4 py-3 font-semibold text-foreground">Time</th>
                              <th className="px-4 py-3 font-semibold text-foreground">Activity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programme.schedule.map(([time, activity]) => (
                              time === 'Saturday' || time === 'Sunday' ? (
                                <tr key={time} className="bg-primary/5">
                                  <th colSpan={2} className="px-4 py-3 font-bold text-primary">{time} – {activity}</th>
                                </tr>
                              ) : (
                                <tr key={`${time}-${activity}`} className="border-t border-border/70">
                                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{time}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{activity}</td>
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
                        View six-month curriculum
                      </summary>
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="w-20 px-4 py-3 font-semibold text-foreground">Month</th>
                              <th className="px-4 py-3 font-semibold text-foreground">Training subject</th>
                              <th className="px-4 py-3 font-semibold text-foreground">Practical activities</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programme.months.map(([month, subject, activities]) => (
                              <tr key={month} className="border-t border-border/70 align-top">
                                <td className="px-4 py-3 font-bold text-primary">{month}</td>
                                <td className="px-4 py-3 font-medium text-foreground">{subject}</td>
                                <td className="px-4 py-3 text-muted-foreground">{activities}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-border px-4 py-4">
                        <p className="text-sm font-semibold text-foreground">The programme concludes with:</p>
                        <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          {programme.outcomes?.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{outcome}
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
