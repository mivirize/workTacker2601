import { create } from 'zustand'
import type { FormField, FormFieldType, FormFieldOption, ValidationRules } from '@lp-generator/sanity-schemas/types'

interface FormEditorState {
  formFields: FormField[]
  selectedFieldId: string | null
  hasChanges: boolean
  isSaving: boolean
  setFormFields: (fields: FormField[]) => void
  setSelectedFieldId: (id: string | null) => void
  addField: (type: FormFieldType) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  deleteField: (id: string) => void
  moveField: (fromIndex: number, toIndex: number) => void
  addOption: (fieldId: string) => void
  updateOption: (fieldId: string, optionId: string, updates: Partial<FormFieldOption>) => void
  deleteOption: (fieldId: string, optionId: string) => void
  moveOption: (fieldId: string, fromIndex: number, toIndex: number) => void
  resetChanges: () => void
  markAsSaved: () => void
  setSaving: (saving: boolean) => void
}

const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const getDefaultFieldConfig = (type: FormFieldType): Omit<FormField, '_key'> => {
  const configs: Record<FormFieldType, Omit<FormField, '_key'>> = {
    text: {
      fieldName: 'field_name',
      fieldLabel: 'フィールド名',
      fieldType: 'text',
      placeholder: '入力してください',
      required: false,
    },
    email: {
      fieldName: 'email',
      fieldLabel: 'メールアドレス',
      fieldType: 'email',
      placeholder: 'example@example.com',
      required: true,
    },
    tel: {
      fieldName: 'phone',
      fieldLabel: '電話番号',
      fieldType: 'tel',
      placeholder: '000-0000-0000',
      required: false,
    },
    number: {
      fieldName: 'number',
      fieldLabel: '数値',
      fieldType: 'number',
      placeholder: '0',
      required: false,
    },
    textarea: {
      fieldName: 'message',
      fieldLabel: 'メッセージ',
      fieldType: 'textarea',
      placeholder: 'ご入力ください',
      required: true,
    },
    select: {
      fieldName: 'select',
      fieldLabel: '選択してください',
      fieldType: 'select',
      required: false,
      options: [
        { _key: 'opt_1', label: 'オプション1', value: 'option1' },
        { _key: 'opt_2', label: 'オプション2', value: 'option2' },
      ],
    },
    checkbox: {
      fieldName: 'checkbox',
      fieldLabel: 'チェックボックス',
      fieldType: 'checkbox',
      required: false,
      options: [
        { _key: 'opt_1', label: 'オプション1', value: 'option1' },
      ],
    },
    radio: {
      fieldName: 'radio',
      fieldLabel: 'ラジオボタン',
      fieldType: 'radio',
      required: false,
      options: [
        { _key: 'opt_1', label: 'オプション1', value: 'option1' },
        { _key: 'opt_2', label: 'オプション2', value: 'option2' },
      ],
    },
  }

  return configs[type]
}

export const useFormStore = create<FormEditorState>((set) => ({
  formFields: [],
  selectedFieldId: null,
  hasChanges: false,
  isSaving: false,

  setFormFields: (fields) => set({ formFields: fields, hasChanges: true }),

  setSelectedFieldId: (id) => set({ selectedFieldId: id }),

  addField: (type) =>
    set((state) => ({
      formFields: [
        ...state.formFields,
        {
          _key: generateId(),
          ...getDefaultFieldConfig(type),
        },
      ],
      hasChanges: true,
      selectedFieldId: state.formFields.length === 0 ? generateId() : state.selectedFieldId,
    })),

  updateField: (id, updates) =>
    set((state) => ({
      formFields: state.formFields.map((field) =>
        field._key === id ? { ...field, ...updates } : field
      ),
      hasChanges: true,
    })),

  deleteField: (id) =>
    set((state) => ({
      formFields: state.formFields.filter((field) => field._key !== id),
      selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
      hasChanges: true,
    })),

  moveField: (fromIndex, toIndex) =>
    set((state) => {
      const newFields = [...state.formFields]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return { formFields: newFields, hasChanges: true }
    }),

  addOption: (fieldId) =>
    set((state) => ({
      formFields: state.formFields.map((field) => {
        if (field._key === fieldId && field.options) {
          return {
            ...field,
            options: [
              ...field.options,
              { _key: `opt_${Date.now()}`, label: '新しいオプション', value: `option_${field.options.length + 1}` },
            ],
          }
        }
        return field
      }),
      hasChanges: true,
    })),

  updateOption: (fieldId, optionId, updates) =>
    set((state) => ({
      formFields: state.formFields.map((field) => {
        if (field._key === fieldId && field.options) {
          return {
            ...field,
            options: field.options.map((option) =>
              option._key === optionId ? { ...option, ...updates } : option
            ),
          }
        }
        return field
      }),
      hasChanges: true,
    })),

  deleteOption: (fieldId, optionId) =>
    set((state) => ({
      formFields: state.formFields.map((field) => {
        if (field._key === fieldId && field.options) {
          return {
            ...field,
            options: field.options.filter((option) => option._key !== optionId),
          }
        }
        return field
      }),
      hasChanges: true,
    })),

  moveOption: (fieldId, fromIndex, toIndex) =>
    set((state) => ({
      formFields: state.formFields.map((field) => {
        if (field._key === fieldId && field.options) {
          const newOptions = [...field.options]
          const [movedOption] = newOptions.splice(fromIndex, 1)
          newOptions.splice(toIndex, 0, movedOption)
          return { ...field, options: newOptions }
        }
        return field
      }),
      hasChanges: true,
    })),

  resetChanges: () =>
    set((state) => ({
      hasChanges: false,
    })),

  markAsSaved: () =>
    set({
      hasChanges: false,
    }),

  setSaving: (saving) => set({ isSaving: saving }),
}))
