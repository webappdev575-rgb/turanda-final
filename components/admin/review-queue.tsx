'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check, ChevronDown, ChevronUp, Clock, Loader2, MessageSquare, RefreshCw,
  Send, Sparkles, X, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ReviewStatus = 'draft' | 'pending_review' | 'approved' | 'revision_requested' | 'rejected';

interface QueueArticle {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  body_content_tr: string | null;
  category: string;
  source: string | null;
  published_at: string;
  review_status: ReviewStatus;
  ai_rewritten_at: string | null;
  author_id: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface ReviewComment {
  id: string;
  article_id: string;
  author_id: string;
  comment: string;
  created_at: string;
  author_name?: string;
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; className: string }> = {
  draft: { label: 'Taslak', className: 'bg-muted text-muted-foreground border-border' },
  pending_review: { label: 'İnceleme Bekliyor', className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' },
  revision_requested: { label: 'Revizyon İstendi', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' },
  rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' },
};

const QUEUE_FILTERS: { key: ReviewStatus | 'all'; label: string }[] = [
  { key: 'pending_review', label: 'Bekleyenler' },
  { key: 'revision_requested', label: 'Revizyon' },
  { key: 'rejected', label: 'Reddedilenler' },
  { key: 'approved', label: 'Onaylılar' },
  { key: 'draft', label: 'Taslaklar' },
  { key: 'all', label: 'Tümü' },
];

export function ReviewQueueTab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isEditorOnly = profile?.is_editor === true && !profile.is_admin && !profile.is_moderator;

  const [articles, setArticles] = useState<QueueArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('pending_review');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const [autopilotLoading, setAutopilotLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('news_articles')
      .select('id, slug, title, summary, body_content_tr, category, source, published_at, review_status, ai_rewritten_at, author_id, submitted_by, submitted_at, reviewed_by, reviewed_at')
      .in('review_status', filter === 'all' ? ['draft', 'pending_review', 'approved', 'revision_requested', 'rejected'] : [filter])
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false })
      .limit(100);
    setArticles((data as QueueArticle[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('news_autopilot')
        .eq('id', 1)
        .maybeSingle();
      setAutopilot(data?.news_autopilot === true);
      setAutopilotLoading(false);
    })();
  }, []);

