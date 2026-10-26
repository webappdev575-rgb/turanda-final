'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare, Send, ArrowLeft, Loader2, Mail, User, Briefcase,
  CheckCheck, Clock, ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/components/i18n-provider';
import { useMessages } from '@/hooks/use-messages';
import { VerificationPrompt } from '@/components/auth/verified-badge';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('c');

  const [selectedId, setSelectedId] = useState<string | null>(conversationParam || null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, messages, loading, messagesLoading, selectConversation, sendMessage, refetch } =
    useMessages(user?.id || null, selectedId || undefined);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (conversationParam && conversationParam !== selectedId) {
      setSelectedId(conversationParam);
    }
  }, [conversationParam, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    selectConversation(conversationId);
  };

  const handleSend = async () => {
    if (!draft.trim() || !selectedId || !user?.id || !profile) return;

    const selectedConv = conversations.find((c) => c.id === selectedId);
    if (!selectedConv) return;

    const senderRole = selectedConv.employer_id === user.id ? 'employer' : 'applicant';
    setSending(true);
    const result = await sendMessage(selectedId, user.id, senderRole, draft.trim());
    setSending(false);
    if (!result.error) {
      setDraft('');
      refetch();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  );

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const otherPartyName = (conv: { employer_id: string; applicant_name: string; job?: { farm_name?: string } }) => {
    if (conv.employer_id === user.id) {
      return conv.applicant_name;
    }
    return conv.job?.farm_name || t('messages.employer');
  };

  const isVerified = profile?.is_verified;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('messages.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('messages.subtitle')}</p>
        </div>
      </div>

      {!isVerified && (
        <Card className="mb-6 border-amber-300/40 bg-amber-50/50 p-5 dark:bg-amber-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('messages.verificationRequired')}</p>
                <p className="text-xs text-muted-foreground">{t('messages.verificationRequiredDesc')}</p>
              </div>
            </div>
            <VerificationPrompt />
          </div>
        </Card>
      )}

      <div className="flex h-[calc(100vh-320px)] min-h-[500px] overflow-hidden rounded-xl border border-border bg-card">
        {/* Conversation list */}
        <div className={cn(
          'flex-col border-r border-border',
          selectedId ? 'hidden w-full md:flex md:w-80' : 'flex w-full md:w-80'
        )}>
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">{t('messages.inbox')}</h2>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
                <Mail className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">{t('messages.noConversations')}</p>
                <p className="text-xs text-muted-foreground">{t('messages.noConversationsDesc')}</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => {
                  const isSelected = conv.id === selectedId;
                  const name = otherPartyName(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-3 text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                          <User className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {conv.job?.title || t('messages.jobDeleted')}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message thread */}
        <div className={cn(
          'flex-col flex-1',
          selectedId ? 'flex' : 'hidden md:flex'
        )}>
          {selectedConversation ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    router.push('/messages');
                  }}
                  className="md:hidden text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15">
                  <User className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {otherPartyName(selectedConversation)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {selectedConversation.job?.title || t('messages.jobDeleted')}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div className="space-y-3 p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">{t('messages.noMessages')}</p>
                      <p className="text-xs text-muted-foreground">{t('messages.noMessagesDesc')}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                              isMine
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <div className={cn(
                              'mt-1 flex items-center gap-1 text-[10px]',
                              isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                            )}>
                              {new Date(msg.created_at).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {isMine && (
                                msg.is_read
                                  ? <CheckCheck className="h-3 w-3" />
                                  : <Clock className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="border-t border-border p-3">
                {isVerified ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('messages.typeMessage')}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!draft.trim() || sending}
                      size="icon"
                      className="bg-primary hover:bg-primary-light"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    {t('messages.verifyToSend')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">{t('messages.selectConversation')}</p>
              <p className="text-xs text-muted-foreground">{t('messages.selectConversationDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
