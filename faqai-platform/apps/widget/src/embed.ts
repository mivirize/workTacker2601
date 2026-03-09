/**
 * FAQAI Chatbot Widget - エントリポイント
 *
 * 埋め込み方法:
 * <script
 *   src="https://faqai.example.com/widget.js"
 *   data-chatbot-id="YOUR_CHATBOT_ID"
 *   data-position="bottom-right"
 *   defer
 * ></script>
 */

import { render, h } from 'preact';
import { Widget } from './components/Widget.js';

interface WidgetConfig {
  chatbotId: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  apiUrl?: string;
}

function getConfig(): WidgetConfig | null {
  // 現在のスクリプトタグからdata属性を取得
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-chatbot-id]',
  );
  const script = scripts[scripts.length - 1];

  if (!script) {
    console.warn('[FAQAI Widget] data-chatbot-id が指定されていません');
    return null;
  }

  const chatbotId = script.dataset['chatbotId'];
  if (!chatbotId) {
    console.warn('[FAQAI Widget] data-chatbot-id が空です');
    return null;
  }

  return {
    chatbotId,
    position: (script.dataset['position'] as WidgetConfig['position']) ?? 'bottom-right',
    primaryColor: script.dataset['primaryColor'],
    apiUrl: script.dataset['apiUrl'] ?? 'https://faqai.example.com',
  };
}

function mountWidget(config: WidgetConfig) {
  // Shadow DOM ホスト要素を作成
  const host = document.createElement('div');
  host.id = 'faqai-widget-host';
  host.style.cssText = 'position: fixed; z-index: 2147483647; pointer-events: none;';
  document.body.appendChild(host);

  // Shadow DOM を作成（スタイルの分離）
  const shadow = host.attachShadow({ mode: 'open' });

  // Shadow DOM 内にマウントポイントを作成
  const mountPoint = document.createElement('div');
  mountPoint.id = 'faqai-widget-root';
  shadow.appendChild(mountPoint);

  // Preact コンポーネントをレンダリング
  render(
    h(Widget, {
      chatbotId: config.chatbotId,
      position: config.position ?? 'bottom-right',
      primaryColor: config.primaryColor ?? '#2563eb',
      apiUrl: config.apiUrl ?? 'https://faqai.example.com',
    }),
    mountPoint,
  );
}

// DOMContentLoaded または即時実行
function init() {
  const config = getConfig();
  if (!config) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountWidget(config));
  } else {
    mountWidget(config);
  }
}

init();

// グローバル API を公開
declare global {
  interface Window {
    FAQAI?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}
