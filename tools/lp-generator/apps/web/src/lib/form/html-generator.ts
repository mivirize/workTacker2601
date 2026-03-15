import type { FormField, FormBlock } from '@lp-generator/sanity-schemas/types'

/**
 * フォームフィールドからHTML要素を生成する関数
 */
export function generateFieldHtml(field: FormField): string {
  const commonAttrs = {
    id: field.fieldName,
    name: field.fieldName,
    placeholder: field.placeholder ?? '',
    required: field.required ? 'required' : '',
    'data-editable': `field:${field.fieldName}`,
  }

  const validationAttrs: Record<string, string> = {}
  if (field.validation) {
    if (field.validation.pattern) validationAttrs.pattern = field.validation.pattern
    if (field.validation.min !== undefined) validationAttrs.min = field.validation.min.toString()
    if (field.validation.max !== undefined) validationAttrs.max = field.validation.max.toString()
    if (field.validation.minLength !== undefined) validationAttrs.minLength = field.validation.minLength.toString()
    if (field.validation.maxLength !== undefined) validationAttrs.maxLength = field.validation.maxLength.toString()
  }

  const attrsToString = (attrs: Record<string, string>) => {
    return Object.entries(attrs)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')
  }

  const labelHtml = field.fieldType !== 'checkbox' && field.fieldType !== 'radio'
    ? `<label for="${field.fieldName}" class="form-label" data-editable="label:${field.fieldName}">
        ${field.fieldLabel}
        ${field.required ? '<span class="required">*</span>' : ''}
      </label>`
    : `<span class="form-label">${field.fieldLabel}${field.required ? '<span class="required">*</span>' : ''}</span>`

  switch (field.fieldType) {
    case 'textarea':
      return `
        <div class="form-field" data-editable="field:${field.fieldName}">
          ${labelHtml}
          <textarea
            ${attrsToString(commonAttrs)}
            ${attrsToString(validationAttrs)}
            rows="4"
            class="form-input"
          ></textarea>
        </div>
      `

    case 'select':
      const optionsHtml = field.options?.map((option) =>
        `<option value="${option.value}">${option.label}</option>`
      ).join('') ?? ''

      return `
        <div class="form-field" data-editable="field:${field.fieldName}">
          ${labelHtml}
          <select ${attrsToString(commonAttrs)} class="form-select">
            <option value="">${field.placeholder ?? '選択してください'}</option>
            ${optionsHtml}
          </select>
        </div>
      `

    case 'checkbox':
      const checkboxOptionsHtml = field.options?.map((option) =>
        `<label class="checkbox-label">
          <input
            type="checkbox"
            name="${field.fieldName}"
            value="${option.value}"
            ${field.defaultValue === option.value ? 'checked' : ''}
            data-editable="field:${field.fieldName}"
          />
          <span>${option.label}</span>
        </label>`
      ).join('') ?? ''

      return `
        <div class="form-field" data-editable="field:${field.fieldName}">
          ${labelHtml}
          <div class="checkbox-group">
            ${checkboxOptionsHtml}
          </div>
        </div>
      `

    case 'radio':
      const radioOptionsHtml = field.options?.map((option) =>
        `<label class="radio-label">
          <input
            type="radio"
            name="${field.fieldName}"
            value="${option.value}"
            ${field.required ? 'required' : ''}
            ${field.defaultValue === option.value ? 'checked' : ''}
            data-editable="field:${field.fieldName}"
          />
          <span>${option.label}</span>
        </label>`
      ).join('') ?? ''

      return `
        <div class="form-field" data-editable="field:${field.fieldName}">
          ${labelHtml}
          <div class="radio-group">
            ${radioOptionsHtml}
          </div>
        </div>
      `

    default:
      return `
        <div class="form-field" data-editable="field:${field.fieldName}">
          ${labelHtml}
          <input
            type="${field.fieldType}"
            ${attrsToString(commonAttrs)}
            ${attrsToString(validationAttrs)}
            value="${field.defaultValue ?? ''}"
            class="form-input"
          />
        </div>
      `
  }
}

/**
 * フォームブロックからHTMLフォームを生成する関数
 */
