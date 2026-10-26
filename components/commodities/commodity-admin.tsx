'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Save, Check, Plus, Trash2, Building2, Database,
  RefreshCw, Image as ImageIcon, AlertCircle, CheckCircle2,
  XCircle, MapPin, Pencil, X, ArrowUp, ArrowDown, Upload, Star, Eye, EyeOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type {
  CommodityExchange, CommoditySource, CommoditySourceLog,
  CommodityRegistryEntry,
} from '@/hooks/use-commodities';
import { IconUploader } from '@/components/shared/icon-uploader';
import { IconRenderer } from '@/components/shared/icon-renderer';
import { CommodityCategoriesAdmin } from '@/components/commodities/commodity-categories-admin';

const SOURCE_TYPES = [
  { value: 'json_api', label: 'JSON API' },
  { value: 'rss_xml', label: 'RSS / XML Feed' },
  { value: 'manual_json', label: 'Manual JSON' },
  { value: 'tobb_html', label: 'TOBB HTML Scraper (POST form)' },
];

const FETCH_INTERVALS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const TOBB_PRICE_TYPES = [
  { value: '1', label: 'Salon Satışı' },
  { value: '2', label: 'Laboratuvar' },
  { value: '3', label: 'Tescil' },
];

const TOBB_DATE_RANGES = [
  { value: 'latest', label: 'Latest day' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
];

const DEFAULT_FIELD_MAPPING = {
  commodity_name: 'commodity_name',
  price: 'price',
  unit: 'unit',
  recorded_date: 'recorded_date',
  change_pct: 'change_pct',
};

const DEFAULT_TOBB_MAPPING = {
  commodity_name: 'commodity_name',
  price: 'price',
  unit: 'unit',
  recorded_date: 'recorded_date',
  change_pct: 'change_pct',
  tobb_exchange_code: '0',
  tobb_commodity_codes: '',
  tobb_price_type: '1',
  tobb_start_date_field: 'bas_tarih',
  tobb_end_date_field: 'bit_tarih',
  tobb_date_range: 'latest',
  html_min_price: '1',
  html_max_price: '2',
  html_avg_price: '3',
  html_unit: '4',
  html_date: '5',
  html_commodity_name: '0',
};

const emptySource: Omit<CommoditySource, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  source_type: 'json_api',
  url: '',
  api_key_env: null,
  exchange_id: null,
  fetch_interval: 'daily',
  is_active: true,
  field_mapping: { ...DEFAULT_FIELD_MAPPING },
};

interface ExchangeForm {
  name: string;
  short_name: string;
  city: string;
  region: string;
  specialties: string;
  latitude: string;
  longitude: string;
  thumbnail_url: string;
}

const emptyExchangeForm: ExchangeForm = {
  name: '', short_name: '', city: '', region: '',
  specialties: '', latitude: '', longitude: '', thumbnail_url: '',
};

export function CommodityAdmin() {
  return (
    <Tabs defaultValue="exchanges" className="w-full">
      <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
        <TabsTrigger value="exchanges" className="gap-1.5"><Building2 className="h-4 w-4" />Exchanges</TabsTrigger>
        <TabsTrigger value="sources" className="gap-1.5"><Database className="h-4 w-4" />Data Sources</TabsTrigger>
        <TabsTrigger value="icons" className="gap-1.5"><ImageIcon className="h-4 w-4" />Icons & Registry</TabsTrigger>
        <TabsTrigger value="categories" className="gap-1.5"><Database className="h-4 w-4" />Categories</TabsTrigger>
      </TabsList>
      <TabsContent value="exchanges"><ExchangesTab /></TabsContent>
      <TabsContent value="sources"><SourcesTab /></TabsContent>
      <TabsContent value="icons"><IconsRegistryTab /></TabsContent>
      <TabsContent value="categories"><CommodityCategoriesAdmin /></TabsContent>
    </Tabs>
  );
}

