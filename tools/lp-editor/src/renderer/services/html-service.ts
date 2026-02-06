/**
 * HTML Service
 *
 * Handles HTML parsing and modification.
 */

import * as cheerio from 'cheerio'

export interface ParsedMarker {
  id: string
  type: 'text' | 'richtext' | 'image' | 'link' | 'background-image' | 'number' | 'icon' | 'counter'
  label?: string
  group?: string
  value: string | null
  href?: string
  src?: string
  order: number
  // Number-specific attributes
  min?: number
  max?: number
  step?: number
  suffix?: string
  // Icon-specific attributes
  iconSet?: string
  // Counter-specific attributes
  dataCount?: string
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
 * Also auto-detects counters (data-target) and icons (.icon svg)
 */
export function parseHtmlMarkers(html: string): ParsedMarker[] {
  const $ = cheerio.load(html)
  const markers: ParsedMarker[] = []
  let order = 0

  // Track processed elements to avoid duplicates
  const processedElements = new Set<cheerio.Element>()

  // 1. Parse explicit data-editable markers
  $('[data-editable]').each((_, element) => {
    const $el = $(element)

    // Skip fields inside repeat blocks
    if ($el.closest('[data-repeat-item]').length > 0) return

    const id = $el.attr('data-editable')
    const type = $el.attr('data-type') as ParsedMarker['type']

    if (!id || !type) return

    processedElements.add(element)

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
    if (type === 'number') {
      // Get number value from data-target if available, otherwise from text
      const dataTarget = $el.attr('data-target')
      if (dataTarget) {
        marker.value = dataTarget
      }
      // Get number constraints
      marker.min = parseFloat($el.attr('data-min') || '0')
      marker.max = parseFloat($el.attr('data-max') || '999999')
      marker.step = parseFloat($el.attr('data-step') || '1')
      marker.suffix = $el.attr('data-suffix')
    }
    if (type === 'icon') {
      marker.iconSet = $el.attr('data-icon-set')
      // Get current icon SVG
      const $svg = $el.find('svg')
      if ($svg.length > 0) {
        marker.value = $.html($svg)
      }
    }
    if (type === 'counter') {
      // Counter type: read data-count attribute for animation target value
      const dataCount = $el.attr('data-count')
      marker.dataCount = dataCount
      // Use text content as the display value, but prefer data-count for editing
      marker.value = dataCount || $el.text().trim()
    }

    markers.push(marker)
  })

  // 2. Auto-detect counters (elements with data-target but no data-editable)
  $('[data-target]').each((idx, element) => {
    const $el = $(element)

    // Skip if already processed or inside repeat block
    if (processedElements.has(element)) return
    if ($el.closest('[data-repeat-item]').length > 0) return
    if ($el.attr('data-editable')) return

    processedElements.add(element)

    const dataTarget = $el.attr('data-target')
    const section = findSectionName($, $el)
    const id = `auto-counter-${section}-${idx}`

    // Try to find label from sibling or parent text
    const labelEl = $el.siblings().first()
    const labelText = labelEl.text().trim() || `カウンター ${idx + 1}`

    const marker: ParsedMarker = {
      id,
      type: 'number',
      label: `${labelText} (${dataTarget})`,
      group: section ? `${section}` : 'カウンター',
      value: dataTarget || '0',
      order: order++,
      min: 0,
      max: 999999,
      step: 1,
    }

    markers.push(marker)
  })

  // 3. Auto-detect icons (.icon elements containing svg, without data-editable)
  // Track SVG elements that have already been processed to avoid duplicates
  const processedSvgs = new Set<cheerio.Element>()
  let iconIndex = 0

  $('.icon, .feature-card__icon, .stat-card__icon, [class*="icon"]').each((_, element) => {
    const $el = $(element)
    const $svg = $el.find('svg').first()

    // Skip if no svg, already processed, or inside repeat block
    if ($svg.length === 0) return
    if (processedElements.has(element)) return
    if ($el.closest('[data-repeat-item]').length > 0) return
    if ($el.attr('data-editable')) return

    // Skip if this SVG was already processed (avoids parent/child duplicates)
    const svgElement = $svg.get(0)
    if (svgElement && processedSvgs.has(svgElement)) return
    if (svgElement) processedSvgs.add(svgElement)

    processedElements.add(element)

    const section = findSectionName($, $el)
    const id = `auto-icon-${section}-${iconIndex}`
    iconIndex++

    // Try to find label from nearby heading or parent
    const parentCard = $el.closest('.feature-card, .stat-card, [class*="card"]')
    const cardTitle = parentCard.find('h3, h4, .title').first().text().trim()
    const labelText = cardTitle || `アイコン ${iconIndex}`

    const marker: ParsedMarker = {
      id,
      type: 'icon',
      label: `${labelText} アイコン`,
      group: section ? `${section}` : 'アイコン',
      value: $.html($svg),
      order: order++,
    }

    markers.push(marker)
  })

  return markers
}

/**
 * Find the section name for an element
 */
function findSectionName($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>): string {
  const $section = $el.closest('section')
  if ($section.length > 0) {
    const sectionId = $section.attr('id')
    if (sectionId) return sectionId
    const sectionClass = $section.attr('class')
    if (sectionClass) {
      const firstClass = sectionClass.split(' ')[0]
      return firstClass
    }
  }
  return 'other'
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

    const min = parseInt($container.attr('data-repeat-min') || '1', 10)
    const max = parseInt($container.attr('data-repeat-max') || '10', 10)
    const items: ParsedRepeatItem[] = []

    // Get direct repeat items only (exclude items inside nested repeat blocks)
    const $directItems = $container.find('[data-repeat-item]').filter((_, el) => {
      // Check if this item is inside a nested data-repeat (but not this container)
      const $el = $(el)
      const $parentRepeat = $el.parentsUntil($container, '[data-repeat]')
      return $parentRepeat.length === 0
    })

    // Get first repeat item as template
    const $firstItem = $directItems.first()
    const templateHtml = $firstItem.length > 0 ? $.html($firstItem) : ''

    // Extract field keys from template (in order) - only direct editables, not nested
    const templateFieldKeys: string[] = []
    if ($firstItem.length > 0) {
      // First, check if the item element itself has data-editable
      const selfFieldId = $firstItem.attr('data-editable')
      if (selfFieldId) {
        const normalizedKey = normalizeFieldIdForKey(selfFieldId)
        templateFieldKeys.push(normalizedKey)
      }

      // Then find child elements with data-editable
      $firstItem.find('[data-editable]').each((_, fieldEl) => {
        const $fieldEl = $(fieldEl)
        const fieldId = $fieldEl.attr('data-editable')
        // Skip if inside a nested repeat block
        if ($fieldEl.parentsUntil($firstItem, '[data-repeat]').length > 0) return
        if (fieldId) {
          // Use normalized field ID as key
          const normalizedKey = normalizeFieldIdForKey(fieldId)
          templateFieldKeys.push(normalizedKey)
        }
      })
    }

    // Parse all repeat items (only direct items, not nested)
    $directItems.each((index, itemEl) => {
      const $item = $(itemEl)
      const fields: ParsedRepeatItem['fields'] = {}
      let fieldIndex = 0

      // Helper function to process an editable field
      const processEditableField = ($field: ReturnType<typeof $>) => {
        const fieldId = $field.attr('data-editable')
        const fieldType = $field.attr('data-type') as ParsedMarker['type']
        if (!fieldId || !fieldType) return

        // Use normalized field ID as key (consistent across all items)
        const fieldKey = fieldIndex < templateFieldKeys.length
          ? templateFieldKeys[fieldIndex]
          : normalizeFieldIdForKey(fieldId)

        fields[fieldKey] = {
          id: `${id}.${index}.${fieldKey}`,
          type: fieldType,
          label: $field.attr('data-label'),
          value: fieldType === 'richtext' ? $field.html() : $field.text().trim(),
          href: fieldType === 'link' ? $field.attr('href') : undefined,
          src: fieldType === 'image' ? $field.attr('src') : undefined,
        }
        fieldIndex++
      }

      // First, check if the item element itself has data-editable
      if ($item.attr('data-editable')) {
        processEditableField($item)
      }

      // Find all editable fields within this item (in order), excluding nested repeat fields
      $item.find('[data-editable]').each((_, fieldEl) => {
        const $field = $(fieldEl)
        // Skip if inside a nested repeat block
        if ($field.parentsUntil($item, '[data-repeat]').length > 0) return

        processEditableField($field)
      })

      // Auto-detect icons within this item (avoid duplicates by tracking SVGs)
      // Exclude icons inside nested repeat blocks
      const itemProcessedSvgs = new Set<cheerio.Element>()
      let itemIconIdx = 0
      $item.find('.icon, .feature-card__icon, .stat-card__icon, [class*="icon"]').each((_, iconEl) => {
        const $iconEl = $(iconEl)
        // Skip if inside a nested repeat block
        if ($iconEl.parentsUntil($item, '[data-repeat]').length > 0) return

        const $svg = $iconEl.find('svg').first()
        if ($svg.length === 0 || $iconEl.attr('data-editable')) return

        // Skip if this SVG was already processed
        const svgElement = $svg.get(0)
        if (svgElement && itemProcessedSvgs.has(svgElement)) return
        if (svgElement) itemProcessedSvgs.add(svgElement)

        const fieldKey = `icon-${itemIconIdx}`
        itemIconIdx++
        fields[fieldKey] = {
          id: `${id}.${index}.${fieldKey}`,
          type: 'icon',
          label: 'アイコン',
          value: $.html($svg),
        }
      })

      // Auto-detect counters within this item (exclude nested repeats)
      $item.find('[data-target]').each((counterIdx, counterEl) => {
        const $counterEl = $(counterEl)
        // Skip if inside a nested repeat block
        if ($counterEl.parentsUntil($item, '[data-repeat]').length > 0) return
        if ($counterEl.attr('data-editable')) return

        const fieldKey = `counter-${counterIdx}`
        const dataTarget = $counterEl.attr('data-target')
        fields[fieldKey] = {
          id: `${id}.${index}.${fieldKey}`,
          type: 'number',
          label: 'カウンター',
          value: dataTarget || '0',
        }
      })

      items.push({ index, fields })
    })

    blocks.push({ id, min, max, items, templateHtml })
  })

  return blocks
}

