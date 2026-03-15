/**
 * CheckTab Component
 *
 * Displays validation results with severity-based styling.
 */

import React from 'react'
import type { ValidationResult, ValidationIssue } from '../../services/validation-service'

interface CheckTabProps {
  validationResult: ValidationResult | null
  selectField: (id: string | null) => void
}

export function CheckTab({ validationResult, selectField }: CheckTabProps) {
  if (!validationResult) {
    return (
      <div className="text-center py-8 text-gray-500">
        コンテンツを読み込み中...
      </div>
    )
  }

  const { issues, summary, isValid } = validationResult

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
                className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => issue.field && selectField(issue.field)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && issue.field) selectField(issue.field)
                }}
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
