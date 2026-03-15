'use client'

import { FieldPropertiesForm } from './FieldPropertiesForm'
import type { FormField, FormFieldOption } from '@lp-generator/sanity-schemas/types'

interface FormFieldEditorProps {
  selectedField: FormField | null
  onUpdateField: (id: string, updates: Partial<FormField>) => void
  onAddOption: (fieldId: string) => void
  onUpdateOption: (fieldId: string, optionId: string, updates: Partial<FormFieldOption>) => void
  onDeleteOption: (fieldId: string, optionId: string) => void
  onMoveOption: (fieldId: string, fromIndex: number, toIndex: number) => void
}

export function FormFieldEditor({
  selectedField,
  onUpdateField,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onMoveOption,
}: FormFieldEditorProps) {
  const handleUpdate = (updates: Partial<FormField>) => {
    if (selectedField) {
      onUpdateField(selectedField._key, updates)
    }
  }

  const handleAddOption = () => {
    if (selectedField) {
      onAddOption(selectedField._key)
    }
  }

  const handleUpdateOption = (optionId: string, updates: Partial<FormFieldOption>) => {
    if (selectedField) {
      onUpdateOption(selectedField._key, optionId, updates)
    }
  }

  const handleDeleteOption = (optionId: string) => {
    if (selectedField) {
      onDeleteOption(selectedField._key, optionId)
    }
  }

  const handleMoveOption = (fromIndex: number, toIndex: number) => {
    if (selectedField) {
      onMoveOption(selectedField._key, fromIndex, toIndex)
    }
  }

  return (
    <div className="card">
      <FieldPropertiesForm
        field={selectedField}
        onUpdate={handleUpdate}
        onAddOption={handleAddOption}
        onUpdateOption={handleUpdateOption}
        onDeleteOption={handleDeleteOption}
        onMoveOption={handleMoveOption}
      />
    </div>
  )
}
