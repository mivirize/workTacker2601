/**
 * Editor Panel Component
 *
 * The main editing interface for modifying LP content.
 */

import React from 'react'
import { useEditorStore } from '../stores/editor-store'
import { validateContent, type ValidationResult, type ValidationIssue } from '../services/validation-service'
import { analyzeDesign, type DesignAnalysis } from '../services/design-service'
import { QualityScore, AnimationPresets, DesignChecker } from './design'

export function EditorPanel() {
  const {
    editables,
    colors,
    repeatBlocks,
    selectedField,
    activeGroup,
    originalHtml,
    basePath,
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

  // Validation result
  const validationResult = React.useMemo(() => {
    if (!originalHtml) return null
    return validateContent(originalHtml, editables, repeatBlocks)
  }, [originalHtml, editables, repeatBlocks])

  const validationBadge = validationResult ? (
    validationResult.summary.errors > 0 ? (
      <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
        {validationResult.summary.errors}
      </span>
    ) : validationResult.summary.warnings > 0 ? (
      <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
        {validationResult.summary.warnings}
      </span>
    ) : null
  ) : null

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">編集パネル</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeGroup === null
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup(null)}
        >
          コンテンツ
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeGroup === 'colors'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup('colors')}
        >
          カラー
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeGroup === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup('settings')}
        >
          設定
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center ${
            activeGroup === 'check'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup('check')}
        >
          チェック
          {validationBadge}
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeGroup === 'design'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveGroup('design')}
        >
          デザイン
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeGroup === 'colors' ? (
          <ColorEditor colors={colors} updateColor={updateColor} />
        ) : activeGroup === 'settings' ? (
          <SettingsEditor editables={editables} updateEditable={updateEditable} />
        ) : activeGroup === 'check' ? (
          <CheckEditor validationResult={validationResult} selectField={selectField} />
        ) : activeGroup === 'design' ? (
          <DesignEditor originalHtml={originalHtml} />
        ) : (
          <ContentEditor
            groups={groups}
            groupNames={groupNames}
            repeatBlocks={repeatBlocks}
            selectedField={selectedField}
            basePath={basePath}
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
  type: 'text' | 'richtext' | 'image' | 'link' | 'background-image' | 'number' | 'icon' | 'counter'
  label?: string
  value: string | null
  href?: string
  src?: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  dataCount?: string
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
    min?: number
    max?: number
    step?: number
    suffix?: string
    iconSet?: string
  }>>
  groupNames: string[]
  repeatBlocks: Record<string, RepeatBlock>
  selectedField: string | null
  basePath: string
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
  basePath,
  updateEditable,
  updateRepeatItemField,
  addRepeatItem,
  removeRepeatItem,
  selectField,
}: ContentEditorProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {groupNames.map((groupName) => {
        const isCollapsed = collapsedGroups.has(groupName)
        const fieldCount = Object.keys(groups[groupName]).length

        return (
          <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Group Header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-gray-100 hover:to-gray-50 transition-colors"
              onClick={() => toggleGroup(groupName)}
            >
              <div className="flex items-center gap-3">
                <span className={`transform transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  {groupName}
                </h3>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {fieldCount} 項目
              </span>
            </div>

            {/* Group Content */}
            {!isCollapsed && (
              <div className="p-4 space-y-3 bg-gray-50/50">
                {Object.entries(groups[groupName]).map(([id, field]) => (
                  <FieldEditor
                    key={id}
                    id={id}
                    field={field}
                    isSelected={selectedField === id}
                    basePath={basePath}
                    updateEditable={updateEditable}
                    selectField={selectField}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Repeat Blocks */}
      {Object.entries(repeatBlocks).length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-lg text-xs font-bold">
                ↻
              </span>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                リピートブロック
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4 bg-gray-50/50">
            {Object.entries(repeatBlocks).map(([blockId, block]) => (
              <RepeatBlockEditor
                key={blockId}
                block={block}
                basePath={basePath}
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
    min?: number
    max?: number
    step?: number
    suffix?: string
    iconSet?: string
  }
  isSelected: boolean
  basePath: string
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
  selectField: (id: string | null) => void
}

function FieldEditor({
  id,
  field,
  isSelected,
  basePath,
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
        <ImageField id={id} field={field} basePath={basePath} updateEditable={updateEditable} />
      )}

      {field.type === 'number' && (
        <NumberField
          id={id}
          field={field}
          updateEditable={updateEditable}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}

      {field.type === 'icon' && (
        <IconField id={id} field={field} updateEditable={updateEditable} />
      )}

      {field.type === 'counter' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={field.value || ''}
              onChange={(e) => updateEditable(id, e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">カウンター</span>
          </div>
          <p className="text-xs text-gray-400">
            この値はページ表示時にカウントアップアニメーションで表示されます
          </p>
        </div>
      )}
    </div>
  )
}

// Number Field
interface NumberFieldProps {
  id: string
  field: { value: string | null; min?: number; max?: number; step?: number; suffix?: string }
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
  onFocus: () => void
  onBlur: () => void
}

function NumberField({ id, field, updateEditable, onFocus, onBlur }: NumberFieldProps) {
  const numValue = parseFloat(field.value || '0')
  const min = field.min ?? 0
  const max = field.max ?? 999999
  const step = field.step ?? 1

  const handleChange = (newValue: number) => {
    const clampedValue = Math.min(max, Math.max(min, newValue))
    updateEditable(id, String(clampedValue))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={field.value || ''}
          onChange={(e) => updateEditable(id, e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {field.suffix && (
          <span className="text-gray-500 text-sm">{field.suffix}</span>
        )}
      </div>
      <input
        type="range"
        value={numValue}
        onChange={(e) => handleChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// Icon Field
interface IconFieldProps {
  id: string
  field: { value: string | null; iconSet?: string }
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
}

// Predefined SVG icons
const ICON_LIBRARY = [
  { name: 'sync', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' },
  { name: 'lock', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' },
  { name: 'bolt', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
  { name: 'link', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>' },
  { name: 'dashboard', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>' },
  { name: 'people', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>' },
  { name: 'star', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' },
  { name: 'clock', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>' },
  { name: 'money', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>' },
  { name: 'chart', svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>' },
]

function IconField({ id, field, updateEditable }: IconFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelectIcon = (svg: string) => {
    updateEditable(id, svg)
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      {/* Current icon preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
          dangerouslySetInnerHTML={{ __html: field.value || '' }}
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm"
        >
          アイコンを変更
        </button>
      </div>

      {/* Icon picker */}
      {isOpen && (
        <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {ICON_LIBRARY.map((icon) => (
            <button
              key={icon.name}
              onClick={() => handleSelectIcon(icon.svg)}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-100 rounded border border-gray-200 hover:border-blue-500 transition-colors"
              title={icon.name}
              dangerouslySetInnerHTML={{ __html: icon.svg }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Image Field
interface ImageFieldProps {
  id: string
  field: { src?: string }
  basePath: string
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
}

// File size threshold for warning (5MB)
const FILE_SIZE_WARNING_THRESHOLD = 5 * 1024 * 1024

function ImageField({ id, field, basePath, updateEditable }: ImageFieldProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [warning, setWarning] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [showOptimize, setShowOptimize] = React.useState(false)
  const [pendingFilePath, setPendingFilePath] = React.useState<string | null>(null)
  const [imageInfo, setImageInfo] = React.useState<{
    size: number
    width?: number
    height?: number
    format?: string
  } | null>(null)

  // Optimization options
  const [optimizeOptions, setOptimizeOptions] = React.useState({
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'webp' as 'jpeg' | 'png' | 'webp'
  })

  const processImage = async (filePath: string, shouldOptimize: boolean = false) => {
    setError(null)
    setWarning(null)
    setIsLoading(true)
    try {
      if (shouldOptimize) {
        // Optimize and save
        const relativePath = await window.electronAPI.optimizeImage(filePath, optimizeOptions)
        updateEditable(id, null, { src: relativePath })
        setShowOptimize(false)
        setPendingFilePath(null)
        setImageInfo(null)
      } else {
        // Just copy the image
        const fileName = `${id}-${Date.now()}.${filePath.split('.').pop()}`
        const relativePath = await window.electronAPI.copyImage(filePath, fileName)
        updateEditable(id, null, { src: relativePath })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像の処理に失敗しました'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAndProcessImage = async (filePath: string) => {
    setError(null)
    setWarning(null)
    setIsLoading(true)

    try {
      // Get image info
      const info = await window.electronAPI.getImageInfo(filePath)
      setImageInfo(info)

      // Check file size
      if (info.size > FILE_SIZE_WARNING_THRESHOLD) {
        const sizeMB = (info.size / (1024 * 1024)).toFixed(2)
        setWarning(`ファイルサイズが大きいです (${sizeMB}MB)。最適化をおすすめします。`)
        setPendingFilePath(filePath)
        setShowOptimize(true)
        setIsLoading(false)
        return
      }

      // Process without optimization
      await processImage(filePath, false)
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像情報の取得に失敗しました'
      setError(message)
      setIsLoading(false)
    }
  }

  const handleSelectImage = async () => {
    const filePath = await window.electronAPI.selectImage()
    if (filePath) {
      await checkAndProcessImage(filePath)
    }
  }

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルをドロップしてください')
        return
      }
      // Get the file path
      const filePath = (file as File & { path?: string }).path
      if (filePath) {
        await checkAndProcessImage(filePath)
      } else {
        setError('ファイルパスを取得できませんでした')
      }
    }
  }

  const handleOptimize = async () => {
    if (pendingFilePath) {
      await processImage(pendingFilePath, true)
    }
  }

  const handleSkipOptimize = async () => {
    if (pendingFilePath) {
      await processImage(pendingFilePath, false)
    }
  }

  const handleCancelOptimize = () => {
    setShowOptimize(false)
    setPendingFilePath(null)
    setImageInfo(null)
    setWarning(null)
  }

  return (
    <div className="space-y-2">
      {/* Current image preview */}
      {field.src && !showOptimize && (
        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={`${basePath}${field.src}`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Optimization panel */}
      {showOptimize && imageInfo && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-lg">!</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">{warning}</p>
              <p className="text-xs text-yellow-600 mt-1">
                サイズ: {imageInfo.width}x{imageInfo.height} / 形式: {imageInfo.format?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Optimization options */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">最大幅</label>
                <input
                  type="number"
                  value={optimizeOptions.maxWidth}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    maxWidth: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">最大高さ</label>
                <input
                  type="number"
                  value={optimizeOptions.maxHeight}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    maxHeight: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">品質 ({optimizeOptions.quality}%)</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={optimizeOptions.quality}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    quality: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">形式</label>
                <select
                  value={optimizeOptions.format}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    format: e.target.value as 'jpeg' | 'png' | 'webp'
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="webp">WebP (推奨)</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleOptimize}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400"
            >
              {isLoading ? '処理中...' : '最適化して使用'}
            </button>
            <button
              onClick={handleSkipOptimize}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:bg-gray-100"
            >
              そのまま使用
            </button>
          </div>
          <button
            onClick={handleCancelOptimize}
            className="w-full px-3 py-1 text-gray-500 hover:text-gray-700 text-xs"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* Drop zone and select button */}
      {!showOptimize && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isLoading ? (
            <div className="py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">処理中...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">
                画像をドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-400 mb-3">または</p>
              <button
                onClick={handleSelectImage}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm"
              >
                画像を選択
              </button>
            </>
          )}
        </div>
      )}

      {/* Error message */}
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

// Repeat Block Editor with Accordion
interface RepeatBlockEditorProps {
  block: RepeatBlock
  basePath: string
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
  addRepeatItem: (blockId: string) => void
  removeRepeatItem: (blockId: string, itemIndex: number) => void
}

function RepeatBlockEditor({
  block,
  basePath,
  updateRepeatItemField,
  addRepeatItem,
  removeRepeatItem,
}: RepeatBlockEditorProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set([0]))
  const canAdd = block.items.length < block.max
  const canRemove = block.items.length > block.min

  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Get field names from first item for display
  const fieldLabels = React.useMemo(() => {
    if (block.items.length === 0) return {}
    const firstItem = block.items[0]
    return Object.fromEntries(
      Object.entries(firstItem.fields).map(([key, field]) => [key, field.label || key])
    )
  }, [block.items])

  // Get thumbnail image from item
  const getItemThumbnail = (item: RepeatItem): string | null => {
    for (const field of Object.values(item.fields)) {
      if (field.type === 'image' && field.src) {
        return field.src
      }
    }
    return null
  }

  // Get item preview text (first text field)
  const getItemPreview = (item: RepeatItem): string => {
    for (const field of Object.values(item.fields)) {
      if ((field.type === 'text' || field.type === 'richtext') && field.value) {
        return field.value.slice(0, 30) + (field.value.length > 30 ? '...' : '')
      }
    }
    return ''
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
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

          return (
            <div key={itemIndex} className="bg-white">
              {/* Item Header (Accordion trigger) */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isExpanded ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => toggleItem(itemIndex)}
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
                        removeRepeatItem(block.id, itemIndex)
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Item Content (Accordion content) */}
              {isExpanded && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-4">
                    {Object.entries(item.fields).map(([fieldKey, field]) => (
                      <RepeatItemFieldEditor
                        key={fieldKey}
                        blockId={block.id}
                        itemIndex={itemIndex}
                        fieldKey={fieldKey}
                        field={field}
                        label={fieldLabels[fieldKey]}
                        basePath={basePath}
                        updateRepeatItemField={updateRepeatItemField}
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
              // Expand the new item
              setExpandedItems(prev => new Set([...prev, block.items.length]))
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

// Repeat Item Field Editor
interface RepeatItemFieldEditorProps {
  blockId: string
  itemIndex: number
  fieldKey: string
  field: RepeatItemField
  label?: string
  basePath: string
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
}

function RepeatItemFieldEditor({
  blockId,
  itemIndex,
  fieldKey,
  field,
  label,
  basePath,
  updateRepeatItemField,
}: RepeatItemFieldEditorProps) {
  const [isIconPickerOpen, setIsIconPickerOpen] = React.useState(false)

  const handleChange = (value: string | null, extra?: Record<string, unknown>) => {
    updateRepeatItemField(blockId, itemIndex, fieldKey, value, extra)
  }

  // Field type indicator
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼'
      case 'link': return '🔗'
      case 'number': return '#'
      case 'counter': return '⏱'
      case 'icon': return '◆'
      case 'richtext': return '¶'
      default: return 'T'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Label with type indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 flex items-center justify-center text-xs bg-gray-100 rounded text-gray-500">
          {getFieldTypeIcon(field.type)}
        </span>
        <label className="text-sm font-medium text-gray-700">
          {label || fieldKey}
        </label>
      </div>

      {field.type === 'text' && (
        <input
          type="text"
          value={field.value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
        />
      )}

      {field.type === 'richtext' && (
        <textarea
          value={field.value || ''}
          onChange={(e) => handleChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
        />
      )}

      {field.type === 'link' && (
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">テキスト</span>
            <input
              type="text"
              value={field.value || ''}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">URL</span>
            <input
              type="url"
              value={field.href || ''}
              onChange={(e) => handleChange(field.value, { href: e.target.value })}
              className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>
      )}

      {field.type === 'number' && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={field.value || ''}
            onChange={(e) => handleChange(e.target.value)}
            min={field.min ?? 0}
            max={field.max ?? 999999}
            step={field.step ?? 1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
          />
          {field.suffix && (
            <span className="text-gray-500 text-sm font-medium">{field.suffix}</span>
          )}
        </div>
      )}

      {field.type === 'counter' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={field.value || ''}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
            />
            <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">カウンター</span>
          </div>
          <p className="text-xs text-gray-400">カウントアップアニメーション用</p>
        </div>
      )}

      {field.type === 'icon' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300"
              dangerouslySetInnerHTML={{ __html: field.value || '' }}
            />
            <button
              onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              アイコンを変更
            </button>
          </div>
          {isIconPickerOpen && (
            <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {ICON_LIBRARY.map((icon) => (
                <button
                  key={icon.name}
                  onClick={() => {
                    handleChange(icon.svg)
                    setIsIconPickerOpen(false)
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-100 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                  title={icon.name}
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {field.type === 'image' && (
        <RepeatImageField
          blockId={blockId}
          itemIndex={itemIndex}
          fieldKey={fieldKey}
          field={field}
          basePath={basePath}
          updateRepeatItemField={updateRepeatItemField}
        />
      )}
    </div>
  )
}

// Repeat Image Field - for images inside repeat blocks
interface RepeatImageFieldProps {
  blockId: string
  itemIndex: number
  fieldKey: string
  field: RepeatItemField
  basePath: string
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
}

function RepeatImageField({
  blockId,
  itemIndex,
  fieldKey,
  field,
  basePath,
  updateRepeatItemField,
}: RepeatImageFieldProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)

  const handleChange = (value: string | null, extra?: Record<string, unknown>) => {
    updateRepeatItemField(blockId, itemIndex, fieldKey, value, extra)
  }

  const processImage = async (filePath: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const fileName = `${blockId}-${itemIndex}-${fieldKey}-${Date.now()}.${filePath.split('.').pop()}`
      const relativePath = await window.electronAPI.copyImage(filePath, fileName)
      handleChange(null, { src: relativePath })
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像の処理に失敗しました'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectImage = async () => {
    const filePath = await window.electronAPI.selectImage()
    if (filePath) {
      await processImage(filePath)
    }
  }

  const handleClearImage = () => {
    handleChange(null, { src: '' })
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルをドロップしてください')
        return
      }
      const filePath = (file as File & { path?: string }).path
      if (filePath) {
        await processImage(filePath)
      } else {
        setError('ファイルパスを取得できませんでした')
      }
    }
  }

  // Compact view with image on the left
  return (
    <div className="flex gap-3 items-start">
      {/* Image Preview / Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
          isDragOver
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : 'ring-1 ring-gray-300'
        } ${field.src ? '' : 'bg-gray-100'}`}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : field.src ? (
          <>
            <img
              src={`${basePath}${field.src}`}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                onClick={handleSelectImage}
                className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="変更"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleClearImage}
                className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors"
                title="削除"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={handleSelectImage}
          >
            <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500">画像を追加</span>
          </div>
        )}
      </div>

      {/* Instructions / Error */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-2">
          クリックまたはドラッグ&ドロップで画像を設定
        </p>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
      </div>
    </div>
  )
}

// Check Editor - Validation results display
interface CheckEditorProps {
  validationResult: ValidationResult | null
  selectField: (id: string | null) => void
}

function CheckEditor({ validationResult, selectField }: CheckEditorProps) {
  if (!validationResult) {
    return (
      <div className="text-center py-8 text-gray-500">
        コンテンツを読み込み中...
      </div>
    )
  }

  const { issues, summary, isValid } = validationResult

  // Group issues by category
  const issuesByCategory = React.useMemo(() => {
    const grouped: Record<string, ValidationIssue[]> = {}
    for (const issue of issues) {
      if (!grouped[issue.category]) {
        grouped[issue.category] = []
      }
      grouped[issue.category].push(issue)
    }
    return grouped
  }, [issues])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '!'
      case 'warning': return '!'
      case 'info': return 'i'
      default: return '?'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className={`p-4 rounded-lg border ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? '✓' : '!'}
          </span>
          <div>
            <h3 className={`font-medium ${isValid ? 'text-green-800' : 'text-red-800'}`}>
              {isValid ? 'すべてのチェックをパスしました' : 'チェック項目があります'}
            </h3>
            <p className="text-sm text-gray-600">
              エラー: {summary.errors} / 警告: {summary.warnings} / 情報: {summary.info}
            </p>
          </div>
        </div>
      </div>

      {/* Issues by category */}
      {Object.entries(issuesByCategory).map(([category, categoryIssues]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryIssues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)} cursor-pointer hover:opacity-80`}
                onClick={() => issue.field && selectField(issue.field)}
              >
                <div className="flex items-start gap-2">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                    issue.severity === 'error' ? 'bg-red-500 text-white' :
                    issue.severity === 'warning' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {getSeverityIcon(issue.severity)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs mt-1 opacity-75">{issue.suggestion}</p>
                    )}
                    {issue.field && (
                      <p className="text-xs mt-1 opacity-50">フィールド: {issue.field}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {issues.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          チェック項目はありません
        </div>
      )}
    </div>
  )
}

