/**
 * Confirm Replace Dialog Component
 *
 * Dialog for confirming replacement of existing form fields.
 */

import React from 'react'

interface ConfirmReplaceDialogProps {
  readonly isOpen?: boolean
  readonly existingFieldCount?: number
  readonly newFieldCount?: number
  readonly onConfirm?: () => void
  readonly onCancel?: () => void
  readonly className?: string
}

export function ConfirmReplaceDialog({
  isOpen = false,
  existingFieldCount = 0,
  newFieldCount = 0,
  onConfirm,
  onCancel,
  className = '',
}: ConfirmReplaceDialogProps) {
  const handleConfirm = () => {
    onConfirm?.()
  }

  const handleCancel = () => {
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
          <h3 className="text-lg font-semibold text-gray-900">フィールドの置換</h3>
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

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-900 mb-2">
                既存のフォームフィールドを新しいテンプレートで置換しますか？
              </p>
              <p className="text-sm text-gray-500 mb-3">
                この操作により、現在のフィールド設定が失われます。
              </p>

              {/* Field Count Info */}
              <div className="bg-gray-50 rounded-md p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">既存のフィールド:</span>
                  <span className="font-medium text-gray-900">{existingFieldCount} 件</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">新しいフィールド:</span>
                  <span className="font-medium text-gray-900">{newFieldCount} 件</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              置換する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
