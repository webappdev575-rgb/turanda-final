'use client';

import { useState, useRef } from 'react';
import {
  FileText, Upload, Type, CheckCircle2, Trash2, Pencil,
  Loader2, Plus, X, FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useDocuments } from '@/hooks/use-documents';
import { useI18n } from '@/components/i18n-provider';
import { useAuth } from '@/components/auth-provider';
import type { DocumentType, UserDocument } from '@/lib/types';
import { cn } from '@/lib/utils';

export function DocumentManager({ documentType }: { documentType: DocumentType }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { documents, loading, uploadPdf, createManual, updateDocument, deleteDocument, refetch } = useDocuments(documentType);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addMode, setAddMode] = useState<'pdf' | 'manual'>('pdf');
  const [title, setTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabel = documentType === 'cv' ? t('docs.cv') : t('docs.coverLetter');
  const typeDesc = documentType === 'cv' ? t('docs.cvDesc') : t('docs.coverLetterDesc');

  const resetAddForm = () => {
    setTitle('');
    setManualText('');
    setSelectedFile(null);
    setError(null);
    setAddMode('pdf');
  };

  const handleOpenAdd = () => {
    resetAddForm();
    setShowAddDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError(t('docs.pdfOnly'));
        return;
      }
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.pdf$/i, ''));
      setError(null);
    }
  };

  const handleSubmitAdd = async () => {
    if (!title.trim()) {
      setError(t('docs.titleRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);

    if (addMode === 'pdf') {
      if (!selectedFile) {
        setError(t('docs.fileRequired'));
        setSubmitting(false);
        return;
      }
      const { error } = await uploadPdf(selectedFile, documentType, title.trim());
      if (error) {
        setError(error);
        setSubmitting(false);
        return;
      }
    } else {
      if (!manualText.trim()) {
        setError(t('docs.textRequired'));
        setSubmitting(false);
        return;
      }
      const { error } = await createManual(documentType, title.trim(), manualText.trim());
      if (error) {
        setError(error);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setShowAddDialog(false);
    resetAddForm();
  };

  const handleSetDefault = async (doc: UserDocument) => {
    await updateDocument(doc.id, { is_default: true });
  };

  const handleOpenEdit = (doc: UserDocument) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditText(doc.manual_text || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const updates: Partial<Pick<UserDocument, 'title' | 'manual_text'>> = { title: editTitle.trim() };
    const doc = documents.find((d) => d.id === editingId);
    if (doc?.content_method === 'manual') {
      updates.manual_text = editText.trim();
    }
    await updateDocument(editingId, updates);
    setEditingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteDocument(deleteId);
    setDeleteId(null);
  };

  if (!user) return null;

  const filteredDocs = documents.filter((d) => d.document_type === documentType);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-secondary" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {typeLabel}
              {documentType === 'cv' && <span className="ml-1 text-destructive">*</span>}
            </p>
            <p className="text-[10px] text-muted-foreground">{typeDesc}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleOpenAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" />{t('docs.add')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">{t('docs.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-all',
                doc.is_default ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/20',
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {doc.content_method === 'pdf' ? (
                  <FileText className="h-4 w-4 text-destructive" />
                ) : (
                  <Type className="h-4 w-4 text-secondary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                  {doc.is_default && (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {documentType === 'cv' ? t('docs.defaultCv') : t('docs.defaultCl')}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {doc.content_method === 'pdf' ? 'PDF' : t('docs.manualText')} · {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!doc.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(doc)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title={t('docs.setAsDefault')}
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(doc)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-colors"
                  title={t('docs.edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(doc.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title={t('docs.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(v) => { setShowAddDialog(v); if (!v) resetAddForm(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg text-primary">
              {t('docs.addTitle', { type: typeLabel })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAddMode('pdf')}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all',
                  addMode === 'pdf' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
                )}
              >
                <Upload className="h-4 w-4" />{t('docs.uploadPdf')}
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all',
                  addMode === 'manual' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
                )}
              >
                <Type className="h-4 w-4" />{t('docs.typeManual')}
              </button>
            </div>

            <div className="space-y-2">
              <Label>{t('docs.titleLabel')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('docs.titlePlaceholder')}
              />
            </div>

            {addMode === 'pdf' ? (
              <div className="space-y-2">
                <Label>{t('docs.pdfFile')}</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-all hover:border-primary/30"
                >
                  {selectedFile ? (
                    <>
                      <FileText className="h-8 w-8 text-destructive" />
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">{t('docs.clickUpload')}</p>
                      <p className="text-[10px] text-muted-foreground">PDF · max 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('docs.content')}</Label>
                <Textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={t('docs.contentPlaceholder')}
                  rows={8}
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetAddForm(); }} disabled={submitting}>
              {t('apply.cancel')}
            </Button>
            <Button onClick={handleSubmitAdd} disabled={submitting} className="bg-primary hover:bg-primary-light">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.loading')}</> : t('docs.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(v) => { if (!v) setEditingId(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg text-primary">{t('docs.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('docs.titleLabel')}</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            {documents.find((d) => d.id === editingId)?.content_method === 'manual' && (
              <div className="space-y-2">
                <Label>{t('docs.content')}</Label>
                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={8} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>{t('apply.cancel')}</Button>
            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary-light">{t('docs.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg text-destructive">{t('docs.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{t('docs.deleteConfirm')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('apply.cancel')}</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>{t('docs.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
