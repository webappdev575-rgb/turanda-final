'use client';

import { useState, useEffect } from 'react';
import {
  Loader2, Save, Check, Plus, Trash2, GraduationCap,
  PlayCircle, FileText, Pencil, X, BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { AcademyCourse, AcademyLesson, AcademyDifficulty, LessonType } from '@/lib/types';

const COURSE_CATEGORIES = [
  'Crop Management', 'Livestock', 'Machinery', 'Irrigation',
  'Soil & Fertilizer', 'Pest Control', 'General',
];
const DIFFICULTIES: AcademyDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const LESSON_TYPES: LessonType[] = ['video', 'article'];

const emptyCourse: Partial<AcademyCourse> = {
  title: '', description: '', category: 'General', difficulty: 'beginner',
  thumbnail_url: '', estimated_minutes: 0, instructor_name: '', is_published: false, sort_order: 0,
};
const emptyLesson: Partial<AcademyLesson> = {
  title: '', description: '', video_url: '', content: '', lesson_type: 'video', duration_minutes: 0, sort_order: 0, is_published: false,
};

export function AcademyAdmin() {
  return (
    <Tabs defaultValue="courses" className="w-full">
      <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
        <TabsTrigger value="courses" className="gap-1.5"><GraduationCap className="h-4 w-4" />Courses</TabsTrigger>
        <TabsTrigger value="lessons" className="gap-1.5"><BookOpen className="h-4 w-4" />Lessons</TabsTrigger>
      </TabsList>
      <TabsContent value="courses"><CoursesTab /></TabsContent>
      <TabsContent value="lessons"><LessonsTab /></TabsContent>
    </Tabs>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<AcademyCourse>>(emptyCourse);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AcademyCourse>>(emptyCourse);

  const load = async () => {
    const { data } = await supabase.from('academy_courses').select('*').order('sort_order', { ascending: true });
    setCourses((data as AcademyCourse[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    await supabase.from('academy_courses').insert({
      title: form.title, description: form.description, category: form.category || 'General',
      difficulty: form.difficulty || 'beginner', thumbnail_url: form.thumbnail_url || null,
      estimated_minutes: form.estimated_minutes || 0, instructor_name: form.instructor_name || null,
      is_published: form.is_published || false, sort_order: form.sort_order || 0,
    });
    setSaving(false); setForm(emptyCourse); setShowForm(false); await load();
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    await supabase.from('academy_courses').update({
      title: editForm.title, description: editForm.description, category: editForm.category,
      difficulty: editForm.difficulty, thumbnail_url: editForm.thumbnail_url || null,
      estimated_minutes: editForm.estimated_minutes || 0, instructor_name: editForm.instructor_name || null,
      is_published: editForm.is_published, sort_order: editForm.sort_order || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false); setEditingId(null); await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('academy_courses').delete().eq('id', id);
    await load();
  };

  const handleTogglePublish = async (course: AcademyCourse) => {
    await supabase.from('academy_courses').update({ is_published: !course.is_published, updated_at: new Date().toISOString() }).eq('id', course.id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Courses</h2>
            <p className="text-sm text-muted-foreground">Create and manage academy courses</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />{showForm ? 'Cancel' : 'Add Course'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Title *</Label>
                <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={form.category || 'General'} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COURSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Difficulty</Label>
                <Select value={form.difficulty || 'beginner'} onValueChange={(v) => setForm({ ...form, difficulty: v as AcademyDifficulty })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Instructor</Label>
                <Input value={form.instructor_name || ''} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Thumbnail URL</Label>
                <Input value={form.thumbnail_url || ''} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Est. Minutes</Label>
                <Input type="number" value={form.estimated_minutes || 0} onChange={(e) => setForm({ ...form, estimated_minutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Published</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={form.is_published || false} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description *</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.title || !form.description}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}Create Course
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {courses.map((course) => {
            const isEditing = editingId === course.id;
            return (
              <div key={course.id} className={cn('rounded-lg border p-4 space-y-3', isEditing ? 'border-primary/40 bg-primary/5' : 'border-border')}>
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" />
                      <Select value={editForm.category || 'General'} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{COURSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={editForm.difficulty || 'beginner'} onValueChange={(v) => setEditForm({ ...editForm, difficulty: v as AcademyDifficulty })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={editForm.instructor_name || ''} onChange={(e) => setEditForm({ ...editForm, instructor_name: e.target.value })} placeholder="Instructor" />
                      <Input value={editForm.thumbnail_url || ''} onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })} placeholder="Thumbnail URL" />
                      <Input type="number" value={editForm.estimated_minutes || 0} onChange={(e) => setEditForm({ ...editForm, estimated_minutes: parseInt(e.target.value) || 0 })} />
                      <Textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} placeholder="Description" className="sm:col-span-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(course.id)} disabled={saving}>
                        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{course.title}</p>
                        <Badge variant="outline" className="text-[10px]">{course.category}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{course.difficulty}</Badge>
                        {course.is_published && <Badge className="text-[10px] bg-success/15 text-success">Published</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                      {course.instructor_name && <p className="mt-0.5 text-[10px] text-muted-foreground">{course.instructor_name}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Switch checked={course.is_published} onCheckedChange={() => handleTogglePublish(course)} />
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(course.id); setEditForm({ ...course }); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(course.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function LessonsTab() {
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<AcademyLesson>>(emptyLesson);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('academy_courses').select('*').order('sort_order').then(({ data }) => {
      setCourses((data as AcademyCourse[]) || []);
      if (data && data.length > 0) setSelectedCourseId(data[0].id);
      else setLoading(false);
    });
  }, []);

  const loadLessons = async (cId: string) => {
    setLoading(true);
    const { data } = await supabase.from('academy_lessons').select('*').eq('course_id', cId).order('sort_order', { ascending: true });
    setLessons((data as AcademyLesson[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (selectedCourseId) loadLessons(selectedCourseId); }, [selectedCourseId]);

  const handleAdd = async () => {
    if (!form.title || !selectedCourseId) return;
    setSaving(true);
    await supabase.from('academy_lessons').insert({
      course_id: selectedCourseId, title: form.title, description: form.description || null,
      video_url: form.video_url || null, content: form.content || null,
      lesson_type: form.lesson_type || 'video', duration_minutes: form.duration_minutes || 0,
      sort_order: form.sort_order || 0, is_published: form.is_published || false,
    });
    setSaving(false); setForm(emptyLesson); setShowForm(false); await loadLessons(selectedCourseId);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('academy_lessons').delete().eq('id', id);
    if (selectedCourseId) await loadLessons(selectedCourseId);
  };

  const handleTogglePublish = async (lesson: AcademyLesson) => {
    await supabase.from('academy_lessons').update({ is_published: !lesson.is_published }).eq('id', lesson.id);
    if (selectedCourseId) await loadLessons(selectedCourseId);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
            <p className="text-sm text-muted-foreground">Manage lessons within each course</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCourseId || ''} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={() => setShowForm(!showForm)} disabled={!selectedCourseId}>
              <Plus className="mr-1 h-4 w-4" />{showForm ? 'Cancel' : 'Add Lesson'}
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Title *</Label>
                <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lesson Type</Label>
                <Select value={form.lesson_type || 'video'} onValueChange={(v) => setForm({ ...form, lesson_type: v as LessonType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LESSON_TYPES.map((lt) => <SelectItem key={lt} value={lt} className="capitalize">{lt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (minutes)</Label>
                <Input type="number" value={form.duration_minutes || 0} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Video URL (for video lessons)</Label>
                <Input value={form.video_url || ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Published</Label>
                <div className="flex items-center gap-2 pt-2"><Switch checked={form.is_published || false} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            {form.lesson_type === 'article' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Article Content</Label>
                <Textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
              </div>
            )}
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.title}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}Create Lesson
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : lessons.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No lessons yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => {
              const LessonIcon = lesson.lesson_type === 'video' ? PlayCircle : FileText;
              return (
                <div key={lesson.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <LessonIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm">{lesson.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{lesson.lesson_type} · {lesson.duration_minutes} min · Order: {lesson.sort_order}</p>
                  </div>
                  <Switch checked={lesson.is_published} onCheckedChange={() => handleTogglePublish(lesson)} />
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(lesson.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
