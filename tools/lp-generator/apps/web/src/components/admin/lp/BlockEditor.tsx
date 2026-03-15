'use client'

import { useState, useCallback } from 'react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2, Save, RefreshCw } from 'lucide-react'

interface Block {
  _key: string
  _type: string
  [key: string]: unknown
}

interface BlockEditorProps {
  blocks: Block[]
  onSave: (blocks: Block[]) => Promise<void>
  isLoading?: boolean
}

const blockTypeLabels: Record<string, string> = {
  heroBlock: 'ヒーロー',
  featureBlock: '特徴',
  benefitBlock: 'メリット',
  testimonialBlock: 'お客様の声',
  faqBlock: 'FAQ',
  pricingBlock: '料金',
  ctaBlock: 'CTA',
  formBlock: 'フォーム',
  imageGalleryBlock: 'ギャラリー',
  videoBlock: '動画',
  textBlock: 'テキスト',
}

const blockTypeColors: Record<string, string> = {
  heroBlock: 'bg-purple-100 text-purple-700 border-purple-200',
  featureBlock: 'bg-blue-100 text-blue-700 border-blue-200',
  benefitBlock: 'bg-green-100 text-green-700 border-green-200',
  testimonialBlock: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  faqBlock: 'bg-orange-100 text-orange-700 border-orange-200',
  pricingBlock: 'bg-pink-100 text-pink-700 border-pink-200',
  ctaBlock: 'bg-red-100 text-red-700 border-red-200',
  formBlock: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  imageGalleryBlock: 'bg-teal-100 text-teal-700 border-teal-200',
  videoBlock: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  textBlock: 'bg-gray-100 text-gray-700 border-gray-200',
}

interface SortableBlockProps {
  block: Block
  onToggleVisibility: (key: string) => void
  onDelete: (key: string) => void
  isHidden: boolean
}

function SortableBlock({ block, onToggleVisibility, onDelete, isHidden }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block._key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const blockTitle = getBlockTitle(block)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white rounded-lg border shadow-sm ${
        isDragging ? 'shadow-lg' : ''
      } ${isHidden ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        title="ドラッグして並び替え"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <span className={`px-2 py-1 text-xs font-medium rounded border ${blockTypeColors[block._type] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {blockTypeLabels[block._type] ?? block._type}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{blockTitle}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleVisibility(block._key)}
          className={`p-2 rounded-lg transition-colors ${
            isHidden
              ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={isHidden ? 'ブロックを表示' : 'ブロックを非表示'}
        >
          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(block._key)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="ブロックを削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function getBlockTitle(block: Block): string {
  if (block._type === 'heroBlock' && block.headline) {
    return String(block.headline).slice(0, 50)
  }
  if (block.sectionTitle) {
    return String(block.sectionTitle).slice(0, 50)
  }
  if (block.title) {
    return String(block.title).slice(0, 50)
  }
  return blockTypeLabels[block._type] ?? 'Block'
}

export function BlockEditor({ blocks: initialBlocks, onSave, isLoading }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [hiddenBlocks, setHiddenBlocks] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item._key === active.id)
        const newIndex = items.findIndex((item) => item._key === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }, [])

  const handleToggleVisibility = useCallback((key: string) => {
    setHiddenBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    setHasChanges(true)
  }, [])

  const handleDelete = useCallback((key: string) => {
    if (confirm('このブロックを削除してもよろしいですか？')) {
      setBlocks((prev) => prev.filter((block) => block._key !== key))
      setHiddenBlocks((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setHasChanges(true)
    }
  }, [])

  const handleSave = useCallback(async () => {
    const visibleBlocks = blocks.filter((block) => !hiddenBlocks.has(block._key))
    await onSave(visibleBlocks)
    setHasChanges(false)
  }, [blocks, hiddenBlocks, onSave])

  const handleReset = useCallback(() => {
    setBlocks(initialBlocks)
    setHiddenBlocks(new Set())
    setHasChanges(false)
  }, [initialBlocks])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ブロックエディタ</h3>
          <p className="text-sm text-gray-500 mt-1">
            ドラッグして並び替え。非表示のブロックは公開ページに表示されません。
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              リセット
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary flex items-center gap-2"
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            変更を保存
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">このランディングページにはブロックがありません。</p>
          <p className="text-sm text-gray-400 mt-1">
            ヒアリングから再生成するか、Sanity Studioでブロックを追加してください。
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b._key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {blocks.map((block) => (
                <SortableBlock
                  key={block._key}
                  block={block}
                  onToggleVisibility={handleToggleVisibility}
                  onDelete={handleDelete}
                  isHidden={hiddenBlocks.has(block._key)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800">ヒント</h4>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>左側のハンドルをドラッグしてブロックを並び替えられます</li>
          <li>目のアイコンをクリックしてブロックを一時的に非表示にできます</li>
          <li>「変更を保存」をクリックして編集を適用してください</li>
          <li>高度な編集にはSanity Studioをご利用ください</li>
        </ul>
      </div>
    </div>
  )
}
