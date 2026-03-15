/**
 * Form Store
 *
 * Zustand store for managing form backend configuration.
 * Supports Formspree, Custom endpoint, Google Forms, and Webhook.
 * Extended with template, clipboard, and toast functionality.
 */

import { create } from 'zustand'
import type { Toast } from '../types/form-templates'

export type FormProvider = 'formspree' | 'custom' | 'google-forms' | 'webhook'

export interface DetectedField {
  readonly name: string
  readonly type: string
  readonly label: string
  readonly required: boolean
  readonly selector: string
}

export interface DetectedForm {
  readonly id: string
  readonly selector: string
  readonly action: string
  readonly method: string
  readonly fields: readonly DetectedField[]
}

export interface FormspreeConfig {
  readonly formId: string
}

export interface CustomConfig {
  readonly actionUrl: string
  readonly method: 'POST' | 'GET'
}

export interface GoogleFormsConfig {
  readonly formUrl: string
  readonly entryMappings: Record<string, string>
}

export interface WebhookConfig {
  readonly url: string
  readonly headers: Record<string, string>
}

export interface HiddenField {
  readonly name: string
  readonly value: string
}

export interface FormConfig {
  readonly formSelector: string
  readonly provider: FormProvider
  readonly formspree: FormspreeConfig
  readonly custom: CustomConfig
  readonly googleForms: GoogleFormsConfig
  readonly webhook: WebhookConfig
  readonly hiddenFields: readonly HiddenField[]
  readonly successAction: 'redirect' | 'message'
  readonly successUrl: string
  readonly successMessage: string
}

interface FormState {
  readonly forms: readonly DetectedForm[]
  readonly configs: Record<string, FormConfig>
  readonly selectedFormId: string | null
  readonly isDirty: boolean
  readonly isLoading: boolean
  readonly error: string | null

  // Template state
  readonly isTemplateSidebarOpen: boolean
  readonly selectedTemplateId: string | null

  // Clipboard state
  readonly clipboardFields: readonly DetectedField[] | null
  readonly canPaste: boolean

  // Toast state
  readonly toasts: readonly Toast[]

  // Actions
  setForms: (forms: readonly DetectedForm[]) => void
  setConfigs: (configs: Record<string, FormConfig>) => void
  selectForm: (formId: string | null) => void
  updateFormConfig: (formId: string, updates: Partial<FormConfig>) => void
  addHiddenField: (formId: string) => void
  removeHiddenField: (formId: string, index: number) => void
  updateHiddenField: (formId: string, index: number, field: HiddenField) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDirty: (dirty: boolean) => void
  reset: () => void

  // Template actions
  setTemplateSidebarOpen: (open: boolean) => void
  selectTemplate: (templateId: string | null) => void

  // Clipboard actions
  setClipboardFields: (fields: readonly DetectedField[] | null) => void
  setCanPaste: (canPaste: boolean) => void

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const defaultFormConfig: FormConfig = {
  formSelector: '',
  provider: 'formspree',
  formspree: { formId: '' },
  custom: { actionUrl: '', method: 'POST' },
  googleForms: { formUrl: '', entryMappings: {} },
  webhook: { url: '', headers: {} },
  hiddenFields: [],
  successAction: 'message',
  successUrl: '',
  successMessage: 'Thank you for your submission.',
}

export const useFormStore = create<FormState>((set) => ({
  forms: [],
  configs: {},
  selectedFormId: null,
  isDirty: false,
  isLoading: false,
  error: null,

  // Template state
  isTemplateSidebarOpen: false,
  selectedTemplateId: null,

  // Clipboard state
  clipboardFields: null,
  canPaste: false,

  // Toast state
  toasts: [],

  setForms: (forms) => set({ forms }),

  setConfigs: (configs) => set({ configs, isDirty: false }),

  selectForm: (formId) => set({ selectedFormId: formId }),

  updateFormConfig: (formId, updates) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [formId]: {
          ...(state.configs[formId] || defaultFormConfig),
          ...updates,
        },
      },
      isDirty: true,
    })),

  addHiddenField: (formId) =>
    set((state) => {
      const current = state.configs[formId] || defaultFormConfig
      return {
        configs: {
          ...state.configs,
          [formId]: {
            ...current,
            hiddenFields: [...current.hiddenFields, { name: '', value: '' }],
          },
        },
        isDirty: true,
      }
    }),

  removeHiddenField: (formId, index) =>
    set((state) => {
      const current = state.configs[formId] || defaultFormConfig
      return {
        configs: {
          ...state.configs,
          [formId]: {
            ...current,
            hiddenFields: current.hiddenFields.filter((_, i) => i !== index),
          },
        },
        isDirty: true,
      }
    }),

  updateHiddenField: (formId, index, field) =>
    set((state) => {
      const current = state.configs[formId] || defaultFormConfig
      return {
        configs: {
          ...state.configs,
          [formId]: {
            ...current,
            hiddenFields: current.hiddenFields.map((f, i) => (i === index ? field : f)),
          },
        },
        isDirty: true,
      }
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Template actions
  setTemplateSidebarOpen: (open) => set({ isTemplateSidebarOpen: open }),
  selectTemplate: (templateId) => set({ selectedTemplateId: templateId }),

  // Clipboard actions
  setClipboardFields: (fields) => set({ clipboardFields: fields }),
  setCanPaste: (canPaste) => set({ canPaste }),

  // Toast actions
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),

  reset: () =>
    set({
      forms: [],
      configs: {},
      selectedFormId: null,
      isDirty: false,
      isLoading: false,
      error: null,
      isTemplateSidebarOpen: false,
      selectedTemplateId: null,
      clipboardFields: null,
      canPaste: false,
      toasts: [],
    }),
}))
