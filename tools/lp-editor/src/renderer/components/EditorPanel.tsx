/**
 * Editor Panel Component
 *
 * The main editing interface for modifying LP content.
 */

import React from 'react'
import { useEditorStore } from '../stores/editor-store'

export function EditorPanel() {
  const {
    editables,
    colors,
    repeatBlocks,
    selectedField,
    activeGroup,
    updateEditable,
    updateColor,
    updateRepeatItemField,
    addRepeatItem,
    removeRepeatItem,
    selectField,
    setActiveGroup,
  } = useEditorStore()

  // Group editables by group and sort by order
  const groups = React.useMemo(() => {
    const grouped: Record<string, typeof editables> = {}

    // Sort by order first
    const sortedEntries = Object.entries(editables).sort(
      ([, a], [, b]) => a.order - b.order
    )

    for (const [id, field] of sortedEntries) {
      const groupName = field.group || 'その他'
      if (!grouped[groupName]) {
        grouped[groupName] = {}
      }
      grouped[groupName][id] = field
    }

    return grouped
  }, [editables])

  const groupNames = Object.keys(groups)

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">編集パネル</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeGroup === null
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup(null)}
        >
          コンテンツ
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeGroup === 'colors'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup('colors')}
        >
          カラー
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeGroup === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup('settings')}
        >
          設定
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeGroup === 'colors' ? (
          <ColorEditor colors={colors} updateColor={updateColor} />
        ) : activeGroup === 'settings' ? (
          <SettingsEditor editables={editables} updateEditable={updateEditable} />
        ) : (
          <ContentEditor
            groups={groups}
            groupNames={groupNames}
            repeatBlocks={repeatBlocks}
            selectedField={selectedField}
            updateEditable={updateEditable}
            updateRepeatItemField={updateRepeatItemField}
            addRepeatItem={addRepeatItem}
            removeRepeatItem={removeRepeatItem}
            selectField={selectField}
          />
        )}
      </div>
    </div>
  )
}

// Repeat Block types
interface RepeatItemField {
  id: string
  type: 'text' | 'richtext' | 'image' | 'link' | 'background-image'
  label?: string
  value: string | null
  href?: string
  src?: string
}

interface RepeatItem {
  index: number
  fields: Record<string, RepeatItemField>
}

interface RepeatBlock {
  id: string
  min: number
  max: number
  items: RepeatItem[]
  templateHtml: string
}

// Content Editor
interface ContentEditorProps {
  groups: Record<string, Record<string, {
    id: string
    type: string
    value: string | null
    label?: string
    href?: string
    src?: string
    order: number
  }>>
  groupNames: string[]
  repeatBlocks: Record<string, RepeatBlock>
  selectedField: string | null
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
  addRepeatItem: (blockId: string) => void
  removeRepeatItem: (blockId: string, itemIndex: number) => void
  selectField: (id: string | null) => void
}

