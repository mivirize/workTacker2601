/**
 * Form Templates Utility
 *
 * Utilities for managing form field templates (save, load, delete).
 */

import type { FormTemplate, TemplateType } from '../types/form-templates'
import { PREDEFINED_TEMPLATES } from './predefined-templates'

const STORAGE_KEY = 'form-templates'

/**
 * Get all templates (predefined + custom)
 */
export const getAllTemplates = (): readonly FormTemplate[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const customTemplates: FormTemplate[] = saved ? JSON.parse(saved) : []
    return [...PREDEFINED_TEMPLATES, ...customTemplates]
  } catch (error) {
    console.error('Failed to load templates:', error)
    return PREDEFINED_TEMPLATES
  }
}

/**
 * Get custom templates only
 */
export const getCustomTemplates = (): readonly FormTemplate[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('Failed to load custom templates:', error)
    return []
  }
}

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): FormTemplate | undefined => {
  return getAllTemplates().find((t) => t.id === id)
}

/**
 * Get templates by type
 */
export const getTemplatesByType = (type: TemplateType): readonly FormTemplate[] => {
  return getAllTemplates().filter((t) => t.type === type)
}

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): readonly FormTemplate[] => {
  return getAllTemplates().filter((t) => t.category === category)
}

/**
 * Get all categories
 */
export const getAllCategories = (): readonly string[] => {
  const categories = new Set(
    getAllTemplates()
      .map((t) => t.category)
      .filter((c): c is string => Boolean(c))
  )
  return Array.from(categories)
}

/**
 * Save a custom template
 */
export const saveTemplate = (template: Omit<FormTemplate, 'type' | 'createdAt' | 'updatedAt'>): FormTemplate => {
  const customTemplates: FormTemplate[] = [...getCustomTemplates()]
  const now = new Date().toISOString()

  // Check if template already exists
  const existingIndex = customTemplates.findIndex((t) => t.id === template.id)

  const newTemplate: FormTemplate = {
    ...template,
    type: 'custom',
    createdAt: existingIndex >= 0 ? customTemplates[existingIndex].createdAt : now,
    updatedAt: now,
  }

  if (existingIndex >= 0) {
    // Update existing template
    customTemplates[existingIndex] = newTemplate
  } else {
    // Add new template
    customTemplates.push(newTemplate)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates))
  return newTemplate
}

/**
 * Delete a custom template
 */
export const deleteTemplate = (id: string): boolean => {
  const customTemplates = getCustomTemplates()
  const filtered = customTemplates.filter((t) => t.id !== id)

  if (filtered.length === customTemplates.length) {
    return false // Template not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * Check if template is predefined
 */
export const isPredefinedTemplate = (id: string): boolean => {
  return PREDEFINED_TEMPLATES.some((t) => t.id === id)
}

/**
 * Check if template is custom
 */
export const isCustomTemplate = (id: string): boolean => {
  return !isPredefinedTemplate(id)
}

/**
 * Generate a unique template ID
 */
export const generateTemplateId = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const customTemplates = getCustomTemplates()
  let counter = 1
  let id = base

  while (customTemplates.some((t) => t.id === id) || PREDEFINED_TEMPLATES.some((t) => t.id === id)) {
    id = `${base}-${counter}`
    counter++
  }

  return id
}

/**
 * Validate template data
 */
export const validateTemplate = (template: Partial<FormTemplate>): { valid: boolean; errors: string[] } => {
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
