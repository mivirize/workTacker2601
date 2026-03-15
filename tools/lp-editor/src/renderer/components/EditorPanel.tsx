/**
 * Editor Panel Component
 *
 * The main editing interface for modifying LP content.
 * Tabs: コンテンツ | カラー | 品質 | 計測 | フォーム
 *
 * Refactored from a 1,765-line monolith into modular tab components.
 */

import React from 'react'
import { useEditorStore } from '../stores/editor-store'
import { validateContent } from '../services/validation-service'
import { ContentTab } from './editor/ContentTab'
import { ColorTab } from './editor/ColorTab'
import { CheckTab } from './editor/CheckTab'
import { DesignTab } from './editor/DesignTab'
import { TrackingEditor } from './TrackingEditor'
import { FormEditor } from './FormEditor'

type TabId = 'content' | 'colors' | 'quality' | 'tracking' | 'forms'

interface TabConfig {
  id: TabId
  label: string
  badge?: React.ReactNode
}

export function EditorPanel() {
  const {
    editables,
    colors,
    repeatBlocks,
    selectedField,
    activeGroup,
    originalHtml,
    basePath,
    updateEditable,
    updateColor,
    updateRepeatItemField,
    addRepeatItem,
    removeRepeatItem,
    selectField,
    setActiveGroup,
  } = useEditorStore()

  // Active tab state (mapped from activeGroup for compatibility)
  const activeTab: TabId = React.useMemo(() => {
    switch (activeGroup) {
      case 'colors': return 'colors'
      case 'check':
      case 'design':
      case 'quality': return 'quality'
      case 'tracking': return 'tracking'
      case 'forms': return 'forms'
      default: return 'content'
    }
  }, [activeGroup])

  // Quality sub-tab state
  const [qualitySubTab, setQualitySubTab] = React.useState<'check' | 'design'>('check')

  const setActiveTab = (tab: TabId) => {
    switch (tab) {
      case 'content': setActiveGroup(null); break
      case 'colors': setActiveGroup('colors'); break
      case 'quality': setActiveGroup('quality'); break
      case 'tracking': setActiveGroup('tracking'); break
      case 'forms': setActiveGroup('forms'); break
    }
  }

  // Group editables by group and sort by order
  const groups = React.useMemo(() => {
    const grouped: Record<string, typeof editables> = {}

    const sortedEntries = Object.entries(editables).sort(
      ([, a], [, b]) => a.order - b.order
    )

    for (const [id, field] of sortedEntries) {
      const groupName = field.group || 'その他'
      if (!grouped[groupName]) {
        grouped[groupName] = {}
      }
      grouped[groupName][id] = field
    }

    return grouped
  }, [editables])

  const groupNames = Object.keys(groups)

  // Validation result
  const validationResult = React.useMemo(() => {
    if (!originalHtml) return null
    return validateContent(originalHtml, editables, repeatBlocks)
  }, [originalHtml, editables, repeatBlocks])

  // Badge for quality tab
  const qualityBadge = React.useMemo(() => {
    if (!validationResult) return null
    if (validationResult.summary.errors > 0) {
      return (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
          {validationResult.summary.errors}
        </span>
      )
    }
    if (validationResult.summary.warnings > 0) {
      return (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
          {validationResult.summary.warnings}
        </span>
      )
    }
    return null
  }, [validationResult])

  // Tab configuration
  const tabs: TabConfig[] = [
    { id: 'content', label: 'コンテンツ' },
    { id: 'colors', label: 'カラー' },
    { id: 'quality', label: '品質', badge: qualityBadge },
    { id: 'tracking', label: '計測' },
    { id: 'forms', label: 'フォーム' },
  ]

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">編集パネル</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.label}
            {tab.badge}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" role="tabpanel" id={`tabpanel-${activeTab}`}>
        {activeTab === 'content' && (
          <ContentTab
            groups={groups}
            groupNames={groupNames}
            repeatBlocks={repeatBlocks}
            selectedField={selectedField}
            basePath={basePath}
            updateEditable={updateEditable}
            updateRepeatItemField={updateRepeatItemField}
            addRepeatItem={addRepeatItem}
            removeRepeatItem={removeRepeatItem}
            selectField={selectField}
          />
        )}

        {activeTab === 'colors' && (
          <ColorTab colors={colors} updateColor={updateColor} />
        )}

        {activeTab === 'quality' && (
          <div className="space-y-4">
            {/* Quality sub-tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  qualitySubTab === 'check'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setQualitySubTab('check')}
              >
                チェック
                {qualityBadge}
              </button>
              <button
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  qualitySubTab === 'design'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setQualitySubTab('design')}
              >
                デザイン
              </button>
            </div>

            {qualitySubTab === 'check' && (
              <CheckTab validationResult={validationResult} selectField={selectField} />
            )}
            {qualitySubTab === 'design' && (
              <DesignTab originalHtml={originalHtml} />
            )}
          </div>
        )}

        {activeTab === 'tracking' && <TrackingEditor />}
        {activeTab === 'forms' && <FormEditor />}
      </div>
    </div>
  )
}
