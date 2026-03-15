'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { SortableFieldItem } from './SortableFieldItem'
import type { FormField, FormFieldType } from '@lp-generator/sanity-schemas/types'

interface FormFieldListProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (id: string) => void
  onEditField: (id: string) => void
  onDeleteField: (id: string) => void
  onMoveField: (fromIndex: number, toIndex: number) => void
  onAddField: (type: FormFieldType) => void
}

const fieldTypes: Array<{ type: FormFieldType; label: string; color: string }> = [
  { type: 'text', label: 'テキスト', color: 'bg-blue-500' },
  { type: 'email', label: 'メール', color: 'bg-blue-500' },
  { type: 'tel', label: '電話', color: 'bg-blue-500' },
  { type: 'number', label: '数値', color: 'bg-blue-500' },
  { type: 'textarea', label: 'テキストエリア', color: 'bg-purple-500' },
  { type: 'select', label: 'セレクト', color: 'bg-green-500' },
  { type: 'checkbox', label: 'チェックボックス', color: 'bg-orange-500' },
  { type: 'radio', label: 'ラジオボタン', color: 'bg-pink-500' },
]

export function FormFieldList({
  fields,
  selectedFieldId,
  onSelectField,
  onEditField,
  onDeleteField,
  onMoveField,
  onAddField,
}: FormFieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field._key === active.id)
      const newIndex = fields.findIndex((field) => field._key === over.id)
      onMoveField(oldIndex, newIndex)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onMoveField(index, index - 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      onMoveField(index, index + 1)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">フィールド一覧</h3>
        <p className="text-sm text-gray-500">
          ドラッグして並び替え、またはボタンで移動できます
        </p>
      </div>

      {/* フィールド追加ボタン */}
      <div className="space-y-3">
        <label className="label">フィールドを追加</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {fieldTypes.map((fieldType) => (
            <button
              key={fieldType.type}
              type="button"
              onClick={() => onAddField(fieldType.type)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-3 h-3 rounded-full ${fieldType.color}`} />
              <span className="text-sm text-gray-700">{fieldType.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* フィールドリスト */}
      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">フィールドがありません</p>
          <p className="text-sm text-gray-400 mt-1">
            上のボタンからフィールドを追加してください
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f._key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field._key}
                  field={field}
                  isSelected={selectedFieldId === field._key}
                  onSelect={onSelectField}
                  onEdit={onEditField}
                  onDelete={onDeleteField}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
