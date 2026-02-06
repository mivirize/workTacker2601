import { useState } from 'react'
import type { Goal, GoalType, Category } from '../../../shared/types'
import Modal from '../common/Modal'

export interface GoalModalProps {
  goal?: Goal
  categories: Category[]
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id'> | Goal) => void
}

export default function GoalModal({ goal, categories, onClose, onSave }: GoalModalProps) {
  const [type, setType] = useState<GoalType>(goal?.type ?? 'daily')
  const [hours, setHours] = useState(Math.floor((goal?.targetMinutes ?? 480) / 60))
  const [minutes, setMinutes] = useState((goal?.targetMinutes ?? 0) % 60)
  const [categoryId, setCategoryId] = useState<number | null>(goal?.categoryId ?? null)
  const [isEnabled, setIsEnabled] = useState(goal?.isEnabled ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetMinutes = hours * 60 + minutes
    if (targetMinutes <= 0) return

    const goalData = {
      type,
      targetMinutes,
      categoryId: type === 'category' ? categoryId : null,
      isEnabled,
    }

    if (goal) {
      onSave({ ...goalData, id: goal.id })
    } else {
      onSave(goalData)
    }
  }

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary">
        キャンセル
      </button>
      <button type="submit" form="goal-form" className="btn btn-primary">
        保存
      </button>
    </>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={goal ? '目標を編集' : '新規目標'}
      footer={footer}
    >
      <form id="goal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">目標タイプ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as GoalType)}
            className="input"
          >
            <option value="daily">1日の作業目標</option>
            <option value="weekly">週間の作業目標</option>
            <option value="category">カテゴリ別目標</option>
          </select>
        </div>

        {type === 'category' && (
          <div>
            <label className="label">対象カテゴリ</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
              className="input"
              required
            >
              <option value="">選択してください</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">目標時間</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="input w-20 text-center"
              min="0"
              max="24"
            />
            <span className="text-gray-600">時間</span>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="input w-20 text-center"
              min="0"
              max="59"
            />
            <span className="text-gray-600">分</span>
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">この目標を有効にする</span>
        </label>
      </form>
    </Modal>
  )
}
