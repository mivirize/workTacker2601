/**
 * DesignTab Component
 *
 * Design quality analysis with sub-tabs for score, checker, and presets.
 */

import React from 'react'
import { analyzeDesign, type DesignAnalysis } from '../../services/design-service'
import { QualityScore, AnimationPresets, DesignChecker } from '../design'

interface DesignTabProps {
  originalHtml: string
}

export function DesignTab({ originalHtml }: DesignTabProps) {
  const [analysis, setAnalysis] = React.useState<DesignAnalysis | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedPresets, setSelectedPresets] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState<'score' | 'checker' | 'presets'>('score')

  const runAnalysis = React.useCallback(() => {
    if (!originalHtml) return

    setIsLoading(true)
    setTimeout(() => {
      const result = analyzeDesign(originalHtml)
      setAnalysis(result)
      setIsLoading(false)
    }, 100)
  }, [originalHtml])

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

  const handleApplyPresets = (_css: string, _js: string) => {
    // TODO: Inject CSS and JS into HTML
    alert('アニメーションコードがコンソールに出力されました。\n今後、HTML編集機能で直接挿入できるようになります。')
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'score' as const, label: 'スコア' },
          { key: 'checker' as const, label: '詳細チェック' },
          { key: 'presets' as const, label: 'プリセット' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
