'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Save, Check, Plus, Trash2, ArrowUp, ArrowDown,
  Pencil, X, AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { IconUploader } from '@/components/shared/icon-uploader';
import { IconRenderer } from '@/components/shared/icon-renderer';
import type { JobCategory } from '@/lib/types';

const COLOR_PRESETS = [
  'bg-accent/15 text-accent-foreground border-accent/30',
  'bg-primary/10 text-primary border-primary/20',
  'bg-secondary/15 text-secondary border-secondary/30',
  'bg-success/10 text-success border-success/20',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-muted text-muted-foreground border-border',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-amber-50 text-amber-700 border-amber-200',
];

interface CategoryForm {
  name: string;
  color: string;
  icon_type: 'lucide' | 'custom';
  icon_name: string;
  icon_svg_path: string | null;
  translation_tr: string;
  translation_en: string;
  translation_ar: string;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  name: '', color: COLOR_PRESETS[0], icon_type: 'lucide', icon_name: 'Briefcase',
  icon_svg_path: null, translation_tr: '', translation_en: '', translation_ar: '', is_active: true,
};

export function JobCategoriesAdmin() {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<JobCategory | null>(null);
  const [deleteJobCount, setDeleteJobCount] = useState(0);
  const [reassignTarget, setReassignTarget] = useState<string>('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('job_categories').select('*').order('sort_order');
    setCategories((data as JobCategory[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.translation_tr) return;
    setSaving(true);
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    await supabase.from('job_categories').insert({
      name: form.name,
      color: form.color,
      sort_order: maxOrder + 1,
      is_active: form.is_active,
      icon_type: form.icon_type,
      icon_name: form.icon_name,
      icon_svg_path: form.icon_svg_path,
      translation_tr: form.translation_tr,
      translation_en: form.translation_en || form.translation_tr,
      translation_ar: form.translation_ar || form.translation_tr,
    });
    setSaving(false);
    setForm(emptyForm);
    setShowForm(false);
    await load();
  };

  const handleEditSave = async (id: string) => {
    setSaving(true);
    await supabase.from('job_categories').update({
      name: editForm.name,
      color: editForm.color,
      icon_type: editForm.icon_type,
      icon_name: editForm.icon_name,
      icon_svg_path: editForm.icon_svg_path,
      translation_tr: editForm.translation_tr,
      translation_en: editForm.translation_en,
      translation_ar: editForm.translation_ar,
      is_active: editForm.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    setEditingId(null);
    await load();
  };

  const startEdit = (cat: JobCategory) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      color: cat.color,
      icon_type: cat.icon_type,
      icon_name: cat.icon_name,
      icon_svg_path: cat.icon_svg_path,
      translation_tr: cat.translation_tr,
      translation_en: cat.translation_en,
      translation_ar: cat.translation_ar,
      is_active: cat.is_active,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (reassignTarget && deleteJobCount > 0) {
      await supabase.from('jobs').update({ job_type: reassignTarget }).eq('job_type', deleteTarget.name);
    }
    await supabase.from('job_categories').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    setReassignTarget('');
    setDeleteJobCount(0);
    await load();
  };

  const confirmDelete = async (cat: JobCategory) => {
    const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('job_type', cat.name);
    setDeleteJobCount(count || 0);
    setDeleteTarget(cat);
  };

  const moveOrder = async (cat: JobCategory, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('job_categories').update({ sort_order: other.sort_order, updated_at: new Date().toISOString() }).eq('id', cat.id),
      supabase.from('job_categories').update({ sort_order: cat.sort_order, updated_at: new Date().toISOString() }).eq('id', other.id),
    ]);
    await load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Job Categories</h2>
            <p className="text-sm text-muted-foreground">Add, edit, delete, and reorder job categories. Changes apply instantly across the site.</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Category'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">New Category</h3>
            <CategoryFormFields form={form} setForm={setForm} />
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.name || !form.translation_tr}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Create Category
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {[...categories].sort((a, b) => a.sort_order - b.sort_order).map((cat, idx, arr) => {
            const isEditing = editingId === cat.id;
            return (
              <div key={cat.id} className={cn('rounded-lg border p-4 space-y-3', isEditing ? 'border-primary/40 bg-primary/5' : 'border-border')}>
                {isEditing ? (
                  <>
                    <CategoryFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditSave(cat.id)} disabled={saving}>
                        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="mr-1 h-4 w-4" />Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === 0} onClick={() => moveOrder(cat, 'up')}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === arr.length - 1} onClick={() => moveOrder(cat, 'down')}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
                      <IconRenderer icon={{ icon_type: cat.icon_type, icon_name: cat.icon_name, icon_svg_path: cat.icon_svg_path }} className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{cat.translation_tr}</p>
                        <Badge className={cn('border text-[10px]', cat.color)} variant="outline">{cat.name}</Badge>
                        {!cat.is_active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {cat.translation_en} · {cat.translation_ar}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => confirmDelete(cat)} className="text-destructive hover:text-destructive">
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setReassignTarget(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>This will permanently remove the category.</p>
                {deleteJobCount > 0 && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="text-sm">{deleteJobCount} job(s) use this category. Reassign them to another category before deletion, or they will keep the old type name.</span>
                  </div>
                )}
                {deleteJobCount > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Reassign jobs to:</Label>
                    <Select value={reassignTarget} onValueChange={setReassignTarget}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter((c) => c.id !== deleteTarget?.id).map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.translation_tr} ({c.name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryFormFields({ form, setForm }: { form: CategoryForm; setForm: (f: CategoryForm) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Category Name (internal key) *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hasat" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Active</Label>
          <div className="flex items-center gap-2 h-9">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-xs text-muted-foreground">{form.is_active ? 'Visible on site' : 'Hidden from site'}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Turkish *</Label>
          <Input value={form.translation_tr} onChange={(e) => setForm({ ...form, translation_tr: e.target.value })} placeholder="Hasat" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">English</Label>
          <Input value={form.translation_en} onChange={(e) => setForm({ ...form, translation_en: e.target.value })} placeholder="Harvest" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Arabic</Label>
          <Input value={form.translation_ar} onChange={(e) => setForm({ ...form, translation_ar: e.target.value })} placeholder="الحصاد" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Badge Color</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              className={cn(
                'h-8 rounded-md border-2 px-2 text-[10px] font-medium transition-all',
                color,
                form.color === color ? 'ring-2 ring-primary ring-offset-1' : 'border-transparent'
              )}
            >
              Aa
            </button>
          ))}
        </div>
      </div>
      <IconUploader
        value={{ icon_type: form.icon_type, icon_name: form.icon_name, icon_svg_path: form.icon_svg_path }}
        onChange={(icon) => setForm({ ...form, icon_type: icon.icon_type, icon_name: icon.icon_name, icon_svg_path: icon.icon_svg_path })}
        label="Category Icon"
      />
    </div>
  );
}
