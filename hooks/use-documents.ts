'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserDocument, DocumentType, ContentMethod } from '@/lib/types';

export function useDocuments(documentType?: DocumentType) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('user_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (documentType) {
      query = query.eq('document_type', documentType);
    }
    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setDocuments(data as UserDocument[]);
    }
    setLoading(false);
  }, [documentType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadPdf = useCallback(
    async (
      file: File,
      docType: DocumentType,
      title: string,
    ): Promise<{ error: string | null; document: UserDocument | null }> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { error: 'Not authenticated', document: null };

      if (file.type !== 'application/pdf') {
        return { error: 'Only PDF files are allowed', document: null };
      }

      const fileId = crypto.randomUUID();
      const filePath = `${userId}/${fileId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, { contentType: 'application/pdf' });

      if (uploadError) return { error: uploadError.message, document: null };

      const { data, error: insertError } = await supabase
        .from('user_documents')
        .insert({
          document_type: docType,
          title,
          content_method: 'pdf' as ContentMethod,
          file_path: filePath,
        })
        .select('*')
        .maybeSingle();

      if (insertError) {
        await supabase.storage.from('user-documents').remove([filePath]);
        return { error: insertError.message, document: null };
      }

      await fetchDocuments();
      return { error: null, document: data as UserDocument };
    },
    [fetchDocuments],
  );

  const createManual = useCallback(
    async (
      docType: DocumentType,
      title: string,
      manualText: string,
    ): Promise<{ error: string | null; document: UserDocument | null }> => {
      const { data, error } = await supabase
        .from('user_documents')
        .insert({
          document_type: docType,
          title,
          content_method: 'manual' as ContentMethod,
          manual_text: manualText,
        })
        .select('*')
        .maybeSingle();

      if (error) return { error: error.message, document: null };
      await fetchDocuments();
      return { error: null, document: data as UserDocument };
    },
    [fetchDocuments],
  );

  const updateDocument = useCallback(
    async (
      id: string,
      updates: Partial<Pick<UserDocument, 'title' | 'manual_text' | 'is_default'>>,
    ): Promise<{ error: string | null }> => {
      if (updates.is_default === true) {
        const doc = documents.find((d) => d.id === id);
        if (doc) {
          await supabase
            .from('user_documents')
            .update({ is_default: false })
            .eq('user_id', doc.user_id)
            .eq('document_type', doc.document_type)
            .neq('id', id);
        }
      }
      const { error } = await supabase
        .from('user_documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { error: error.message };
      await fetchDocuments();
      return { error: null };
    },
    [documents, fetchDocuments],
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const doc = documents.find((d) => d.id === id);
      if (doc?.file_path) {
        await supabase.storage.from('user-documents').remove([doc.file_path]);
      }
      const { error } = await supabase.from('user_documents').delete().eq('id', id);
      if (error) return { error: error.message };
      await fetchDocuments();
      return { error: null };
    },
    [documents, fetchDocuments],
  );

  const getPdfUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('user-documents').createSignedUrl(filePath, 3600);
    if (error) return null;
    return data?.signedUrl ?? null;
  }, []);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    uploadPdf,
    createManual,
    updateDocument,
    deleteDocument,
    getPdfUrl,
  };
}