/**
 * Normalize field ID for use as a consistent key across items
 * e.g., "042-feature-1-title" -> "title"
 * e.g., "043-feature-1-desc" -> "desc"
 */
function normalizeFieldIdForKey(id: string): string {
  // Remove leading number prefix and item number, keep last part
  const parts = id.split('-')
  // Filter out pure number parts
  const meaningfulParts = parts.filter(p => !/^\d+$/.test(p))
  // Return last meaningful part, or full id if nothing left
  return meaningfulParts.length > 0
    ? meaningfulParts[meaningfulParts.length - 1]
    : id
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

  // Build index maps for auto-detected elements
  const counterElements: cheerio.Element[] = []
  const iconElements: cheerio.Element[] = []

  $('[data-target]').each((_, el) => {
    if (!$(el).attr('data-editable')) {
      counterElements.push(el)
    }
  })

  $('.icon, .feature-card__icon, [class*="icon"]').each((_, el) => {
    const $el = $(el)
    if ($el.find('svg').length > 0 && !$el.attr('data-editable')) {
      iconElements.push(el)
    }
  })

  for (const [id, data] of Object.entries(editables)) {
    // Handle auto-detected counters
    if (id.startsWith('auto-counter-')) {
      const match = id.match(/auto-counter-[^-]+-(\d+)$/)
      if (match) {
        const idx = parseInt(match[1], 10)
        if (idx < counterElements.length) {
          const $el = $(counterElements[idx])
          if (data.value !== null) {
            $el.attr('data-target', data.value)
          }
        }
      }
      continue
    }

    // Handle auto-detected icons
    if (id.startsWith('auto-icon-')) {
      const match = id.match(/auto-icon-[^-]+-(\d+)$/)
      if (match) {
        const idx = parseInt(match[1], 10)
        if (idx < iconElements.length) {
          const $el = $(iconElements[idx])
          if (data.value) {
            $el.find('svg').replaceWith(data.value)
          }
        }
      }
      continue
    }

    // Handle explicit data-editable elements
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
    } else if (data.type === 'number') {
      // Update data-target attribute for counter animations
      if (data.value !== null) {
        $el.attr('data-target', data.value)
      }
    } else if (data.type === 'icon') {
      // Replace SVG content
      if (data.value) {
        $el.find('svg').replaceWith(data.value)
      }
    } else if (data.type === 'counter') {
      // Update both data-count attribute and text content
      if (data.value !== null) {
        $el.attr('data-count', data.value)
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

  console.log('[applyRepeatBlocksToHtml] Processing blocks:', Object.keys(repeatBlocks))

  for (const [blockId, block] of Object.entries(repeatBlocks)) {
    const $container = $(`[data-repeat="${blockId}"]`)
    if ($container.length === 0) {
      console.warn('[applyRepeatBlocksToHtml] Container not found:', blockId)
      continue
    }

    console.log('[applyRepeatBlocksToHtml] Processing block:', {
      blockId,
      itemCount: block.items.length,
      templateHtmlLength: block.templateHtml?.length || 0,
    })

    // Clear existing direct items only (not nested repeat items)
    $container.find('[data-repeat-item]').filter((_, el) => {
      // Only remove items that are not inside a nested data-repeat
      return $(el).parentsUntil($container, '[data-repeat]').length === 0
    }).remove()

    // Get field keys in order from template (excluding nested repeat fields)
    const $template = $(block.templateHtml)

    // Build field order array - first check if template itself has data-editable
    const fieldOrder: (string | undefined)[] = []
    if ($template.attr('data-editable')) {
      fieldOrder.push($template.attr('data-editable'))
    }
    // Then add child editable fields
    const templateFields = $template.find('[data-editable]').filter((_, el) => {
      return $(el).parentsUntil($template, '[data-repeat]').length === 0
    }).toArray()
    fieldOrder.push(...templateFields.map(el => $(el).attr('data-editable')))

    // Add items based on block data
    for (const item of block.items) {
      // Create new item from template
      const $newItem = $(block.templateHtml)

      // Helper function to apply field data to an element
      const applyFieldToElement = ($field: ReturnType<typeof $>) => {
        const fieldId = $field.attr('data-editable')
        if (!fieldId) return

        // Find matching field data by normalized key
        let fieldData: ParsedRepeatItem['fields'][string] | undefined

        // Get normalized key for this field
        const normalizedKey = normalizeFieldIdForKey(fieldId)

        // Try exact key match first
        fieldData = item.fields[normalizedKey]

        // If not found, try matching by checking all field keys
        if (!fieldData) {
          for (const [key, value] of Object.entries(item.fields)) {
            // Skip auto-detected fields (icons, counters)
            if (key.startsWith('icon-') || key.startsWith('counter-')) continue
            // Check if this key matches
            if (key === normalizedKey || normalizeFieldIdForKey(key) === normalizedKey) {
              fieldData = value
              break
            }
          }
        }

        if (!fieldData) {
          console.warn('[applyRepeatBlocksToHtml] Field not found:', {
            fieldId,
            normalizedKey,
            availableKeys: Object.keys(item.fields),
          })
          return
        }

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

      // Update field values by normalized key (not by order)
      // First, check if the item element itself has data-editable
      if ($newItem.attr('data-editable')) {
        applyFieldToElement($newItem)
      }

      // Only update direct fields, not fields inside nested repeats
      const $editableFields = $newItem.find('[data-editable]').filter((_, el) => {
        return $(el).parentsUntil($newItem, '[data-repeat]').length === 0
      })

      $editableFields.each((_, el) => {
        applyFieldToElement($(el))
      })

      // Apply auto-detected icons (excluding nested repeats)
      let iconIdx = 0
      $newItem.find('.icon, .feature-card__icon, [class*="icon"]').each((_, iconEl) => {
        const $iconEl = $(iconEl)
        // Skip if inside a nested repeat
        if ($iconEl.parentsUntil($newItem, '[data-repeat]').length > 0) return

        const $svg = $iconEl.find('svg')
        if ($svg.length === 0 || $iconEl.attr('data-editable')) return

        const fieldKey = `icon-${iconIdx}`
        iconIdx++
        const fieldData = item.fields[fieldKey]
        if (fieldData && fieldData.value) {
          $svg.replaceWith(fieldData.value)
        }
      })

      // Apply auto-detected counters (excluding nested repeats)
      let counterIdx = 0
      $newItem.find('[data-target]').each((_, counterEl) => {
        const $counterEl = $(counterEl)
        // Skip if inside a nested repeat
        if ($counterEl.parentsUntil($newItem, '[data-repeat]').length > 0) return
        if ($counterEl.attr('data-editable')) return

        const fieldKey = `counter-${counterIdx}`
        counterIdx++
        const fieldData = item.fields[fieldKey]
        if (fieldData && fieldData.value !== null) {
          $counterEl.attr('data-target', fieldData.value)
        }
      })

      // Update repeat-item attribute with new index
      $newItem.attr('data-repeat-item', String(item.index + 1))

      $container.append($newItem)
    }
  }

  return $.html()
}

/**
 * Normalize field ID by removing number prefixes and suffixes
 * e.g., "042-feature-1-title" -> "feature-title"
 */
function normalizeFieldId(id: string): string {
  return id
    .replace(/^\d+-/, '') // Remove leading number prefix like "042-"
    .replace(/-\d+(-|$)/g, '$1') // Remove number segments like "-1-" or "-1" at end
    .replace(/\.\d+$/, '') // Remove dot-number suffix like ".0"
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
    'data-repeat-min',
    'data-repeat-max',
  ]

  $('*').each((_, element) => {
    const $el = $(element)
    for (const attr of markerAttributes) {
      $el.removeAttr(attr)
    }
  })

  return $.html()
}
