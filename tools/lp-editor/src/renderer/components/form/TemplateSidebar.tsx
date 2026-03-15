/**
 * Template Sidebar Component
 *
 * Sidebar for managing form templates (list, save, import/export).
 */

import React, { useRef } from 'react'
import type { FormTemplate } from '../../types/form-templates'
import { TemplateList } from './TemplateList'

interface TemplateSidebarProps {
  readonly isOpen?: boolean
  readonly onClose?: () => void
  readonly selectedTemplateId?: string | null
  readonly onSelectTemplate?: (template: FormTemplate) => void
  readonly onApplyTemplate?: (template: FormTemplate) => void
  readonly onEditTemplate?: (template: FormTemplate) => void
  readonly onDeleteTemplate?: (template: FormTemplate) => void
  readonly onSaveAsTemplate?: () => void
  readonly onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void
  readonly onExport?: () => void
  readonly isReadOnly?: boolean
  readonly className?: string
}

export function TemplateSidebar({
  isOpen = false,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSaveAsTemplate,
  onImport,
  onExport,
  isReadOnly = false,
  className = '',
}: TemplateSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport()
    }
    // Reset input
    e.target.value = ''
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">テンプレート</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200">
        {onSaveAsTemplate && (
          <button
            type="button"
            onClick={onSaveAsTemplate}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <span>テンプレートとして保存</span>
          </button>
        )}

        {onImport && (
          <button
            type="button"
            onClick={handleImportClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>インポート</span>
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>エクスポート</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-hidden">
        <TemplateList
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={onSelectTemplate}
          onApplyTemplate={onApplyTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  )
}