function ExchangesTab() {
  const [exchanges, setExchanges] = useState<CommodityExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExchangeForm>(emptyExchangeForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExchangeForm>(emptyExchangeForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFor, setThumbnailFor] = useState<'add' | 'edit'>('add');

  const load = useCallback(async () => {
    const { data } = await supabase.from('commodity_exchanges').select('*').order('name');
    setExchanges((data as CommodityExchange[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.city || !form.region) return;
    setSaving(true);
    await supabase.from('commodity_exchanges').insert({
      name: form.name,
      short_name: form.short_name || null,
      city: form.city,
      region: form.region,
      specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      thumbnail_url: form.thumbnail_url || null,
    });
    setSaving(false);
    setForm(emptyExchangeForm);
    setShowForm(false);
    await load();
  };

  const handleEditSave = async (id: string) => {
    setSaving(true);
    await supabase.from('commodity_exchanges').update({
      name: editForm.name,
      short_name: editForm.short_name || null,
      city: editForm.city,
      region: editForm.region,
      specialties: editForm.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
      longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
      thumbnail_url: editForm.thumbnail_url || null,
    }).eq('id', id);
    setSaving(false);
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from('commodity_exchanges').delete().eq('id', id);
    setDeletingId(null);
    await load();
  };

  const startEdit = (ex: CommodityExchange) => {
    setEditingId(ex.id);
    setEditForm({
      name: ex.name,
      short_name: ex.short_name || '',
      city: ex.city,
      region: ex.region,
      specialties: ex.specialties.join(', '),
      latitude: ex.latitude?.toString() || '',
      longitude: ex.longitude?.toString() || '',
      thumbnail_url: ex.thumbnail_url || '',
    });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `exchange-${Date.now()}.${fileExt}`;
    setThumbnailUploading(target);
    const { data, error } = await supabase.storage
      .from('exchange-thumbnails')
      .upload(fileName, file, { upsert: true });
    setThumbnailUploading(null);
    if (error) return;
    const { data: urlData } = supabase.storage.from('exchange-thumbnails').getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;
    if (target === 'add') {
      setForm((prev) => ({ ...prev, thumbnail_url: publicUrl }));
    } else {
      setEditForm((prev) => ({ ...prev, thumbnail_url: publicUrl }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const renderThumbnailPicker = (value: string, onChange: (url: string) => void, target: 'add' | 'edit') => (
    <div className="space-y-1.5 sm:col-span-2">
      <Label className="text-xs">Exchange Thumbnail (crest/logo)</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="thumbnail" className="h-12 w-12 rounded-lg border border-border object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/30">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => { setThumbnailFor(target); (target === 'add' ? fileInputRef : editFileInputRef).current?.click(); }}
          disabled={thumbnailUploading === target}
        >
          {thumbnailUploading === target ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Upload
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            <X className="h-3 w-3" /> Remove
          </Button>
        )}
        <input
          ref={target === 'add' ? fileInputRef : editFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleThumbnailUpload(e, target)}
          className="hidden"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Commodity Exchanges</h2>
            <p className="text-sm text-muted-foreground">Add, edit, or remove regional trade exchanges. Upload a crest/logo thumbnail for each.</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Exchange'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">New Exchange</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Konya Ticaret Borsası" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Short Name</Label>
                <Input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} placeholder="e.g. KTB" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City *</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Konya" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Region *</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. İç Anadolu" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="37.8746" type="number" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="32.4932" type="number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Specialties (comma-separated)</Label>
              <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Buğday, Arpa, Mısır" />
            </div>
            {renderThumbnailPicker(form.thumbnail_url, (url) => setForm({ ...form, thumbnail_url: url }), 'add')}
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.name || !form.city || !form.region}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Create Exchange
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {exchanges.map((ex) => {
            const isEditing = editingId === ex.id;
            return (
              <div key={ex.id} className={cn('rounded-lg border p-4 space-y-3', isEditing ? 'border-primary/40 bg-primary/5' : 'border-border')}>
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                      <Input value={editForm.short_name} onChange={(e) => setEditForm({ ...editForm, short_name: e.target.value })} placeholder="Short name" />
                      <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                      <Input value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} placeholder="Region" />
                      <Input value={editForm.latitude} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })} placeholder="Latitude" type="number" />
                      <Input value={editForm.longitude} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })} placeholder="Longitude" type="number" />
                      <div className="sm:col-span-2">
                        <Input value={editForm.specialties} onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })} placeholder="Specialties (comma-separated)" />
                      </div>
                    </div>
                    {renderThumbnailPicker(editForm.thumbnail_url, (url) => setEditForm({ ...editForm, thumbnail_url: url }), 'edit')}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEditSave(ex.id)} disabled={saving}>
                        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="mr-1 h-4 w-4" />Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 flex items-start gap-3">
                      {ex.thumbnail_url ? (
                        <img src={ex.thumbnail_url} alt={ex.name} className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10">
                          <span className="text-sm font-bold text-primary">{(ex.short_name || ex.name).charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{ex.name}</p>
                          {ex.short_name && <Badge variant="outline" className="text-[10px]">{ex.short_name}</Badge>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{ex.city} · {ex.region}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {ex.specialties.slice(0, 5).map((s, i) => (
                            <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                          ))}
                        </div>
                        {ex.latest_price_date && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Last data: {new Date(ex.latest_price_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(ex)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" disabled={deletingId === ex.id} onClick={() => handleDelete(ex.id)} className="text-destructive hover:text-destructive">
                        {deletingId === ex.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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

function SourcesTab() {
  const [sources, setSources] = useState<CommoditySource[]>([]);
  const [exchanges, setExchanges] = useState<{ id: string; name: string; short_name: string | null }[]>([]);
  const [logs, setLogs] = useState<Record<string, CommoditySourceLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptySource });
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState<string | null>(null);
  const [fetchResult, setFetchResult] = useState<Record<string, { ingested: number; error: string | null }>>({});

  const load = useCallback(async () => {
    const [srcRes, exRes, logRes] = await Promise.all([
      supabase.from('commodity_sources').select('*').order('created_at', { ascending: false }),
      supabase.from('commodity_exchanges').select('id, name, short_name').order('name'),
      supabase.from('commodity_source_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setSources((srcRes.data as CommoditySource[]) || []);
    setExchanges((exRes.data as { id: string; name: string; short_name: string | null }[]) || []);
    const logMap: Record<string, CommoditySourceLog[]> = {};
    ((logRes.data as CommoditySourceLog[]) || []).forEach((l) => {
      if (!logMap[l.source_id]) logMap[l.source_id] = [];
      if (logMap[l.source_id].length < 10) logMap[l.source_id].push(l);
    });
    setLogs(logMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    const mapping = form.source_type === 'tobb_html'
      ? { ...DEFAULT_TOBB_MAPPING }
      : form.field_mapping;
    await supabase.from('commodity_sources').insert({
      name: form.name,
      source_type: form.source_type,
      url: form.url,
      api_key_env: form.api_key_env || null,
      exchange_id: form.exchange_id || null,
      fetch_interval: form.fetch_interval,
      is_active: form.is_active,
      field_mapping: mapping,
    });
    setSaving(false);
    setForm({ ...emptySource });
    setShowForm(false);
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('commodity_sources').delete().eq('id', id);
    await load();
  };

  const handleToggle = async (src: CommoditySource) => {
    await supabase.from('commodity_sources').update({ is_active: !src.is_active }).eq('id', src.id);
    await load();
  };

  const handleTestFetch = async (src: CommoditySource) => {
    setFetching(src.id);
    setFetchResult((prev) => ({ ...prev, [src.id]: { ingested: 0, error: null } }));
    try {
      const { data, error } = await supabase.functions.invoke('fetch-commodities', {
        body: { sourceId: src.id },
      });
      if (error) {
        setFetchResult((prev) => ({ ...prev, [src.id]: { ingested: 0, error: error.message } }));
      } else {
        const result = data as { ingested: number; error: string | null; success: boolean };
        setFetchResult((prev) => ({ ...prev, [src.id]: { ingested: result.ingested, error: result.error } }));
      }
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchResult((prev) => ({ ...prev, [src.id]: { ingested: 0, error: msg } }));
    }
    setFetching(null);
  };

  const updateMapping = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      field_mapping: { ...prev.field_mapping, [field]: value },
    }));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const isTobbForm = form.source_type === 'tobb_html';

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Data Sources</h2>
            <p className="text-sm text-muted-foreground">Connect external APIs, RSS feeds, or TOBB to fetch commodity prices automatically. TOBB source: <a href="https://borsa.tobb.org.tr/index.php" target="_blank" rel="noopener noreferrer" className="text-primary underline">borsa.tobb.org.tr</a></p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Source'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">New Data Source</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Source Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. TOBB Konya Exchange" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Source Type</Label>
                <Select value={form.source_type} onValueChange={(v) => {
                  const newType = v as CommoditySource['source_type'];
                  setForm({
                    ...form,
                    source_type: newType,
                    field_mapping: newType === 'tobb_html' ? { ...DEFAULT_TOBB_MAPPING } : { ...DEFAULT_FIELD_MAPPING },
                  });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">URL {isTobbForm && '(leave empty to use default TOBB endpoint)'}</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder={isTobbForm ? 'https://borsa.tobb.org.tr/index.php' : 'https://api.example.com/v1/commodities'} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Target Exchange</Label>
                <Select value={form.exchange_id || 'none'} onValueChange={(v) => setForm({ ...form, exchange_id: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No exchange</SelectItem>
                    {exchanges.map((ex) => <SelectItem key={ex.id} value={ex.id}>{ex.short_name || ex.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fetch Interval</Label>
                <Select value={form.fetch_interval} onValueChange={(v) => setForm({ ...form, fetch_interval: v as CommoditySource['fetch_interval'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FETCH_INTERVALS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!isTobbForm && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">API Key Env Variable Name (optional)</Label>
                  <Input value={form.api_key_env || ''} onChange={(e) => setForm({ ...form, api_key_env: e.target.value || null })} placeholder="TMEX_API_KEY" />
                </div>
              )}
            </div>

            {isTobbForm && (
              <div className="space-y-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3">
                <p className="text-xs font-semibold text-foreground">TOBB Scraper Configuration</p>
                <p className="text-[10px] text-muted-foreground">Data is fetched from TOBB Ticaret Borsaları Ürün Fiyat Bilgileri at <a href="https://borsa.tobb.org.tr/index.php" target="_blank" rel="noopener noreferrer" className="text-primary underline">borsa.tobb.org.tr/index.php</a></p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">TOBB Exchange Code (borsa_kodu)</Label>
                    <Input value={form.field_mapping.tobb_exchange_code || ''} onChange={(e) => updateMapping('tobb_exchange_code', e.target.value)} placeholder="0 for all, or specific exchange ID" />
                    <p className="text-[10px] text-muted-foreground">Use 0 to fetch from all exchanges, or a specific borsa kodu.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Price Type (fiyat_tipi)</Label>
                    <Select value={form.field_mapping.tobb_price_type || '1'} onValueChange={(v) => updateMapping('tobb_price_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TOBB_PRICE_TYPES.map((pt) => <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date Range</Label>
                    <Select value={form.field_mapping.tobb_date_range || 'latest'} onValueChange={(v) => updateMapping('tobb_date_range', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TOBB_DATE_RANGES.map((dr) => <SelectItem key={dr.value} value={dr.value}>{dr.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start Date Field Name</Label>
                    <Input value={form.field_mapping.tobb_start_date_field || 'bas_tarih'} onChange={(e) => updateMapping('tobb_start_date_field', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">End Date Field Name</Label>
                    <Input value={form.field_mapping.tobb_end_date_field || 'bit_tarih'} onChange={(e) => updateMapping('tobb_end_date_field', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Commodity Codes (comma-separated TOBB urun_kodu values)</Label>
                  <Input value={form.field_mapping.tobb_commodity_codes || ''} onChange={(e) => updateMapping('tobb_commodity_codes', e.target.value)} placeholder="e.g. 1001, 1002, 1003" />
                  <p className="text-[10px] text-muted-foreground">Leave empty to fetch all commodities for the exchange.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground">HTML Table Column Mapping (0-indexed positions)</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 shrink-0 text-[10px]">Commodity</Label>
                      <Input value={form.field_mapping.html_commodity_name || '0'} onChange={(e) => updateMapping('html_commodity_name', e.target.value)} className="h-7 text-xs w-14" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 shrink-0 text-[10px]">Min Price</Label>
                      <Input value={form.field_mapping.html_min_price || '1'} onChange={(e) => updateMapping('html_min_price', e.target.value)} className="h-7 text-xs w-14" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 shrink-0 text-[10px]">Max Price</Label>
                      <Input value={form.field_mapping.html_max_price || '2'} onChange={(e) => updateMapping('html_max_price', e.target.value)} className="h-7 text-xs w-14" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 shrink-0 text-[10px]">Avg Price</Label>
                      <Input value={form.field_mapping.html_avg_price || '3'} onChange={(e) => updateMapping('html_avg_price', e.target.value)} className="h-7 text-xs w-14" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 shrink-0 text-[10px]">Unit</Label>
                      <Input value={form.field_mapping.html_unit || '4'} onChange={(e) => updateMapping('html_unit', e.target.value)} className="h-7 text-xs w-14" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 shrink-0 text-[10px]">Date</Label>
                      <Input value={form.field_mapping.html_date || '5'} onChange={(e) => updateMapping('html_date', e.target.value)} className="h-7 text-xs w-14" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isTobbForm && form.source_type !== 'manual_json' && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-foreground">Field Mapping</p>
                <p className="text-[10px] text-muted-foreground">Map API response field names to database columns</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-[10px]">commodity_name</Label>
                    <Input value={form.field_mapping.commodity_name || ''} onChange={(e) => updateMapping('commodity_name', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-[10px]">price</Label>
                    <Input value={form.field_mapping.price || ''} onChange={(e) => updateMapping('price', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-[10px]">unit</Label>
                    <Input value={form.field_mapping.unit || ''} onChange={(e) => updateMapping('unit', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-[10px]">recorded_date</Label>
                    <Input value={form.field_mapping.recorded_date || ''} onChange={(e) => updateMapping('recorded_date', e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-28 shrink-0 text-[10px]">change_pct</Label>
                    <Input value={form.field_mapping.change_pct || ''} onChange={(e) => updateMapping('change_pct', e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>
              </div>
            )}

            <Button size="sm" onClick={handleAdd} disabled={saving || !form.name}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Create Source
            </Button>
          </div>
        )}

        {sources.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Database className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No data sources configured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((src) => {
              const result = fetchResult[src.id];
              const sourceLogs = logs[src.id] || [];
              const sourceTypeLabel = SOURCE_TYPES.find((t) => t.value === src.source_type)?.label || src.source_type;
              return (
                <div key={src.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{src.name}</p>
                        <Badge variant="outline" className="text-[10px]">{sourceTypeLabel}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{src.fetch_interval}</Badge>
                      </div>
                      {src.url && <p className="mt-0.5 truncate text-xs text-muted-foreground">{src.url}</p>}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Target: {exchanges.find((e) => e.id === src.exchange_id)?.short_name || 'None'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch checked={src.is_active} onCheckedChange={() => handleToggle(src)} />
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(src.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={fetching === src.id || src.source_type === 'manual_json'}
                      onClick={() => handleTestFetch(src)}
                    >
                      {fetching === src.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
                      Test Fetch
                    </Button>
                    {result && (
                      <span className={cn('flex items-center gap-1 text-xs', result.error ? 'text-destructive' : 'text-success')}>
                        {result.error ? <><XCircle className="h-3.5 w-3.5" />{result.error}</> : <><CheckCircle2 className="h-3.5 w-3.5" />{result.ingested} records ingested</>}
                      </span>
                    )}
                  </div>

                  {sourceLogs.length > 0 && (
                    <div className="rounded-md border border-border bg-muted/20 p-2 space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground">Recent Fetch History</p>
                      {sourceLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-[10px]">
                          {log.status === 'success' ? <CheckCircle2 className="h-3 w-3 text-success" /> : <AlertCircle className="h-3 w-3 text-destructive" />}
                          <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                          <span className="font-medium">{log.records_ingested} records</span>
                          {log.error_message && <span className="truncate text-destructive">{log.error_message}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function IconsRegistryTab() {
  const [overrides, setOverrides] = useState<Record<string, { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null }>>({});
  const [registry, setRegistry] = useState<CommodityRegistryEntry[]>([]);
  const [categories, setCategories] = useState<{ key: string; translation_tr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIcon, setSavingIcon] = useState<string | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({
    commodity_name: '', category: 'Grain & Field Crops', unit: 'ton',
    translation_tr: '', translation_en: '', translation_ar: '',
    icon_type: 'lucide' as 'lucide' | 'custom', icon_name: 'Wheat', icon_svg_path: null as string | null,
    is_featured: false, is_visible: true,
  });
  const [savingReg, setSavingReg] = useState(false);
  const [editingReg, setEditingReg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [iconRes, regRes, catRes] = await Promise.all([
      supabase.from('commodity_icon_overrides').select('commodity_name, icon_name, icon_type, icon_svg_path'),
      supabase.from('commodity_registry').select('*').order('commodity_name'),
      supabase.from('commodity_categories').select('key, translation_tr').order('sort_order'),
    ]);
    const map: Record<string, { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null }> = {};
    ((iconRes.data as { commodity_name: string; icon_name: string; icon_type: string; icon_svg_path: string | null }[]) || []).forEach((o) => {
      map[o.commodity_name] = { icon_name: o.icon_name, icon_type: (o.icon_type as 'lucide' | 'custom') || 'lucide', icon_svg_path: o.icon_svg_path };
    });
    setOverrides(map);
    setRegistry((regRes.data as CommodityRegistryEntry[]) || []);
    setCategories((catRes.data as { key: string; translation_tr: string }[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleIconSave = async (commodityName: string, icon: { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null }) => {
    setSavingIcon(commodityName);
    await supabase.from('commodity_icon_overrides').upsert({
      commodity_name: commodityName,
      icon_name: icon.icon_name,
      icon_type: icon.icon_type,
      icon_svg_path: icon.icon_svg_path,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'commodity_name' });
    setSavingIcon(null);
    await load();
  };

  const handleRegAdd = async () => {
    if (!regForm.commodity_name || !regForm.translation_tr) return;
    setSavingReg(true);
    const maxOrder = registry.reduce((max, r) => Math.max(max, r.display_order || 0), 0);
    await supabase.from('commodity_registry').upsert({
      commodity_name: regForm.commodity_name,
      category: regForm.category,
      unit: regForm.unit,
      translation_tr: regForm.translation_tr,
      translation_en: regForm.translation_en || regForm.commodity_name,
      translation_ar: regForm.translation_ar || regForm.commodity_name,
      icon_name: regForm.icon_name,
      icon_type: regForm.icon_type,
      icon_svg_path: regForm.icon_svg_path,
      display_order: maxOrder + 1,
      is_visible: regForm.is_visible,
      is_featured: regForm.is_featured,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'commodity_name' });
    setSavingReg(false);
    setRegForm({
      commodity_name: '', category: categories[0]?.key || 'Grain & Field Crops', unit: 'ton',
      translation_tr: '', translation_en: '', translation_ar: '',
      icon_type: 'lucide', icon_name: 'Wheat', icon_svg_path: null,
      is_featured: false, is_visible: true,
    });
    setShowRegForm(false);
    await load();
  };

  const handleRegDelete = async (name: string) => {
    await supabase.from('commodity_registry').delete().eq('commodity_name', name);
    await load();
  };

  const handleRegUpdate = async (entry: CommodityRegistryEntry, field: string, value: string | boolean) => {
    await supabase.from('commodity_registry').update({
      [field]: value,
      updated_at: new Date().toISOString(),
    }).eq('commodity_name', entry.commodity_name);
    await load();
  };

  const moveRegOrder = async (entry: CommodityRegistryEntry, direction: 'up' | 'down') => {
    const sorted = [...registry].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = sorted.findIndex((r) => r.commodity_name === entry.commodity_name);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('commodity_registry').update({ display_order: other.display_order }).eq('commodity_name', entry.commodity_name),
      supabase.from('commodity_registry').update({ display_order: entry.display_order }).eq('commodity_name', other.commodity_name),
    ]);
    await load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const allCommodityNames = Array.from(new Set([
    ...Object.keys(overrides),
    ...registry.map((r) => r.commodity_name),
  ])).sort();

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Commodity Icons</h2>
          <p className="text-sm text-muted-foreground">Change the icon for any commodity. Pick from the lucide library or upload a custom SVG. Changes apply instantly across the site.</p>
        </div>
        {allCommodityNames.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No commodities with custom icons yet. Register a commodity below to get started.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allCommodityNames.map((name) => (
              <CommodityIconEditor
                key={name}
                commodityName={name}
                currentIcon={overrides[name] || { icon_name: 'Wheat', icon_type: 'lucide', icon_svg_path: null }}
                onSave={(icon) => handleIconSave(name, icon)}
                saving={savingIcon === name}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Commodity Registry</h2>
            <p className="text-sm text-muted-foreground">Register commodities with translations, icons, display order, and visibility controls</p>
          </div>
          <Button size="sm" onClick={() => setShowRegForm(!showRegForm)}>
            <Plus className="mr-1 h-4 w-4" />
            {showRegForm ? 'Cancel' : 'Register Commodity'}
          </Button>
        </div>

        {showRegForm && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">New Commodity</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Commodity Name (internal) *</Label>
                <Input value={regForm.commodity_name} onChange={(e) => setRegForm({ ...regForm, commodity_name: e.target.value })} placeholder="e.g. Çay" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={regForm.category} onValueChange={(v) => setRegForm({ ...regForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.key} value={c.key}>{c.translation_tr}</SelectItem>)}
                    {categories.length === 0 && <SelectItem value="Grain & Field Crops">Grain & Field Crops</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit</Label>
                <Input value={regForm.unit} onChange={(e) => setRegForm({ ...regForm, unit: e.target.value })} placeholder="ton, kg, liter" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Turkish Translation *</Label>
                <Input value={regForm.translation_tr} onChange={(e) => setRegForm({ ...regForm, translation_tr: e.target.value })} placeholder="Çay" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">English Translation</Label>
                <Input value={regForm.translation_en} onChange={(e) => setRegForm({ ...regForm, translation_en: e.target.value })} placeholder="Tea" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Arabic Translation</Label>
                <Input value={regForm.translation_ar} onChange={(e) => setRegForm({ ...regForm, translation_ar: e.target.value })} placeholder="الشاي" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={regForm.is_visible} onCheckedChange={(v) => setRegForm({ ...regForm, is_visible: v })} />
                <Label className="text-xs">Visible on site</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={regForm.is_featured} onCheckedChange={(v) => setRegForm({ ...regForm, is_featured: v })} />
                <Label className="text-xs">Featured (homepage ticker)</Label>
              </div>
            </div>
            <IconUploader
              value={{ icon_type: regForm.icon_type, icon_name: regForm.icon_name, icon_svg_path: regForm.icon_svg_path }}
              onChange={(icon) => setRegForm({ ...regForm, icon_type: icon.icon_type, icon_name: icon.icon_name, icon_svg_path: icon.icon_svg_path })}
              label="Commodity Icon"
            />
            <Button size="sm" onClick={handleRegAdd} disabled={savingReg || !regForm.commodity_name || !regForm.translation_tr}>
              {savingReg ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Register
            </Button>
          </div>
        )}

        {registry.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No registered commodities yet. Use the button above to add one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...registry].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((entry, idx, arr) => (
              <div key={entry.commodity_name} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col gap-0.5">
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={idx === 0} onClick={() => moveRegOrder(entry, 'up')}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" disabled={idx === arr.length - 1} onClick={() => moveRegOrder(entry, 'down')}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <IconRenderer icon={{ icon_type: entry.icon_type, icon_name: entry.icon_name, icon_svg_path: entry.icon_svg_path }} className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm">{entry.commodity_name}</p>
                        <Badge variant="outline" className="text-[10px]">{entry.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.translation_tr} · {entry.translation_en} · {entry.translation_ar}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="ghost" className={cn('h-7 w-7 p-0', entry.is_featured && 'text-amber-500')} onClick={() => handleRegUpdate(entry, 'is_featured', !entry.is_featured)} title="Toggle featured">
                      <Star className={cn('h-3.5 w-3.5', entry.is_featured && 'fill-current')} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleRegUpdate(entry, 'is_visible', !entry.is_visible)} title="Toggle visibility">
                      {entry.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingReg(editingReg === entry.commodity_name ? null : entry.commodity_name)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRegDelete(entry.commodity_name)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {editingReg === entry.commodity_name && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-[10px]">TR</Label>
                        <Input value={entry.translation_tr} onChange={(e) => handleRegUpdate(entry, 'translation_tr', e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-[10px]">EN</Label>
                        <Input value={entry.translation_en} onChange={(e) => handleRegUpdate(entry, 'translation_en', e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-[10px]">AR</Label>
                        <Input value={entry.translation_ar} onChange={(e) => handleRegUpdate(entry, 'translation_ar', e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-12 shrink-0 text-[10px]">Unit</Label>
                        <Input value={entry.unit} onChange={(e) => handleRegUpdate(entry, 'unit', e.target.value)} className="h-7 text-xs" />
                      </div>
                    </div>
                    <IconUploader
                      value={{ icon_type: entry.icon_type, icon_name: entry.icon_name, icon_svg_path: entry.icon_svg_path }}
                      onChange={(icon) => handleRegUpdate(entry, 'icon_type', icon.icon_type).then(() => handleRegUpdate(entry, 'icon_name', icon.icon_name).then(() => handleRegUpdate(entry, 'icon_svg_path', icon.icon_svg_path || '')))}
                      label="Icon"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CommodityIconEditor({
  commodityName, currentIcon, onSave, saving,
}: {
  commodityName: string;
  currentIcon: { icon_name: string; icon_type: 'lucide' | 'custom'; icon_svg_path: string | null };
  onSave: (icon: { icon_type: 'lucide' | 'custom'; icon_name: string; icon_svg_path: string | null }) => void;
  saving: boolean;
}) {
  const [icon, setIcon] = useState(currentIcon);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setIcon(currentIcon); }, [currentIcon]);

  const handleSave = () => {
    onSave(icon);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const hasChanged = icon.icon_name !== currentIcon.icon_name || icon.icon_type !== currentIcon.icon_type || icon.icon_svg_path !== currentIcon.icon_svg_path;

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <IconRenderer icon={icon} className="h-4 w-4 text-primary" />
        </div>
        <p className="truncate text-sm font-medium text-foreground">{commodityName}</p>
      </div>
      <IconUploader value={icon} onChange={setIcon} label="" />
      <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || !hasChanged} className="w-full h-7 text-xs">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
        {saved ? 'Saved' : 'Save Icon'}
      </Button>
    </div>
  );
}
