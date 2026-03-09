/**
 * FAQ検出に使用する共有定数
 * crawler.ts / playwright-crawler.ts で共通利用
 */

/**
 * FAQ URL検出パターン
 */
export const FAQ_URL_PATTERNS: RegExp[] = [
  /\/faq/i, /\/faqs/i, /\/qa/i, /\/question/i,
  /\/help/i, /\/support/i,
  /よくある質問/i, /ヘルプ/i,
];

/**
 * FAQタイトル検出パターン
 */
export const FAQ_TITLE_PATTERNS: RegExp[] = [
  /faq/i, /よくある質問/i, /q\s*[&＆]\s*a/i,
  /質問と回答/i, /ヘルプ/i, /お問い合わせ/i,
  /frequently\s*asked/i,
];

/**
 * FAQ検出パターン（ナビゲーションリンク用） - source/flags 形式でブラウザに渡す
 */
export const FAQ_NAV_PATTERN_DEFS: Array<{ source: string; flags: string }> = [
  { source: 'faq', flags: 'i' },
  { source: 'よくある質問', flags: '' },
  { source: 'q\\s*[&＆]\\s*a', flags: 'i' },
  { source: 'ヘルプ', flags: '' },
  { source: 'ご利用ガイド', flags: '' },
  { source: 'お問い合わせ', flags: '' },
  { source: 'サポート', flags: '' },
  { source: 'help', flags: 'i' },
  { source: 'support', flags: 'i' },
  { source: 'guide', flags: 'i' },
  { source: '使い方', flags: '' },
  { source: 'ガイド', flags: '' },
];

/**
 * ページネーションリンク検出用セレクター
 */
export const PAGINATION_SELECTORS: string[] = [
  '.pagination a',
  '.pager a',
  'nav.pagination a',
  '.page-navigation a',
  '.page-nav a',
  '.wp-pagenavi a',
  '[class*="pagination"] a',
  '[class*="pager"] a',
  '[aria-label="pagination"] a',
  '[role="navigation"][aria-label*="page"] a',
  '[rel="next"]',
];

/**
 * ページネーションURL検出パターン
 */
export const PAGINATION_URL_PATTERNS: RegExp[] = [
  /[?&]page=\d+/i,
  /[?&]p=\d+/i,
  /[?&]pg=\d+/i,
  /[?&]paged=\d+/i,
  /\/page\/\d+/i,
  /\/p\/\d+/i,
];

/**
 * ページネーションテキスト検出パターン（日本語対応）
 */
export const PAGINATION_TEXT_PATTERN_DEFS: Array<{ source: string; flags: string }> = [
  { source: '次へ', flags: '' },
  { source: '次のページ', flags: '' },
  { source: '次ページ', flags: '' },
  { source: 'next', flags: 'i' },
  { source: '^\\d+$', flags: '' },
  { source: '^›$', flags: '' },
  { source: '^»$', flags: '' },
  { source: '^>$', flags: '' },
  { source: '^>>$', flags: '' },
];

/**
 * メインコンテンツ検出セレクター
 */
export const MAIN_CONTENT_SELECTORS: string[] = [
  'main', 'article', '[role="main"]',
  '.main-content', '#main-content',
  '.content', '#content',
  '.entry-content', '.post-content',
];

/**
 * FAQセクションスクリーンショット用セレクター
 */
export const FAQ_SECTION_SCREENSHOT_SELECTORS: string[] = [
  'details',
  '.faq-item',
  '.qa-item',
  '[class*="accordion-item"]',
  '[itemtype*="Question"]',
];
