import { useState, useEffect } from 'react'
import type { Tag } from '../../../shared/types'
import Modal from '../common/Modal'

interface TagModalProps {
  tag?: Tag | null
  onClose: () => void
  onSave: (tag: Omit<Tag, 'id'> | Tag) => Promise<void>
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
]

export default function TagModal({ tag, onClose, onSave }: TagModalProps) {
  const [name, setName] = useState(tag?.name ?? '')
  const [color, setColor] = useState(tag?.color ?? DEFAULT_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!tag

  useEffect(() => {
    if (tag) {
      setName(tag.name)
      setColor(tag.color)
    }
  }, [tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('タグ名を入力してください')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (isEditing && tag) {
        await onSave({ id: tag.id, name: name.trim(), color })
      } else {
        await onSave({ name: name.trim(), color })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="btn btn-secondary"
        disabled={isSaving}
      >
        キャンセル
      </button>
      <button
        type="submit"
        form="tag-form"
        className="btn btn-primary"
        disabled={isSaving}
      >
        {isSaving ? '保存中...' : '保存'}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'タグを編集' : 'タグを追加'}
      footer={footer}
    >
      <form id="tag-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タグ名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            placeholder="タグ名を入力"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            色 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-8 gap-2">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`色を選択: ${c}`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm text-gray-600">カスタム:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="input w-24 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: color }}
            />
            {name || 'プレビュー'}
          </div>
        </div>
      </form>
    </Modal>
  )
}
