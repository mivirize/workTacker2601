/**
 * Form Templates Types
 *
 * Type definitions for form field templates, clipboard, and import/export functionality.
 */

import type { DetectedField } from '../stores/form-store'

/**
 * Template type
 */
export type TemplateType = 'predefined' | 'custom'

/**
 * Form field template
 */
export interface FormTemplate {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly type: TemplateType
  readonly fields: readonly DetectedField[]
  readonly category?: string
  readonly createdAt?: string
  readonly updatedAt?: string
}

/**
 * Clipboard data for form fields
 */
export interface ClipboardData {
  readonly fields: readonly DetectedField[]
  readonly timestamp: number
  readonly source?: string
}

/**
 * Export data for form templates
 */
export interface ExportData {
  readonly version: string
  readonly templates: readonly FormTemplate[]
  readonly exportedAt: string
}

/**
 * Import result
 */
export interface ImportResult {
  readonly success: boolean
  readonly imported: readonly FormTemplate[]
  readonly skipped: readonly string[]
  readonly errors: readonly string[]
}

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

/**
 * Toast notification
 */
export interface Toast {
  readonly id: string
  readonly type: ToastType
  readonly message: string
  readonly duration?: number
}
