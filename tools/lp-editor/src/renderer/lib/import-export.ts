/**
 * Import/Export Utility
 *
 * Utilities for importing and exporting form field templates.
 */

import type { ExportData, ImportResult, FormTemplate } from '../types/form-templates'
import { saveTemplate, getCustomTemplates } from './form-templates'
import { PREDEFINED_TEMPLATES } from './predefined-templates'

const EXPORT_VERSION = '1.0.0'

/**
 * Export templates to JSON file
 */
export const exportTemplates = async (templateIds: string[]): Promise<void> => {
  const allTemplates = [...PREDEFINED_TEMPLATES, ...getCustomTemplates()]
  const templatesToExport = allTemplates.filter((t) => templateIds.includes(t.id))

  if (templatesToExport.length === 0) {
    throw new Error('エクスポートするテンプレートがありません')
  }

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    templates: templatesToExport,
    exportedAt: new Date().toISOString(),
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `form-templates-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import templates from JSON file
 */
export const importTemplates = async (file: File): Promise<ImportResult> => {
  const imported: FormTemplate[] = []
  const skipped: string[] = []
  const errors: string[] = []

  try {
    const text = await file.text()
    const data: unknown = JSON.parse(text)

    // Validate export data structure
    if (!isValidExportData(data)) {
      errors.push('無効なファイル形式です')
      return { success: false, imported: [], skipped: [], errors }
    }

    const exportData = data as ExportData

    // Check version compatibility
    if (exportData.version !== EXPORT_VERSION) {
      errors.push(`バージョン ${exportData.version} はサポートされていません`)
      return { success: false, imported: [], skipped: [], errors }
    }

    // Import each template
    for (const template of exportData.templates) {
      try {
        // Validate template
        const validation = validateTemplate(template)
        if (!validation.valid) {
          errors.push(`"${template.name}": ${validation.errors.join(', ')}`)
          continue
        }

        // Check if template already exists
        const existing = getCustomTemplates().find((t) => t.id === template.id)
        if (existing) {
          skipped.push(template.name)
          continue
        }

        // Save template
        saveTemplate(template)
        imported.push(template)
      } catch (error) {
        const message = error instanceof Error ? error.message : '不明なエラー'
        errors.push(`"${template.name}": ${message}`)
      }
    }

    return {
      success: imported.length > 0,
      imported,
      skipped,
      errors,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー'
    errors.push(message)
    return { success: false, imported: [], skipped: [], errors }
  }
}

/**
 * Validate export data structure
 */
const isValidExportData = (data: unknown): data is ExportData => {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const exportData = data as Record<string, unknown>

  if (typeof exportData.version !== 'string') {
    return false
  }

  if (!Array.isArray(exportData.templates)) {
    return false
  }

  if (typeof exportData.exportedAt !== 'string') {
    return false
  }

  return exportData.templates.every((t) => isValidTemplate(t))
}

/**
 * Validate template structure
 */
const isValidTemplate = (data: unknown): data is FormTemplate => {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const template = data as Record<string, unknown>

  if (typeof template.id !== 'string') {
    return false
  }

  if (typeof template.name !== 'string') {
    return false
  }

  if (typeof template.description !== 'string') {
    return false
  }

  if (template.type !== 'predefined' && template.type !== 'custom') {
    return false
  }

  if (!Array.isArray(template.fields)) {
    return false
  }

  return template.fields.every((f) => isValidField(f))
}

/**
 * Validate field structure
 */
const isValidField = (data: unknown): boolean => {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const field = data as Record<string, unknown>

  if (typeof field.name !== 'string') {
    return false
  }

  if (typeof field.type !== 'string') {
    return false
  }

  if (typeof field.label !== 'string') {
    return false
  }

  if (typeof field.required !== 'boolean') {
    return false
  }

  if (typeof field.selector !== 'string') {
    return false
  }

  return true
}

/**
 * Validate template data
 */
const validateTemplate = (template: FormTemplate): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!template.name || template.name.trim().length === 0) {
    errors.push('テンプレート名は必須です')
  }

  if (!template.description || template.description.trim().length === 0) {
    errors.push('説明は必須です')
  }

  if (!template.fields || template.fields.length === 0) {
    errors.push('少なくとも1つのフィールドが必要です')
  } else {
    template.fields.forEach((field, index) => {
      if (!field.name || field.name.trim().length === 0) {
        errors.push(`フィールド ${index + 1}: フィールド名は必須です`)
      }
      if (!field.label || field.label.trim().length === 0) {
        errors.push(`フィールド ${index + 1}: ラベルは必須です`)
      }
      if (!field.type || field.type.trim().length === 0) {
        errors.push(`フィールド ${index + 1}: タイプは必須です`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Export all custom templates
 */
export const exportAllCustomTemplates = async (): Promise<void> => {
  const customTemplates = getCustomTemplates()
  const templateIds = customTemplates.map((t) => t.id)
  await exportTemplates(templateIds)
}

/**
 * Export selected templates
 */
export const exportSelectedTemplates = async (templateIds: string[]): Promise<void> => {
  await exportTemplates(templateIds)
}
