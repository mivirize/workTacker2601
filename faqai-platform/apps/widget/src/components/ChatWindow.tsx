import { h } from 'preact';
import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import type { FunctionComponent } from 'preact';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  chatbotId: string;
  apiUrl: string;
  primaryColor: string;
  onClose: () => void;
}

/**
 * チャットウィンドウコンポーネント
 * WebSocket または HTTP polling でAPIと通信
 */
export const ChatWindow: FunctionComponent<ChatWindowProps> = ({
  chatbotId,
  apiUrl,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: 'こんにちは！何かお手伝いできることはありますか？',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージ到達時に自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/v1/public/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json() as { message: string };

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: data.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'bot',
        content: 'エラーが発生しました。しばらく経ってから再試行してください。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chatbotId, apiUrl, sessionId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  return (
    <div class="faqai-window">
      {/* ヘッダー */}
      <div class="faqai-header">
        <span class="faqai-header-title">サポートチャット</span>
        <button class="faqai-close-btn" onClick={onClose} aria-label="閉じる">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div class="faqai-messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            class={`faqai-message faqai-message--${msg.role}`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div class="faqai-message faqai-message--bot">
            <span aria-label="入力中">...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div class="faqai-input-area">
        <input
          class="faqai-input"
          type="text"
          placeholder="メッセージを入力..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="メッセージ入力"
          maxLength={1000}
        />
        <button
          class="faqai-send-btn"
          onClick={() => void sendMessage()}
          disabled={isLoading || !input.trim()}
          aria-label="送信"
        >
          送信
        </button>
      </div>
    </div>
  );
};
