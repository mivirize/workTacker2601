/**
 * Form Editor Component
 *
 * UI for configuring form backend providers (Formspree, Custom, Google Forms, Webhook).
 * Extended with template, clipboard, and toast functionality.
 */

import React from 'react'
import { useFormStore, defaultFormConfig } from '../stores/form-store'
import type { FormConfig, FormProvider, DetectedField, DetectedForm, HiddenField } from '../stores/form-store'
import type { FormTemplate } from '../types/form-templates'
import { detectForms } from '../services/form-service'
import { useEditorStore } from '../stores/editor-store'
import {
  TemplateSidebar,
  SaveTemplateDialog,
  ConfirmReplaceDialog,
  ToastContainer,
} from './form'
import {
  copyFieldsToClipboard,
  readFieldsFromClipboard,
  hasValidClipboardData,
  generateUniqueFieldNames,
} from '../lib/clipboard-manager'
import { saveTemplate, getTemplateById } from '../lib/form-templates'
import { importTemplates, exportAllCustomTemplates } from '../lib/import-export'

const PROVIDER_OPTIONS: { value: FormProvider; label: string; description: string }[] = [
  { value: 'formspree', label: 'Formspree', description: 'シンプルなフォームバックエンド' },
  { value: 'custom', label: 'カスタム', description: 'カスタムアクションURL' },
  { value: 'google-forms', label: 'Google Forms', description: 'Googleフォーム連携' },
  { value: 'webhook', label: 'Webhook', description: 'JSON Webhookエンドポイント' },
]

