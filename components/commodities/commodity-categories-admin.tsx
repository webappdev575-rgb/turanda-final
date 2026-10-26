'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Plus, Trash2, ArrowUp, ArrowDown, Pencil, X, Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CommodityCategoryRow {
  id: string;
  key: string;
  sort_order: number;
  translation_tr: string;
  translation_en: string;
  translation_ar: string;
}

const emptyForm = { key: '', translation_tr: '', translation_en: '', translation_ar: '' };

export function CommodityCategoriesAdmin() {
  const [categories, setCategories] = useState<CommodityCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('commodity_categories').select('*').order('sort_order');
    setCategories((data as CommodityCategoryRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.key || !form.translation_tr) return;
    setSaving(true);
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0);
    await supabase.from('commodity_categories').insert({
      key: form.key,
      sort_order: maxOrder + 1,
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
    await supabase.from('commodity_categories').update({
      key: editForm.key,
      translation_tr: editForm.translation_tr,
      translation_en: editForm.translation_en,
      translation_ar: editForm.translation_ar,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('commodity_categories').delete().eq('id', id);
    await load();
  };

  const moveOrder = async (cat: CommodityCategoryRow, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('commodity_categories').update({ sort_order: other.sort_order }).eq('id', cat.id),
      supabase.from('commodity_categories').update({ sort_order: cat.sort_order }).eq('id', other.id),
    ]);
    await load();
  };

  const startEdit = (cat: CommodityCategoryRow) => {
    setEditingId(cat.id);
    setEditForm({ key: cat.key, translation_tr: cat.translation_tr, translation_en: cat.translation_en, translation_ar: cat.translation_ar });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Commodity Categories</h2>
          <p className="text-sm text-muted-foreground">Manage the categories that group commodities (Grain, Pulses, etc.)</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Category'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">New Commodity Category</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Category Key *</Label>
              <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. Grain & Field Crops" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Turkish *</Label>
              <Input value={form.translation_tr} onChange={(e) => setForm({ ...form, translation_tr: e.target.value })} placeholder="Tahıl & Tarla" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">English</Label>
              <Input value={form.translation_en} onChange={(e) => setForm({ ...form, translation_en: e.target.value })} placeholder="Grain & Field" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Arabic</Label>
              <Input value={form.translation_ar} onChange={(e) => setForm({ ...form, translation_ar: e.target.value })} placeholder="الحبوب" />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={saving || !form.key || !form.translation_tr}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Create
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {[...categories].sort((a, b) => a.sort_order - b.sort_order).map((cat, idx, arr) => {
          const isEditing = editingId === cat.id;
          return (
            <div key={cat.id} className={cn('rounded-lg border p-3 space-y-2', isEditing ? 'border-primary/40 bg-primary/5' : 'border-border')}>
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-10 shrink-0 text-[10px]">Key</Label>
                      <Input value={editForm.key} onChange={(e) => setEditForm({ ...editForm, key: e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-10 shrink-0 text-[10px]">TR</Label>
                      <Input value={editForm.translation_tr} onChange={(e) => setEditForm({ ...editForm, translation_tr: e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-10 shrink-0 text-[10px]">EN</Label>
                      <Input value={editForm.translation_en} onChange={(e) => setEditForm({ ...editForm, translation_en: e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-10 shrink-0 text-[10px]">AR</Label>
                      <Input value={editForm.translation_ar} onChange={(e) => setEditForm({ ...editForm, translation_ar: e.target.value })} className="h-7 text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditSave(cat.id)} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />Cancel
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">{cat.translation_tr}</p>
                      <Badge variant="outline" className="text-[10px]">{cat.key}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{cat.translation_en} · {cat.translation_ar}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive">
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
  );
}
