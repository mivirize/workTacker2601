/**
 * Toolbar Component
 *
 * Top toolbar with save, export, and undo/redo actions.
 */

import { useStore } from 'zustand'
import { useEditorStore } from '../stores/editor-store'

interface PageConfig {
  id: string
  path: string
  label: string
}

interface ToolbarProps {
  onSave: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  pages: PageConfig[]
  currentPageId: string | null
  onPageChange: (pageId: string) => void
}

export function Toolbar({ onSave, onExport, onUndo, onRedo, pages, currentPageId, onPageChange }: ToolbarProps) {
  const { projectInfo, isDirty, isExporting } = useEditorStore()

  // Subscribe to temporal state for undo/redo availability
  const { pastStates, futureStates } = useStore(useEditorStore.temporal, (state) => ({
    pastStates: state.pastStates,
    futureStates: state.futureStates,
  }))
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

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
        {/* Undo/Redo Buttons */}
        <div className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="元に戻す (Ctrl+Z)"
            className={`p-2 rounded-md transition-colors ${
              canUndo
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="やり直す (Ctrl+Y / Ctrl+Shift+Z)"
            className={`p-2 rounded-md transition-colors ${
              canRedo
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </button>
        </div>

        <button
          onClick={onSave}
          disabled={!isDirty}
          title="保存 (Ctrl+S)"
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
          title="HTML出力 (Ctrl+E)"
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          {isExporting ? '出力中...' : 'HTML出力'}
        </button>
      </div>
    </header>
  )
}
