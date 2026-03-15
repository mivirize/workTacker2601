'use client'

import { OptionsEditor } from './OptionsEditor'
import type { FormField, FormFieldType, ValidationRules, FormFieldOption } from '@lp-generator/sanity-schemas/types'

interface FieldPropertiesFormProps {
  field: FormField | null
  onUpdate: (updates: Partial<FormField>) => void
  onAddOption: () => void
  onUpdateOption: (id: string, updates: Partial<FormFieldOption>) => void
  onDeleteOption: (id: string) => void
  onMoveOption: (fromIndex: number, toIndex: number) => void
}

const fieldTypeOptions: Array<{ value: FormFieldType; label: string }> = [
  { value: 'text', label: 'テキスト' },
  { value: 'email', label: 'メールアドレス' },
  { value: 'tel', label: '電話番号' },
  { value: 'number', label: '数値' },
  { value: 'textarea', label: 'テキストエリア' },
  { value: 'select', label: 'セレクトボックス' },
  { value: 'checkbox', label: 'チェックボックス' },
  { value: 'radio', label: 'ラジオボタン' },
]

export function FieldPropertiesForm({
  field,
  onUpdate,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onMoveOption,
}: FieldPropertiesFormProps) {
  if (!field) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">編集するフィールドを選択してください</p>
      </div>
    )
  }

  const hasOptions = ['select', 'checkbox', 'radio'].includes(field.fieldType)
  const hasValidation = ['text', 'email', 'tel', 'number', 'textarea'].includes(field.fieldType)
  const hasMinMax = ['number', 'textarea'].includes(field.fieldType)
  const hasMinMaxLength = ['text', 'email', 'tel', 'textarea'].includes(field.fieldType)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">フィールドプロパティ</h3>
        <p className="text-sm text-gray-500">
          選択したフィールドの設定を編集できます
        </p>
      </div>

      {/* 基本プロパティ */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 border-b pb-2">基本設定</h4>

        <div>
          <label className="label">
            フィールドラベル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.fieldLabel}
            onChange={(e) => onUpdate({ fieldLabel: e.target.value })}
            className="input w-full"
            placeholder="例: お名前"
          />
        </div>

        <div>
          <label className="label">
            フィールド名（name属性） <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.fieldName}
            onChange={(e) => onUpdate({ fieldName: e.target.value })}
            className="input w-full"
            placeholder="例: name"
            pattern="[a-zA-Z0-9_]+"
            title="英数字とアンダースコアのみ使用できます"
          />
          <p className="text-xs text-gray-500 mt-1">
            英数字とアンダースコアのみ使用できます
          </p>
        </div>

        <div>
          <label className="label">フィールドタイプ</label>
          <select
            value={field.fieldType}
            onChange={(e) => onUpdate({ fieldType: e.target.value as FormFieldType })}
            className="input w-full"
          >
            {fieldTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">プレースホルダー</label>
          <input
            type="text"
            value={field.placeholder ?? ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="input w-full"
            placeholder="例: 山田 太郎"
          />
        </div>

        <div>
          <label className="label">デフォルト値</label>
          <input
            type="text"
            value={field.defaultValue ?? ''}
            onChange={(e) => onUpdate({ defaultValue: e.target.value })}
            className="input w-full"
            placeholder="例: 初期値"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={field.required ?? false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="required" className="text-sm text-gray-700">
            必須項目にする
          </label>
        </div>
      </div>

      {/* バリデーション設定 */}
      {hasValidation && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 border-b pb-2">バリデーション設定</h4>

          <div>
            <label className="label">正規表現パターン</label>
            <input
              type="text"
              value={field.validation?.pattern ?? ''}
              onChange={(e) =>
                onUpdate({
                  validation: { ...field.validation, pattern: e.target.value },
                })
              }
              className="input w-full font-mono text-sm"
              placeholder="例: ^[a-zA-Z]+$"
            />
            <p className="text-xs text-gray-500 mt-1">
              入力値の形式を制限する正規表現パターン
            </p>
          </div>

          {hasMinMax && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">最小値</label>
                <input
                  type="number"
                  value={field.validation?.min ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="input w-full"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">最大値</label>
                <input
                  type="number"
                  value={field.validation?.max ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="input w-full"
                  placeholder="100"
                />
              </div>
            </div>
          )}

          {hasMinMaxLength && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">最小文字数</label>
                <input
                  type="number"
                  value={field.validation?.minLength ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        minLength: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="input w-full"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="label">最大文字数</label>
                <input
                  type="number"
                  value={field.validation?.maxLength ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        maxLength: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="input w-full"
                  placeholder="100"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 選択肢設定 */}
      {hasOptions && (
        <OptionsEditor
          options={field.options ?? []}
          onAddOption={onAddOption}
          onUpdateOption={onUpdateOption}
          onDeleteOption={onDeleteOption}
          onMoveOption={onMoveOption}
        />
      )}
    </div>
  )
}
