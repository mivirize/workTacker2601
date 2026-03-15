/**
 * Save Template Dialog Component
 *
 * Dialog for saving current form fields as a template.
 */

import React, { useState } from 'react'
import type { DetectedField } from '../../stores/form-store'

interface SaveTemplateDialogProps {
  readonly isOpen?: boolean
  readonly fields?: readonly DetectedField[]
  readonly onSave?: (name: string, description: string, category: string) => void
  readonly onCancel?: () => void
  readonly className?: string
}

export function SaveTemplateDialog({
  isOpen = false,
  fields = [],
  onSave,
  onCancel,
  className = '',
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && description.trim()) {
      onSave?.(name.trim(), description.trim(), category)
      // Reset form
      setName('')
      setDescription('')
      setCategory('custom')
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    setCategory('custom')
    onCancel?.()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">テンプレートとして保存</h3>
          <button
            type="button"
            onClick={handleCancel}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
              テンプレート名 <span className="text-red-500">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: お問い合わせフォーム"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このテンプレートの説明を入力してください"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label htmlFor="template-category" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <select
              id="template-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="custom">カスタム</option>
              <option value="basic">基本</option>
              <option value="business">ビジネス</option>
              <option value="event">イベント</option>
              <option value="survey">アンケート</option>
            </select>
          </div>

          {/* Field Count */}
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-600">
              保存されるフィールド数: <span className="font-medium">{fields.length}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !description.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
