/**
 * Config Validator Tests
 */

import { describe, it, expect } from 'vitest'
import { validateLpConfig, validateLpConfigJson } from './config-validator'

describe('config-validator', () => {
  describe('validateLpConfig', () => {
    it('should validate a valid config', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(config)
    })

    it('should reject missing required fields', () => {
      const config = {
        name: 'Test LP',
        // missing client, version, entry, output
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('should reject invalid version format', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: 'invalid',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(false)
      expect(result.errors?.some((e) => e.path === 'version')).toBe(true)
    })

    it('should reject invalid fileName format', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'Invalid File Name', // spaces not allowed
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(false)
      expect(result.errors?.some((e) => e.path === 'output.fileName')).toBe(true)
    })

    it('should validate config with editables', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
        editables: {
          'hero-title': {
            type: 'text',
            label: 'Hero Title',
            group: 'hero',
          },
          'hero-image': {
            type: 'image',
            recommendedSize: '1920x1080',
          },
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(true)
    })

    it('should reject invalid editable type', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
        editables: {
          'hero-title': {
            type: 'invalid-type',
          },
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(false)
    })

    it('should validate config with colors', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
        colors: {
          primary: {
            value: '#3B82F6',
            label: 'Primary Color',
            description: 'Main brand color',
          },
          secondary: {
            value: '#1E40AF',
          },
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(true)
    })

    it('should reject invalid color format', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
        colors: {
          primary: {
            value: 'not-a-color',
          },
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(false)
    })

    it('should validate config with groups', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
        groups: {
          hero: { label: 'Hero Section', order: 1 },
          features: { label: 'Features', order: 2 },
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(true)
    })

    it('should validate config with repeatBlocks', () => {
      const config = {
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
        repeatBlocks: {
          features: {
            label: 'Features',
            min: 1,
            max: 6,
            fields: {
              title: { type: 'text' },
              description: { type: 'richtext' },
            },
          },
        },
      }

      const result = validateLpConfig(config)

      expect(result.success).toBe(true)
    })
  })

  describe('validateLpConfigJson', () => {
    it('should validate valid JSON string', () => {
      const json = JSON.stringify({
        name: 'Test LP',
        client: 'Test Client',
        version: '1.0.0',
        entry: 'src/index.html',
        output: {
          appName: 'LP-Editor',
          fileName: 'test-lp-editor',
        },
      })

      const result = validateLpConfigJson(json)

      expect(result.success).toBe(true)
    })

    it('should reject invalid JSON', () => {
      const result = validateLpConfigJson('not valid json')

      expect(result.success).toBe(false)
      expect(result.errors?.[0].message).toBe('Invalid JSON format')
    })
  })
})
