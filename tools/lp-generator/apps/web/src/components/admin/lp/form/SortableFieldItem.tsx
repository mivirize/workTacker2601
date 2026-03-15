'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { FormField, FormFieldType } from '@lp-generator/sanity-schemas/types'

interface SortableFieldItemProps {
  field: FormField
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  index: number
  isFirst: boolean
  isLast: boolean
}

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: 'テキスト',
  email: 'メール',
  tel: '電話',
  number: '数値',
  textarea: 'テキストエリア',
  select: 'セレクト',
  checkbox: 'チェックボックス',
  radio: 'ラジオボタン',
}

const fieldTypeColors: Record<FormFieldType, string> = {
  text: 'bg-blue-100 text-blue-700 border-blue-200',
  email: 'bg-blue-100 text-blue-700 border-blue-200',
  tel: 'bg-blue-100 text-blue-700 border-blue-200',
  number: 'bg-blue-100 text-blue-700 border-blue-200',
  textarea: 'bg-purple-100 text-purple-700 border-purple-200',
  select: 'bg-green-100 text-green-700 border-green-200',
  checkbox: 'bg-orange-100 text-orange-700 border-orange-200',
  radio: 'bg-pink-100 text-pink-700 border-pink-200',
}

export function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  isFirst,
  isLast,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field._key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white rounded-lg border shadow-sm transition-all ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className={`p-1 rounded transition-colors ${
            isFirst
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
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
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
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
        <GripVertical className="w-5 h-5" />
      </button>

      <span className={`px-2 py-1 text-xs font-medium rounded border ${fieldTypeColors[field.fieldType]}`}>
        {fieldTypeLabels[field.fieldType]}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{field.fieldLabel}</p>
        <p className="text-xs text-gray-500 truncate">{field.fieldName}</p>
      </div>

      {field.required && (
        <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">
          必須
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(field._key)}
          className={`p-2 rounded-lg transition-colors ${
            isSelected
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="編集"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(field._key)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
