import type { CSSProperties } from 'preact/compat';

/**
 * Shadow DOM 内のコンテナスタイル
 * Shadow DOM の外側はposition: fixedで固定
 */
export const styles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 2147483647,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
};
