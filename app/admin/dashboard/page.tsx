'use client';

import Image from 'next/image';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Image as ImageIcon, Newspaper, LayoutGrid, BarChart3,
  Briefcase, GraduationCap, Loader2, Save, Star, Plus, Trash2,
  Check, Users, Ban, ShieldCheck, Search, Bell, Megaphone, Tags,
  ClipboardCheck, Sprout,
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
import { useAuth } from '@/components/auth-provider';
import { PostEditor } from '@/components/admin/post-editor';
import { supabase } from '@/lib/supabase';
import { JOB_SKILLS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CommodityAdmin } from '@/components/commodities/commodity-admin';
import { JobCategoriesAdmin } from '@/components/jobs/job-categories-admin';
import { AcademyAdmin } from '@/components/academy/academy-admin';
import { useJobCategories } from '@/hooks/use-job-categories';
import { NotificationsTab } from '@/components/notifications/notification-log';
import { AdsAdminTab } from '@/components/ads/ads-admin-tab';
import { ReviewQueueTab } from '@/components/admin/review-queue';
import { CropDevelopmentAdmin } from '@/components/admin/crop-development-admin';

const NEWS_CATEGORIES = ['market', 'general', 'policy', 'weather'];
const HERO_BG_TYPES = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Photo URL' },
  { value: 'video', label: 'Video URL' },
  { value: 'color', label: 'Solid Color' },
];
const ANIMATION_DIRECTIONS = [
  { value: 'top-right', label: 'Top Right → Center' },
  { value: 'top-left', label: 'Top Left → center' },
  { value: 'bottom-right', label: 'Bottom Right → center' },
  { value: 'bottom-left', label: 'Bottom Left → center' },
  { value: 'left', label: 'Left → center' },
  { value: 'right', label: 'Right → center' },
];
interface JobRow {
  id: string;
  title: string;
  farm_name: string;
  job_type: string;
  status: string;
  is_featured: boolean;
  skills: string[];
}

interface NewsRow {
  id: string;
  title: string;
  category: string;
  published_at: string;
  display_locations: string[] | null;
  is_breaking: boolean;
}



export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isStaff, setIsStaff] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      if (profile) {
        const staff = profile.is_admin === true || profile.is_moderator === true || profile.is_editor === true;
        setIsStaff(staff);
        if (!staff) router.push('/');
      }
      setCheckingStaff(false);
    }
  }, [authLoading, user, profile, router]);

  if (authLoading || checkingStaff) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isStaff) return null;
  return <AdminDashboard />;
}

