import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import { ChatWindow } from './ChatWindow.js';
import { ToggleButton } from './ToggleButton.js';
import { styles } from '../styles/index.js';

interface WidgetProps {
  chatbotId: string;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  apiUrl: string;
}

/**
 * メインウィジェットコンポーネント
 * Shadow DOM 内でレンダリングされる
 */
export const Widget: FunctionComponent<WidgetProps> = ({
  chatbotId,
  position,
  primaryColor,
  apiUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const positionStyle =
    position === 'bottom-right'
      ? { bottom: '20px', right: '20px' }
      : { bottom: '20px', left: '20px' };

  return (
    <div style={{ ...styles.container, ...positionStyle }}>
      {/* スタイル定義 */}
      <style>{getWidgetStyles(primaryColor)}</style>

      {/* チャットウィンドウ */}
      {isOpen && (
        <ChatWindow
          chatbotId={chatbotId}
          apiUrl={apiUrl}
          primaryColor={primaryColor}
          onClose={close}
        />
      )}

      {/* トグルボタン */}
      <ToggleButton
        isOpen={isOpen}
        primaryColor={primaryColor}
        onClick={toggle}
      />
    </div>
  );
};

function getWidgetStyles(primaryColor: string): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .faqai-btn {
      pointer-events: auto;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: ${primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .faqai-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    }

    .faqai-btn:active {
      transform: scale(0.95);
    }

    .faqai-window {
      pointer-events: auto;
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 370px;
      height: 560px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideIn 0.2s ease;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .faqai-header {
      background-color: ${primaryColor};
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .faqai-header-title {
      font-size: 15px;
      font-weight: 600;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .faqai-close-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      opacity: 0.8;
      transition: opacity 0.15s;
    }

    .faqai-close-btn:hover { opacity: 1; }

    .faqai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    }

    .faqai-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.5;
      word-break: break-word;
    }

    .faqai-message--bot {
      background: #f3f4f6;
      color: #111827;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }

    .faqai-message--user {
      background-color: ${primaryColor};
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    .faqai-input-area {
      border-top: 1px solid #e5e7eb;
      padding: 12px;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .faqai-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }

    .faqai-input:focus {
      border-color: ${primaryColor};
      box-shadow: 0 0 0 2px ${primaryColor}33;
    }

    .faqai-send-btn {
      background-color: ${primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.15s;
    }

    .faqai-send-btn:hover { opacity: 0.9; }
    .faqai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 420px) {
      .faqai-window {
        width: calc(100vw - 24px);
        height: 480px;
        right: 0;
      }
    }
  `;
}
