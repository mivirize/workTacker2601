/**
 * Quality Score Component
 *
 * Displays the overall design quality score with a visual gauge.
 */

import { getQualityLevel, type DesignAnalysis } from '../../services/design-service'

interface QualityScoreProps {
  analysis: DesignAnalysis | null
  isLoading?: boolean
}

export function QualityScore({ analysis, isLoading }: QualityScoreProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-gray-500">
        分析データがありません
      </div>
    )
  }

  const { label, color } = getQualityLevel(analysis.score)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (analysis.score / 100) * circumference

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
      {/* Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>
              {analysis.score}
            </span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Quality Level Badge */}
      <div className="text-center mb-4">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {label}
        </span>
      </div>

      {/* Category Scores */}
      <div className="space-y-3">
        <CategoryScore
          label="アニメーション"
          score={analysis.categories.animation.score}
          status={analysis.categories.animation.status}
        />
        <CategoryScore
          label="レイアウト"
          score={analysis.categories.layout.score}
          status={analysis.categories.layout.status}
        />
        <CategoryScore
          label="タイポグラフィ"
          score={analysis.categories.typography.score}
          status={analysis.categories.typography.status}
        />
        <CategoryScore
          label="コントラスト"
          score={analysis.categories.colorContrast.score}
          status={analysis.categories.colorContrast.status}
        />
        <CategoryScore
          label="パフォーマンス"
          score={analysis.categories.performance.score}
          status={analysis.categories.performance.status}
        />
        <CategoryScore
          label="アクセシビリティ"
          score={analysis.categories.accessibility.score}
          status={analysis.categories.accessibility.status}
        />
      </div>
    </div>
  )
}

interface CategoryScoreProps {
  label: string
  score: number
  status: 'good' | 'warning' | 'error'
}

function CategoryScore({ label, score, status }: CategoryScoreProps) {
  const statusColors = {
    good: { bg: 'bg-green-500', text: 'text-green-600' },
    warning: { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    error: { bg: 'bg-red-500', text: 'text-red-600' },
  }

  const colors = statusColors[status]

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-gray-600">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bg} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`w-10 text-sm font-medium ${colors.text} text-right`}>
        {score}
      </span>
    </div>
  )
}