function AdminDashboard() {
  useJobCategories();
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <Settings className="h-7 w-7 text-primary" />
          {isAdmin ? 'Admin Dashboard' : 'Moderator Panel'}
        </h1>
        <p className="mt-1 text-muted-foreground">{isAdmin ? 'Manage homepage content, markets, news, jobs, and academy' : 'Create and manage news posts and announcements'}</p>
      </div>

      <Tabs defaultValue={isAdmin ? 'hero' : 'review'} className="w-full">
        <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
          {isAdmin && <TabsTrigger value="hero" className="gap-1.5"><ImageIcon className="h-4 w-4" />Hero</TabsTrigger>}
          {isAdmin && <TabsTrigger value="crop" className="gap-1.5"><Sprout className="h-4 w-4" />Crop Development</TabsTrigger>}
          <TabsTrigger value="review" className="gap-1.5"><ClipboardCheck className="h-4 w-4" />Review Queue</TabsTrigger>
          <TabsTrigger value="news" className="gap-1.5"><Newspaper className="h-4 w-4" />News</TabsTrigger>
          {isAdmin && <TabsTrigger value="categories" className="gap-1.5"><LayoutGrid className="h-4 w-4" />Categories</TabsTrigger>}
          {isAdmin && <TabsTrigger value="markets" className="gap-1.5"><BarChart3 className="h-4 w-4" />Markets</TabsTrigger>}
          {isAdmin && <TabsTrigger value="job-categories" className="gap-1.5"><Tags className="h-4 w-4" />Job Categories</TabsTrigger>}
          {isAdmin && <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-4 w-4" />Jobs</TabsTrigger>}
          {isAdmin && <TabsTrigger value="academy" className="gap-1.5"><GraduationCap className="h-4 w-4" />Academy</TabsTrigger>}
          {isAdmin && <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" />Notifications</TabsTrigger>}
          {isAdmin && <TabsTrigger value="ads" className="gap-1.5"><Megaphone className="h-4 w-4" />Ads</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" />Users</TabsTrigger>}
        </TabsList>

        {isAdmin && <TabsContent value="hero"><HeroTab /></TabsContent>}
        {isAdmin && <TabsContent value="crop"><CropDevelopmentAdmin /></TabsContent>}
        <TabsContent value="review"><ReviewQueueTab /></TabsContent>
        <TabsContent value="news"><NewsTab /></TabsContent>
        {isAdmin && <TabsContent value="categories"><CategoriesTab /></TabsContent>}
        {isAdmin && <TabsContent value="markets"><CommodityAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="job-categories"><JobCategoriesAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="jobs"><JobsTab /></TabsContent>}
        {isAdmin && <TabsContent value="academy"><AcademyAdmin /></TabsContent>}
        {isAdmin && <TabsContent value="notifications"><NotificationsTab /></TabsContent>}
        {isAdmin && <TabsContent value="ads"><AdsAdminTab /></TabsContent>}
        {isAdmin && <TabsContent value="users"><UsersTab /></TabsContent>}
      </Tabs>
    </div>
  );
}

function HeroTab() {
  const [bgType, setBgType] = useState('gradient');
  const [bgValue, setBgValue] = useState('from-primary to-primary-light');
  const [bgOpacity, setBgOpacity] = useState('0.2');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) {
        setBgType(data.hero_background_type);
        setBgValue(data.hero_background_value);
        setBgOpacity(String(data.hero_background_opacity));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').update({
      hero_background_type: bgType,
      hero_background_value: bgValue,
      hero_background_opacity: parseFloat(bgOpacity) || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Hero Background</h2>
        <p className="text-sm text-muted-foreground">Change the background behind the homepage hero section</p>
      </div>

      <div className="space-y-2">
        <Label>Background Type</Label>
        <Select value={bgType} onValueChange={setBgType}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {HERO_BG_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          {bgType === 'gradient' && 'Gradient CSS (e.g. from-primary to-primary-light)'}
          {bgType === 'image' && 'Photo URL'}
          {bgType === 'video' && 'Video URL (MP4)'}
          {bgType === 'color' && 'Color hex (e.g. #1a5c3e) or transparent'}
        </Label>
        <Input value={bgValue} onChange={(e) => setBgValue(e.target.value)} placeholder="Enter value..." />
      </div>

      <div className="space-y-2">
        <Label>Overlay Opacity (0 = invisible, 1 = full)</Label>
        <Input type="number" step="0.1" min="0" max="1" value={bgOpacity} onChange={(e) => setBgOpacity(e.target.value)} />
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
        <div
          className="h-24 rounded-lg"
          style={bgType === 'gradient' ? { background: `linear-gradient(to right, ${bgValue.replace('from-', '').replace('to-', '').split(' ')[0] || '#1a5c3e'}, ${bgValue.split(' ').pop() || '#2d7a52'})` } : undefined}
        >
          {bgType === 'image' && <Image width={1200} height={675} src={bgValue} alt="" className="h-full w-full rounded-lg object-cover" />}
          {bgType === 'color' && <div className="h-full w-full rounded-lg" style={{ background: bgValue }} />}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
        {saved ? 'Saved' : 'Save'}
      </Button>
    </Card>
  );
}

function NewsTab() {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;
  const { toast } = useToast();
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [categories, setCategories] = useState<string[]>([]);
  const [postIds, setPostIds] = useState<string[]>([]);
  const [count, setCount] = useState('6');
  const [marqueeMode, setMarqueeMode] = useState<'auto' | 'manual'>('auto');
  const [marqueeIds, setMarqueeIds] = useState<string[]>([]);
  const [allNews, setAllNews] = useState<NewsRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('news_articles').select('id, title, category, published_at, display_locations, is_breaking').order('published_at', { ascending: false }).limit(50),
    ]).then(([settingsRes, newsRes]) => {
      if (settingsRes.data) {
        setMode(settingsRes.data.news_section_mode === 'manual' ? 'manual' : 'auto');
        setCategories(settingsRes.data.news_section_categories || []);
        setPostIds(settingsRes.data.news_section_post_ids || []);
        setCount(String(settingsRes.data.news_section_count || 6));
        setMarqueeMode(settingsRes.data.marquee_mode === 'manual' ? 'manual' : 'auto');
        setMarqueeIds(settingsRes.data.marquee_post_ids || []);
      }
      setAllNews((newsRes.data as NewsRow[]) || []);
      setLoading(false);
    });
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const togglePost = (id: string) => {
    setPostIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 5) {
        toast({ title: 'Maximum 5 posts', description: 'Remove one before adding another.', variant: 'destructive' });
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleMarqueePost = (id: string) => {
    setMarqueeIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 5) {
        toast({ title: 'Maximum 5 posts', description: 'Remove one before adding another.', variant: 'destructive' });
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').update({
      news_section_mode: mode,
      news_section_categories: categories,
      news_section_post_ids: postIds,
      news_section_count: parseInt(count) || 6,
      marquee_mode: marqueeMode,
      marquee_post_ids: marqueeIds,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <PostEditor />

      {isAdmin && (
      <>
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Homepage News Section</h2>
          <p className="text-sm text-muted-foreground">Choose automatic assignment or hand-pick posts for the homepage widget</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('auto')}
            className={cn(
              'flex-1 rounded-lg border p-3 text-left transition-all',
              mode === 'auto' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
            )}
          >
            <p className="text-sm font-semibold text-foreground">Automatic</p>
            <p className="text-xs text-muted-foreground">Newest posts from selected categories fill the widget</p>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={cn(
              'flex-1 rounded-lg border p-3 text-left transition-all',
              mode === 'manual' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
            )}
          >
            <p className="text-sm font-semibold text-foreground">Manual</p>
            <p className="text-xs text-muted-foreground">Hand-pick up to 5 specific posts</p>
          </button>
        </div>

        {mode === 'auto' ? (
          <>
            <div className="space-y-2">
              <Label>Categories to Display</Label>
              <div className="flex flex-wrap gap-2">
                {NEWS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      categories.includes(cat) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Empty = show all categories</p>
            </div>

            <div className="space-y-2">
              <Label>Number of Posts to Display</Label>
              <Input type="number" min="1" max="20" value={count} onChange={(e) => setCount(e.target.value)} className="w-32" />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label>Select Specific Posts ({postIds.length}/5)</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {allNews.map((article) => (
                <label key={article.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30">
                  <input
                    type="checkbox"
                    checked={postIds.includes(article.id)}
                    onChange={() => togglePost(article.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{article.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                      {article.is_breaking && <Badge className="bg-red-600 text-[10px] text-white hover:bg-red-600">Breaking</Badge>}
                      <span className="text-[10px] text-muted-foreground">{new Date(article.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Marquee (News Ticker)</h2>
          <p className="text-sm text-muted-foreground">Choose automatic mode or hand-pick posts for the scrolling top bar</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMarqueeMode('auto')}
            className={cn(
              'flex-1 rounded-lg border p-3 text-left transition-all',
              marqueeMode === 'auto' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
            )}
          >
            <p className="text-sm font-semibold text-foreground">Automatic</p>
            <p className="text-xs text-muted-foreground">The latest 1-2 posts each day scroll alongside market prices</p>
          </button>
          <button
            type="button"
            onClick={() => setMarqueeMode('manual')}
            className={cn(
              'flex-1 rounded-lg border p-3 text-left transition-all',
              marqueeMode === 'manual' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40',
            )}
          >
            <p className="text-sm font-semibold text-foreground">Manual</p>
            <p className="text-xs text-muted-foreground">Hand-pick up to 5 posts for the ticker</p>
          </button>
        </div>

        {marqueeMode === 'manual' && (
          <div className="space-y-2">
            <Label>Marquee Posts ({marqueeIds.length}/5)</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {allNews.map((article) => (
                <label key={article.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30">
                  <input
                    type="checkbox"
                    checked={marqueeIds.includes(article.id)}
                    onChange={() => toggleMarqueePost(article.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{article.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(article.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
        {saved ? 'Saved' : 'Save News Settings'}
      </Button>
      </>
      )}
    </div>
  );
}

function CategoriesTab() {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Browse by Categories Tiles</h2>
        <p className="text-sm text-muted-foreground">These tiles show job types on the homepage. Their names and icons are managed in the Markets tab (commodity exchanges) and the app configuration. The category names are stored in Turkish and translated automatically when switching languages via the translation maps in the codebase.</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">How translation works:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Job type names (Hasat, Sürüş, etc.) are translated via <code className="rounded bg-muted px-1 text-xs">translateJobType()</code> in <code className="rounded bg-muted px-1 text-xs">lib/translations.ts</code></li>
          <li>Commodity names (Buğday, Mısır, etc.) are translated via <code className="rounded bg-muted px-1 text-xs">translateCommodity()</code> in the same file</li>
          <li>To add a new translation, add an entry to the relevant map in that file</li>
        </ul>
      </div>
    </Card>
  );
}



function JobsTab() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const { data } = await supabase.from('jobs').select('id, title, farm_name, job_type, status, is_featured, skills').order('created_at', { ascending: false });
    setJobs((data as JobRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const toggleFeatured = async (job: JobRow) => {
    setUpdating(job.id);
    await supabase.from('jobs').update({ is_featured: !job.is_featured }).eq('id', job.id);
    await loadJobs();
    setUpdating(null);
  };

  const updateSkills = async (jobId: string, skills: string[]) => {
    setUpdating(jobId);
    await supabase.from('jobs').update({ skills }).eq('id', jobId);
    await loadJobs();
    setUpdating(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Featured Jobs</h2>
          <p className="text-sm text-muted-foreground">Toggle which jobs appear in the homepage featured section. Also manage required skills (max 4) per job.</p>
        </div>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.farm_name} · {job.job_type} · {job.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Star className={cn('h-4 w-4', job.is_featured ? 'fill-accent text-accent' : 'text-muted-foreground')} />
                  <Switch checked={job.is_featured} disabled={updating === job.id} onCheckedChange={() => toggleFeatured(job)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Required Skills (max 4)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_SKILLS.map((skill) => {
                    const selected = job.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        disabled={updating === job.id}
                        onClick={() => {
                          if (selected) updateSkills(job.id, job.skills.filter((s) => s !== skill));
                          else if (job.skills.length < 4) updateSkills(job.id, [...job.skills, skill]);
                        }}
                        className={cn(
                          'rounded-md border px-2 py-1 text-[11px] font-medium transition-all',
                          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40',
                          !selected && job.skills.length >= 4 && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AcademyTab() {
  const [tiles, setTiles] = useState<{ id: string; tile_key: string; icon_name: string; image1_url: string | null; image2_url: string | null; video_url: string | null; description: string | null; animation_direction: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('academy_tiles').select('*').order('tile_key').then(({ data }) => {
      setTiles((data as typeof tiles) || []);
      setLoading(false);
    });
  }, []);

  const updateTile = (id: string, field: string, value: string | null) => {
    setTiles((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const tile of tiles) {
      await supabase.from('academy_tiles').update({
        icon_name: tile.icon_name,
        image1_url: tile.image1_url,
        image2_url: tile.image2_url,
        video_url: tile.video_url,
        description: tile.description,
        animation_direction: tile.animation_direction,
        updated_at: new Date().toISOString(),
      }).eq('id', tile.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Turanda Akademi Tiles</h2>
          <p className="text-sm text-muted-foreground">Each tile shows two images that animate toward the center, then reveals a video or description on click.</p>
        </div>
        <div className="space-y-4">
          {tiles.map((tile) => (
            <div key={tile.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{tile.tile_key}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Icon (lucide name)</Label>
                  <Input value={tile.icon_name} onChange={(e) => updateTile(tile.id, 'icon_name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Animation Direction</Label>
                  <Select value={tile.animation_direction} onValueChange={(v) => updateTile(tile.id, 'animation_direction', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANIMATION_DIRECTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Image 1 URL (first animated image)</Label>
                  <Input value={tile.image1_url || ''} onChange={(e) => updateTile(tile.id, 'image1_url', e.target.value || null)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Image 2 URL (second animated image)</Label>
                  <Input value={tile.image2_url || ''} onChange={(e) => updateTile(tile.id, 'image2_url', e.target.value || null)} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Video URL (revealed on click, optional)</Label>
                <Input value={tile.video_url || ''} onChange={(e) => updateTile(tile.id, 'video_url', e.target.value || null)} placeholder="https://...mp4" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (revealed on click if no video)</Label>
                <Textarea value={tile.description || ''} onChange={(e) => updateTile(tile.id, 'description', e.target.value || null)} rows={2} placeholder="Short explanation shown on click..." />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
        {saved ? 'Saved' : 'Save Academy Tiles'}
      </Button>
    </div>
  );
}

interface UserRow {
  id: string;
  full_name: string | null;
  user_type: string;
  city: string | null;
  region: string | null;
  is_admin: boolean;
  is_moderator: boolean;
  is_editor: boolean;
  is_banned: boolean;
  created_at: string;
}

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as UserRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleBan = async (user: UserRow) => {
    setUpdating(user.id);
    const { error } = await supabase.functions.invoke('admin-user-action', {
      body: { action: 'set_user_ban_status', userId: user.id, value: !user.is_banned },
    });
    if (!error) await loadUsers();
    setUpdating(null);
  };

  const toggleAdmin = async (user: UserRow) => {
    setUpdating(user.id);
    const { error } = await supabase.functions.invoke('admin-user-action', {
      body: { action: 'set_admin_status', userId: user.id, value: !user.is_admin },
    });
    if (!error) await loadUsers();
    setUpdating(null);
  };

  const toggleModerator = async (user: UserRow) => {
    setUpdating(user.id);
    const { error } = await supabase.functions.invoke('admin-user-action', {
      body: { action: 'set_moderator_status', userId: user.id, value: !user.is_moderator },
    });
    if (!error) await loadUsers();
    setUpdating(null);
  };

  const toggleEditor = async (user: UserRow) => {
    setUpdating(user.id);
    const { error } = await supabase.functions.invoke('admin-user-action', {
      body: { action: 'set_editor_status', userId: user.id, value: !user.is_editor },
    });
    if (error) {
      console.error('Failed to update editor role', error);
    } else {
      await loadUsers();
    }
    setUpdating(null);
  };

  const filtered = users.filter((u) => {
    if (typeFilter !== 'all' && u.user_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (u.full_name || '').toLowerCase().includes(q) || (u.city || '').toLowerCase().includes(q) || u.id.includes(q);
    }
    return true;
  });

  const counts = {
    all: users.length,
    worker: users.filter((u) => u.user_type === 'worker').length,
    farmer: users.filter((u) => u.user_type === 'farmer').length,
    business: users.filter((u) => u.user_type === 'business').length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    let age = '';
    if (years > 0) age = `${years}y ${months % 12}mo`;
    else if (months > 0) age = `${months}mo ${days % 30}d`;
    else age = `${days}d`;
    return { date: date.toLocaleDateString('en-CA'), age };
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">View all users, filter by type, ban/unban, and manage admin status</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, or ID..." className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({counts.all})</SelectItem>
              <SelectItem value="worker">Workers ({counts.worker})</SelectItem>
              <SelectItem value="farmer">Farmers ({counts.farmer})</SelectItem>
              <SelectItem value="business">Business ({counts.business})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            filtered.map((u) => {
              const { date, age } = formatDate(u.created_at);
              return (
                <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-bold text-primary">{(u.full_name || '?')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{u.full_name || 'Unnamed'}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{u.user_type}</Badge>
                      {u.is_admin && <Badge className="text-[10px] border-primary/30 bg-primary/10 text-primary"><ShieldCheck className="mr-0.5 h-3 w-3" />Admin</Badge>}
                      {u.is_moderator && !u.is_admin && <Badge className="text-[10px] border-blue-300/50 bg-blue-100 text-blue-900 dark:border-blue-400/50 dark:bg-blue-950/50 dark:text-blue-200">Moderator</Badge>}
                      {u.is_editor && !u.is_admin && !u.is_moderator && <Badge className="text-[10px] border-purple-300/50 bg-purple-100 text-purple-900 dark:border-purple-400/50 dark:bg-purple-950/50 dark:text-purple-200">Editor</Badge>}
                      {u.is_banned && <Badge className="text-[10px] border-destructive/30 bg-destructive/10 text-destructive"><Ban className="mr-0.5 h-3 w-3" />Banned</Badge>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{u.city || 'No city'} · {u.region || 'No region'}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">Member since {date}</span>
                      <span className="text-muted-foreground/50">({age})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={u.is_admin ? 'default' : 'outline'}
                      disabled={updating === u.id}
                      onClick={() => toggleAdmin(u)}
                      className={u.is_admin ? 'bg-primary hover:bg-primary-light' : ''}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                    {!u.is_admin && (
                      <Button
                        size="sm"
                        variant={u.is_moderator ? 'default' : 'outline'}
                        disabled={updating === u.id}
                        onClick={() => toggleModerator(u)}
                        className={u.is_moderator ? 'bg-primary hover:bg-primary-light' : ''}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {u.is_moderator ? 'Remove Moderator' : 'Make Moderator'}
                      </Button>
                    )}
                    {!u.is_admin && !u.is_moderator && (
                      <Button
                        size="sm"
                        variant={u.is_editor ? 'default' : 'outline'}
                        disabled={updating === u.id}
                        onClick={() => toggleEditor(u)}
                        className={u.is_editor ? 'bg-primary hover:bg-primary-light' : ''}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        {u.is_editor ? 'Remove Editor' : 'Make Editor'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={u.is_banned ? 'default' : 'outline'}
                      disabled={updating === u.id}
                      onClick={() => toggleBan(u)}
                      className={u.is_banned ? 'bg-success hover:bg-success/90' : 'text-destructive hover:text-destructive'}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