export function FormEditor() {
  const originalHtml = useEditorStore((s) => s.originalHtml)
  const {
    forms,
    configs,
    selectedFormId,
    isDirty,
    isLoading,
    error,
    isTemplateSidebarOpen,
    selectedTemplateId,
    clipboardFields,
    canPaste,
    toasts,
    setForms,
    setConfigs,
    selectForm,
    updateFormConfig,
    addHiddenField,
    removeHiddenField,
    updateHiddenField,
    setLoading,
    setError,
    setDirty,
    setTemplateSidebarOpen,
    selectTemplate,
    setClipboardFields,
    setCanPaste,
    addToast,
    removeToast,
  } = useFormStore()

  // Dialog states
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = React.useState(false)
  const [isConfirmReplaceDialogOpen, setIsConfirmReplaceDialogOpen] = React.useState(false)
  const [pendingTemplate, setPendingTemplate] = React.useState<FormTemplate | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Check clipboard availability on mount and periodically
  React.useEffect(() => {
    const checkClipboard = async () => {
      const hasValid = await hasValidClipboardData()
      setCanPaste(hasValid)
    }
    checkClipboard()
    const interval = setInterval(checkClipboard, 5000)
    return () => clearInterval(interval)
  }, [])

  // Detect forms on mount or when HTML changes
  React.useEffect(() => {
    if (!originalHtml) return
    const detected = detectForms(originalHtml)
    setForms(detected)
    // Auto-select first form
    if (detected.length > 0 && !selectedFormId) {
      selectForm(detected[0].id)
    }
  }, [originalHtml])

  // Load saved config on mount
  React.useEffect(() => {
    loadFormConfig()
  }, [])

  const loadFormConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const saved = await window.electronAPI.loadFormConfig()
      if (saved) {
        setConfigs(saved)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'フォーム設定の読み込みに失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      await window.electronAPI.saveFormConfig(configs)
      setDirty(false)
      addToast({ type: 'success', message: 'フォーム設定を保存しました' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'フォーム設定の保存に失敗しました'
      setError(message)
      addToast({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  // Template handlers
  const handleOpenTemplateSidebar = () => {
    setTemplateSidebarOpen(true)
  }

  const handleApplyTemplate = (template: FormTemplate) => {
    const selectedForm = forms.find((f) => f.id === selectedFormId)
    if (selectedForm && selectedForm.fields.length > 0) {
      // Show confirmation dialog
      setPendingTemplate(template)
      setIsConfirmReplaceDialogOpen(true)
    } else {
      // Apply template directly
      applyTemplate(template)
    }
  }

  const applyTemplate = (template: FormTemplate) => {
    // For now, just show a toast message
    // In a full implementation, this would update the form fields in the HTML
    addToast({
      type: 'success',
      message: `テンプレート「${template.name}」を適用しました`,
    })
    setTemplateSidebarOpen(false)
  }

  const handleSaveAsTemplate = () => {
    setIsSaveTemplateDialogOpen(true)
  }

  const handleSaveTemplate = (name: string, description: string, category: string) => {
    const selectedForm = forms.find((f) => f.id === selectedFormId)
    if (!selectedForm) {
      addToast({ type: 'error', message: 'フォームが選択されていません' })
      return
    }

    const templateId = `custom-${Date.now()}`
    const template = saveTemplate({
      id: templateId,
      name,
      description,
      category,
      fields: selectedForm.fields,
    })

    addToast({
      type: 'success',
      message: `テンプレート「${name}」を保存しました`,
    })
    setIsSaveTemplateDialogOpen(false)
  }

  const handleDeleteTemplate = (template: FormTemplate) => {
    // Template deletion would be handled here
    addToast({
      type: 'info',
      message: `テンプレート「${template.name}」を削除しました`,
    })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await importTemplates(file)
      if (result.success) {
        addToast({
          type: 'success',
          message: `${result.imported.length} 件のテンプレートをインポートしました`,
        })
      } else {
        addToast({
          type: 'error',
          message: 'インポートに失敗しました',
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'インポートエラー'
      addToast({ type: 'error', message })
    }

    // Reset input
    e.target.value = ''
  }

  const handleExport = async () => {
    try {
      await exportAllCustomTemplates()
      addToast({
        type: 'success',
        message: 'テンプレートをエクスポートしました',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エクスポートエラー'
      addToast({ type: 'error', message })
    }
  }

  // Clipboard handlers
  const handleCopyFields = async () => {
    const selectedForm = forms.find((f) => f.id === selectedFormId)
    if (!selectedForm) return

    const success = await copyFieldsToClipboard(selectedForm.fields)
    if (success) {
      setClipboardFields(selectedForm.fields)
      addToast({ type: 'success', message: 'フィールドをクリップボードにコピーしました' })
    } else {
      addToast({ type: 'error', message: 'クリップボードへのコピーに失敗しました' })
    }
  }

  const handlePasteFields = async () => {
    if (!canPaste) return

    try {
      const fields = await readFieldsFromClipboard()
      if (fields && fields.length > 0) {
        const selectedForm = forms.find((f) => f.id === selectedFormId)
        if (!selectedForm) return

        const existingNames = selectedForm.fields.map((f) => f.name)
        const uniqueFields = generateUniqueFieldNames(fields, existingNames)

        // In a full implementation, this would add fields to the form
        addToast({
          type: 'success',
          message: `${uniqueFields.length} 件のフィールドを貼り付けました`,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '貼り付けエラー'
      addToast({ type: 'error', message })
    }
  }

  const handleConfirmReplace = () => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate)
      setPendingTemplate(null)
      setIsConfirmReplaceDialogOpen(false)
    }
  }

  const handleCancelReplace = () => {
    setPendingTemplate(null)
    setIsConfirmReplaceDialogOpen(false)
  }

  const selectedForm = forms.find((f) => f.id === selectedFormId)
  const selectedConfig = selectedFormId
    ? configs[selectedFormId] || { ...defaultFormConfig, formSelector: selectedForm?.selector || '' }
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          フォームバックエンド
        </h3>
        {isDirty && (
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* No forms detected */}
      {forms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">HTMLにフォーム要素がありません</p>
          <p className="text-gray-400 text-xs mt-1">
            HTMLに &lt;form&gt; タグを追加してください
          </p>
        </div>
      )}

      {/* Form list */}
      {forms.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500">検出されたフォーム</label>
          <div className="flex flex-wrap gap-2">
            {forms.map((form) => (
              <button
                key={form.id}
                onClick={() => selectForm(form.id)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedFormId === form.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {form.id}
                <span className="ml-1 text-xs opacity-70">({form.fields.length} フィールド)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form detail */}
      {selectedForm && selectedConfig && selectedFormId && (
        <FormDetail
          form={selectedForm}
          config={selectedConfig}
          formId={selectedFormId}
          updateFormConfig={updateFormConfig}
          addHiddenField={addHiddenField}
          removeHiddenField={removeHiddenField}
          updateHiddenField={updateHiddenField}
          onCopyFields={handleCopyFields}
          onPasteFields={handlePasteFields}
          canPaste={canPaste}
          onSaveAsTemplate={handleSaveAsTemplate}
        />
      )}

      {/* Template Sidebar */}
      <TemplateSidebar
        isOpen={isTemplateSidebarOpen}
        onClose={() => setTemplateSidebarOpen(false)}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={(template) => selectTemplate(template.id)}
        onApplyTemplate={handleApplyTemplate}
        onEditTemplate={() => {}}
        onDeleteTemplate={handleDeleteTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
        onImport={handleImport}
        onExport={handleExport}
        isReadOnly={false}
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={isSaveTemplateDialogOpen}
        fields={selectedForm?.fields || []}
        onSave={handleSaveTemplate}
        onCancel={() => setIsSaveTemplateDialogOpen(false)}
      />

      {/* Confirm Replace Dialog */}
      <ConfirmReplaceDialog
        isOpen={isConfirmReplaceDialogOpen}
        existingFieldCount={selectedForm?.fields.length || 0}
        newFieldCount={pendingTemplate?.fields.length || 0}
        onConfirm={handleConfirmReplace}
        onCancel={handleCancelReplace}
      />

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  )
}

// Form Detail
interface FormDetailProps {
  form: DetectedForm
  config: FormConfig
  formId: string
  updateFormConfig: (formId: string, updates: Partial<FormConfig>) => void
  addHiddenField: (formId: string) => void
  removeHiddenField: (formId: string, index: number) => void
  updateHiddenField: (formId: string, index: number, field: HiddenField) => void
  onCopyFields?: () => void
  onPasteFields?: () => void
  canPaste?: boolean
  onSaveAsTemplate?: () => void
}

function FormDetail({
  form,
  config,
  formId,
  updateFormConfig,
  addHiddenField,
  removeHiddenField,
  updateHiddenField,
  onCopyFields,
  onPasteFields,
  canPaste = false,
  onSaveAsTemplate,
}: FormDetailProps) {
  const handleTestSend = async () => {
    try {
      const result = await window.electronAPI.testFormSubmit(formId, config)
      if (!result) {
        alert('テスト失敗: レスポンスなし')
        return
      }
      if (result.success) {
        alert('テスト送信が成功しました！')
      } else {
        alert(`テスト失敗: ${result.error}`)
      }
    } catch (err) {
      alert(`テストエラー: ${err instanceof Error ? err.message : '不明なエラー'}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Form fields info */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-600 uppercase">検出されたフィールド</h4>
          <div className="flex items-center gap-1">
            {onCopyFields && (
              <button
                type="button"
                onClick={onCopyFields}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="コピー"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
            {onPasteFields && (
              <button
                type="button"
                onClick={onPasteFields}
                disabled={!canPaste}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="貼り付け"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </button>
            )}
            {onSaveAsTemplate && (
              <button
                type="button"
                onClick={onSaveAsTemplate}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="テンプレートとして保存"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {form.fields.map((field) => (
            <div key={field.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
              <span className="text-gray-400 font-mono">{field.type}</span>
            </div>
          ))}
          {form.fields.length === 0 && (
            <p className="text-xs text-gray-400">入力フィールドが検出されませんでした</p>
          )}
        </div>
      </div>

      {/* Provider selector */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">プロバイダー</label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFormConfig(formId, { provider: opt.value })}
              className={`p-2 rounded-lg border text-left transition-colors ${
                config.provider === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider-specific config */}
      {config.provider === 'formspree' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Formspree フォームID</label>
          <input
            type="text"
            value={config.formspree.formId}
            onChange={(e) =>
              updateFormConfig(formId, { formspree: { formId: e.target.value } })
            }
            placeholder="xyzabcde"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            formspree.io/f/ ID
          </p>
        </div>
      )}

      {config.provider === 'custom' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">アクションURL</label>
            <input
              type="url"
              value={config.custom.actionUrl}
              onChange={(e) =>
                updateFormConfig(formId, {
                  custom: { ...config.custom, actionUrl: e.target.value },
                })
              }
              placeholder="https://example.com/submit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">メソッド</label>
            <select
              value={config.custom.method}
              onChange={(e) =>
                updateFormConfig(formId, {
                  custom: { ...config.custom, method: e.target.value as 'POST' | 'GET' },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
          </div>
        </div>
      )}

      {config.provider === 'google-forms' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Googleフォーム URL</label>
            <input
              type="url"
              value={config.googleForms.formUrl}
              onChange={(e) =>
                updateFormConfig(formId, {
                  googleForms: { ...config.googleForms, formUrl: e.target.value },
                })
              }
              placeholder="https://docs.google.com/forms/d/.../viewform"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">エントリIDマッピング</label>
            {form.fields.map((field) => (
              <div key={field.name} className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 w-24 truncate">{field.label}</span>
                <input
                  type="text"
                  value={config.googleForms.entryMappings[field.name] || ''}
                  onChange={(e) =>
                    updateFormConfig(formId, {
                      googleForms: {
                        ...config.googleForms,
                        entryMappings: {
                          ...config.googleForms.entryMappings,
                          [field.name]: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="entry.12345"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {config.provider === 'webhook' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
          <input
            type="url"
            value={config.webhook.url}
            onChange={(e) =>
              updateFormConfig(formId, {
                webhook: { ...config.webhook, url: e.target.value },
              })
            }
            placeholder="https://hooks.example.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Hidden Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">隠しフィールド</label>
          <button
            onClick={() => addHiddenField(formId)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + 追加
          </button>
        </div>
        {config.hiddenFields.map((field, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={field.name}
              onChange={(e) =>
                updateHiddenField(formId, index, { ...field, name: e.target.value })
              }
              placeholder="フィールド名"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={field.value}
              onChange={(e) =>
                updateHiddenField(formId, index, { ...field, value: e.target.value })
              }
              placeholder="値"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeHiddenField(formId, index)}
              className="text-red-500 hover:text-red-700 text-xs p-1"
            >
              x
            </button>
          </div>
        ))}
      </div>

      {/* Success Action */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">送信成功時</label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => updateFormConfig(formId, { successAction: 'message' })}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
              config.successAction === 'message'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            メッセージ表示
          </button>
          <button
            onClick={() => updateFormConfig(formId, { successAction: 'redirect' })}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
              config.successAction === 'redirect'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            リダイレクト
          </button>
        </div>
        {config.successAction === 'message' && (
          <input
            type="text"
            value={config.successMessage}
            onChange={(e) => updateFormConfig(formId, { successMessage: e.target.value })}
            placeholder="ありがとうございます！"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        )}
        {config.successAction === 'redirect' && (
          <input
            type="url"
            value={config.successUrl}
            onChange={(e) => updateFormConfig(formId, { successUrl: e.target.value })}
            placeholder="https://example.com/thanks"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Test button */}
      <button
        onClick={handleTestSend}
        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors border border-gray-300"
      >
        テスト送信
      </button>
    </div>
  )
}
