'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, PlayCircle, FileText, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import { useCourse, useEnrollment } from '@/hooks/use-academy';
import { cn } from '@/lib/utils';

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const { course, lessons, loading } = useCourse(courseId);
  const { enrollment, enroll, markLessonComplete } = useEnrollment(courseId);
  const [marking, setMarking] = useState(false);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!course || lessons.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-foreground">{t('akademi.noCourses')}</p>
        <Link href="/akademi"><Button variant="outline">{t('akademi.allCourses')}</Button></Link>
      </div>
    );
  }

  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[currentIndex];
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  if (!lesson) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40" />
        <Link href={`/akademi/${courseId}`}><Button variant="outline">{t('akademi.allCourses')}</Button></Link>
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.completed_lessons?.includes(currentIndex) ?? false;

  if (!isEnrolled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
        <p className="mb-2 text-lg font-semibold text-foreground">{t('akademi.notEnrolled')}</p>
        {!user ? (
          <Link href="/login"><Button className="bg-primary hover:bg-primary-light">{t('akademi.signInToEnroll')}</Button></Link>
        ) : (
          <Button onClick={async () => { await enroll(user.id, course.id); }} className="bg-primary hover:bg-primary-light">
            {t('akademi.enroll')}
          </Button>
        )}
      </div>
    );
  }

  const handleMarkComplete = async () => {
    if (!enrollment) return;
    setMarking(true);
    await markLessonComplete(enrollment.id, currentIndex, lessons.map((_, i) => i));
    setMarking(false);
  };

  const LessonIcon = lesson.lesson_type === 'video' ? PlayCircle : FileText;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/akademi/${courseId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />{course.title}
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <LessonIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('akademi.lesson')} {currentIndex + 1} / {lessons.length}</p>
          <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
        </div>
      </div>

      {lesson.description && (
        <p className="mb-6 text-muted-foreground">{lesson.description}</p>
      )}

      <Card className="mb-6 overflow-hidden p-0">
        {lesson.lesson_type === 'video' && lesson.video_url ? (
          <div className="aspect-video w-full">
            {lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be') ? (
              <iframe
                src={lesson.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="h-full w-full"
                allowFullScreen
                title={lesson.title}
              />
            ) : (
              <video src={lesson.video_url} controls className="h-full w-full" />
            )}
          </div>
        ) : lesson.content ? (
          <div className="p-6 prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{lesson.content}</div>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">No content available for this lesson.</p>
          </div>
        )}
      </Card>

      <div className="mb-8 flex items-center gap-3">
        <Button
          onClick={handleMarkComplete}
          disabled={marking || isCompleted}
          variant={isCompleted ? 'outline' : 'default'}
          className={cn(!isCompleted && 'bg-primary hover:bg-primary-light')}
        >
          {marking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isCompleted ? <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          {isCompleted ? t('akademi.completed') : t('akademi.markComplete')}
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        {prevLesson ? (
          <Link href={`/akademi/${courseId}/${prevLesson.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />{t('akademi.prevLesson')}
            </Button>
          </Link>
        ) : <div />}
        {nextLesson ? (
          <Link href={`/akademi/${courseId}/${nextLesson.id}`}>
            <Button className="bg-primary hover:bg-primary-light">
              {t('akademi.nextLesson')}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href={`/akademi/${courseId}`}>
            <Button variant="outline">{t('akademi.allCourses')}</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
