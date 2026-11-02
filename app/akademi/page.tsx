'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, User, ArrowRight, Loader2, BookOpen, PlayCircle, FileText, CalendarDays, MapPin } from 'lucide-react';
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

const WORKSHOPS = [
  {
    title: { tr: 'Sera Budama Atölyesi', en: 'Greenhouse Pruning Workshop', ar: 'ورشة تقليم البيوت المحمية' },
    date: { tr: '14 Kasım', en: 'November 14', ar: '١٤ نوفمبر' },
    location: 'Antalya',
    seats: 24,
    image: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=940',
  },
  {
    title: { tr: 'Drone ile Hassas Tarım', en: 'Precision Farming with Drones', ar: 'الزراعة الدقيقة بالطائرات المسيّرة' },
    date: { tr: '21 Kasım', en: 'November 21', ar: '٢١ نوفمبر' },
    location: 'Konya',
    seats: 16,
    image: 'https://images.pexels.com/photos/3807683/pexels-photo-3807683.jpeg?auto=compress&cs=tinysrgb&w=940',
  },
  {
    title: { tr: 'Toprak Analizi ve Gübreleme', en: 'Soil Analysis & Fertilization', ar: 'تحليل التربة والتسميد' },
    date: { tr: '28 Kasım', en: 'November 28', ar: '٢٨ نوفمبر' },
    location: 'İzmir',
    seats: 30,
    image: 'https://images.pexels.com/photos/11505049/pexels-photo-11505049.jpeg?auto=compress&cs=tinysrgb&w=940',
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
        <div className="relative aspect-[1536/342] w-full overflow-hidden bg-white">
          <img
            src="/images/turanda_academy_header.png"
            alt="Turanda Tarım Akademisi"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      </div>

      {/* In-person workshops — sit above the online course catalog */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('akademi.workshopsTitle') as string}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('akademi.workshopsDesc') as string}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSHOPS.map((w) => (
            <Card key={w.location} className="group h-full overflow-hidden border-border transition-all hover:shadow-lg hover:border-primary/30">
              <div className="relative h-44 overflow-hidden">
                <img src={w.image} alt={w.title[locale]} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-bold text-brand backdrop-blur-[4px]">
                  <CalendarDays className="h-3 w-3" />{w.date[locale]}
                </div>
              </div>
              <div className="space-y-2.5 p-5">
                <h3 className="font-bold text-foreground leading-tight">{w.title[locale]}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.location}</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{w.seats} {t('akademi.workshopSeats') as string}</span>
                </div>
                <Button size="sm" className="mt-1 w-full bg-accent text-accent-foreground hover:bg-accent-light">
                  {t('akademi.workshopRegister') as string}
                </Button>
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
