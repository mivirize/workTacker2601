/**
 * HTML Service Tests
 */

import { describe, it, expect } from 'vitest'
import {
  parseHtmlMarkers,
  parseHtmlColors,
  applyEditablesToHtml,
  applyColorsToHtml,
  removeMarkers,
} from './html-service'

describe('html-service', () => {
  describe('parseHtmlMarkers', () => {
    it('should parse text markers', () => {
      const html = `
        <h1 data-editable="headline" data-type="text">Hello World</h1>
      `
      const markers = parseHtmlMarkers(html)

      expect(markers).toHaveLength(1)
      expect(markers[0]).toMatchObject({
        id: 'headline',
        type: 'text',
        value: 'Hello World',
      })
    })

    it('should parse markers with label and group', () => {
      const html = `
        <h1
          data-editable="headline"
          data-type="text"
          data-label="メインコピー"
          data-group="hero"
        >Title</h1>
      `
      const markers = parseHtmlMarkers(html)

      expect(markers[0]).toMatchObject({
        id: 'headline',
        type: 'text',
        label: 'メインコピー',
        group: 'hero',
      })
    })

    it('should parse link markers with href', () => {
      const html = `
        <a
          data-editable="cta"
          data-type="link"
          href="https://example.com"
        >Click</a>
      `
      const markers = parseHtmlMarkers(html)

      expect(markers[0]).toMatchObject({
        id: 'cta',
        type: 'link',
        href: 'https://example.com',
        value: 'Click',
      })
    })

    it('should parse image markers with src', () => {
      const html = `
        <img
          data-editable="hero-img"
          data-type="image"
          src="images/hero.jpg"
          alt="Hero"
        >
      `
      const markers = parseHtmlMarkers(html)

      expect(markers[0]).toMatchObject({
        id: 'hero-img',
        type: 'image',
        src: 'images/hero.jpg',
      })
    })

    it('should parse richtext markers with HTML content', () => {
      const html = `
        <div data-editable="content" data-type="richtext">
          <p>First</p>
          <p>Second</p>
        </div>
      `
      const markers = parseHtmlMarkers(html)

      expect(markers[0].type).toBe('richtext')
      expect(markers[0].value).toContain('<p>First</p>')
      expect(markers[0].value).toContain('<p>Second</p>')
    })
  })

  describe('parseHtmlColors', () => {
    it('should extract CSS color variables', () => {
      const html = `
        <style>
          :root {
            --color-primary: #3B82F6;
            --color-secondary: #1E40AF;
          }
        </style>
      `
      const colors = parseHtmlColors(html)

      expect(colors).toHaveLength(2)
      expect(colors).toContainEqual({
        variable: '--color-primary',
        value: '#3B82F6',
      })
    })

    it('should return empty array if no :root', () => {
      const html = `<style>body { color: red; }</style>`
      const colors = parseHtmlColors(html)

      expect(colors).toHaveLength(0)
    })

    it('should only extract color variables', () => {
      const html = `
        <style>
          :root {
            --color-primary: #3B82F6;
            --spacing-md: 2rem;
            --font-sans: Arial;
          }
        </style>
      `
      const colors = parseHtmlColors(html)

      expect(colors).toHaveLength(1)
      expect(colors[0].variable).toBe('--color-primary')
    })
  })

  describe('applyEditablesToHtml', () => {
    it('should update text content', () => {
      const html = `<h1 data-editable="headline" data-type="text">Old</h1>`
      const editables = {
        headline: { type: 'text', value: 'New' },
      }

      const result = applyEditablesToHtml(html, editables)

      expect(result).toContain('New')
      expect(result).not.toContain('>Old<')
    })

    it('should update link href', () => {
      const html = `<a data-editable="cta" data-type="link" href="old.html">Click</a>`
      const editables = {
        cta: { type: 'link', value: 'Click Me', href: 'new.html' },
      }

      const result = applyEditablesToHtml(html, editables)

      expect(result).toContain('href="new.html"')
      expect(result).toContain('Click Me')
    })

    it('should update image src', () => {
      const html = `<img data-editable="img" data-type="image" src="old.jpg">`
      const editables = {
        img: { type: 'image', value: null, src: 'new.jpg' },
      }

      const result = applyEditablesToHtml(html, editables)

      expect(result).toContain('src="new.jpg"')
    })
  })

  describe('applyColorsToHtml', () => {
    it('should update color values in :root', () => {
      const html = `
        <style>
          :root {
            --color-primary: #000000;
          }
        </style>
      `
      const colors = {
        primary: { value: '#FF0000' },
      }

      const result = applyColorsToHtml(html, colors)

      expect(result).toContain('--color-primary: #FF0000;')
    })
  })

  describe('removeMarkers', () => {
    it('should remove all marker attributes', () => {
      const html = `
        <h1
          data-editable="headline"
          data-type="text"
          data-label="Title"
          data-group="hero"
        >Title</h1>
      `
      const result = removeMarkers(html)

      expect(result).not.toContain('data-editable')
      expect(result).not.toContain('data-type')
      expect(result).not.toContain('data-label')
      expect(result).not.toContain('data-group')
      expect(result).toContain('<h1>')
      expect(result).toContain('Title')
    })

    it('should keep non-marker attributes', () => {
      const html = `<a data-editable="cta" data-type="link" href="test.html" class="btn">Click</a>`
      const result = removeMarkers(html)

      expect(result).toContain('href="test.html"')
      expect(result).toContain('class="btn"')
    })
  })
})
