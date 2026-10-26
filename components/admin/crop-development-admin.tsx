'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Check, ArrowUp, ArrowDown, Plus, Trash2, Sprout } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { CropCard } from '@/lib/types';
import { cn } from '@/lib/utils';

const LANGS = [
  { key: 'tr', label: 'Türkçe' },
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
] as const;

interface CropSettings {
  crop_heading_tr: string;
  crop_heading_en: string;
  crop_heading_ar: string;
  crop_subtitle_tr: string;
  crop_subtitle_en: string;
  crop_subtitle_ar: string;
}

const DEFAULT_SETTINGS: CropSettings = {
  crop_heading_tr: '',
  crop_heading_en: '',
  crop_heading_ar: '',
  crop_subtitle_tr: '',
  crop_subtitle_en: '',
  crop_subtitle_ar: '',
};

export function CropDevelopmentAdmin() {
  const [cards, setCards] = useState<CropCard[]>([]);
  const [settings, setSettings] = useState<CropSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('crop_cards').select('*').order('sort_order', { ascending: true }),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    ]).then(([cardsRes, settingsRes]) => {
      setCards((cardsRes.data as CropCard[]) || []);
      if (settingsRes.data) {
        const d = settingsRes.data as CropSettings;
        setSettings({
          crop_heading_tr: d.crop_heading_tr || '',
          crop_heading_en: d.crop_heading_en || '',
          crop_heading_ar: d.crop_heading_ar || '',
          crop_subtitle_tr: d.crop_subtitle_tr || '',
          crop_subtitle_en: d.crop_subtitle_en || '',
          crop_subtitle_ar: d.crop_subtitle_ar || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const updateCard = (id: string, field: keyof CropCard, value: string | boolean) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateSettings = (field: keyof CropSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const moveCard = (index: number, dir: 'up' | 'down') => {
    setCards((prev) => {
      const next = [...prev];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((c, i) => ({ ...c, sort_order: i }));
    });
  };

  const addCard = async () => {
    const maxOrder = cards.length > 0 ? Math.max(...cards.map((c) => c.sort_order)) + 1 : 0;
    const { data } = await supabase
      .from('crop_cards')
      .insert({
        title_tr: 'Yeni Kart',
        title_en: 'New Card',
        title_ar: 'بطاقة جديدة',
        description_tr: '',
        description_en: '',
        description_ar: '',
        image_url: '',
        video_url: '',
        sort_order: maxOrder,
        is_visible: true,
      })
      .select('*')
      .single();
    if (data) setCards((prev) => [...prev, data as CropCard]);
  };

  const deleteCard = async (id: string) => {
    await supabase.from('crop_cards').delete().eq('id', id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('site_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', 1);
    for (const card of cards) {
      await supabase
        .from('crop_cards')
        .update({
          title_tr: card.title_tr,
          title_en: card.title_en,
          title_ar: card.title_ar,
          description_tr: card.description_tr,
          description_en: card.description_en,
          description_ar: card.description_ar,
          image_url: card.image_url,
          video_url: card.video_url,
          sort_order: card.sort_order,
          is_visible: card.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq('id', card.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Section heading + subtitle editor */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Section Heading &amp; Subtitle</h2>
          <p className="text-sm text-muted-foreground">The large title and subtitle above the cards, in all three languages</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Heading</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LANGS.map((lang) => (
                <div key={lang.key} className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{lang.label}</span>
                  <Input
                    value={settings[`crop_heading_${lang.key}` as keyof CropSettings]}
                    onChange={(e) => updateSettings(`crop_heading_${lang.key}` as keyof CropSettings, e.target.value)}
                    placeholder={`Heading (${lang.label})`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Subtitle</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {LANGS.map((lang) => (
                <div key={lang.key} className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{lang.label}</span>
                  <Textarea
                    value={settings[`crop_subtitle_${lang.key}` as keyof CropSettings]}
                    onChange={(e) => updateSettings(`crop_subtitle_${lang.key}` as keyof CropSettings, e.target.value)}
                    rows={3}
                    placeholder={`Subtitle (${lang.label})`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Card editor list */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Crop Development Cards</h2>
            <p className="text-sm text-muted-foreground">Edit the title, description, image, and video for each card in all three languages</p>
          </div>
          <Button variant="outline" size="sm" onClick={addCard}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Card
          </Button>
        </div>

        <div className="space-y-4">
          {cards.map((card, index) => (
            <div key={card.id} className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">Card {index + 1}</Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => moveCard(index, 'up')}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === cards.length - 1}
                      onClick={() => moveCard(index, 'down')}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Visible</span>
                    <Switch
                      checked={card.is_visible}
                      onCheckedChange={(v) => updateCard(card.id, 'is_visible', v)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteCard(card.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Per-language title + description */}
              <div className="space-y-3">
                {LANGS.map((lang) => (
                  <div key={lang.key} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Title ({lang.label})</Label>
                      <Input
                        value={card[`title_${lang.key}` as keyof CropCard] as string}
                        onChange={(e) => updateCard(card.id, `title_${lang.key}` as keyof CropCard, e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description ({lang.label})</Label>
                      <Input
                        value={card[`description_${lang.key}` as keyof CropCard] as string}
                        onChange={(e) => updateCard(card.id, `description_${lang.key}` as keyof CropCard, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Image + video URLs */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cover Image URL</Label>
                  <Input
                    value={card.image_url}
                    onChange={(e) => updateCard(card.id, 'image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hover Video URL</Label>
                  <Input
                    value={card.video_url}
                    onChange={(e) => updateCard(card.id, 'video_url', e.target.value)}
                    placeholder="https://...mp4"
                  />
                </div>
              </div>

              {/* Live preview */}
              {card.image_url && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={card.image_url}
                    alt="Preview"
                    className={cn('h-24 w-full object-cover', !card.is_visible && 'opacity-40')}
                  />
                </div>
              )}
            </div>
          ))}
          {cards.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Sprout className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No cards yet. Click &ldquo;Add Card&rdquo; to create one.</p>
            </div>
          )}
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
        {saved ? 'Saved' : 'Save Crop Development'}
      </Button>
    </div>
  );
}
