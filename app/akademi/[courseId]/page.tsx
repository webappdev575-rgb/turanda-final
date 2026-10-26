'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, User, PlayCircle, FileText, Loader2, BookOpen, CheckCircle2, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import { useCourse, useEnrollment } from '@/hooks/use-academy';
import { cn } from '@/lib/utils';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/30',
  intermediate: 'bg-accent/15 text-accent-foreground border-accent/30',
  advanced: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const { course, lessons, loading } = useCourse(courseId);
  const { enrollment, enroll, markLessonComplete } = useEnrollment(courseId);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-foreground">{t('akademi.noCourses')}</p>
        <Link href="/akademi"><Button variant="outline">{t('akademi.allCourses')}</Button></Link>
      </div>
    );
  }

  const handleEnroll = async () => {
    if (!user) { router.push('/login'); return; }
    await enroll(user.id, course.id);
  };

  const isEnrolled = !!enrollment;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/akademi" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />{t('akademi.allCourses')}
      </Link>

      {course.thumbnail_url && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img src={course.thumbnail_url} alt={course.title} className="h-56 w-full object-cover sm:h-72" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
        <Badge variant="outline" className={cn('text-[10px]', DIFFICULTY_COLORS[course.difficulty])}>
          {t(('akademi.' + course.difficulty) as 'akademi.beginner')}
        </Badge>
        {isEnrolled && (
          <Badge className="text-[10px] bg-success/15 text-success border-success/30">
            <CheckCircle2 className="mr-0.5 h-3 w-3" />{t('akademi.enrolled')}
          </Badge>
        )}
      </div>

      <h1 className="mb-3 text-3xl font-bold text-foreground">{course.title}</h1>
      <p className="mb-4 text-muted-foreground leading-relaxed">{course.description}</p>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {course.estimated_minutes > 0 && (
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-secondary" />{course.estimated_minutes} {t('akademi.minutes')}</span>
        )}
        {course.instructor_name && (
          <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-secondary" />{course.instructor_name}</span>
        )}
        <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-secondary" />{lessons.length} {t('akademi.lessons')}</span>
      </div>

      {isEnrolled && enrollment.progress > 0 && (
        <div className="mb-6 rounded-lg border border-border p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{t('akademi.progress')}</span>
            <span className="text-muted-foreground">{enrollment.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${enrollment.progress}%` }} />
          </div>
        </div>
      )}

      {!isEnrolled && (
        <div className="mb-8">
          <Button onClick={handleEnroll} size="lg" className="bg-primary hover:bg-primary-light">
            <GraduationCap className="mr-2 h-5 w-5" />{t('akademi.enroll')}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">{t('akademi.lessons')}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('akademi.noCoursesDesc')}</p>
        ) : (
          lessons.map((lesson, i) => {
            const isCompleted = enrollment?.completed_lessons?.includes(i) ?? false;
            const canAccess = isEnrolled;
            const LessonIcon = lesson.lesson_type === 'video' ? PlayCircle : FileText;
            return (
              <div key={lesson.id}>
                {canAccess ? (
                  <Link href={`/akademi/${course.id}/${lesson.id}`}>
                    <Card className={cn(
                      'flex items-center gap-3 p-4 transition-all hover:shadow-sm',
                      isCompleted ? 'border-success/30 bg-success/5' : 'border-border hover:border-primary/30'
                    )}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <LessonIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{lesson.title}</p>
                        {lesson.duration_minutes > 0 && (
                          <p className="text-xs text-muted-foreground">{lesson.duration_minutes} {t('akademi.minutes')}</p>
                        )}
                      </div>
                      {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
                    </Card>
                  </Link>
                ) : (
                  <Card className="flex items-center gap-3 p-4 border-border opacity-60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <LessonIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{lesson.title}</p>
                      {lesson.duration_minutes > 0 && (
                        <p className="text-xs text-muted-foreground">{lesson.duration_minutes} {t('akademi.minutes')}</p>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