  const toggleAutopilot = async (next: boolean) => {
    setAutopilot(next);
    const { error } = await supabase
      .from('site_settings')
      .update({ news_autopilot: next, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) {
      setAutopilot(!next);
      toast({ title: 'Ayar kaydedilemedi', variant: 'destructive' });
    } else {
      toast({ title: next ? 'Otomatik yayin acildi' : 'Otomatik yayin kapatildi' });
    }
  };

  const setStatus = async (article: QueueArticle, status: ReviewStatus, note?: string) => {
    setActionBusy(article.id + status);
    const updates: Record<string, unknown> = {
      review_status: status,
      reviewed_by: (status === 'approved' || status === 'rejected' || status === 'revision_requested') ? (await supabase.auth.getUser()).data.user?.id : null,
      reviewed_at: (status === 'approved' || status === 'rejected' || status === 'revision_requested') ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from('news_articles').update(updates).eq('id', article.id);
    if (error) {
      toast({ title: 'İşlem başarısız', description: error.message, variant: 'destructive' });
    } else {
      if (note?.trim()) {
        await supabase.from('news_review_comments').insert({ article_id: article.id, comment: note.trim() });
      }
      toast({
        title:
          status === 'approved' ? 'Makale onaylandı' :
          status === 'rejected' ? 'Makale reddedildi' :
          status === 'revision_requested' ? 'Revizyon istendi' :
          status === 'pending_review' ? 'İncelemeye gönderildi' : 'Taslağa alındı',
      });
      loadArticles();
    }
    setActionBusy(null);
  };

  const submitForReview = async (article: QueueArticle) => {
    setActionBusy(article.id + 'submit');
    const { error } = await supabase
      .from('news_articles')
      .update({
        review_status: 'pending_review',
        submitted_by: (await supabase.auth.getUser()).data.user?.id,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', article.id);
    if (error) {
      toast({ title: 'Gönderilemedi', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'İnceleme için gönderildi' });
      loadArticles();
    }
    setActionBusy(null);
  };

  const rewriteWithAi = async (article: QueueArticle) => {
    setActionBusy(article.id + 'ai');
    try {
      const { error } = await supabase.functions.invoke('fetch-news', {
        body: { rewriteArticleId: article.id },
      });
      if (error) throw error;
      toast({ title: 'AI ile yeniden yazıldı', description: 'Makale gövdesi ve ürün etiketleri güncellendi.' });
      loadArticles();
    } catch {
      toast({ title: 'AI yeniden yazma başarısız', description: 'Lütfen tekrar deneyin.', variant: 'destructive' });
    }
    setActionBusy(null);
  };

  const loadComments = async (articleId: string) => {
    setCommentsLoading(true);
    const { data } = await supabase
      .from('news_review_comments')
      .select('id, article_id, author_id, comment, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    const rows = (data as ReviewComment[]) ?? [];
    if (rows.length > 0) {
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', authorIds);
      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      rows.forEach((r) => { r.author_name = nameMap.get(r.author_id) || 'Ekip'; });
    }
    setComments(rows);
    setCommentsLoading(false);
  };

  const openArticle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setComments([]);
      return;
    }
    setExpandedId(id);
    setNewComment('');
    loadComments(id);
  };

  const addComment = async () => {
    if (!newComment.trim() || !expandedId) return;
    const { error } = await supabase
      .from('news_review_comments')
      .insert({ article_id: expandedId, comment: newComment.trim() });
    if (!error) {
      setNewComment('');
      loadComments(expandedId);
    }
  };

  const editBody = async (article: QueueArticle) => {
    const current = article.body_content_tr || '';
    const input = window.prompt('Makale gövdesini düzenleyin (paragrafları boş satırla ayırın):', current);
    if (input === null || input === current) return;
    setActionBusy(article.id + 'edit');
    const { error } = await supabase
      .from('news_articles')
      .update({ body_content_tr: input })
      .eq('id', article.id);
    if (error) {
      toast({ title: 'Kaydedilemedi', variant: 'destructive' });
    } else {
      toast({ title: 'Gövde güncellendi' });
      loadArticles();
    }
    setActionBusy(null);
  };

  return (
    <div className="space-y-4">
      {/* Autopilot toggle */}
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <p className="font-semibold text-foreground">Otomatik Yayınlama (Otopilot)</p>
            <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
              {autopilot
                ? 'Açık: AI ile yeniden yazılan makaleler otomatik olarak yayına alınır.'
                : 'Kapalı: yeniden yazılan her makale, onaylanmak üzere inceleme kuyruğuna düşer.'}
            </p>
          </div>
        </div>
        {autopilotLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Switch checked={autopilot} onCheckedChange={toggleAutopilot} disabled={isEditorOnly} />
        )}
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {QUEUE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary',
            )}
          >
            {f.label}
          </button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto h-8" onClick={loadArticles}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Yenile
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : articles.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-14 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Bu listede makale yok</p>
          <p className="text-xs text-muted-foreground">Farklı bir durum filtresi seçin.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const statusCfg = STATUS_CONFIG[article.review_status];
            const expanded = expandedId === article.id;
            const canDecide = !isEditorOnly;
            return (
              <Card key={article.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => openArticle(article.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('border', statusCfg.className)} variant="outline">
                        {statusCfg.label}
                      </Badge>
                      {article.ai_rewritten_at && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Sparkles className="h-3 w-3" />AI yazdı
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{article.source || ''}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">{article.title}</p>
                  </div>
                  {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {expanded && (
                  <div className="border-t border-border bg-muted/10 p-4">
                    <p className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {article.body_content_tr || article.summary || 'Gövde metni henüz yok.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {canDecide && (
                        <>
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" disabled={actionBusy !== null} onClick={() => setStatus(article, 'approved')}>
                            {actionBusy === article.id + 'approved' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}Onayla
                          </Button>
                          <Button size="sm" variant="outline" className="h-8" disabled={actionBusy !== null} onClick={() => {
                            const note = window.prompt('Revizyon notu (isteğe bağlı):') ?? undefined;
                            setStatus(article, 'revision_requested', note);
                          }}>
                            <RefreshCw className="mr-1 h-3.5 w-3.5" />Revizyon İste
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-destructive hover:bg-destructive/10" disabled={actionBusy !== null} onClick={() => {
                            const note = window.prompt('Ret nedeni (isteğe bağlı):') ?? undefined;
                            setStatus(article, 'rejected', note);
                          }}>
                            <X className="mr-1 h-3.5 w-3.5" />Reddet
                          </Button>
                          <Button size="sm" variant="outline" className="h-8" disabled={actionBusy !== null} onClick={() => editBody(article)}>
                            Düzenle
                          </Button>
                        </>
                      )}
                      {article.review_status === 'revision_requested' && !canDecide && (
                        <Button size="sm" className="h-8" disabled={actionBusy !== null} onClick={() => submitForReview(article)}>
                          <Send className="mr-1 h-3.5 w-3.5" />Tekrar Gönder
                        </Button>
                      )}
                      {(article.review_status === 'draft') && (
                        <Button size="sm" className="h-8" disabled={actionBusy !== null} onClick={() => submitForReview(article)}>
                          <Send className="mr-1 h-3.5 w-3.5" />İncelemeye Gönder
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 border-accent/40 text-accent" disabled={actionBusy !== null} onClick={() => rewriteWithAi(article)}>
                        {actionBusy === article.id + 'ai' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}AI ile Yeniden Yaz
                      </Button>
                    </div>

                    {/* Comments thread */}
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />Ekip Yorumları
                      </p>
                      {commentsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Henüz yorum yok.</p>
                      ) : (
                        <div className="space-y-2">
                          {comments.map((c) => (
                            <div key={c.id} className="rounded-lg bg-background p-2.5">
                              <p className="text-xs font-semibold text-foreground">{c.author_name}</p>
                              <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">{c.comment}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground/60">
                                {new Date(c.created_at).toLocaleString('tr-TR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Yorum yazın..."
                          className="min-h-[60px] text-xs"
                        />
                        <Button size="sm" className="h-fit self-end" disabled={!newComment.trim()} onClick={addComment}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}