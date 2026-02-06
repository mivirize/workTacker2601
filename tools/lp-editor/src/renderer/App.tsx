/**
 * LP-Editor App
 *
 * Main application component.
 */

import { useEffect, useCallback, useMemo, useState } from 'react'
import { useEditorStore, useTemporalStore } from './stores/editor-store'
import { useAdminStore } from './stores/admin-store'
import { EditorPanel } from './components/EditorPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { Toolbar } from './components/Toolbar'
import { AdminPage } from './pages/Admin'
import {
  parseHtmlMarkers,
  parseHtmlColors,
  parseRepeatBlocks,
  applyEditablesToHtml,
  applyColorsToHtml,
  applyRepeatBlocksToHtml,
} from './services/html-service'

export function App() {
  const {
    isLoading,
    error,
    editables,
    colors,
    repeatBlocks,
    originalHtml,
    pages,
    currentPageId,
    setProjectInfo,
    setBasePath,
    setLoading,
    setError,
    setPages,
    setCurrentPageId,
    setEditables,
    setColors,
    setRepeatBlocks,
    setOriginalHtml,
    setModifiedHtml,
    setDirty,
    setExporting,
  } = useEditorStore()

  // Admin store
  const { isAdminMode, setAdminMode } = useAdminStore()

  // Project selection state
  const [needsProjectSelect, setNeedsProjectSelect] = useState(false)

  // Initialize and validate project
  const initializeProject = async () => {
    setLoading(true)
    setError(null)
    setNeedsProjectSelect(false)

    try {
      const validation = await window.electronAPI.initProject()

      if (validation.valid) {
        await loadProject()
      } else {
        console.warn('Project validation failed:', validation.error)
        setNeedsProjectSelect(true)
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to initialize project:', err)
      setNeedsProjectSelect(true)
      setLoading(false)
    }
  }

  // Handle project selection
  const handleSelectProject = async () => {
    try {
      const validation = await window.electronAPI.selectProject()

      if (validation && validation.valid) {
        setNeedsProjectSelect(false)
        await loadProject()
      } else if (validation) {
        alert(`プロジェクトが無効です: ${validation.error}`)
      }
    } catch (err) {
      console.error('Failed to select project:', err)
    }
  }

  // Update modified HTML when editables, colors, or repeatBlocks change
  useEffect(() => {
    if (!originalHtml) return

    let html = applyEditablesToHtml(originalHtml, editables)
    html = applyColorsToHtml(html, colors)
    html = applyRepeatBlocksToHtml(html, repeatBlocks)
    setModifiedHtml(html)
  }, [editables, colors, repeatBlocks, originalHtml, setModifiedHtml])

  // Load page HTML and parse markers
  const loadPageContent = async (pagePath: string, projectInfo: Awaited<ReturnType<typeof window.electronAPI.getProjectInfo>>) => {
    const html = await window.electronAPI.loadHtml(pagePath)
    setOriginalHtml(html)

    // Parse markers
    const markers = parseHtmlMarkers(html)
    const editablesMap: Record<string, {
      id: string
      type: 'text' | 'richtext' | 'image' | 'link' | 'background-image' | 'number' | 'icon'
      value: string | null
      label?: string
      group?: string
      href?: string
      src?: string
      order: number
    }> = {}

    for (const marker of markers) {
      editablesMap[marker.id] = {
        id: marker.id,
        type: marker.type,
        value: marker.value,
        label: marker.label,
        group: marker.group,
        href: marker.href,
        src: marker.src,
        order: marker.order,
      }
    }

    // Parse colors
    const parsedColors = parseHtmlColors(html)
    const colorsMap: Record<string, {
      variable: string
      value: string
      label?: string
      description?: string
    }> = {}

    for (const color of parsedColors) {
      const key = color.variable.replace('--color-', '')
      colorsMap[key] = {
        variable: color.variable,
        value: color.value,
        label: projectInfo?.colors?.[key]?.label,
        description: projectInfo?.colors?.[key]?.description,
      }
    }

    // Parse repeat blocks
    const parsedRepeatBlocks = parseRepeatBlocks(html)
    const repeatBlocksMap: Record<string, {
      id: string
      min: number
      max: number
      items: Array<{
        index: number
        fields: Record<string, {
          id: string
          type: 'text' | 'richtext' | 'image' | 'link' | 'background-image' | 'number' | 'icon'
          label?: string
          value: string | null
          href?: string
          src?: string
        }>
      }>
      templateHtml: string
    }> = {}

    for (const block of parsedRepeatBlocks) {
      repeatBlocksMap[block.id] = {
        id: block.id,
        min: block.min,
        max: block.max,
        items: block.items,
        templateHtml: block.templateHtml,
      }
    }

    // Load saved content if exists
    const savedContent = await window.electronAPI.loadContent()
    if (savedContent) {
      // Merge saved values
      for (const [id, data] of Object.entries(savedContent.editables || {})) {
        if (editablesMap[id]) {
          editablesMap[id] = {
            ...editablesMap[id],
            value: data.value,
            href: data.href,
            src: data.src,
          }
        }
      }

      for (const [key, colorData] of Object.entries(savedContent.colors || {})) {
        if (colorsMap[key]) {
          if (typeof colorData === 'string') {
            colorsMap[key].value = colorData
          } else if (colorData && typeof colorData === 'object') {
            const colorObj = colorData as { value?: string; label?: string; description?: string }
            if (colorObj.value) {
              colorsMap[key].value = colorObj.value
            }
            if (colorObj.label) {
              colorsMap[key].label = colorObj.label
            }
            if (colorObj.description) {
              colorsMap[key].description = colorObj.description
            }
          }
        }
      }

      // Merge saved repeat blocks
      for (const [blockId, savedBlock] of Object.entries(savedContent.repeatBlocks || {})) {
        if (repeatBlocksMap[blockId] && savedBlock && typeof savedBlock === 'object') {
          const typedBlock = savedBlock as unknown as { items?: Array<{ fields: Record<string, unknown> }> }
          if (typedBlock.items && Array.isArray(typedBlock.items)) {
            repeatBlocksMap[blockId].items = typedBlock.items.map((item, idx) => ({
              index: idx,
              fields: Object.fromEntries(
                Object.entries(item.fields || {}).map(([fieldKey, fieldData]) => {
                  const fd = fieldData as {
                    type?: string
                    value?: string | null
                    label?: string
                    href?: string
                    src?: string
                    min?: number
                    max?: number
                    step?: number
                    suffix?: string
                  }
                  return [fieldKey, {
                    id: `${blockId}.${idx}.${fieldKey}`,
                    type: (fd.type || 'text') as 'text' | 'richtext' | 'image' | 'link' | 'background-image' | 'number' | 'icon',
                    label: fd.label,
                    value: fd.value ?? null,
                    href: fd.href,
                    src: fd.src,
                    min: fd.min,
                    max: fd.max,
                    step: fd.step,
                    suffix: fd.suffix,
                  }]
                })
              ),
            }))
          }
        }
      }
    }

    setEditables(editablesMap)
    setColors(colorsMap)
    setRepeatBlocks(repeatBlocksMap)
  }

  // Load project data
  const loadProject = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load project info
      const projectInfo = await window.electronAPI.getProjectInfo()
      setProjectInfo(projectInfo)

      // Get src path for base href
      const srcPath = await window.electronAPI.getSrcPath()
      setBasePath(srcPath)

      // Setup pages
      if (projectInfo?.pages && projectInfo.pages.length > 0) {
        setPages(projectInfo.pages)
        setCurrentPageId(projectInfo.pages[0].id)
        await loadPageContent(projectInfo.pages[0].path, projectInfo)
      } else {
        // Fallback to single entry
        const entryPath = projectInfo?.entry || 'src/index.html'
        setPages([{ id: 'index', path: entryPath, label: 'トップページ' }])
        setCurrentPageId('index')
        await loadPageContent(entryPath, projectInfo)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = useCallback(async (pageId: string) => {
    const page = pages.find(p => p.id === pageId)
    if (!page) return

    setLoading(true)
    try {
      const projectInfo = await window.electronAPI.getProjectInfo()
      setCurrentPageId(pageId)
      await loadPageContent(page.path, projectInfo)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [pages, setCurrentPageId, setLoading, setError])

  // Save content
  const handleSave = useCallback(async () => {
    try {
      const content = {
        _meta: {
          savedAt: new Date().toISOString(),
        },
        editables: Object.fromEntries(
          Object.entries(editables).map(([id, field]) => [
            id,
            {
              type: field.type,
              value: field.value,
              label: field.label,
              group: field.group,
              href: field.href,
              src: field.src,
            },
          ])
        ),
        colors: Object.fromEntries(
          Object.entries(colors).map(([key, color]) => [key, color.value])
        ),
        repeatBlocks: Object.fromEntries(
          Object.entries(repeatBlocks).map(([blockId, block]) => [
            blockId,
            {
              items: block.items.map((item) => ({
                fields: Object.fromEntries(
                  Object.entries(item.fields).map(([fieldKey, field]) => [
                    fieldKey,
                    {
                      type: field.type,
                      value: field.value,
                      label: field.label,
                      href: field.href,
                      src: field.src,
                      // Number-specific attributes
                      min: field.min,
                      max: field.max,
                      step: field.step,
                      suffix: field.suffix,
                    },
                  ])
                ),
              })),
            },
          ])
        ),
      }

      await window.electronAPI.saveContent(content)
      setDirty(false)
    } catch (err) {
      console.error('Failed to save:', err)
      alert('保存に失敗しました')
    }
  }, [editables, colors, repeatBlocks, setDirty])

  // Export HTML
  const handleExport = useCallback(async () => {
    setExporting(true)

    try {
      // Save first
      await handleSave()

      // Apply edits and export (including repeat blocks)
      let html = applyEditablesToHtml(originalHtml, editables)
      html = applyColorsToHtml(html, colors)
      html = applyRepeatBlocksToHtml(html, repeatBlocks)

      const outputPath = await window.electronAPI.exportHtml(html)

      // User cancelled folder selection
      if (!outputPath) {
        return
      }

      // Show success dialog
      const result = confirm(
        `HTMLを出力しました。\n\n出力先: ${outputPath}\n\nフォルダを開きますか？`
      )

      if (result) {
        await window.electronAPI.showOutputFolder(outputPath)
      }
    } catch (err) {
      console.error('Failed to export:', err)
      alert('出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }, [originalHtml, editables, colors, repeatBlocks, handleSave, setExporting])

  // Get temporal store for undo/redo
  const temporalStore = useMemo(() => useTemporalStore(), [])

  // Undo handler
  const handleUndo = useCallback(() => {
    temporalStore.undo()
    setDirty(true)
  }, [temporalStore, setDirty])

  // Redo handler
  const handleRedo = useCallback(() => {
    temporalStore.redo()
    setDirty(true)
  }, [temporalStore, setDirty])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input or textarea (don't intercept shortcuts)
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'z':
            // Don't intercept if in input field (let native undo work)
            if (!isInput) {
              e.preventDefault()
              if (e.shiftKey) {
                handleRedo()
              } else {
                handleUndo()
              }
            }
            break
          case 'y':
            // Don't intercept if in input field
            if (!isInput) {
              e.preventDefault()
              handleRedo()
            }
            break
          case 'e':
            e.preventDefault()
            handleExport()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleExport, handleUndo, handleRedo])

  // Track previous admin mode to detect transitions
  const [wasAdminMode, setWasAdminMode] = useState<boolean | null>(null)
  // Track if we were opened from admin (for showing "back to admin" button)
  const [openedFromAdmin, setOpenedFromAdmin] = useState(false)

  // Check admin mode on mount
  useEffect(() => {
    const checkAdminMode = async () => {
      try {
        const adminMode = await window.electronAPI.isAdminMode()
        setAdminMode(adminMode)
        setWasAdminMode(adminMode)
        if (!adminMode) {
          initializeProject()
        }
      } catch (err) {
        console.error('Failed to check admin mode:', err)
        initializeProject()
      }
    }
    checkAdminMode()
  }, [])

  // Handle transition from admin mode to editor mode
  useEffect(() => {
    // Skip initial render (wasAdminMode is null) and when still in admin mode
    if (wasAdminMode === null || isAdminMode) return

    // If we were in admin mode and now we're not, initialize the project
    if (wasAdminMode && !isAdminMode) {
      initializeProject()
      setWasAdminMode(false)
      setOpenedFromAdmin(true) // Remember we came from admin
    }
  }, [isAdminMode, wasAdminMode])

  // Handle returning to admin mode
  const handleBackToAdmin = useCallback(async () => {
    try {
      await window.electronAPI.returnToAdmin()
      setAdminMode(true)
      setWasAdminMode(true)
    } catch (err) {
      console.error('Failed to return to admin:', err)
    }
  }, [setAdminMode])

  // If admin mode, show admin page
  if (isAdminMode) {
    return <AdminPage />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Project selection screen
  if (needsProjectSelect) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="text-center max-w-lg p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-blue-600 text-6xl mb-6">📁</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">LP-Editor</h1>
          <p className="text-gray-600 mb-6">
            プロジェクトフォルダを選択してください。<br />
            <span className="text-sm text-gray-500">
              フォルダには <code className="bg-gray-100 px-1 rounded">src/index.html</code> が必要です。
            </span>
          </p>

          <button
            onClick={handleSelectProject}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
          >
            プロジェクトを開く
          </button>

          <div className="mt-6 text-xs text-gray-400">
            <p>推奨フォルダ構造:</p>
            <pre className="text-left bg-gray-50 p-3 rounded-lg mt-2 text-gray-600">
{`project/
├── lp-config.json
└── src/
    ├── index.html
    ├── css/
    ├── js/
    └── images/`}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => initializeProject()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              再読み込み
            </button>
            <button
              onClick={handleSelectProject}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              別のプロジェクトを開く
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        onSave={handleSave}
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
        pages={pages}
        currentPageId={currentPageId}
        onPageChange={handlePageChange}
        showBackToAdmin={openedFromAdmin}
        onBackToAdmin={handleBackToAdmin}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel - Left */}
        <div className="w-80 flex-shrink-0">
          <EditorPanel />
        </div>

        {/* Preview Panel - Right */}
        <div className="flex-1">
          <PreviewPanel />
        </div>
      </div>
    </div>
  )
}
