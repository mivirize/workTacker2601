/**
 * Project Stats Component
 *
 * Displays statistics for a selected project.
 */

import { useState } from 'react'
import { useAdminStore } from '../../stores/admin-store'

interface ProjectStatsProps {
  stats: {
    markers: number
    repeatBlocks: number
    colors: number
    images: number
    pages: number
  } | null
  projectName?: string
  projectPath?: string
  onOpenProject: () => void
}

export function ProjectStats({ stats, projectName, projectPath, onOpenProject }: ProjectStatsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false)
  const [includeEditor, setIncludeEditor] = useState(false)
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    warnings: Array<{ type: 'error' | 'warning' | 'info'; code: string; message: string; element?: string }>
  } | null>(null)
  const { generateScreenshot } = useAdminStore()

  const handleExport = async () => {
    if (!projectPath) return

    setIsExporting(true)
    setExportResult(null)

    try {
      const outputPath = await window.electronAPI.exportProject(projectPath, { includeEditor })
      if (outputPath) {
        const message = includeEditor
          ? `出力完了（Editor同梱）: ${outputPath}`
          : `出力完了: ${outputPath}`
        setExportResult({ success: true, message })
      } else {
        setExportResult({ success: false, message: 'エクスポートがキャンセルされました' })
      }
    } catch (error) {
      setExportResult({ success: false, message: `エラー: ${error}` })
    } finally {
      setIsExporting(false)
    }
  }

  const handleValidate = async () => {
    if (!projectPath) return

    setIsValidating(true)
    setValidationResult(null)

    try {
      const result = await window.electronAPI.validateLpContent(projectPath)
      setValidationResult(result)
    } catch (error) {
      setExportResult({ success: false, message: `バリデーションエラー: ${error}` })
    } finally {
      setIsValidating(false)
    }
  }

  const handleGenerateScreenshot = async () => {
    if (!projectPath) return

    setIsGeneratingScreenshot(true)
    try {
      const result = await generateScreenshot(projectPath)
      if (result) {
        setExportResult({ success: true, message: 'スクリーンショットを生成しました' })
      } else {
        setExportResult({ success: false, message: 'スクリーンショットの生成に失敗しました' })
      }
    } catch (error) {
      setExportResult({ success: false, message: `エラー: ${error}` })
    } finally {
      setIsGeneratingScreenshot(false)
    }
  }

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">プロジェクトを選択してください</p>
        </div>
      </div>
    )
  }

  const statItems = [
    { label: 'マーカー', value: stats.markers, icon: '📝', color: 'bg-blue-100 text-blue-700' },
    { label: 'リピートブロック', value: stats.repeatBlocks, icon: '🔄', color: 'bg-purple-100 text-purple-700' },
    { label: 'カラー', value: stats.colors, icon: '🎨', color: 'bg-pink-100 text-pink-700' },
    { label: '画像', value: stats.images, icon: '🖼', color: 'bg-green-100 text-green-700' },
    { label: 'ページ', value: stats.pages, icon: '📄', color: 'bg-yellow-100 text-yellow-700' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          {projectName || 'プロジェクト詳細'}
        </h3>
        <p className="text-sm text-gray-500">統計情報</p>
      </div>

      {/* Stats Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`p-4 rounded-xl ${item.color} flex flex-col items-center justify-center`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-2xl font-bold">{item.value}</span>
              <span className="text-xs font-medium opacity-75">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Total Score */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">合計編集項目</p>
              <p className="text-3xl font-bold">
                {stats.markers + stats.repeatBlocks + stats.colors}
              </p>
            </div>
            <div className="text-5xl opacity-50">✨</div>
          </div>
        </div>
      </div>

      {/* Export Result Message */}
      {exportResult && (
        <div
          className={`mx-4 mb-2 p-3 rounded-lg text-sm ${
            exportResult.success
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          {exportResult.message}
        </div>
      )}

      {/* Validation Result */}
      {validationResult && (
        <div className="mx-4 mb-2">
          <div
            className={`p-3 rounded-lg text-sm ${
              validationResult.valid
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            }`}
          >
            <div className="font-medium mb-1">
              {validationResult.valid ? '✓ バリデーション OK' : '⚠ 確認事項があります'}
            </div>
            {validationResult.warnings.length > 0 && (
              <ul className="text-xs space-y-1 mt-2">
                {validationResult.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className={w.type === 'error' ? 'text-red-500' : w.type === 'warning' ? 'text-yellow-600' : 'text-blue-500'}>
                      {w.type === 'error' ? '❌' : w.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span>{w.message}{w.element && ` (${w.element})`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={onOpenProject}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          エディターで開く
        </button>

        {/* Include Editor Option */}
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={includeEditor}
            onChange={(e) => setIncludeEditor(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">LP-Editorを同梱</span>
          <span className="text-xs text-gray-400">(クライアント納品用)</span>
        </label>

        <button
          onClick={handleExport}
          disabled={isExporting || !projectPath}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              エクスポート中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              パッケージ出力
            </>
          )}
        </button>

        {/* Validation Button */}
        <button
          onClick={handleValidate}
          disabled={isValidating || !projectPath}
          className="w-full py-2 bg-purple-100 text-purple-700 font-medium rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isValidating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              チェック中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              コンテンツチェック
            </>
          )}
        </button>

        <button
          onClick={handleGenerateScreenshot}
          disabled={isGeneratingScreenshot || !projectPath}
          className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isGeneratingScreenshot ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              生成中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              サムネイル更新
            </>
          )}
        </button>
      </div>
    </div>
  )
}
