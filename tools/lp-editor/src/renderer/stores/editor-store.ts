/**
 * Editor Store
 *
 * Zustand store for managing editor state.
 */

import { create } from 'zustand'

interface EditableField {
  id: string
  type: 'text' | 'richtext' | 'image' | 'link' | 'background-image'
  value: string | null
  label?: string
  group?: string
  href?: string
  src?: string
  order: number
}

interface ColorField {
  variable: string
  value: string
  label?: string
  description?: string
}

interface RepeatItemField {
  id: string
  type: 'text' | 'richtext' | 'image' | 'link' | 'background-image'
  label?: string
  value: string | null
  href?: string
  src?: string
}

interface RepeatItem {
  index: number
  fields: Record<string, RepeatItemField>
}

interface RepeatBlock {
  id: string
  min: number
  max: number
  items: RepeatItem[]
  templateHtml: string
}

interface PageConfig {
  id: string
  path: string
  label: string
}

interface ProjectInfo {
  name: string
  client: string
  version: string
  entry: string
  pages?: PageConfig[]
}

interface EditorState {
  // Project
  projectInfo: ProjectInfo | null
  basePath: string
  isLoading: boolean
  error: string | null

  // Pages
  pages: PageConfig[]
  currentPageId: string | null

  // Content
  editables: Record<string, EditableField>
  colors: Record<string, ColorField>
  repeatBlocks: Record<string, RepeatBlock>
  originalHtml: string
  modifiedHtml: string

  // UI State
  selectedField: string | null
  activeGroup: string | null
  isDirty: boolean
  isExporting: boolean

  // Actions
  setProjectInfo: (info: ProjectInfo | null) => void
  setBasePath: (path: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPages: (pages: PageConfig[]) => void
  setCurrentPageId: (pageId: string | null) => void
  setEditables: (editables: Record<string, EditableField>) => void
  setColors: (colors: Record<string, ColorField>) => void
  setRepeatBlocks: (blocks: Record<string, RepeatBlock>) => void
  setOriginalHtml: (html: string) => void
  setModifiedHtml: (html: string) => void
  updateEditable: (id: string, value: string | null, extraProps?: Partial<EditableField>) => void
  updateColor: (variable: string, value: string) => void
  updateRepeatItemField: (blockId: string, itemIndex: number, fieldId: string, value: string | null, extraProps?: Partial<RepeatItemField>) => void
  addRepeatItem: (blockId: string) => void
  removeRepeatItem: (blockId: string, itemIndex: number) => void
  selectField: (id: string | null) => void
  setActiveGroup: (group: string | null) => void
  setDirty: (dirty: boolean) => void
  setExporting: (exporting: boolean) => void
  reset: () => void
}

const initialState = {
  projectInfo: null,
  basePath: '',
  isLoading: false,
  error: null,
  pages: [] as PageConfig[],
  currentPageId: null as string | null,
  editables: {},
  colors: {},
  repeatBlocks: {},
  originalHtml: '',
  modifiedHtml: '',
  selectedField: null,
  activeGroup: null,
  isDirty: false,
  isExporting: false,
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setProjectInfo: (info) => set({ projectInfo: info }),
  setBasePath: (path) => set({ basePath: path }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setPages: (pages) => set({ pages }),
  setCurrentPageId: (pageId) => set({ currentPageId: pageId }),
  setEditables: (editables) => set({ editables }),
  setColors: (colors) => set({ colors }),
  setRepeatBlocks: (blocks) => set({ repeatBlocks: blocks }),
  setOriginalHtml: (html) => set({ originalHtml: html }),
  setModifiedHtml: (html) => set({ modifiedHtml: html }),

  updateEditable: (id, value, extraProps = {}) =>
    set((state) => ({
      editables: {
        ...state.editables,
        [id]: {
          ...state.editables[id],
          value,
          ...extraProps,
        },
      },
      isDirty: true,
    })),

  updateColor: (variable, value) =>
    set((state) => ({
      colors: {
        ...state.colors,
        [variable]: {
          ...state.colors[variable],
          value,
        },
      },
      isDirty: true,
    })),

  updateRepeatItemField: (blockId, itemIndex, fieldId, value, extraProps = {}) =>
    set((state) => {
      const block = state.repeatBlocks[blockId]
      if (!block) return state

      const newItems = block.items.map((item, idx) => {
        if (idx !== itemIndex) return item
        return {
          ...item,
          fields: {
            ...item.fields,
            [fieldId]: {
              ...item.fields[fieldId],
              value,
              ...extraProps,
            },
          },
        }
      })

      return {
        repeatBlocks: {
          ...state.repeatBlocks,
          [blockId]: {
            ...block,
            items: newItems,
          },
        },
        isDirty: true,
      }
    }),

  addRepeatItem: (blockId) =>
    set((state) => {
      const block = state.repeatBlocks[blockId]
      if (!block || block.items.length >= block.max) return state

      // Create new item based on first item's structure
      const templateItem = block.items[0]
      const newIndex = block.items.length
      const newFields: Record<string, RepeatItemField> = {}

      for (const [fieldKey, field] of Object.entries(templateItem.fields)) {
        newFields[fieldKey] = {
          ...field,
          id: `${blockId}.${newIndex}.${fieldKey}`,
          value: '', // Empty value for new item
        }
      }

      return {
        repeatBlocks: {
          ...state.repeatBlocks,
          [blockId]: {
            ...block,
            items: [...block.items, { index: newIndex, fields: newFields }],
          },
        },
        isDirty: true,
      }
    }),

  removeRepeatItem: (blockId, itemIndex) =>
    set((state) => {
      const block = state.repeatBlocks[blockId]
      if (!block || block.items.length <= block.min) return state

      const newItems = block.items
        .filter((_, idx) => idx !== itemIndex)
        .map((item, idx) => ({
          ...item,
          index: idx,
          fields: Object.fromEntries(
            Object.entries(item.fields).map(([key, field]) => [
              key,
              { ...field, id: `${blockId}.${idx}.${key}` },
            ])
          ),
        }))

      return {
        repeatBlocks: {
          ...state.repeatBlocks,
          [blockId]: {
            ...block,
            items: newItems,
          },
        },
        isDirty: true,
      }
    }),

  selectField: (id) => set({ selectedField: id }),
  setActiveGroup: (group) => set({ activeGroup: group }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  reset: () => set(initialState),
}))
