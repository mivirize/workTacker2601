/**
 * ColorTab Component
 *
 * Color picker for CSS custom properties.
 */

import type { ColorFieldData } from './types'

interface ColorTabProps {
  colors: Record<string, ColorFieldData>
  updateColor: (variable: string, value: string) => void
}

export function ColorTab({ colors, updateColor }: ColorTabProps) {
  const colorEntries = Object.entries(colors)

  if (colorEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">カラー変数が定義されていません</p>
        <p className="text-gray-400 text-xs mt-1">
          HTMLに CSS変数 を定義してください
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          カラー設定
        </h3>
        <span className="text-xs text-gray-400">
          {colorEntries.length} 色
        </span>
      </div>

      {colorEntries.map(([key, color]) => (
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
              className="w-10 h-10 rounded cursor-pointer border-0"
              aria-label={`${color.label || color.variable}のカラーピッカー`}
            />
            <input
              type="text"
              value={color.value}
              onChange={(e) => updateColor(key, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              aria-label={`${color.label || color.variable}のカラーコード`}
            />
            {/* Color preview swatch */}
            <div
              className="w-8 h-8 rounded-md border border-gray-200 flex-shrink-0"
              style={{ backgroundColor: color.value }}
              title={color.value}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
