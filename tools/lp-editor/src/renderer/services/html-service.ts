/**
 * HTML Service
 *
 * Handles HTML parsing and modification.
 */

import * as cheerio from 'cheerio'

export interface ParsedMarker {
  id: string
  type: 'text' | 'richtext' | 'image' | 'link' | 'background-image'
  label?: string
  group?: string
  value: string | null
  href?: string
  src?: string
  order: number
}

export interface ParsedColor {
  variable: string
  value: string
}

export interface ParsedRepeatBlock {
  id: string
  min: number
  max: number
  items: ParsedRepeatItem[]
  templateHtml: string
}

export interface ParsedRepeatItem {
  index: number
  fields: Record<string, {
    id: string
    type: ParsedMarker['type']
    label?: string
    value: string | null
    href?: string
    src?: string
  }>
}

/**
 * Parse HTML and extract editable markers
 * Excludes fields inside repeat blocks (data-repeat-item)
 */
export function parseHtmlMarkers(html: string): ParsedMarker[] {
  const $ = cheerio.load(html)
  const markers: ParsedMarker[] = []
  let order = 0

  $('[data-editable]').each((_, element) => {
    const $el = $(element)

    // Skip fields inside repeat blocks
    if ($el.closest('[data-repeat-item]').length > 0) return

    const id = $el.attr('data-editable')
    const type = $el.attr('data-type') as ParsedMarker['type']

    if (!id || !type) return

    const marker: ParsedMarker = {
      id,
      type,
      label: $el.attr('data-label'),
      group: $el.attr('data-group'),
      value: type === 'richtext' ? $el.html() : $el.text().trim(),
      order: order++,
    }

    // Add extra attributes for specific types
    if (type === 'link') {
      marker.href = $el.attr('href')
    }
    if (type === 'image') {
      marker.src = $el.attr('src')
    }

    markers.push(marker)
  })

  return markers
}

/**
 * Parse HTML and extract repeat blocks
 */
export function parseRepeatBlocks(html: string): ParsedRepeatBlock[] {
  const $ = cheerio.load(html)
  const blocks: ParsedRepeatBlock[] = []

  $('[data-repeat]').each((_, container) => {
    const $container = $(container)
    const id = $container.attr('data-repeat')
    if (!id) return

    const min = parseInt($container.attr('data-min') || '1', 10)
    const max = parseInt($container.attr('data-max') || '10', 10)
    const items: ParsedRepeatItem[] = []

    // Get first repeat item as template
    const $firstItem = $container.find('[data-repeat-item]').first()
    const templateHtml = $firstItem.length > 0 ? $.html($firstItem) : ''

    // Parse all repeat items
    $container.find('[data-repeat-item]').each((index, itemEl) => {
      const $item = $(itemEl)
      const fields: ParsedRepeatItem['fields'] = {}

      // Find all editable fields within this item
      $item.find('[data-editable]').each((_, fieldEl) => {
        const $field = $(fieldEl)
        const fieldId = $field.attr('data-editable')
        const fieldType = $field.attr('data-type') as ParsedMarker['type']
        if (!fieldId || !fieldType) return

        // Use base field id (without index suffix)
        const baseFieldId = fieldId.replace(/\.\d+$/, '')

        fields[baseFieldId] = {
          id: `${id}.${index}.${baseFieldId}`,
          type: fieldType,
          label: $field.attr('data-label'),
          value: fieldType === 'richtext' ? $field.html() : $field.text().trim(),
          href: fieldType === 'link' ? $field.attr('href') : undefined,
          src: fieldType === 'image' ? $field.attr('src') : undefined,
        }
      })

      items.push({ index, fields })
    })

    blocks.push({ id, min, max, items, templateHtml })
  })

  return blocks
}

/**
 * Parse HTML and extract CSS color variables
 */
