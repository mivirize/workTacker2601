import { h } from 'preact';
import type { FunctionComponent } from 'preact';

interface ToggleButtonProps {
  isOpen: boolean;
  primaryColor: string;
  onClick: () => void;
}

/**
 * チャットウィジェット開閉ボタン
 */
export const ToggleButton: FunctionComponent<ToggleButtonProps> = ({
  isOpen,
  onClick,
}) => {
  return (
    <button
      class="faqai-btn"
      onClick={onClick}
      aria-label={isOpen ? 'チャットを閉じる' : 'チャットを開く'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        // 閉じるアイコン (X)
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        // チャットバブルアイコン
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z" />
        </svg>
      )}
    </button>
  );
};
