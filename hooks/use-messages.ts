'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { createMessageNotification } from '@/lib/notifications';
import type { Conversation, Message, SenderRole } from '@/lib/types';

export function useMessages(userId: string | null | undefined, selectedConversationId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentConversationId = useRef<string | undefined>(selectedConversationId);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('conversations')
      .select('*, job:jobs(*)')
      .or(`employer_id.eq.${userId},applicant_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setConversations(data as Conversation[]);
    }
    setLoading(false);
  }, [userId]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setMessages(data as Message[]);
    }
    setMessagesLoading(false);
  }, []);

  const markAsRead = useCallback(async (conversationId: string, currentUserId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);
    if (error) return;
    setMessages((prev) =>
      prev.map((m) => (m.sender_id !== currentUserId ? { ...m, is_read: true } : m))
    );
  }, []);

  const selectConversation = useCallback(async (conversationId: string) => {
    currentConversationId.current = conversationId;
    await fetchMessages(conversationId);
    if (userId) {
      await markAsRead(conversationId, userId);
      await fetchConversations();
    }
  }, [fetchMessages, markAsRead, fetchConversations, userId]);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      senderId: string,
      senderRole: SenderRole,
      body: string
    ): Promise<{ error: string | null }> => {
      if (!body.trim()) return { error: 'Message cannot be empty' };

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          sender_role: senderRole,
          body: body.trim(),
        })
        .select('*')
        .maybeSingle();

      if (error) return { error: error.message };

      if (data) {
        setMessages((prev) => [...prev, data as Message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, last_message_at: new Date().toISOString() }
              : c
          )
        );

        // Send email notification to the other participant
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
          const recipientId =
            senderRole === 'employer' ? conversation.applicant_id : conversation.employer_id;
          if (recipientId) {
            const { data: recipientProfile } = await supabase
              .from('profiles')
              .select('email_message_notifications, message_notification_email, notification_email, preferred_language, full_name')
              .eq('id', recipientId)
              .maybeSingle();

            if (recipientProfile?.email_message_notifications !== false) {
              const emailTo =
                recipientProfile?.message_notification_email ||
                recipientProfile?.notification_email ||
                '';
              if (emailTo) {
                const senderName =
                  senderRole === 'employer'
                    ? conversation.job?.farm_name || 'Employer'
                    : conversation.applicant_name;
                const jobTitle = conversation.job?.title || '';
                const recipientName = recipientProfile?.full_name || '';
                const lang = (recipientProfile?.preferred_language as 'tr' | 'en' | 'ar') || 'tr';
                await createMessageNotification(
                  emailTo,
                  recipientName,
                  senderName,
                  jobTitle,
                  body.trim(),
                  conversationId,
                  lang
                );
              }
            }
          }
        }
      }

      return { error: null };
    },
    [conversations]
  );

  const getOrCreateConversation = useCallback(
    async (
      jobId: string,
      employerId: string,
      applicantId: string,
      applicantName: string,
      applicantEmail: string,
      applicationId: string
    ): Promise<{ conversation: Conversation | null; error: string | null }> => {
      // Try to find existing conversation for this application
      const { data: existing } = await supabase
        .from('conversations')
        .select('*, job:jobs(*)')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (existing) return { conversation: existing as Conversation, error: null };

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          job_id: jobId,
          employer_id: employerId,
          applicant_id: applicantId,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          application_id: applicationId,
        })
        .select('*, job:jobs(*)')
        .maybeSingle();

      if (error) return { conversation: null, error: error.message };
      return { conversation: data as Conversation, error: null };
    },
    []
  );

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`employer_id.eq.${userId},applicant_id.eq.${userId}`);

    if (!convs || convs.length === 0) {
      setUnreadCount(0);
      return;
    }

    const conversationIds = convs.map((c) => c.id);
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  }, [userId]);

  // Initial load
  useEffect(() => {
    fetchConversations();
    refreshUnreadCount();
  }, [fetchConversations, refreshUnreadCount]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // If message belongs to the currently open conversation, add it
          if (currentConversationId.current && newMessage.conversation_id === currentConversationId.current) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
            // Mark as read if we're the recipient
            if (newMessage.sender_id !== userId) {
              markAsRead(newMessage.conversation_id, userId);
            }
          }
          // Always refresh conversations list and unread count
          fetchConversations();
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations, refreshUnreadCount, markAsRead]);

  // Load selected conversation on mount or change
  useEffect(() => {
    if (selectedConversationId) {
      selectConversation(selectedConversationId);
    }
  }, [selectedConversationId, selectConversation]);

  return {
    conversations,
    messages,
    unreadCount,
    loading,
    messagesLoading,
    error,
    selectConversation,
    sendMessage,
    getOrCreateConversation,
    markAsRead,
    refetch: fetchConversations,
    refreshUnreadCount,
  };
}