// Design Editor - Design quality analysis and animation presets
interface DesignEditorProps {
  originalHtml: string
}

function DesignEditor({ originalHtml }: DesignEditorProps) {
  const [analysis, setAnalysis] = React.useState<DesignAnalysis | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedPresets, setSelectedPresets] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState<'score' | 'checker' | 'presets'>('score')

  // Run analysis
  const runAnalysis = React.useCallback(() => {
    if (!originalHtml) return

    setIsLoading(true)
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const result = analyzeDesign(originalHtml)
      setAnalysis(result)
      setIsLoading(false)
    }, 100)
  }, [originalHtml])

  // Auto-analyze on mount
  React.useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  const handleTogglePreset = (presetId: string) => {
    setSelectedPresets((prev) =>
      prev.includes(presetId)
        ? prev.filter((id) => id !== presetId)
        : [...prev, presetId]
    )
  }

  const handleApplyPresets = (css: string, js: string) => {
    // TODO: Inject CSS and JS into HTML
    console.log('Applying presets:', { css, js })
    alert('アニメーションコードがコンソールに出力されました。\n今後、HTML編集機能で直接挿入できるようになります。')
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-2 py-2 text-xs font-medium ${
            activeTab === 'score'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('score')}
        >
          スコア
        </button>
        <button
          className={`flex-1 px-2 py-2 text-xs font-medium ${
            activeTab === 'checker'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('checker')}
        >
          詳細チェック
        </button>
        <button
          className={`flex-1 px-2 py-2 text-xs font-medium ${
            activeTab === 'presets'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('presets')}
        >
          プリセット
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'score' && (
        <QualityScore analysis={analysis} isLoading={isLoading} />
      )}

      {activeTab === 'checker' && (
        <DesignChecker
          analysis={analysis}
          isLoading={isLoading}
          onRefresh={runAnalysis}
        />
      )}

      {activeTab === 'presets' && (
        <AnimationPresets
          selectedPresets={selectedPresets}
          onTogglePreset={handleTogglePreset}
          onApply={handleApplyPresets}
        />
      )}
    </div>
  )
}
