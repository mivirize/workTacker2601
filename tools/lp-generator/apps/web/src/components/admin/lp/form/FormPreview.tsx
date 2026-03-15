'use client'

import type { FormField, FormBlock as FormBlockType } from '@lp-generator/sanity-schemas/types'

interface FormPreviewProps {
  formBlock: FormBlockType
}

export function FormPreview({ formBlock }: FormPreviewProps) {
  const {
    sectionTitle,
    sectionSubtitle,
    formFields,
    submitButtonText = '送信',
    successMessage = '送信ありがとうございます',
  } = formBlock

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.fieldName,
      name: field.fieldName,
      placeholder: field.placeholder,
      required: field.required,
      defaultValue: field.defaultValue,
      'data-editable': `field:${field.fieldName}`,
    }

    const validationProps = field.validation
      ? {
          pattern: field.validation.pattern,
          min: field.validation.min,
          max: field.validation.max,
          minLength: field.validation.minLength,
          maxLength: field.validation.maxLength,
        }
      : {}

    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            {...validationProps}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
          />
        )

      case 'select':
        return (
          <select
            {...commonProps}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="">{field.placeholder ?? '選択してください'}</option>
            {field.options?.map((option) => (
              <option key={option._key} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option._key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name={field.fieldName}
                  value={option.value}
                  defaultChecked={field.defaultValue === option.value}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  data-editable={`field:${field.fieldName}`}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option._key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.fieldName}
                  value={option.value}
                  defaultChecked={field.defaultValue === option.value}
                  required={field.required}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  data-editable={`field:${field.fieldName}`}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )

      default:
        return (
          <input
            type={field.fieldType}
            {...commonProps}
            {...validationProps}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">フォームプレビュー</h3>
        <p className="text-sm text-gray-500">
          フォームの表示を確認できます
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-500">プレビュー</span>
        </div>

        <div className="p-6 bg-white">
          <section className="max-w-2xl mx-auto">
            {(sectionTitle || sectionSubtitle) && (
              <div className="text-center mb-8">
                {sectionTitle && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {sectionTitle}
                  </h2>
                )}
                {sectionSubtitle && (
                  <p className="text-gray-600">{sectionSubtitle}</p>
                )}
              </div>
            )}

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault()
                alert(successMessage)
              }}
              data-editable="form"
            >
              {formFields.map((field) => (
                <div key={field._key}>
                  {field.fieldType !== 'checkbox' && field.fieldType !== 'radio' && (
                    <label
                      htmlFor={field.fieldName}
                      className="block text-sm font-medium text-gray-700 mb-2"
                      data-editable={`label:${field.fieldName}`}
                    >
                      {field.fieldLabel}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}

                  {field.fieldType === 'checkbox' || field.fieldType === 'radio' ? (
                    <div className="space-y-1">
                      <span className="block text-sm font-medium text-gray-700 mb-2">
                        {field.fieldLabel}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      {renderField(field)}
                    </div>
                  ) : (
                    renderField(field)
                  )}
                </div>
              ))}

              <button
                type="submit"
                className="w-full py-3 px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                {submitButtonText}
              </button>
            </form>
          </section>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800">プレビューについて</h4>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>これは実際の表示を模したプレビューです</li>
          <li>data-editable属性が自動的に付与されます</li>
          <li>送信ボタンはデモ用です</li>
        </ul>
      </div>
    </div>
  )
}
