import { useState } from 'react'
import type { Category, CategoryRule, Tag } from '../../../shared/types'
import TagSelector from '../tags/TagSelector'
import Modal from '../common/Modal'

export interface CategoryModalProps {
  category?: Category
  tags: Tag[]
  onClose: () => void
  onSave: (category: Omit<Category, 'id'> | Category) => void
}

export default function CategoryModal({ category, tags, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? '#3b82f6')
  const [rules, setRules] = useState<CategoryRule[]>(category?.rules ?? [])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(category?.tagIds ?? [])

  const handleAddRule = () => {
    setRules([...rules, { type: 'app', pattern: '', isRegex: false }])
  }

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleRuleChange = (
    index: number,
    field: keyof CategoryRule,
    value: string | boolean | number[]
  ) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const categoryData = {
      name: name.trim(),
      color,
      rules: rules.filter((r) => r.pattern.trim()),
      isDefault: category?.isDefault ?? false,
      tagIds: selectedTagIds,
    }

    if (category) {
      onSave({ ...categoryData, id: category.id })
    } else {
      onSave(categoryData)
    }
  }

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary">
        キャンセル
      </button>
      <button type="submit" form="category-form" className="btn btn-primary">
        保存
      </button>
    </>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={category ? 'カテゴリを編集' : '新規カテゴリ'}
      size="lg"
      scrollable
      footer={footer}
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">カテゴリ名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="例: 開発"
                required
              />
            </div>

            <div>
              <label className="label">色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="input flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <label className="label">デフォルトタグ</label>
              <p className="text-sm text-gray-500 mb-2">
                このカテゴリのアクティビティに自動で付与されるタグ
              </p>
              <TagSelector
                tags={tags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
                placeholder="タグを選択..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">マッチングルール</label>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + ルールを追加
                </button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={rule.type}
                        onChange={(e) =>
                          handleRuleChange(
                            index,
                            'type',
                            e.target.value as CategoryRule['type']
                          )
                        }
                        className="input w-24"
                      >
                        <option value="app">アプリ</option>
                        <option value="title">タイトル</option>
                        <option value="url">URL</option>
                      </select>
                      <input
                        type="text"
                        value={rule.pattern}
                        onChange={(e) =>
                          handleRuleChange(index, 'pattern', e.target.value)
                        }
                        className="input flex-1"
                        placeholder="パターン"
                      />
                      <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={rule.isRegex}
                          onChange={(e) =>
                            handleRuleChange(index, 'isRegex', e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        正規表現
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">ルール専用タグ（任意）</label>
                      <TagSelector
                        tags={tags}
                        selectedTagIds={rule.tagIds ?? []}
                        onChange={(tagIds) => handleRuleChange(index, 'tagIds', tagIds)}
                        placeholder="このルール専用のタグ..."
                      />
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">
                    ルールがありません
                  </p>
                )}
              </div>
            </div>
          </form>
    </Modal>
  )
}
