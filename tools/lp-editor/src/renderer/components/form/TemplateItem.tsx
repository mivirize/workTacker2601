/**
 * Template Item Component
 *
 * Individual template item in the template list.
 */

import React from 'react'
import type { FormTemplate } from '../../types/form-templates'

interface TemplateItemProps {
  readonly template: FormTemplate
  readonly isSelected?: boolean
  readonly onSelect?: () => void
  readonly onApply?: () => void
  readonly onEdit?: () => void
  readonly onDelete?: () => void
  readonly isReadOnly?: boolean
}

export function TemplateItem({
  template,
  isSelected = false,
  onSelect,
  onApply,
  onEdit,
  onDelete,
  isReadOnly = false,
}: TemplateItemProps) {
  const isPredefined = template.type === 'predefined'

  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">{template.name}</h4>
            {isPredefined && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                定義済み
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400">
              {template.fields.length} フィールド
            </span>
            {template.category && (
              <span className="text-xs text-gray-400">{template.category}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
              title="適用"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          )}

          {!isReadOnly && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="編集"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {!isReadOnly && !isPredefined && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
      </div>
    </div>
  )
}
