/**
 * Field Action Toolbar Component
 *
 * Toolbar with actions for form fields (copy, paste, duplicate, delete).
 */

import React from 'react'

interface FieldActionToolbarProps {
  readonly canCopy?: boolean
  readonly canPaste?: boolean
  readonly canDuplicate?: boolean
  readonly canDelete?: boolean
  readonly onCopy?: () => void
  readonly onPaste?: () => void
  readonly onDuplicate?: () => void
  readonly onDelete?: () => void
  readonly className?: string
}

export function FieldActionToolbar({
  canCopy = true,
  canPaste = true,
  canDuplicate = true,
  canDelete = true,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  className = '',
}: FieldActionToolbarProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="コピー"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      )}

      {onPaste && (
        <button
          type="button"
          onClick={onPaste}
          disabled={!canPaste}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="貼り付け"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </button>
      )}

      {onDuplicate && (
        <button
          type="button"
          onClick={onDuplicate}
          disabled={!canDuplicate}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="複製"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
