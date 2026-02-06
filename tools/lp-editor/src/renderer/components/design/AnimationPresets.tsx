/**
 * Animation Presets Component
 *
 * Displays animation presets and allows users to apply them to their LP.
 */

import { useState, useEffect, useMemo, CSSProperties } from 'react'
import {
  ANIMATION_PRESETS,
  generateAnimationCSS,
  generateAnimationJS,
  type AnimationPreset,
} from '../../services/design-service'

interface AnimationPresetsProps {
  selectedPresets: string[]
  onTogglePreset: (presetId: string) => void
  onApply: (css: string, js: string) => void
}

export function AnimationPresets({
  selectedPresets,
  onTogglePreset,
  onApply,
}: AnimationPresetsProps) {
  const [previewPreset, setPreviewPreset] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

  const generatedCSS = useMemo(
    () => generateAnimationCSS(selectedPresets),
    [selectedPresets]
  )

  const generatedJS = useMemo(
    () => generateAnimationJS(selectedPresets),
    [selectedPresets]
  )

  const handleApply = () => {
    onApply(generatedCSS, generatedJS)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          アニメーションプリセット
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {selectedPresets.length} 選択中
        </span>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-3">
        {ANIMATION_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPresets.includes(preset.id)}
            isPreview={previewPreset === preset.id}
            onToggle={() => onTogglePreset(preset.id)}
            onPreview={() => setPreviewPreset(previewPreset === preset.id ? null : preset.id)}
          />
        ))}
      </div>

      {/* Selected Presets Summary */}
      {selectedPresets.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              選択したプリセット
            </span>
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showCode ? 'コードを隠す' : 'コードを表示'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {selectedPresets.map((presetId) => {
              const preset = ANIMATION_PRESETS.find((p) => p.id === presetId)
              return preset ? (
                <span
                  key={presetId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {preset.name}
                  <button
                    onClick={() => onTogglePreset(presetId)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ) : null
            })}
          </div>

          {showCode && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">CSS</label>
                <pre className="p-2 bg-gray-800 text-green-400 text-xs rounded overflow-x-auto max-h-40">
                  {generatedCSS || '/* 選択なし */'}
                </pre>
              </div>
              {generatedJS && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">JavaScript</label>
                  <pre className="p-2 bg-gray-800 text-yellow-400 text-xs rounded overflow-x-auto max-h-40">
                    {generatedJS}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleApply}
            className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            HTMLに適用
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">使い方:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>使用したいプリセットを選択</li>
          <li>「HTMLに適用」でCSSとJSを追加</li>
          <li>HTML要素にクラス名を追加（例: <code className="bg-gray-200 px-1 rounded">animate-fade-up</code>）</li>
        </ol>
      </div>
    </div>
  )
}

interface PresetCardProps {
  preset: AnimationPreset
  isSelected: boolean
  isPreview: boolean
  onToggle: () => void
  onPreview: () => void
}

function PresetCard({
  preset,
  isSelected,
  isPreview,
  onToggle,
  onPreview,
}: PresetCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      {/* Preview Animation */}
      <div className="h-16 mb-2 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
        <PresetPreview preset={preset} isActive={isPreview || isSelected} />
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-gray-800 truncate">
            {preset.name}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2">
            {preset.description}
          </p>
        </div>
        {preset.jsRequired && (
          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded">
            JS
          </span>
        )}
      </div>

      {/* Class Name */}
      <div className="mt-2">
        <code className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
          .{preset.className}
        </code>
      </div>

      {/* Selection Indicator */}
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {isPreview ? '停止' : 'プレビュー'}
        </button>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isSelected
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

interface PresetPreviewProps {
  preset: AnimationPreset
  isActive: boolean
}

function PresetPreview({ preset, isActive }: PresetPreviewProps) {
  const [key, setKey] = useState(0)

  // Reset animation when becoming active
  useEffect(() => {
    if (isActive) {
      setKey((k) => k + 1)
    }
  }, [isActive])

  const getPreviewStyle = (): CSSProperties => {
    if (!isActive) {
      return {}
    }

    switch (preset.id) {
      case 'fade-in':
        return {
          animation: 'fadeIn 1s ease-out forwards',
        }
      case 'fade-up':
        return {
          animation: 'fadeUp 1s ease-out forwards',
        }
      case 'slide-left':
        return {
          animation: 'slideLeft 1s ease-out forwards',
        }
      case 'slide-right':
        return {
          animation: 'slideRight 1s ease-out forwards',
        }
      case 'scale-in':
        return {
          animation: 'scaleIn 0.8s ease-out forwards',
        }
      case 'reveal-image':
        return {
          animation: 'reveal 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards',
        }
      case 'glow-hover':
        return {
          animation: 'glow 1.5s ease-in-out infinite',
        }
      default:
        return {}
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideLeft {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideRight {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes reveal {
            from { clip-path: inset(0 100% 0 0); }
            to { clip-path: inset(0 0 0 0); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
            50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
          }
        `}
      </style>
      <div
        key={key}
        className="w-12 h-8 bg-blue-500 rounded"
        style={getPreviewStyle()}
      />
    </>
  )
}
