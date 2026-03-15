/**
 * Field Actions Panel Component
 *
 * Panel with actions for managing form fields (add from template, clipboard actions).
 */

import React from 'react'
import { FieldActionToolbar } from './FieldActionToolbar'

interface FieldActionsPanelProps {
  readonly canAddFromTemplate?: boolean
  readonly canCopy?: boolean
  readonly canPaste?: boolean
  readonly onAddFromTemplate?: () => void
  readonly onCopy?: () => void
  readonly onPaste?: () => void
  readonly className?: string
}

export function FieldActionsPanel({
  canAddFromTemplate = true,
  canCopy = true,
  canPaste = true,
  onAddFromTemplate,
  onCopy,
  onPaste,
  className = '',
}: FieldActionsPanelProps) {
  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="flex items-center gap-2">
        {onAddFromTemplate && (
          <button
            type="button"
            onClick={onAddFromTemplate}
            disabled={!canAddFromTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>テンプレートから追加</span>
          </button>
        )}
      </div>

      <FieldActionToolbar
        canCopy={canCopy}
        canPaste={canPaste}
        canDuplicate={false}
        canDelete={false}
        onCopy={onCopy}
        onPaste={onPaste}
      />
    </div>
  )
}