export function parseHtmlColors(html: string): ParsedColor[] {
  const colors: ParsedColor[] = []
  const rootMatch = html.match(/:root\s*\{([^}]+)\}/g)

  if (!rootMatch) return colors

  for (const block of rootMatch) {
    const varMatches = block.matchAll(/(--color[^:]+):\s*([^;]+);/g)

    for (const match of varMatches) {
      colors.push({
        variable: match[1].trim(),
        value: match[2].trim(),
      })
    }
  }

  return colors
}

/**
 * Apply editable values to HTML
 */
export function applyEditablesToHtml(
  html: string,
  editables: Record<string, { value: string | null; href?: string; src?: string; type: string }>
): string {
  const $ = cheerio.load(html)

  for (const [id, data] of Object.entries(editables)) {
    const $el = $(`[data-editable="${id}"]`)

    if ($el.length === 0) continue

    if (data.type === 'richtext') {
      $el.html(data.value || '')
    } else if (data.type === 'image' && data.src) {
      $el.attr('src', data.src)
    } else if (data.type === 'link') {
      if (data.href) {
        $el.attr('href', data.href)
      }
      if (data.value !== null) {
        $el.text(data.value)
      }
    } else if (data.value !== null) {
      $el.text(data.value)
    }
  }

  return $.html()
}

/**
 * Apply color values to HTML
 */
export function applyColorsToHtml(
  html: string,
  colors: Record<string, { value: string }>
): string {
  let result = html

  // Find :root block and update color values
  result = result.replace(/:root\s*\{([^}]+)\}/g, (_match, content) => {
    let updatedContent = content

    for (const [variable, data] of Object.entries(colors)) {
      const varName = variable.startsWith('--') ? variable : `--color-${variable}`
      const regex = new RegExp(`(${varName}):\\s*[^;]+;`, 'g')
      updatedContent = updatedContent.replace(regex, `$1: ${data.value};`)
    }

    return `:root {${updatedContent}}`
  })

  return result
}

/**
 * Apply repeat block changes to HTML
 */
export function applyRepeatBlocksToHtml(
  html: string,
  repeatBlocks: Record<string, ParsedRepeatBlock>
): string {
  const $ = cheerio.load(html)

  for (const [blockId, block] of Object.entries(repeatBlocks)) {
    const $container = $(`[data-repeat="${blockId}"]`)
    if ($container.length === 0) continue

    // Clear existing items
    $container.find('[data-repeat-item]').remove()

    // Add items based on block data
    for (const item of block.items) {
      // Create new item from template
      const $newItem = $(block.templateHtml)

      // Update field values
      for (const [fieldBaseId, fieldData] of Object.entries(item.fields)) {
        const $field = $newItem.find(`[data-editable="${fieldBaseId}"]`)
        if ($field.length === 0) continue

        if (fieldData.type === 'richtext') {
          $field.html(fieldData.value || '')
        } else if (fieldData.type === 'image' && fieldData.src) {
          $field.attr('src', fieldData.src)
        } else if (fieldData.type === 'link') {
          if (fieldData.href) $field.attr('href', fieldData.href)
          if (fieldData.value !== null) $field.text(fieldData.value)
        } else if (fieldData.value !== null) {
          $field.text(fieldData.value)
        }
      }

      $container.append($newItem)
    }
  }

  return $.html()
}

/**
 * Remove all marker attributes from HTML
 */
export function removeMarkers(html: string): string {
  const $ = cheerio.load(html)

  const markerAttributes = [
    'data-editable',
    'data-type',
    'data-label',
    'data-group',
    'data-placeholder',
    'data-recommended-size',
    'data-max-size',
    'data-accept',
    'data-text-editable',
    'data-allow-external',
    'data-css-var',
    'data-repeat',
    'data-repeat-item',
    'data-min',
    'data-max',
  ]

  $('*').each((_, element) => {
    const $el = $(element)
    for (const attr of markerAttributes) {
      $el.removeAttr(attr)
    }
  })

  return $.html()
}