function ContentEditor({
  groups,
  groupNames,
  repeatBlocks,
  selectedField,
  updateEditable,
  updateRepeatItemField,
  addRepeatItem,
  removeRepeatItem,
  selectField,
}: ContentEditorProps) {
  return (
    <div className="space-y-6">
      {groupNames.map((groupName) => (
        <div key={groupName}>
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            {groupName}
          </h3>
          <div className="space-y-4">
            {Object.entries(groups[groupName]).map(([id, field]) => (
              <FieldEditor
                key={id}
                id={id}
                field={field}
                isSelected={selectedField === id}
                updateEditable={updateEditable}
                selectField={selectField}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Repeat Blocks */}
      {Object.entries(repeatBlocks).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            リピートブロック
          </h3>
          <div className="space-y-4">
            {Object.entries(repeatBlocks).map(([blockId, block]) => (
              <RepeatBlockEditor
                key={blockId}
                block={block}
                updateRepeatItemField={updateRepeatItemField}
                addRepeatItem={addRepeatItem}
                removeRepeatItem={removeRepeatItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Field Editor
interface FieldEditorProps {
  id: string
  field: {
    type: string
    value: string | null
    label?: string
    href?: string
    src?: string
  }
  isSelected: boolean
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
  selectField: (id: string | null) => void
}

function FieldEditor({
  id,
  field,
  isSelected,
  updateEditable,
  selectField,
}: FieldEditorProps) {
  const handleFocus = () => selectField(id)
  const handleBlur = () => selectField(null)

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label || id}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          value={field.value || ''}
          onChange={(e) => updateEditable(id, e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      {field.type === 'richtext' && (
        <textarea
          value={field.value || ''}
          onChange={(e) => updateEditable(id, e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      {field.type === 'link' && (
        <div className="space-y-2">
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => updateEditable(id, e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="リンクテキスト"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="url"
            value={field.href || ''}
            onChange={(e) => updateEditable(id, field.value, { href: e.target.value })}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {field.type === 'image' && (
        <ImageField id={id} field={field} updateEditable={updateEditable} />
      )}
    </div>
  )
}

// Image Field
interface ImageFieldProps {
  id: string
  field: { src?: string }
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
}

function ImageField({ id, field, updateEditable }: ImageFieldProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSelectImage = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const filePath = await window.electronAPI.selectImage()
      if (filePath) {
        const fileName = `${id}-${Date.now()}.${filePath.split('.').pop()}`
        const relativePath = await window.electronAPI.copyImage(filePath, fileName)
        updateEditable(id, null, { src: relativePath })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像の選択に失敗しました'
      setError(message)
      console.error('Failed to select image:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {field.src && (
        <img
          src={`../../src/${field.src}`}
          alt=""
          className="max-w-full h-32 object-contain bg-gray-100 rounded"
        />
      )}
      <button
        onClick={handleSelectImage}
        disabled={isLoading}
        className={`w-full px-4 py-2 rounded-md transition-colors ${
          isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        {isLoading ? '処理中...' : '画像を選択'}
      </button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
    </div>
  )
}

// Color Editor
interface ColorEditorProps {
  colors: Record<string, { variable: string; value: string; label?: string; description?: string }>
  updateColor: (variable: string, value: string) => void
}

function ColorEditor({ colors, updateColor }: ColorEditorProps) {
  return (
    <div className="space-y-4">
      {Object.entries(colors).map(([key, color]) => (
        <div key={key} className="p-3 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {color.label || color.variable}
          </label>
          {color.description && (
            <p className="text-xs text-gray-500 mb-2">{color.description}</p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color.value}
              onChange={(e) => updateColor(key, e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={color.value}
              onChange={(e) => updateColor(key, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Settings Editor - URL一覧編集
interface SettingsEditorProps {
  editables: Record<string, {
    id: string
    type: string
    value: string | null
    label?: string
    href?: string
    group?: string
  }>
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
}

function SettingsEditor({ editables, updateEditable }: SettingsEditorProps) {
  // Get all link type fields
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
      {/* URL Settings */}
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

// Repeat Block Editor
interface RepeatBlockEditorProps {
  block: RepeatBlock
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
  addRepeatItem: (blockId: string) => void
  removeRepeatItem: (blockId: string, itemIndex: number) => void
}

function RepeatBlockEditor({
  block,
  updateRepeatItemField,
  addRepeatItem,
  removeRepeatItem,
}: RepeatBlockEditorProps) {
  const canAdd = block.items.length < block.max
  const canRemove = block.items.length > block.min

  // Get field names from first item for display
  const fieldLabels = React.useMemo(() => {
    if (block.items.length === 0) return {}
    const firstItem = block.items[0]
    return Object.fromEntries(
      Object.entries(firstItem.fields).map(([key, field]) => [key, field.label || key])
    )
  }, [block.items])

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
        <span className="font-medium text-gray-700">{block.id}</span>
        <span className="text-sm text-gray-500">
          {block.items.length} / {block.max} アイテム
        </span>
      </div>

      <div className="divide-y divide-gray-200">
        {block.items.map((item, itemIndex) => (
          <div key={itemIndex} className="p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                アイテム {itemIndex + 1}
              </span>
              {canRemove && (
                <button
                  onClick={() => removeRepeatItem(block.id, itemIndex)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              )}
            </div>

            <div className="space-y-3">
              {Object.entries(item.fields).map(([fieldKey, field]) => (
                <RepeatItemFieldEditor
                  key={fieldKey}
                  blockId={block.id}
                  itemIndex={itemIndex}
                  fieldKey={fieldKey}
                  field={field}
                  label={fieldLabels[fieldKey]}
                  updateRepeatItemField={updateRepeatItemField}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {canAdd && (
        <div className="p-3 bg-gray-50 border-t border-gray-300">
          <button
            onClick={() => addRepeatItem(block.id)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + アイテムを追加
          </button>
        </div>
      )}
    </div>
  )
}

// Repeat Item Field Editor
interface RepeatItemFieldEditorProps {
  blockId: string
  itemIndex: number
  fieldKey: string
  field: RepeatItemField
  label?: string
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
}

function RepeatItemFieldEditor({
  blockId,
  itemIndex,
  fieldKey,
  field,
  label,
  updateRepeatItemField,
}: RepeatItemFieldEditorProps) {
  const handleChange = (value: string | null, extra?: Record<string, unknown>) => {
    updateRepeatItemField(blockId, itemIndex, fieldKey, value, extra)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label || fieldKey}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          value={field.value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      )}

      {field.type === 'richtext' && (
        <textarea
          value={field.value || ''}
          onChange={(e) => handleChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      )}

      {field.type === 'link' && (
        <div className="space-y-1">
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="リンクテキスト"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <input
            type="url"
            value={field.href || ''}
            onChange={(e) => handleChange(field.value, { href: e.target.value })}
            placeholder="URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      )}
    </div>
  )
}
