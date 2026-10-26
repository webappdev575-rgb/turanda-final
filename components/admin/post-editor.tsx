'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, Loader2, Save, X, ImageIcon, Zap, Megaphone, Newspaper, ExternalLink, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { uploadPostImage, type Announcement } from '@/hooks/use-announcements';
import { cn } from '@/lib/utils';

const NEWS_CATEGORIES = ['market', 'general', 'policy', 'weather'];
const REGION_LIST = ['all', 'İç Anadolu', 'Ege', 'Akdeniz', 'Karadeniz', 'Marmara', 'Güneydoğu Anadolu'];

interface NewsRow {
  id: string;
  title: string;
  summary: string | null;
  title_en: string | null;
  summary_en: string | null;
  title_ar: string | null;
  summary_ar: string | null;
  category: string;
  region: string;
  source: string | null;
  url: string | null;
  thumbnail_url: string | null;
  published_at: string;
  is_breaking: boolean;
  display_locations: string[] | null;
}

const DISPLAY_LOCATIONS: { value: string; label: string }[] = [
  { value: 'market_news', label: 'Market News' },
  { value: 'marquee', label: 'Marquee' },
  { value: 'homepage', label: 'Homepage News' },
];

type PostKind = 'news' | 'announcement';

export function PostEditor() {
  const [kind, setKind] = useState<PostKind>('news');
  const [news, setNews] = useState<NewsRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // News editor state
  const [editingNews, setEditingNews] = useState<NewsRow | 'new' | null>(null);

  // Announcement editor state
  const [editingAnn, setEditingAnn] = useState<Announcement | 'new' | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ kind: PostKind; id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pulling, setPulling] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [newsRes, annRes] = await Promise.all([
      supabase
        .from('news_articles')
        .select('id, title, summary, title_en, summary_en, title_ar, summary_ar, category, region, source, url, thumbnail_url, published_at, is_breaking, display_locations')
        .order('published_at', { ascending: false })
        .limit(100),
      supabase
        .from('announcements')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
    ]);
    if (newsRes.error) {
      toast({ title: 'Haberler yüklenemedi', description: newsRes.error.message, variant: 'destructive' });
    } else {
      setNews((newsRes.data as NewsRow[]) || []);
    }
    if (annRes.error) {
      toast({ title: 'Duyurular yüklenemedi', description: annRes.error.message, variant: 'destructive' });
    } else {
      setAnnouncements((annRes.data as Announcement[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const table = deleteTarget.kind === 'news' ? 'news_articles' : 'announcements';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Silinemedi', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: deleteTarget.kind === 'news' ? 'Haber silindi' : 'Duyuru silindi' });
      await load();
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handlePullNews = async () => {
    setPulling(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { mode: 'gov_sources' },
      });
      if (error) throw error;
      const ingested = typeof data?.ingested === 'number' ? data.ingested : 0;
      toast({
        title: ingested > 0 ? `${ingested} new item(s) pulled` : 'No new items found',
        description: ingested > 0 ? 'Government feeds were checked for updates.' : 'All government feeds are already up to date.',
      });
      await load();
    } catch (err) {
      toast({
        title: 'Pull failed',
        description: err instanceof Error ? err.message : 'Could not reach the news service.',
        variant: 'destructive',
      });
    }
    setPulling(false);
  };

  const toggleBreaking = async (row: NewsRow) => {
    const next = !row.is_breaking;
    setNews((prev) => prev.map((n) => (n.id === row.id ? { ...n, is_breaking: next } : n)));
    const { error } = await supabase.from('news_articles').update({ is_breaking: next }).eq('id', row.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      setNews((prev) => prev.map((n) => (n.id === row.id ? { ...n, is_breaking: row.is_breaking } : n)));
    }
  };

  const rows: Array<NewsRow | Announcement> = kind === 'news' ? news : announcements;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Kind switcher + create */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => { setKind('news'); setEditingNews(null); setEditingAnn(null); }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              kind === 'news' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Newspaper className="h-4 w-4" />
            News
          </button>
          <button
            type="button"
            onClick={() => { setKind('announcement'); setEditingNews(null); setEditingAnn(null); }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              kind === 'announcement' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Megaphone className="h-4 w-4" />
            Announcements
          </button>
        </div>
        <div className="flex items-center gap-2">
          {kind === 'news' && (
            <Button variant="outline" onClick={handlePullNews} disabled={pulling} className="gap-1.5">
              <RefreshCw className={cn('h-4 w-4', pulling && 'animate-spin')} />
              {pulling ? 'Pulling…' : 'Pull News'}
            </Button>
          )}
          <Button
            onClick={() => (kind === 'news' ? setEditingNews('new') : setEditingAnn('new'))}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {kind === 'news' ? 'New Post' : 'New Announcement'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      {editingNews && <NewsForm article={editingNews === 'new' ? null : editingNews} onDone={() => { setEditingNews(null); load(); }} onCancel={() => setEditingNews(null)} />}
      {editingAnn && <AnnouncementForm announcement={editingAnn === 'new' ? null : editingAnn} onDone={() => { setEditingAnn(null); load(); }} onCancel={() => setEditingAnn(null)} />}

      {/* List */}
      {!editingNews && !editingAnn && (
        <Card className="divide-y divide-border">
          {rows.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {kind === 'news' ? 'No posts yet. Create the first one.' : 'No announcements yet. Create the first one.'}
            </p>
          )}
          {rows.map((row) => {
            const isNews = 'category' in row;
            return (
            <div key={row.id} className="flex items-center gap-3 p-4">
              {isNews && row.thumbnail_url ? (
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={row.thumbnail_url} alt="" fill sizes="64px" className="object-cover" />
                </div>
              ) : !isNews && row.image_url ? (
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={row.image_url} alt="" fill sizes="64px" className="object-cover" />
                </div>
              ) : (
                <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-muted">
                  {isNews ? <Newspaper className="h-5 w-5 text-muted-foreground" /> : <Megaphone className="h-5 w-5 text-muted-foreground" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{row.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {isNews && 'category' in row && <Badge variant="outline" className="text-[10px]">{row.category}</Badge>}
                  {isNews && row.is_breaking && (
                    <Badge className="gap-0.5 bg-red-600 text-[10px] text-white hover:bg-red-600">
                      <Zap className="h-2.5 w-2.5 fill-current" />Breaking
                    </Badge>
                  )}
                  {isNews && (row.display_locations ?? []).map((loc) => (
                    <Badge key={loc} variant="outline" className="text-[10px] text-muted-foreground">
                      {DISPLAY_LOCATIONS.find((l) => l.value === loc)?.label ?? loc}
                    </Badge>
                  ))}
                  {!isNews && !row.is_active && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(isNews ? row.published_at : row.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isNews && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => toggleBreaking(row)}
                    className={cn('h-8 w-8 p-0', row.is_breaking ? 'text-red-600 hover:text-red-600' : 'text-muted-foreground')}
                    aria-label={row.is_breaking ? 'Remove breaking tag' : 'Mark as breaking'}
                    title={row.is_breaking ? 'Remove breaking tag' : 'Mark as breaking'}
                  >
                    <Zap className={cn('h-4 w-4', row.is_breaking && 'fill-current')} />
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  onClick={() => (isNews ? setEditingNews(row) : setEditingAnn(row))}
                  className="h-8 w-8 p-0"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setDeleteTarget({ kind, id: row.id, title: row.title })}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            );
          })}
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {deleteTarget?.kind === 'news' ? 'post' : 'announcement'}?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Shared image upload field ─── */

function ImageUploadField({
  value, onChange, label,
}: { value: string | null; onChange: (url: string | null) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const { url, error: err } = await uploadPostImage(file);
    if (err) setError(err);
    else onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image src={value} alt="" fill sizes="144px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
            {uploading ? 'Uploading...' : 'Upload image'}
          </button>
        )}
        <div className="flex-1 space-y-1.5">
          <Input
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="…or paste an image URL"
          />
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF · max 5MB</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

/* ─── News form ─── */

function NewsForm({ article, onDone, onCancel }: { article: NewsRow | null; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [titleEn, setTitleEn] = useState(article?.title_en ?? '');
  const [summaryEn, setSummaryEn] = useState(article?.summary_en ?? '');
  const [titleAr, setTitleAr] = useState(article?.title_ar ?? '');
  const [summaryAr, setSummaryAr] = useState(article?.summary_ar ?? '');
  const [category, setCategory] = useState(article?.category ?? 'general');
  const [region, setRegion] = useState(article?.region ?? 'all');
  const [source, setSource] = useState(article?.source ?? '');
  const [url, setUrl] = useState(article?.url ?? '');
  const [publishedAt, setPublishedAt] = useState(
    article?.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  );
  const [isBreaking, setIsBreaking] = useState(article?.is_breaking ?? false);
  const [locations, setLocations] = useState<string[]>(article?.display_locations ?? []);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(article?.thumbnail_url ?? null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleLocation = (loc: string) => {
    setLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const values = {
      title: title.trim(),
      summary: summary.trim() || null,
      title_en: titleEn.trim() || null,
      summary_en: summaryEn.trim() || null,
      title_ar: titleAr.trim() || null,
      summary_ar: summaryAr.trim() || null,
      category,
      region,
      source: source.trim() || null,
      url: url.trim() || null,
      thumbnail_url: thumbnailUrl,
      published_at: new Date(publishedAt).toISOString(),
      is_breaking: isBreaking,
      display_locations: locations,
    };
    const { error } = article
      ? await supabase.from('news_articles').update(values).eq('id', article.id)
      : await supabase.from('news_articles').insert(values);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: article ? 'Post updated' : 'Post published' });
    onDone();
  };

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{article ? 'Edit Post' : 'New Post'}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0" aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Title (Turkish) *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Haber başlığı" />
      </div>
      <div className="space-y-2">
        <Label>Summary (Turkish)</Label>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Title (English)</Label>
          <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Optional translation" />
        </div>
        <div className="space-y-2">
          <Label>Summary (English)</Label>
          <Input value={summaryEn} onChange={(e) => setSummaryEn(e.target.value)} placeholder="Optional translation" />
        </div>
        <div className="space-y-2">
          <Label>Title (Arabic)</Label>
          <Input dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="ترجمة اختيارية" />
        </div>
        <div className="space-y-2">
          <Label>Summary (Arabic)</Label>
          <Input dir="rtl" value={summaryAr} onChange={(e) => setSummaryAr(e.target.value)} placeholder="ترجمة اختيارية" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {NEWS_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {REGION_LIST.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Publish Date</Label>
          <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Source</Label>
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. TÜRİB" />
        </div>
        <div className="space-y-2">
          <Label>Link</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Display Locations</Label>
        <div className="flex flex-wrap gap-2">
          {DISPLAY_LOCATIONS.map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={() => toggleLocation(loc.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                locations.includes(loc.value)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {loc.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Choose where this post appears. Empty = news list only.</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm font-medium text-foreground">Breaking News</p>
            <p className="text-xs text-muted-foreground">Shown with a red badge and pinned to the top</p>
          </div>
        </div>
        <Switch checked={isBreaking} onCheckedChange={setIsBreaking} />
      </div>

      <ImageUploadField label="Thumbnail Image" value={thumbnailUrl} onChange={setThumbnailUrl} />

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {article ? 'Save Changes' : 'Publish'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </Card>
  );
}

/* ─── Announcement form ─── */

function AnnouncementForm({ announcement, onDone, onCancel }: { announcement: Announcement | null; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(announcement?.image_url ?? null);
  const [linkUrl, setLinkUrl] = useState(announcement?.link_url ?? '');
  const [linkLabel, setLinkLabel] = useState(announcement?.link_label ?? '');
  const [isActive, setIsActive] = useState(announcement?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(String(announcement?.display_order ?? 0));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Title and text are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const values = {
      title: title.trim(),
      body: body.trim(),
      image_url: imageUrl,
      link_url: linkUrl.trim() || null,
      link_label: linkLabel.trim() || null,
      is_active: isActive,
      display_order: parseInt(displayOrder) || 0,
      updated_at: new Date().toISOString(),
    };
    const { error } = announcement
      ? await supabase.from('announcements').update(values).eq('id', announcement.id)
      : await supabase.from('announcements').insert(values);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: announcement ? 'Announcement updated' : 'Announcement created' });
    onDone();
  };

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{announcement ? 'Edit Announcement' : 'New Announcement'}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0" aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Duyuru başlığı" />
      </div>
      <div className="space-y-2">
        <Label>Text *</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label>Button Link</Label>
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… (optional)" />
        </div>
        <div className="space-y-2">
          <Label>Button Label</Label>
          <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Detaylar" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Visible on Homepage</p>
            <p className="text-xs text-muted-foreground">Inactive announcements are hidden from visitors</p>
          </div>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <div className="space-y-2">
        <Label>Display Order</Label>
        <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className="w-32" />
        <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
      </div>

      <ImageUploadField label="Image" value={imageUrl} onChange={setImageUrl} />

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {announcement ? 'Save Changes' : 'Create'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </Card>
  );
}
