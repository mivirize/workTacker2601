'use client'

import { useEffect } from 'react'
import { useFormStore } from '@/lib/form/form-store'
import { FormFieldList } from './FormFieldList'
import { FormFieldEditor } from './FormFieldEditor'
import { FormPreview } from './FormPreview'
import { Save, RefreshCw, Eye } from 'lucide-react'
import type { FormBlock } from '@lp-generator/sanity-schemas/types'

interface FormEditorProps {
  formBlock: FormBlock
  onSave: (formBlock: FormBlock) => Promise<void>
  isLoading?: boolean
}

export function FormEditor({ formBlock, onSave, isLoading }: FormEditorProps) {
  const {
    formFields,
    selectedFieldId,
    hasChanges,
    isSaving,
    setFormFields,
    setSelectedFieldId,
    addField,
    updateField,
    deleteField,
    moveField,
    addOption,
    updateOption,
    deleteOption,
    moveOption,
    resetChanges,
    markAsSaved,
    setSaving,
  } = useFormStore()

  // 初期データをロード
  useEffect(() => {
    setFormFields(formBlock.formFields)
  }, [formBlock.formFields, setFormFields])

  const handleSelectField = (id: string) => {
    setSelectedFieldId(id)
  }

  const handleEditField = (id: string) => {
    setSelectedFieldId(id)
  }

  const handleDeleteField = (id: string) => {
    if (confirm('このフィールドを削除してもよろしいですか？')) {
      deleteField(id)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedFormBlock: FormBlock = {
        ...formBlock,
        formFields,
      }
      await onSave(updatedFormBlock)
      markAsSaved()
    } catch (error) {
      console.error('Failed to save form:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormFields(formBlock.formFields)
    resetChanges()
  }

  const selectedField = formFields.find((f) => f._key === selectedFieldId) ?? null

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">フォームエディタ</h3>
          <p className="text-sm text-gray-500 mt-1">
            フォームフィールドの追加・編集・削除ができます
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              disabled={isLoading || isSaving}
            >
              リセット
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary flex items-center gap-2"
            disabled={isLoading || isSaving || !hasChanges}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            変更を保存
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左パネル: フィールド一覧 */}
        <div className="card">
          <FormFieldList
            fields={formFields}
            selectedFieldId={selectedFieldId}
            onSelectField={handleSelectField}
            onEditField={handleEditField}
            onDeleteField={handleDeleteField}
            onMoveField={moveField}
            onAddField={addField}
          />
        </div>

        {/* 右パネル: プロパティ編集 */}
        <div className="card">
          <FormFieldEditor
            selectedField={selectedField}
            onUpdateField={updateField}
            onAddOption={addOption}
            onUpdateOption={updateOption}
            onDeleteOption={deleteOption}
            onMoveOption={moveOption}
          />
        </div>
      </div>

      {/* プレビュー */}
      <div className="card">
        <FormPreview formBlock={{ ...formBlock, formFields }} />
      </div>

      {/* ヒント */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          ヒント
        </h4>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>• フィールドをドラッグして並び替えられます</li>
          <li>• 各フィールドのプロパティを右パネルで編集できます</li>
          <li>• 選択肢を持つフィールド（セレクト、チェックボックス、ラジオボタン）は選択肢を追加・編集できます</li>
          <li>• バリデーションルールを設定して入力値を制限できます</li>
          <li>• 「変更を保存」をクリックして編集を適用してください</li>
        </ul>
      </div>
    </div>
  )
}
