/**
 * LP-Editor App
 *
 * Main application component.
 */

import { useEffect, useCallback } from 'react'
import { useEditorStore } from './stores/editor-store'
import { EditorPanel } from './components/EditorPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { Toolbar } from './components/Toolbar'
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

  // Load project on mount
  useEffect(() => {
    loadProject()
  }, [])

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
      type: 'text' | 'richtext' | 'image' | 'link' | 'background-image'
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
          type: 'text' | 'richtext' | 'image' | 'link' | 'background-image'
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
                  const fd = fieldData as { type?: string; value?: string | null; label?: string; href?: string; src?: string }
                  return [fieldKey, {
                    id: `${blockId}.${idx}.${fieldKey}`,
                    type: (fd.type || 'text') as 'text' | 'richtext' | 'image' | 'link' | 'background-image',
                    label: fd.label,
                    value: fd.value ?? null,
                    href: fd.href,
                    src: fd.src,
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

      // Apply edits and export
      let html = applyEditablesToHtml(originalHtml, editables)
      html = applyColorsToHtml(html, colors)

      const outputPath = await window.electronAPI.exportHtml(html)

      // Show success dialog
      const result = confirm(
        `HTMLを出力しました。\n\n出力先: ${outputPath}\n\nフォルダを開きますか？`
      )

      if (result) {
        await window.electronAPI.showOutputFolder()
      }
    } catch (err) {
      console.error('Failed to export:', err)
      alert('出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }, [originalHtml, editables, colors, handleSave, setExporting])

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

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadProject()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        onSave={handleSave}
        onExport={handleExport}
        pages={pages}
        currentPageId={currentPageId}
        onPageChange={handlePageChange}
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
