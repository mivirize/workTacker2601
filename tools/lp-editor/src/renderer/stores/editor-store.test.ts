/**
 * Editor Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './editor-store'

describe('editor-store', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useEditorStore.getState()

      expect(state.projectInfo).toBeNull()
      expect(state.basePath).toBe('')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.editables).toEqual({})
      expect(state.colors).toEqual({})
      expect(state.originalHtml).toBe('')
      expect(state.modifiedHtml).toBe('')
      expect(state.selectedField).toBeNull()
      expect(state.activeGroup).toBeNull()
      expect(state.isDirty).toBe(false)
      expect(state.isExporting).toBe(false)
    })
  })

  describe('setProjectInfo', () => {
    it('should set project info', () => {
      const projectInfo = {
        name: 'Test Project',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
      }

      useEditorStore.getState().setProjectInfo(projectInfo)

      expect(useEditorStore.getState().projectInfo).toEqual(projectInfo)
    })

    it('should clear project info when set to null', () => {
      useEditorStore.getState().setProjectInfo({
        name: 'Test',
        client: 'Test',
        version: '1.0.0',
        entry: 'index.html',
      })
      useEditorStore.getState().setProjectInfo(null)

      expect(useEditorStore.getState().projectInfo).toBeNull()
    })
  })

  describe('setEditables', () => {
    it('should set editables', () => {
      const editables = {
        'hero-title': {
          id: 'hero-title',
          type: 'text' as const,
          value: 'Hello World',
          label: 'Hero Title',
          order: 0,
        },
      }

      useEditorStore.getState().setEditables(editables)

      expect(useEditorStore.getState().editables).toEqual(editables)
    })
  })

  describe('updateEditable', () => {
    it('should update editable value', () => {
      useEditorStore.getState().setEditables({
        'hero-title': {
          id: 'hero-title',
          type: 'text',
          value: 'Original',
          order: 0,
        },
      })

      useEditorStore.getState().updateEditable('hero-title', 'Updated')

      expect(useEditorStore.getState().editables['hero-title'].value).toBe('Updated')
    })

    it('should set isDirty to true when updating', () => {
      useEditorStore.getState().setEditables({
        'hero-title': {
          id: 'hero-title',
          type: 'text',
          value: 'Original',
          order: 0,
        },
      })

      expect(useEditorStore.getState().isDirty).toBe(false)

      useEditorStore.getState().updateEditable('hero-title', 'Updated')

      expect(useEditorStore.getState().isDirty).toBe(true)
    })

    it('should update extra properties', () => {
      useEditorStore.getState().setEditables({
        'hero-link': {
          id: 'hero-link',
          type: 'link',
          value: 'Click here',
          href: 'https://example.com',
          order: 0,
        },
      })

      useEditorStore.getState().updateEditable('hero-link', 'New Text', {
        href: 'https://new-url.com',
      })

      const link = useEditorStore.getState().editables['hero-link']
      expect(link.value).toBe('New Text')
      expect(link.href).toBe('https://new-url.com')
    })
  })

  describe('setColors', () => {
    it('should set colors', () => {
      const colors = {
        primary: {
          variable: '--color-primary',
          value: '#3B82F6',
          label: 'Primary',
        },
      }

      useEditorStore.getState().setColors(colors)

      expect(useEditorStore.getState().colors).toEqual(colors)
    })
  })

  describe('updateColor', () => {
    it('should update color value', () => {
      useEditorStore.getState().setColors({
        primary: {
          variable: '--color-primary',
          value: '#3B82F6',
          label: 'Primary',
        },
      })

      useEditorStore.getState().updateColor('primary', '#FF0000')

      expect(useEditorStore.getState().colors['primary'].value).toBe('#FF0000')
    })

    it('should set isDirty to true when updating', () => {
      useEditorStore.getState().setColors({
        primary: {
          variable: '--color-primary',
          value: '#3B82F6',
        },
      })

      expect(useEditorStore.getState().isDirty).toBe(false)

      useEditorStore.getState().updateColor('primary', '#FF0000')

      expect(useEditorStore.getState().isDirty).toBe(true)
    })
  })

  describe('selectField', () => {
    it('should select a field', () => {
      useEditorStore.getState().selectField('hero-title')

      expect(useEditorStore.getState().selectedField).toBe('hero-title')
    })

    it('should deselect when set to null', () => {
      useEditorStore.getState().selectField('hero-title')
      useEditorStore.getState().selectField(null)

      expect(useEditorStore.getState().selectedField).toBeNull()
    })
  })

  describe('setActiveGroup', () => {
    it('should set active group', () => {
      useEditorStore.getState().setActiveGroup('colors')

      expect(useEditorStore.getState().activeGroup).toBe('colors')
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set some state
      useEditorStore.getState().setProjectInfo({
        name: 'Test',
        client: 'Test',
        version: '1.0.0',
        entry: 'index.html',
      })
      useEditorStore.getState().setLoading(true)
      useEditorStore.getState().setDirty(true)
      useEditorStore.getState().selectField('hero-title')

      // Reset
      useEditorStore.getState().reset()

      // Verify reset
      const state = useEditorStore.getState()
      expect(state.projectInfo).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.isDirty).toBe(false)
      expect(state.selectedField).toBeNull()
    })
  })
})
