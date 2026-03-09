'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ChevronRight, Check, RefreshCw, Bot, Send } from 'lucide-react';

type WidgetConfig = {
  position?: 'bottom-right' | 'bottom-left';
  primary_color?: string;
  greeting_message?: string;
  placeholder_text?: string;
};

type ChatbotInfo = {
  chatbotId: string;
  name: string;
  type: 'scenario' | 'ai' | 'hybrid';
  widgetConfig: WidgetConfig;
};

type Message = {
  role: 'user' | 'bot';
  content: string;
  choices?: string[];
  isEnd?: boolean;
};

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export default function ChatbotWidget({ chatbot }: { chatbot: ChatbotInfo }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [currentChoices, setCurrentChoices] = useState<string[] | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const primaryColor = chatbot.widgetConfig.primary_color ?? '#2563eb';
  const isScenarioMode = chatbot.type === 'scenario' || chatbot.type === 'hybrid';
  const position = chatbot.widgetConfig.position ?? 'bottom-right';
  const positionClass = position === 'bottom-left' ? 'left-5' : 'right-5';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  // チャットウィンドウを開いた時に初期化
  useEffect(() => {
    if (!open || initialized) return;
    setInitialized(true);

    if (isScenarioMode) {
      setSending(true);
      fetch(`${API_URL}/api/v1/public/chatbots/${chatbot.chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '__init__', sessionId }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (!json.success) return;
          const { message, choices, isEnd } = json.data;
          const msg: Message = { role: 'bot', content: message };
          if (choices) msg.choices = choices;
          if (isEnd !== undefined) msg.isEnd = isEnd;
          setMessages([msg]);
          setCurrentChoices(choices ?? null);
          if (isEnd) setIsEnded(true);
        })
        .catch(() => {})
        .finally(() => setSending(false));
    } else {
      const greeting = chatbot.widgetConfig.greeting_message;
      if (greeting) setMessages([{ role: 'bot', content: greeting }]);
    }
  }, [open, initialized, isScenarioMode, chatbot, sessionId]);

  const sendMessage = async (text: string) => {
    if (!text || sending) return;
    setCurrentChoices(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/public/chatbots/${chatbot.chatbotId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId }),
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'エラー');
      const { message, choices, isEnd } = json.data;
      const botMsg: Message = { role: 'bot', content: message };
      if (choices) botMsg.choices = choices;
      if (isEnd !== undefined) botMsg.isEnd = isEnd;
      setMessages((prev) => [...prev, botMsg]);
      setCurrentChoices(choices ?? null);
      if (isEnd) setIsEnded(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: '申し訳ありません。エラーが発生しました。' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentChoices(null);
    setIsEnded(false);
    setInitialized(false);
  };

  return (
    <div className={`fixed bottom-5 ${positionClass} z-50 flex flex-col items-end gap-3`}>
      {/* チャットウィンドウ */}
      {open && (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          style={{ width: 340, height: 520 }}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{chatbot.name}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{sending ? '入力中...' : 'オンライン'}</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="リセット"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto space-y-2.5 px-3 py-3"
            style={{ backgroundColor: '#f5f5f7' }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white mb-0.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Bot className="h-3 w-3" />
                  </div>
                )}
                {msg.role === 'user' ? (
                  <div
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-br-sm text-white text-sm font-medium max-w-[80%]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="h-3 w-3 shrink-0 opacity-80" />
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed text-gray-800 shadow-sm max-w-[84%] whitespace-pre-wrap border border-gray-100">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 items-end justify-start">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white mb-0.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 選択肢 / 入力 */}
          <div className="shrink-0 border-t bg-white">
            {/* シナリオ型: 選択肢 */}
            {isScenarioMode && currentChoices && currentChoices.length > 0 && !isEnded && (
              <div className="flex flex-col" style={{ maxHeight: 220 }}>
                <p className="shrink-0 px-4 pt-2 pb-1 text-[10px] font-medium tracking-wide text-gray-400">
                  選択してください
                </p>
                <div className="overflow-y-auto px-3 pb-2 space-y-1">
                  {currentChoices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => sendMessage(choice)}
                      disabled={sending}
                      className="w-full text-left flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 hover:text-white"
                      style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                        e.currentTarget.style.borderColor = primaryColor;
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                    >
                      <span className="leading-snug">{choice}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 会話終了 */}
            {isEnded && (
              <div className="flex flex-col items-center gap-2 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Check className="h-3.5 w-3.5" />
                  会話が終了しました
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium px-4 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = primaryColor;
                  }}
                >
                  <RefreshCw className="inline h-3 w-3 mr-1" />
                  最初からやり直す
                </button>
              </div>
            )}

            {/* AI型 / ハイブリッド（選択肢なし）: テキスト入力 */}
            {!isEnded && (!isScenarioMode || (chatbot.type === 'hybrid' && !currentChoices)) && (
              <div className="flex items-center gap-2 p-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const text = input.trim();
                      if (text) { setInput(''); sendMessage(text); }
                    }
                  }}
                  placeholder={chatbot.widgetConfig.placeholder_text ?? 'メッセージを入力...'}
                  disabled={sending}
                  className="flex-1 text-sm px-3.5 py-2 rounded-full border bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => { const text = input.trim(); if (text) { setInput(''); sendMessage(text); } }}
                  disabled={!input.trim() || sending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* トグルボタン */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: primaryColor }}
        aria-label={open ? 'チャットを閉じる' : 'チャットを開く'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
