'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  History,
  MessageCircle,
  ScanLine,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/components/i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

const SCROLLBAR = [
  'overflow-y-auto',
  'overscroll-contain',
  '[scrollbar-width:thin]',
  '[scrollbar-color:#c9e7b8_transparent]',
  '[&::-webkit-scrollbar]:w-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full',
  '[&::-webkit-scrollbar-thumb]:bg-[#c9e7b8]',
].join(' ');

interface ChatMessage {
  id: number;
  role: 'user' | 'tura';
  text: string;
  pending?: boolean;
}

const THINKING_MS = 1400;

/** Topic-matched follow-up answers so repeat questions stay fresh. */
const TOPIC_HINTS: { match: RegExp; key: TranslationKey }[] = [
  { match: /sula|irrig|ري/i, key: 'farm.assistantAdvice' },
  { match: /kontrol|check|افحص|مراقب/i, key: 'farm.demoCornAlertMain' },
  { match: /çiçek|flower|زهرة|إزهار/i, key: 'farm.decisionRain' },
];

export function TuraAssistant({ onClose }: { onClose?: () => void }) {
  const { t } = useI18n();
  const [question, setQuestion] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const quickQuestions = [
    t('farm.qq1') as string,
    t('farm.qq2') as string,
    t('farm.qq3') as string,
  ];

  const tabs = [
    { value: 'chat', label: t('farm.tabChat') as string, icon: MessageCircle },
    { value: 'analytics', label: t('farm.tabAnalytics') as string, icon: BarChart3 },
    { value: 'diagnose', label: t('farm.tabDiagnose') as string, icon: ScanLine },
    { value: 'history', label: t('farm.tabHistory') as string, icon: History },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userId = ++idRef.current;
    const turaId = ++idRef.current;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', text: trimmed },
      { id: turaId, role: 'tura', text: '', pending: true },
    ]);
    setQuestion('');

    const hint = TOPIC_HINTS.find((h) => h.match.test(trimmed));
    const answer = t(hint ? hint.key : 'farm.assistantAdvice') as string;

    window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === turaId ? { ...m, text: answer, pending: false } : m)),
      );
    }, THINKING_MS);
  };

  return (
    <div className="animate-tura-open flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d3f2e] text-white shadow-[0px_25px_50px_-12px_#00000040]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="tura-icon-pulse grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#c9e7b8]">
            <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm">{t('farm.assistantName')}</strong>
            <span className="block truncate text-xs text-white/50">{t('farm.assistantStatus')}</span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('farm.assistantName') as string}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 transition-colors hover:bg-cream/10 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className={`flex min-h-0 flex-1 flex-col p-4 ${SCROLLBAR}`}>
        {messages.length === 0 ? (
          <>
            <div className="shrink-0 rounded-[16px_6px_16px_16px] bg-cream/10 p-3.5 text-sm text-white/80">
              {t('farm.assistantQuestion')}
            </div>
            <div className="mt-3 shrink-0 rounded-[6px_16px_16px_16px] bg-cream p-3.5 text-ink">
              <div className="flex items-center gap-2 text-xs font-bold text-field">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t('farm.assistantAdviceLabel')}
              </div>
              <p className="mt-2 text-sm leading-6">{t('farm.assistantAdvice')}</p>
            </div>
          </>
        ) : (
          messages.map((message) =>
            message.role === 'user' ? (
              <div
                key={message.id}
                className="animate-fade-in-up mt-3 flex shrink-0 flex-col items-end"
              >
                <span className="pb-1 text-[10px] font-bold text-white/40">
                  {t('farm.assistantYou')}
                </span>
                <div className="max-w-[85%] rounded-[16px_6px_16px_16px] bg-[#c9e7b8] p-3.5 text-sm font-medium text-[#08271d]">
                  {message.text}
                </div>
              </div>
            ) : (
              <div key={message.id} className="animate-fade-in-up mt-3 shrink-0">
                <div className="flex items-center gap-2 pb-1 text-[10px] font-bold text-white/40">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t('farm.assistantName')}
                </div>
                {message.pending ? (
                  <div className="inline-flex items-center gap-1.5 rounded-[6px_16px_16px_16px] bg-cream/15 px-4 py-3">
                    <span className="text-xs font-semibold text-white/70">
                      {t('farm.assistantThinking')}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="tura-typing-dot h-1.5 w-1.5 rounded-full bg-[#c9e7b8]"
                          style={{ animationDelay: `${dot * 180}ms` }}
                        />
                      ))}
                    </span>
                  </div>
                ) : (
                  <div className="max-w-[90%] rounded-[6px_16px_16px_16px] bg-cream p-3.5 text-ink">
                    <div className="flex items-center gap-2 text-xs font-bold text-field">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('farm.assistantAdviceLabel')}
                    </div>
                    <p className="mt-2 text-sm leading-6">{message.text}</p>
                  </div>
                )}
              </div>
            ),
          )
        )}
      </div>

      <div className="shrink-0 px-4 pb-2">
        <p className="text-xs font-bold tracking-[0.6px] text-white/40">
          {t('farm.quickQuestions')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-xl border border-white/10 bg-cream/5 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-cream/15"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <form
        className="flex shrink-0 items-center gap-2 bg-cream/95 p-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#15231d1a] bg-cream px-3">
          <MessageCircle className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <span className="sr-only">{t('farm.assistantPlaceholder')}</span>
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t('farm.assistantPlaceholder') as string}
            className="h-10 border-0 px-0 text-sm text-ink shadow-none focus-visible:ring-0"
          />
        </div>
        <button
          type="submit"
          aria-label={t('farm.assistantPlaceholder') as string}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors hover:bg-[#0d3f2e]"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <div className="flex shrink-0 justify-center border-t border-white/10 p-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-auto grid-cols-4 gap-1 rounded-2xl bg-[#08271db2] p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] text-white/50 data-[state=active]:bg-[#c9e7b8] data-[state=active]:text-brand"
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
