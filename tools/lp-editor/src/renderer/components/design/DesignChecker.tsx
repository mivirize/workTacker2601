/**
 * Design Checker Component
 *
 * Displays design analysis results with issues and suggestions.
 */

import React from 'react'
import { type DesignAnalysis, type CategoryResult } from '../../services/design-service'

interface DesignCheckerProps {
  analysis: DesignAnalysis | null
  isLoading?: boolean
  onRefresh: () => void
}

export function DesignChecker({ analysis, isLoading, onRefresh }: DesignCheckerProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['animation', 'performance', 'accessibility'])
  )

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm text-gray-500">デザインを分析中...</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">分析データがありません</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          分析を開始
        </button>
      </div>
    )
  }

  const categories = [
    { key: 'animation', label: 'アニメーション', icon: '✨', result: analysis.categories.animation },
    { key: 'layout', label: 'レイアウト', icon: '📐', result: analysis.categories.layout },
    { key: 'typography', label: 'タイポグラフィ', icon: '🔤', result: analysis.categories.typography },
    { key: 'colorContrast', label: 'カラーコントラスト', icon: '🎨', result: analysis.categories.colorContrast },
    { key: 'performance', label: 'パフォーマンス', icon: '⚡', result: analysis.categories.performance },
    { key: 'accessibility', label: 'アクセシビリティ', icon: '♿', result: analysis.categories.accessibility },
  ]

  // Count total issues
  const totalIssues = categories.reduce(
    (acc, cat) => acc + cat.result.issues.length,
    0
  )
  const totalSuggestions = categories.reduce(
    (acc, cat) => acc + cat.result.suggestions.length,
    0
  )

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            デザインチェック
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalIssues} 件の問題 / {totalSuggestions} 件の提案
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="再分析"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Category Accordions */}
      <div className="space-y-2">
        {categories.map(({ key, label, icon, result }) => (
          <CategoryAccordion
            key={key}
            categoryKey={key}
            label={label}
            icon={icon}
            result={result}
            isExpanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
          />
        ))}
      </div>

      {/* Quick Tips */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-2">クイックヒント</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>スクロールアニメーションは<code className="bg-white px-1 rounded">animate-fade-up</code>クラスで追加できます</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>画像には必ず<code className="bg-white px-1 rounded">alt</code>属性を設定しましょう</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span><code className="bg-white px-1 rounded">loading=&quot;lazy&quot;</code>で画像の遅延読み込みを有効にできます</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

interface CategoryAccordionProps {
  categoryKey: string
  label: string
  icon: string
  result: CategoryResult
  isExpanded: boolean
  onToggle: () => void
}

function CategoryAccordion({
  label,
  icon,
  result,
  isExpanded,
  onToggle,
}: CategoryAccordionProps) {
  const statusConfig = {
    good: { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    error: { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
  }

  const config = statusConfig[result.status]
  const hasContent = result.issues.length > 0 || result.suggestions.length > 0

  return (
    <div className={`rounded-lg border ${config.border} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 ${config.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Score Badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
            {result.score}点
          </span>
          {/* Issue Count */}
          {hasContent && (
            <span className="text-xs text-gray-500">
              {result.issues.length + result.suggestions.length}件
            </span>
          )}
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && hasContent && (
        <div className="p-4 bg-white space-y-3">
          {/* Issues */}
          {result.issues.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">問題点</h5>
              <div className="space-y-2">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      issue.type === 'error'
                        ? 'bg-red-50 text-red-700'
                        : issue.type === 'warning'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {issue.type === 'error' ? '⛔' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">改善提案</h5>
              <div className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm text-gray-700"
                  >
                    <span className="flex-shrink-0 text-green-500">💡</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && !hasContent && (
        <div className="p-4 bg-white text-center text-sm text-gray-500">
          問題は見つかりませんでした
        </div>
      )}
    </div>
  )
}
