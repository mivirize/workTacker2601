/**
 * RepeatBlockEditor Component
 *
 * Accordion-based editor for repeat block items.
 * Supports add/remove with confirmation, thumbnail preview, and drag-like reordering.
 */

import React from 'react'
import type { RepeatBlockData, RepeatItemData } from './types'
import { FieldEditor } from './FieldEditor'

interface RepeatBlockEditorProps {
  block: RepeatBlockData
  basePath: string
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
  addRepeatItem: (blockId: string) => void
  removeRepeatItem: (blockId: string, itemIndex: number) => void
}

export function RepeatBlockEditor({
  block,
  basePath,
  updateRepeatItemField,
  addRepeatItem,
  removeRepeatItem,
}: RepeatBlockEditorProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set([0]))
  const [confirmDelete, setConfirmDelete] = React.useState<number | null>(null)
  const canAdd = block.items.length < block.max
  const canRemove = block.items.length > block.min

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const fieldLabels = React.useMemo(() => {
    if (block.items.length === 0) return {}
    const firstItem = block.items[0]
    return Object.fromEntries(
      Object.entries(firstItem.fields).map(([key, field]) => [key, field.label || key])
    )
  }, [block.items])

  const getItemThumbnail = (item: RepeatItemData): string | null => {
    for (const field of Object.values(item.fields)) {
      if (field.type === 'image' && field.src) {
        return field.src
      }
    }
    return null
  }

  const getItemPreview = (item: RepeatItemData): string => {
    for (const field of Object.values(item.fields)) {
      if ((field.type === 'text' || field.type === 'richtext') && field.value) {
        return field.value.slice(0, 30) + (field.value.length > 30 ? '...' : '')
      }
    }
    return ''
  }

  const handleRemoveItem = (itemIndex: number) => {
    if (confirmDelete === itemIndex) {
      removeRepeatItem(block.id, itemIndex)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(itemIndex)
      // Auto-dismiss after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="font-semibold text-gray-800">{block.id}</span>
        </div>
        <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
          {block.items.length} / {block.max}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-200">
        {block.items.map((item, itemIndex) => {
          const isExpanded = expandedItems.has(itemIndex)
          const thumbnail = getItemThumbnail(item)
          const preview = getItemPreview(item)
          const isConfirmingDelete = confirmDelete === itemIndex

          return (
            <div key={itemIndex} className="bg-white">
              {/* Item Header */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isExpanded ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => toggleItem(itemIndex)}
                role="button"
                aria-expanded={isExpanded}
                aria-label={`アイテム ${itemIndex + 1}`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {thumbnail ? (
                    <img
                      src={`${basePath}${thumbnail}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      #{itemIndex + 1}
                    </span>
                    {preview && (
                      <span className="text-sm text-gray-500 truncate">
                        {preview}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {canRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveItem(itemIndex)
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        isConfirmingDelete
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'text-red-500 hover:bg-red-100'
                      }`}
                      title={isConfirmingDelete ? 'もう一度クリックで削除' : '削除'}
                    >
                      {isConfirmingDelete ? (
                        <span className="text-xs font-medium px-1">削除?</span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                  <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Item Content */}
              {isExpanded && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-4">
                    {Object.entries(item.fields).map(([fieldKey, field]) => (
                      <FieldEditor
                        key={fieldKey}
                        id={`${block.id}.${itemIndex}.${fieldKey}`}
                        type={field.type}
                        value={field.value}
                        label={fieldLabels[fieldKey]}
                        href={field.href}
                        src={field.src}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        suffix={field.suffix}
                        basePath={basePath}
                        enableImageOptimization={false}
                        compact
                        showTypeIndicator
                        onChange={(val, extra) =>
                          updateRepeatItemField(block.id, itemIndex, fieldKey, val, extra)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add button */}
      {canAdd && (
        <div className="p-4 bg-gray-50 border-t border-gray-300">
          <button
            onClick={() => {
              addRepeatItem(block.id)
              setExpandedItems((prev) => new Set([...prev, block.items.length]))
            }}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            アイテムを追加
          </button>
        </div>
      )}
    </div>
  )
}