export function generateFormHtml(formBlock: FormBlock): string {
  const {
    sectionTitle,
    sectionSubtitle,
    formFields,
    submitButtonText = '送信',
  } = formBlock

  const fieldsHtml = formFields.map((field) => generateFieldHtml(field)).join('\n')

  const headerHtml = (sectionTitle || sectionSubtitle)
    ? `
      <div class="form-header">
        ${sectionTitle ? `<h2 class="form-title">${sectionTitle}</h2>` : ''}
        ${sectionSubtitle ? `<p class="form-subtitle">${sectionSubtitle}</p>` : ''}
      </div>
    `
    : ''

  return `
    <form class="contact-form" data-editable="form">
      ${headerHtml}
      <div class="form-fields">
        ${fieldsHtml}
      </div>
      <button type="submit" class="form-submit">${submitButtonText}</button>
    </form>
  `
}

/**
 * HTMLからフォームフィールド定義を抽出する関数
 * 注意: これは簡易的な実装であり、完全なHTML解析にはDOMパーサーが必要です
 */
export function extractFieldsFromHtml(html: string): Partial<FormField>[] {
  const fields: Partial<FormField>[] = []

  // 簡易的な正規表現による抽出
  const inputRegex = /<input[^>]*data-editable="field:([^"]+)"[^>]*>/g
  const textareaRegex = /<textarea[^>]*data-editable="field:([^"]+)"[^>]*>/g
  const selectRegex = /<select[^>]*data-editable="field:([^"]+)"[^>]*>/g

  const extractField = (match: RegExpExecArray, type: string): Partial<FormField> => {
    const fieldName = match[1]
    const element = match[0]

    // 属性を抽出
    const placeholderMatch = element.match(/placeholder="([^"]*)"/)
    const requiredMatch = element.match(/required/)
    const typeMatch = element.match(/type="([^"]*)"/)

    return {
      fieldName,
      fieldLabel: fieldName, // ラベルは別途抽出が必要
      fieldType: (typeMatch?.[1] || type) as FormField['fieldType'],
      placeholder: placeholderMatch?.[1],
      required: !!requiredMatch,
    }
  }

  let match
  while ((match = inputRegex.exec(html)) !== null) {
    fields.push(extractField(match, 'text'))
  }

  while ((match = textareaRegex.exec(html)) !== null) {
    fields.push(extractField(match, 'textarea'))
  }

  while ((match = selectRegex.exec(html)) !== null) {
    fields.push(extractField(match, 'select'))
  }

  return fields
}

/**
 * data-editable属性をHTML要素に自動付与する関数
 */
export function addEditableAttributes(html: string, formBlock: FormBlock): string {
  let result = html

  // フォーム要素にdata-editable属性を付与
  result = result.replace(
    /<form([^>]*)>/g,
    '<form$1 data-editable="form">'
  )

  // 各フィールドにdata-editable属性を付与
  formBlock.formFields.forEach((field) => {
    // ラベル要素
    result = result.replace(
      new RegExp(`<label\\s+for=["']${field.fieldName}["']([^>]*)>`, 'g'),
      `<label for="${field.fieldName}"$1 data-editable="label:${field.fieldName}">`
    )

    // 入力要素
    const inputPattern = new RegExp(
      `<input([^>]*name=["']${field.fieldName}["'][^>]*)>`,
      'g'
    )
    result = result.replace(
      inputPattern,
      `<input$1 data-editable="field:${field.fieldName}">`
    )

    // テキストエリア
    const textareaPattern = new RegExp(
      `<textarea([^>]*name=["']${field.fieldName}["'][^>]*)>`,
      'g'
    )
    result = result.replace(
      textareaPattern,
      `<textarea$1 data-editable="field:${field.fieldName}">`
    )

    // セレクト
    const selectPattern = new RegExp(
      `<select([^>]*name=["']${field.fieldName}["'][^>]*)>`,
      'g'
    )
    result = result.replace(
      selectPattern,
      `<select$1 data-editable="field:${field.fieldName}">`
    )
  })

  return result
}

/**
 * フォームフィールドのバリデーション属性をHTML属性に変換する関数
 */
export function validationToHtmlAttributes(validation?: FormField['validation']): Record<string, string> {
  if (!validation) return {}

  const attrs: Record<string, string> = {}

  if (validation.pattern) attrs.pattern = validation.pattern
  if (validation.min !== undefined) attrs.min = validation.min.toString()
  if (validation.max !== undefined) attrs.max = validation.max.toString()
  if (validation.minLength !== undefined) attrs.minLength = validation.minLength.toString()
  if (validation.maxLength !== undefined) attrs.maxLength = validation.maxLength.toString()

  return attrs
}
