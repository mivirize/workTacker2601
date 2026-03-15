/**
 * SettingsTab Component
 *
 * Link URL management for all link-type fields.
 */

import React from 'react'
import type { EditableFieldData } from './types'

interface SettingsTabProps {
  editables: Record<string, EditableFieldData>
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
}

export function SettingsTab({ editables, updateEditable }: SettingsTabProps) {
  const linkFields = React.useMemo(() => {
    return Object.entries(editables)
      .filter(([, field]) => field.type === 'link')
      .map(([fieldId, field]) => ({
        fieldId,
        type: field.type,
        value: field.value,
        label: field.label,
        href: field.href,
        group: field.group,
      }))
  }, [editables])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          リンク設定
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          ボタンやリンクのURL設定を一括で管理できます
        </p>
        <div className="space-y-4">
          {linkFields.length > 0 ? (
            linkFields.map((field) => (
              <div key={field.fieldId} className="p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label || field.fieldId}
                </label>
                {field.group && (
                  <span className="text-xs text-gray-400 mb-2 block">
                    グループ: {field.group}
                  </span>
                )}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">表示テキスト</label>
                    <input
                      type="text"
                      value={field.value || ''}
                      onChange={(e) => updateEditable(field.fieldId, e.target.value)}
                      placeholder="ボタンテキスト"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">リンク先URL</label>
                    <input
                      type="text"
                      value={field.href || ''}
                      onChange={(e) => updateEditable(field.fieldId, field.value, { href: e.target.value })}
                      placeholder="https://example.com または #section"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              リンクフィールドがありません
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
