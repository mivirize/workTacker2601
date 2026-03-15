/**
 * ContentTab Component
 *
 * Displays grouped editable fields and repeat blocks in an accordion layout.
 */

import React from 'react'
import type { EditableFieldData, RepeatBlockData } from './types'
import { FieldEditor } from './FieldEditor'
import { RepeatBlockEditor } from './RepeatBlockEditor'

interface ContentTabProps {
  groups: Record<string, Record<string, EditableFieldData>>
  groupNames: string[]
  repeatBlocks: Record<string, RepeatBlockData>
  selectedField: string | null
  basePath: string
  updateEditable: (id: string, value: string | null, extra?: Record<string, unknown>) => void
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extra?: Record<string, unknown>) => void
  addRepeatItem: (blockId: string) => void
  removeRepeatItem: (blockId: string, itemIndex: number) => void
  selectField: (id: string | null) => void
}

export function ContentTab({
  groups,
  groupNames,
  repeatBlocks,
  selectedField,
  basePath,
  updateEditable,
  updateRepeatItemField,
  addRepeatItem,
  removeRepeatItem,
  selectField,
}: ContentTabProps) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set())

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  // Include link fields inline with their groups (merge settings into content)
  return (
    <div className="space-y-4">
      {groupNames.map((groupName) => {
        const isCollapsed = collapsedGroups.has(groupName)
        const fieldCount = Object.keys(groups[groupName]).length

        return (
          <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Group Header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-gray-100 hover:to-gray-50 transition-colors"
              onClick={() => toggleGroup(groupName)}
              role="button"
              aria-expanded={!isCollapsed}
              aria-label={`${groupName} (${fieldCount} 項目)`}
            >
              <div className="flex items-center gap-3">
                <span className={`transform transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  {groupName}
                </h3>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {fieldCount} 項目
              </span>
            </div>

            {/* Group Content */}
            {!isCollapsed && (
              <div className="p-4 space-y-3 bg-gray-50/50">
                {Object.entries(groups[groupName]).map(([id, field]) => (
                  <FieldEditor
                    key={id}
                    id={id}
                    type={field.type}
                    value={field.value}
                    label={field.label}
                    href={field.href}
                    src={field.src}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    suffix={field.suffix}
                    isSelected={selectedField === id}
                    basePath={basePath}
                    onChange={(val, extra) => updateEditable(id, val, extra)}
                    onFocus={() => selectField(id)}
                    onBlur={() => selectField(null)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Repeat Blocks */}
      {Object.entries(repeatBlocks).length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-lg text-xs font-bold">
                ↻
              </span>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                リピートブロック
              </h3>
            </div>
          </div>
          <div className="p-4 space-y-4 bg-gray-50/50">
            {Object.entries(repeatBlocks).map(([blockId, block]) => (
              <RepeatBlockEditor
                key={blockId}
                block={block}
                basePath={basePath}
                updateRepeatItemField={updateRepeatItemField}
                addRepeatItem={addRepeatItem}
                removeRepeatItem={removeRepeatItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
