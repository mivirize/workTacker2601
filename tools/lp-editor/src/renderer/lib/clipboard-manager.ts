/**
 * Clipboard Manager
 *
 * Utilities for copying and pasting form fields using clipboard API.
 */

import type { ClipboardData } from '../types/form-templates'
import type { DetectedField } from '../stores/form-store'

const CLIPBOARD_MIME_TYPE = 'application/vnd.lp-editor.form-fields'
const CLIPBOARD_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Copy fields to clipboard
 */
export const copyFieldsToClipboard = async (
  fields: readonly DetectedField[],
  source?: string
): Promise<boolean> => {
  try {
    const clipboardData: ClipboardData = {
      fields,
      timestamp: Date.now(),
      source,
    }

    // Try to use the Clipboard API with custom MIME type
    const clipboardItem = new ClipboardItem({
      [CLIPBOARD_MIME_TYPE]: new Blob([JSON.stringify(clipboardData)], {
        type: CLIPBOARD_MIME_TYPE,
      }),
      'text/plain': new Blob([JSON.stringify(fields, null, 2)], { type: 'text/plain' }),
    })

    await navigator.clipboard.write([clipboardItem])
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // Fallback: try to copy as plain text
    try {
      await navigator.clipboard.writeText(JSON.stringify(fields, null, 2))
      return true
    } catch (fallbackError) {
      console.error('Failed to copy as plain text:', fallbackError)
      return false
    }
  }
}

/**
 * Read fields from clipboard
 */
export const readFieldsFromClipboard = async (): Promise<readonly DetectedField[] | null> => {
  try {
    const clipboardItems = await navigator.clipboard.read()

    for (const item of clipboardItems) {
      // Try to read custom MIME type first
      if (item.types.includes(CLIPBOARD_MIME_TYPE)) {
        const blob = await item.getType(CLIPBOARD_MIME_TYPE)
        const text = await blob.text()
        const data: ClipboardData = JSON.parse(text)

        // Check if clipboard data is expired
        if (Date.now() - data.timestamp > CLIPBOARD_EXPIRY_MS) {
          console.warn('Clipboard data has expired')
          return null
        }

        return data.fields
      }

      // Fallback: try to read as plain text
      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain')
        const text = await blob.text()

        try {
          const fields: DetectedField[] = JSON.parse(text)
          if (Array.isArray(fields) && fields.length > 0) {
            return fields
          }
        } catch {
          // Not valid JSON, continue to next item
        }
      }
    }

    return null
  } catch (error) {
    console.error('Failed to read from clipboard:', error)
    return null
  }
}

/**
 * Check if clipboard contains valid form field data
 */
export const hasValidClipboardData = async (): Promise<boolean> => {
  try {
    const clipboardItems = await navigator.clipboard.read()

    for (const item of clipboardItems) {
      if (item.types.includes(CLIPBOARD_MIME_TYPE)) {
        return true
      }

      if (item.types.includes('text/plain')) {
        const blob = await item.getType('text/plain')
        const text = await blob.text()

        try {
          const data = JSON.parse(text)
          if (Array.isArray(data) && data.length > 0) {
            return true
          }
        } catch {
          // Not valid JSON
        }
      }
    }

    return false
  } catch (error) {
    console.error('Failed to check clipboard:', error)
    return false
  }
}

/**
 * Generate new field names to avoid conflicts
 */
export const generateUniqueFieldNames = (
  fields: readonly DetectedField[],
  existingNames: readonly string[]
): DetectedField[] => {
  const nameSet = new Set(existingNames)

  return fields.map((field) => {
    let newName = field.name
    let counter = 1

    while (nameSet.has(newName)) {
      newName = `${field.name}_${counter}`
      counter++
    }

    nameSet.add(newName)

    return {
      ...field,
      name: newName,
    }
  })
}

/**
 * Clone fields with new keys
 */
export const cloneFields = (fields: readonly DetectedField[]): DetectedField[] => {
  return fields.map((field) => ({
    ...field,
    name: `${field.name}_copy`,
  }))
}
