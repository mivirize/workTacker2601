/**
 * Toolbar Component
 *
 * Top toolbar with save and export actions.
 */

import { useEditorStore } from '../stores/editor-store'

interface PageConfig {
  id: string
  path: string
  label: string
}

interface ToolbarProps {
  onSave: () => void
  onExport: () => void
  pages: PageConfig[]
  currentPageId: string | null
  onPageChange: (pageId: string) => void
}

export function Toolbar({ onSave, onExport, pages, currentPageId, onPageChange }: ToolbarProps) {
  const { projectInfo, isDirty, isExporting } = useEditorStore()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left: Project Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">
          {projectInfo?.name || 'LP-Editor'}
        </h1>

        {/* Page Selector */}
        {pages.length > 1 && (
          <select
            value={currentPageId || ''}
            onChange={(e) => onPageChange(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.label}
              </option>
            ))}
          </select>
        )}

        {isDirty && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
            未保存
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={!isDirty}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          保存
        </button>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          {isExporting ? '出力中...' : 'HTML出力'}
        </button>
      </div>
    </header>
  )
}
