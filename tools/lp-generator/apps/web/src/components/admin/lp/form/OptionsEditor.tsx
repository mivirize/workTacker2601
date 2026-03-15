'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormFieldOption } from '@lp-generator/sanity-schemas/types'

interface SortableOptionProps {
  option: FormFieldOption
  index: number
  isFirst: boolean
  isLast: boolean
  onUpdate: (id: string, updates: Partial<FormFieldOption>) => void
  onDelete: (id: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

function SortableOption({
  option,
  index,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: option._key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className={`p-1 rounded transition-colors ${
            isFirst
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
          }`}
          title="上に移動"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className={`p-1 rounded transition-colors ${
            isLast
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
          }`}
          title="下に移動"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        title="ドラッグして並び替え"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <input
          type="text"
          value={option.label}
          onChange={(e) => onUpdate(option._key, { label: e.target.value })}
          placeholder="表示ラベル"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
        <input
          type="text"
          value={option.value}
          onChange={(e) => onUpdate(option._key, { value: e.target.value })}
          placeholder="送信値"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => onDelete(option._key)}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="削除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

interface OptionsEditorProps {
  options: FormFieldOption[]
  onAddOption: () => void
  onUpdateOption: (id: string, updates: Partial<FormFieldOption>) => void
  onDeleteOption: (id: string) => void
  onMoveOption: (fromIndex: number, toIndex: number) => void
}

export function OptionsEditor({
  options,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onMoveOption,
}: OptionsEditorProps) {
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onMoveOption(index, index - 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < options.length - 1) {
      onMoveOption(index, index + 1)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">選択肢</label>
        <button
          type="button"
          onClick={onAddOption}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          選択肢を追加
        </button>
      </div>

      {options.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">選択肢がありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <SortableOption
              key={option._key}
              option={option}
              index={index}
              isFirst={index === 0}
              isLast={index === options.length - 1}
              onUpdate={onUpdateOption}
              onDelete={onDeleteOption}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        ※ 選択肢のラベルはユーザーに表示されるテキスト、値はフォーム送信時に使用される値です
      </p>
    </div>
  )
}
