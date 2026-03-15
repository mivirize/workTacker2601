/**
 * FieldEditor Component
 *
 * Unified field editor for both standard editables and repeat block fields.
 * Renders the appropriate input based on field type.
 */

import React from 'react'
import { ICON_LIBRARY } from './types'
import { ImageField } from './ImageField'

interface FieldEditorProps {
  /** Unique field identifier */
  id: string
  /** Field type */
  type: string
  /** Current value */
  value: string | null
  /** Field label */
  label?: string
  /** Link href (for link type) */
  href?: string
  /** Image src (for image type) */
  src?: string
  /** Number field min */
  min?: number
  /** Number field max */
  max?: number
  /** Number field step */
  step?: number
  /** Number field suffix */
  suffix?: string
  /** Whether this field is selected in the preview */
  isSelected?: boolean
  /** Base path for image URLs */
  basePath: string
  /** Enable image optimization dialog */
  enableImageOptimization?: boolean
  /** Show compact layout (for repeat blocks) */
  compact?: boolean
  /** Show field type indicator */
  showTypeIndicator?: boolean
  /** Called when field value changes */
  onChange: (value: string | null, extra?: Record<string, unknown>) => void
  /** Called when field is focused */
  onFocus?: () => void
  /** Called when field is blurred */
  onBlur?: () => void
}

// Field type icon for compact indicator
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

export function FieldEditor({
  id,
  type,
  value,
  label,
  href,
  src,
  min,
  max,
  step,
  suffix,
  isSelected = false,
  basePath,
  enableImageOptimization = true,
  compact = false,
  showTypeIndicator = false,
  onChange,
  onFocus,
  onBlur,
}: FieldEditorProps) {
  const [isIconPickerOpen, setIsIconPickerOpen] = React.useState(false)

  const handleFocus = () => onFocus?.()
  const handleBlur = () => onBlur?.()

  const containerClass = compact
    ? 'bg-white rounded-lg border border-gray-200 p-3'
    : `p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`

  const inputClass = compact
    ? 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors'
    : 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className={containerClass}>
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        {showTypeIndicator && (
          <span className="w-5 h-5 flex items-center justify-center text-xs bg-gray-100 rounded text-gray-500">
            {getFieldTypeIcon(type)}
          </span>
        )}
        <label className="text-sm font-medium text-gray-700">
          {label || id}
        </label>
      </div>

      {/* Text */}
      {type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={inputClass}
        />
      )}

      {/* Rich Text */}
      {type === 'richtext' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={compact ? 3 : 4}
          className={`${inputClass} ${compact ? 'resize-none' : ''}`}
        />
      )}

      {/* Link */}
      {type === 'link' && (
        <div className="space-y-2">
          {compact ? (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">テキスト</span>
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">URL</span>
                <input
                  type="url"
                  value={href || ''}
                  onChange={(e) => onChange(value, { href: e.target.value })}
                  className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="リンクテキスト"
                className={inputClass}
              />
              <input
                type="url"
                value={href || ''}
                onChange={(e) => onChange(value, { href: e.target.value })}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="URL"
                className={inputClass}
              />
            </>
          )}
        </div>
      )}

      {/* Image */}
      {type === 'image' && (
        <ImageField
          src={src}
          basePath={basePath}
          enableOptimization={enableImageOptimization}
          compact={compact}
          onImageChange={(newSrc) => onChange(null, { src: newSrc })}
        />
      )}

      {/* Number */}
      {type === 'number' && (
        <NumberInput
          value={value}
          min={min}
          max={max}
          step={step}
          suffix={suffix}
          compact={compact}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}

      {/* Counter */}
      {type === 'counter' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`flex-1 ${inputClass}`}
            />
            <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">カウンター</span>
          </div>
          <p className="text-xs text-gray-400">
            {compact ? 'カウントアップアニメーション用' : 'この値はページ表示時にカウントアップアニメーションで表示されます'}
          </p>
        </div>
      )}

      {/* Icon */}
      {type === 'icon' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300`}
              dangerouslySetInnerHTML={{ __html: value || '' }}
            />
            <button
              onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
              className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 ${compact ? 'rounded-lg' : 'rounded-md'} transition-colors text-sm`}
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
                    onChange(icon.svg)
                    setIsIconPickerOpen(false)
                  }}
                  className={`w-10 h-10 flex items-center justify-center bg-white hover:bg-blue-100 rounded${compact ? '-lg' : ''} border border-gray-200 hover:border-blue-500 transition-colors`}
                  title={icon.name}
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Number input with range slider
interface NumberInputProps {
  value: string | null
  min?: number
  max?: number
  step?: number
  suffix?: string
  compact?: boolean
  onChange: (value: string | null) => void
  onFocus: () => void
  onBlur: () => void
}

function NumberInput({ value, min: minProp, max: maxProp, step: stepProp, suffix, compact, onChange, onFocus, onBlur }: NumberInputProps) {
  const numValue = parseFloat(value || '0')
  const min = minProp ?? 0
  const max = maxProp ?? 999999
  const step = stepProp ?? 1

  const handleRangeChange = (newValue: number) => {
    const clamped = Math.min(max, Math.max(min, newValue))
    onChange(String(clamped))
  }

  const inputClass = compact
    ? 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors'
    : 'flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          min={min}
          max={max}
          step={step}
          className={inputClass}
        />
        {suffix && (
          <span className="text-gray-500 text-sm font-medium">{suffix}</span>
        )}
      </div>
      {!compact && (
        <>
          <input
            type="range"
            value={numValue}
            onChange={(e) => handleRangeChange(parseFloat(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </>
      )}
    </div>
  )
}
