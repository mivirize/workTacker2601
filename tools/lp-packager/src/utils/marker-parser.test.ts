import { describe, it, expect } from 'vitest'
import { parseMarkers, extractColors, validateMarkers } from './marker-parser'
import type { EditableMarker, ColorConfig, ValidationMessage } from '../types'

describe('marker-parser', () => {
  describe('parseMarkers', () => {
    it('should parse a simple text marker', () => {
      const html = `
        <h1 data-editable="headline" data-type="text">Hello World</h1>
      `
      const result = parseMarkers(html)

      expect(result.markers).toHaveLength(1)
      expect(result.markers[0]).toMatchObject({
        id: 'headline',
        type: 'text',
        element: 'h1',
        currentValue: 'Hello World',
      })
    })

    it('should parse multiple markers', () => {
      const html = `
        <h1 data-editable="headline" data-type="text">Title</h1>
        <p data-editable="description" data-type="text">Description</p>
        <img data-editable="hero-image" data-type="image" src="test.jpg" alt="Test">
      `
      const result = parseMarkers(html)

      expect(result.markers).toHaveLength(3)
      expect(result.markers.map(m => m.id)).toEqual(['headline', 'description', 'hero-image'])
    })

    it('should parse marker with label and group', () => {
      const html = `
        <h1
          data-editable="headline"
          data-type="text"
          data-label="メインコピー"
          data-group="hero"
        >Title</h1>
      `
      const result = parseMarkers(html)

      expect(result.markers[0]).toMatchObject({
        id: 'headline',
        type: 'text',
        label: 'メインコピー',
        group: 'hero',
      })
    })

    it('should parse image marker with options', () => {
      const html = `
        <img
          data-editable="product-image"
          data-type="image"
          data-recommended-size="800x600"
          data-max-size="2MB"
          src="product.jpg"
          alt="Product"
        >
      `
      const result = parseMarkers(html)

      expect(result.markers[0].attributes).toMatchObject({
        'data-recommended-size': '800x600',
        'data-max-size': '2MB',
        src: 'product.jpg',
        alt: 'Product',
      })
    })

    it('should parse link marker', () => {
      const html = `
        <a
          data-editable="cta-button"
          data-type="link"
          href="https://example.com"
        >Click here</a>
      `
      const result = parseMarkers(html)

      expect(result.markers[0]).toMatchObject({
        id: 'cta-button',
        type: 'link',
        element: 'a',
        currentValue: 'Click here',
      })
      expect(result.markers[0].attributes.href).toBe('https://example.com')
    })

    it('should parse richtext marker', () => {
      const html = `
        <div data-editable="content" data-type="richtext">
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      `
      const result = parseMarkers(html)

      expect(result.markers[0]).toMatchObject({
        id: 'content',
        type: 'richtext',
        element: 'div',
      })
      expect(result.markers[0].currentValue).toContain('<p>First paragraph</p>')
    })

    it('should parse repeat blocks', () => {
      const html = `
        <div data-repeat="features" data-min="1" data-max="6">
          <div data-repeat-item>
            <h3 data-editable="features.title" data-type="text">Feature 1</h3>
          </div>
          <div data-repeat-item>
            <h3 data-editable="features.title" data-type="text">Feature 2</h3>
          </div>
        </div>
      `
      const result = parseMarkers(html)

      expect(result.repeatBlocks).toHaveLength(1)
      expect(result.repeatBlocks[0]).toMatchObject({
        id: 'features',
        min: 1,
        max: 6,
      })
      expect(result.repeatBlocks[0].items).toHaveLength(2)
    })

    it('should handle empty content', () => {
      const html = `
        <h1 data-editable="headline" data-type="text"></h1>
      `
      const result = parseMarkers(html)

      expect(result.markers[0].currentValue).toBe('')
    })

    it('should parse background-image marker', () => {
      const html = `
        <section
          data-editable="hero-bg"
          data-type="background-image"
          style="background-image: url('images/hero.jpg');"
        >
          <h1>Content</h1>
        </section>
      `
      const result = parseMarkers(html)

      expect(result.markers[0]).toMatchObject({
        id: 'hero-bg',
        type: 'background-image',
        element: 'section',
      })
    })
  })

  describe('extractColors', () => {
    it('should extract CSS variables from :root', () => {
      const html = `
        <style>
          :root {
            --color-primary: #3B82F6;
            --color-secondary: #1E40AF;
            --color-accent: #F59E0B;
          }
        </style>
      `
      const colors = extractColors(html)

      expect(colors).toHaveLength(3)
      expect(colors).toContainEqual({
        variable: '--color-primary',
        value: '#3B82F6',
      })
      expect(colors).toContainEqual({
        variable: '--color-secondary',
        value: '#1E40AF',
      })
      expect(colors).toContainEqual({
        variable: '--color-accent',
        value: '#F59E0B',
      })
    })

    it('should extract colors with rgb/rgba values', () => {
      const html = `
        <style>
          :root {
            --color-primary: rgb(59, 130, 246);
            --color-overlay: rgba(0, 0, 0, 0.5);
          }
        </style>
      `
      const colors = extractColors(html)

      expect(colors).toContainEqual({
        variable: '--color-primary',
        value: 'rgb(59, 130, 246)',
      })
      expect(colors).toContainEqual({
        variable: '--color-overlay',
        value: 'rgba(0, 0, 0, 0.5)',
      })
    })

    it('should return empty array if no :root found', () => {
      const html = `
        <style>
          body { color: red; }
        </style>
      `
      const colors = extractColors(html)

      expect(colors).toHaveLength(0)
    })

    it('should filter only color variables', () => {
      const html = `
        <style>
          :root {
            --color-primary: #3B82F6;
            --spacing-md: 2rem;
            --font-sans: 'Noto Sans JP';
          }
        </style>
      `
      const colors = extractColors(html)

      expect(colors).toHaveLength(1)
      expect(colors[0].variable).toBe('--color-primary')
    })
  })

  describe('validateMarkers', () => {
    it('should report error for duplicate IDs', () => {
      const markers: EditableMarker[] = [
        { id: 'headline', type: 'text', element: 'h1', line: 1, column: 1, currentValue: 'A', attributes: {} },
        { id: 'headline', type: 'text', element: 'p', line: 5, column: 1, currentValue: 'B', attributes: {} },
      ]

      const validations = validateMarkers(markers, [])

      const errors = validations.filter(v => v.severity === 'error')
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('Duplicate')
      expect(errors[0].rule).toBe('unique-id')
    })

    it('should report warning for image without alt', () => {
      const markers: EditableMarker[] = [
        { id: 'hero-img', type: 'image', element: 'img', line: 1, column: 1, currentValue: null, attributes: { src: 'test.jpg' } },
      ]

      const validations = validateMarkers(markers, [])

      const warnings = validations.filter(v => v.severity === 'warning')
      expect(warnings.some(w => w.message.includes('alt'))).toBe(true)
      expect(warnings[0].rule).toBe('image-alt')
    })

    it('should report warning for external image URL', () => {
      const markers: EditableMarker[] = [
        { id: 'hero-img', type: 'image', element: 'img', line: 1, column: 1, currentValue: null, attributes: { src: 'https://example.com/img.jpg', alt: 'Test' } },
      ]

      const validations = validateMarkers(markers, [])

      const warnings = validations.filter(v => v.severity === 'warning')
      expect(warnings.some(w => w.message.includes('external') || w.message.includes('External'))).toBe(true)
    })

    it('should report info for missing label', () => {
      const markers: EditableMarker[] = [
        { id: 'headline', type: 'text', element: 'h1', line: 1, column: 1, currentValue: 'Title', attributes: {} },
      ]

      const validations = validateMarkers(markers, [])

      const infos = validations.filter(v => v.severity === 'info')
      expect(infos.some(i => i.message.includes('label'))).toBe(true)
    })

    it('should pass validation for well-formed markers', () => {
      const markers: EditableMarker[] = [
        { id: 'headline', type: 'text', element: 'h1', line: 1, column: 1, currentValue: 'Title', label: 'メインタイトル', attributes: {} },
        { id: 'hero-img', type: 'image', element: 'img', line: 5, column: 1, currentValue: null, attributes: { src: 'images/hero.jpg', alt: 'Hero image' } },
      ]

      const validations = validateMarkers(markers, [])

      const errors = validations.filter(v => v.severity === 'error')
      expect(errors).toHaveLength(0)
    })

    it('should validate repeat block min/max', () => {
      const markers: EditableMarker[] = []
      const repeatBlocks = [
        { id: 'features', min: 5, max: 3, items: [], line: 10 },
      ]

      const validations = validateMarkers(markers, repeatBlocks)

      const errors = validations.filter(v => v.severity === 'error')
      expect(errors.some(e => e.message.includes('min') || e.message.includes('max'))).toBe(true)
    })
  })
})
