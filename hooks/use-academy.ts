'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  AcademyCourse,
  AcademyLesson,
  AcademyEnrollment,
  AcademyCourseAvailability,
  AcademyCourseBooking,
  AcademyCourseSettings,
  AcademyBookingStatus,
} from '@/lib/types';

export function useAcademyCourseAvailability(courseSlug: string | null) {
  const [availability, setAvailability] = useState<AcademyCourseAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!courseSlug) { setLoading(false); return; }
    const { data } = await supabase.rpc('academy_course_availability', { p_course_slug: courseSlug });
    setAvailability((data as AcademyCourseAvailability) || null);
    setLoading(false);
  }, [courseSlug]);

  useEffect(() => { refetch(); }, [refetch]);

  return { availability, loading, refetch };
}

export async function submitAcademyCourseBooking(input: {
  courseSlug: string;
  participantName: string;
  participantEmail: string;
  age: number;
  farmingInterest: string;
}) {
  const { data, error } = await supabase.rpc('submit_academy_course_booking', {
    p_course_slug: input.courseSlug,
    p_participant_name: input.participantName,
    p_participant_email: input.participantEmail,
    p_age: input.age,
    p_farming_interest: input.farmingInterest,
  });
  if (error) throw error;
  return data as { ok: boolean; reason?: string; booking_id?: string };
}

export function useAdminAcademyBookings() {
  const [settings, setSettings] = useState<AcademyCourseSettings[]>([]);
  const [bookings, setBookings] = useState<AcademyCourseBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [settingsRes, bookingsRes] = await Promise.all([
      supabase.from('academy_course_settings').select('*').order('course_slug', { ascending: true }),
      supabase.from('academy_course_bookings').select('*').order('created_at', { ascending: false }),
    ]);
    setSettings((settingsRes.data as AcademyCourseSettings[]) || []);
    setBookings((bookingsRes.data as AcademyCourseBooking[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateCapacity = useCallback(async (courseSlug: string, capacity: number) => {
    const { error } = await supabase
      .from('academy_course_settings')
      .update({ capacity, updated_at: new Date().toISOString() })
      .eq('course_slug', courseSlug);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const updateBooking = useCallback(async (
    id: string,
    updates: Partial<Pick<AcademyCourseBooking, 'participant_name' | 'participant_email' | 'age' | 'farming_interest' | 'status'>>
  ) => {
    const { error } = await supabase
      .from('academy_course_bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const setBookingStatus = useCallback(async (id: string, status: AcademyBookingStatus) => {
    await updateBooking(id, { status });
  }, [updateBooking]);

  return { settings, bookings, loading, refetch: fetchAll, updateCapacity, updateBooking, setBookingStatus };
}

export function useAcademyCourses(category?: string, difficulty?: string) {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    let query = supabase
      .from('academy_courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (category && category !== 'all') query = query.eq('category', category);
    if (difficulty && difficulty !== 'all') query = query.eq('difficulty', difficulty);
    const { data } = await query;
    setCourses((data as AcademyCourse[]) || []);
    setLoading(false);
  }, [category, difficulty]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  return { courses, loading, refetch: fetchCourses };
}

export function useCourse(courseId: string | null) {
  const [course, setCourse] = useState<AcademyCourse | null>(null);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourse = useCallback(async () => {
    if (!courseId) { setLoading(false); return; }
    const [courseRes, lessonsRes] = await Promise.all([
      supabase.from('academy_courses').select('*').eq('id', courseId).maybeSingle(),
      supabase.from('academy_lessons').select('*').eq('course_id', courseId).eq('is_published', true).order('sort_order', { ascending: true }),
    ]);
    setCourse((courseRes.data as AcademyCourse) || null);
    setLessons((lessonsRes.data as AcademyLesson[]) || []);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);
  return { course, lessons, loading, refetch: fetchCourse };
}

export function useEnrollment(courseId: string | null) {
  const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEnrollment = useCallback(async () => {
    if (!courseId) { setLoading(false); return; }
    const { data } = await supabase
      .from('academy_enrollments')
      .select('*, course:academy_courses(*)')
      .eq('course_id', courseId)
      .maybeSingle();
    setEnrollment((data as AcademyEnrollment) || null);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { fetchEnrollment(); }, [fetchEnrollment]);

  const enroll = useCallback(async (userId: string, cId: string) => {
    const { data } = await supabase
      .from('academy_enrollments')
      .insert({ user_id: userId, course_id: cId })
      .select('*, course:academy_courses(*)')
      .maybeSingle();
    if (data) setEnrollment(data as AcademyEnrollment);
    return data as AcademyEnrollment | null;
  }, []);

  const markLessonComplete = useCallback(async (enrollmentId: string, lessonId: number, allLessonIds: number[]) => {
    const current = enrollment?.completed_lessons || [];
    if (current.includes(lessonId)) return;
    const updated = [...current, lessonId];
    const progress = Math.round((updated.length / allLessonIds.length) * 100);
    const { data } = await supabase
      .from('academy_enrollments')
      .update({ completed_lessons: updated, progress, last_accessed_at: new Date().toISOString() })
      .eq('id', enrollmentId)
      .select('*, course:academy_courses(*)')
      .maybeSingle();
    if (data) setEnrollment(data as AcademyEnrollment);
  }, [enrollment]);

  return { enrollment, loading, refetch: fetchEnrollment, enroll, markLessonComplete };
}

export function useMyEnrollments() {
  const [enrollments, setEnrollments] = useState<AcademyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    const { data } = await supabase
      .from('academy_enrollments')
      .select('*, course:academy_courses(*)')
      .order('last_accessed_at', { ascending: false });
    setEnrollments((data as AcademyEnrollment[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);
  return { enrollments, loading, refetch: fetchEnrollments };
}

export function useAdminCourses() {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from('academy_courses').select('*').order('sort_order', { ascending: true });
    setCourses((data as AcademyCourse[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const createCourse = useCallback(async (input: Partial<AcademyCourse>) => {
    const { data } = await supabase.from('academy_courses').insert(input).select('*').maybeSingle();
    if (data) await fetchCourses();
    return data as AcademyCourse | null;
  }, [fetchCourses]);

  const updateCourse = useCallback(async (id: string, updates: Partial<AcademyCourse>) => {
    await supabase.from('academy_courses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchCourses();
  }, [fetchCourses]);

  const deleteCourse = useCallback(async (id: string) => {
    await supabase.from('academy_courses').delete().eq('id', id);
    await fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, refetch: fetchCourses, createCourse, updateCourse, deleteCourse };
}

export function useAdminLessons(courseId: string | null) {
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    if (!courseId) { setLessons([]); setLoading(false); return; }
    const { data } = await supabase.from('academy_lessons').select('*').eq('course_id', courseId).order('sort_order', { ascending: true });
    setLessons((data as AcademyLesson[]) || []);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const createLesson = useCallback(async (input: Partial<AcademyLesson>) => {
    const { data } = await supabase.from('academy_lessons').insert(input).select('*').maybeSingle();
    if (data) await fetchLessons();
    return data as AcademyLesson | null;
  }, [fetchLessons]);

  const updateLesson = useCallback(async (id: string, updates: Partial<AcademyLesson>) => {
    await supabase.from('academy_lessons').update(updates).eq('id', id);
    await fetchLessons();
  }, [fetchLessons]);

  const deleteLesson = useCallback(async (id: string) => {
    await supabase.from('academy_lessons').delete().eq('id', id);
    await fetchLessons();
  }, [fetchLessons]);

  return { lessons, loading, refetch: fetchLessons, createLesson, updateLesson, deleteLesson };
}
