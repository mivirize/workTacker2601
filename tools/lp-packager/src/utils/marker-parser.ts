/**
 * HTML Marker Parser
 *
 * Parses HTML to extract editable markers, repeat blocks, and CSS color variables.
 */

import { Parser, DomHandler, type Element, type ChildNode } from 'htmlparser2'
import type {
  EditableMarker,
  MarkerType,
  RepeatBlock,
  RepeatItem,
  ColorConfig,
  ValidationMessage,
  ValidationSeverity,
} from '../types'

const MARKER_TYPES: MarkerType[] = ['text', 'richtext', 'image', 'link', 'background-image']

/**
 * Parse HTML and extract editable markers
 */
export function parseMarkers(html: string): {
  markers: EditableMarker[]
  repeatBlocks: RepeatBlock[]
} {
  const markers: EditableMarker[] = []
  const repeatBlocks: RepeatBlock[] = []

  const handler = new DomHandler((error, dom) => {
    if (error) {
      throw new Error(`Failed to parse HTML: ${error.message}`)
    }

    traverseNodes(dom, markers, repeatBlocks, html)
  })

  const parser = new Parser(handler, {
    lowerCaseTags: true,
    lowerCaseAttributeNames: true,
  })

  parser.write(html)
  parser.end()

  return { markers, repeatBlocks }
}

/**
 * Traverse DOM nodes recursively
 */
function traverseNodes(
  nodes: ChildNode[],
  markers: EditableMarker[],
  repeatBlocks: RepeatBlock[],
  html: string,
  currentRepeat?: RepeatBlock,
  currentItemIndex?: number
): void {
  for (const node of nodes) {
    if (node.type !== 'tag') continue

    const element = node as Element

    // Check for repeat container
    if (element.attribs['data-repeat']) {
      const repeatBlock = parseRepeatBlock(element, html)
      repeatBlocks.push(repeatBlock)

      // Process repeat items
      const items = element.children.filter(
        (child) => child.type === 'tag' && (child as Element).attribs['data-repeat-item'] !== undefined
      ) as Element[]

      items.forEach((item, index) => {
        const repeatItem: RepeatItem = { index, markers: [] }
        traverseNodes(item.children, repeatItem.markers, repeatBlocks, html, repeatBlock, index)
        repeatBlock.items.push(repeatItem)
      })

      continue
    }

    // Check for repeat item (handled by parent)
    if (element.attribs['data-repeat-item'] !== undefined) {
      continue
    }

    // Check for editable marker
    if (element.attribs['data-editable'] && element.attribs['data-type']) {
      const marker = parseMarker(element, html)
      if (marker) {
        if (currentRepeat && currentItemIndex !== undefined) {
          // Add to current repeat item
          markers.push(marker)
        } else {
          markers.push(marker)
        }
      }
    }

    // Recursively process children
    if (element.children) {
      traverseNodes(element.children, markers, repeatBlocks, html, currentRepeat, currentItemIndex)
    }
  }
}

/**
 * Parse a single editable marker from an element
 */
function parseMarker(element: Element, html: string): EditableMarker | null {
  const id = element.attribs['data-editable']
  const typeStr = element.attribs['data-type']

  if (!id || !typeStr) return null

  const type = typeStr as MarkerType
  if (!MARKER_TYPES.includes(type)) {
    return null
  }

  const { line, column } = getPosition(element, html)

  // Get text content or inner HTML
  const currentValue = type === 'richtext'
    ? getInnerHtml(element)
    : getTextContent(element)

  // Collect all attributes
  const attributes: Record<string, string> = {}
  for (const [key, value] of Object.entries(element.attribs)) {
    if (!key.startsWith('data-editable') && !key.startsWith('data-type')) {
      attributes[key] = value
    }
  }

  return {
    id,
    type,
    label: element.attribs['data-label'],
    group: element.attribs['data-group'],
    placeholder: element.attribs['data-placeholder'],
    element: element.name,
    line,
    column,
    currentValue,
    attributes,
  }
}

/**
 * Parse a repeat block from an element
 */
function parseRepeatBlock(element: Element, html: string): RepeatBlock {
  const id = element.attribs['data-repeat']
  const min = parseInt(element.attribs['data-min'] || '0', 10)
  const max = parseInt(element.attribs['data-max'] || '999', 10)
  const { line } = getPosition(element, html)

  return {
    id,
    min,
    max,
    items: [],
    line,
  }
}

/**
 * Get text content from element (excluding nested elements for text type)
 */
function getTextContent(element: Element): string {
  let text = ''

  for (const child of element.children || []) {
    if (child.type === 'text') {
      text += (child as unknown as { data: string }).data
    } else if (child.type === 'tag') {
      // For simple text markers, include br as newline
      const tagName = (child as Element).name
      if (tagName === 'br') {
        text += '\n'
      } else {
        text += getTextContent(child as Element)
      }
    }
  }

  return text.trim()
}

/**
 * Get inner HTML from element (for richtext type)
 */
function getInnerHtml(element: Element): string {
  const parts: string[] = []

  for (const child of element.children || []) {
    if (child.type === 'text') {
      parts.push((child as unknown as { data: string }).data)
    } else if (child.type === 'tag') {
      const childElement = child as Element
      const attrs = Object.entries(childElement.attribs || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      const openTag = attrs ? `<${childElement.name} ${attrs}>` : `<${childElement.name}>`
      const closeTag = `</${childElement.name}>`
      const innerContent = getInnerHtml(childElement)
      parts.push(`${openTag}${innerContent}${closeTag}`)
    }
  }

  return parts.join('').trim()
}

/**
 * Get approximate line and column position
 */
function getPosition(element: Element, html: string): { line: number; column: number } {
  // htmlparser2 provides startIndex on elements when includeIndices is enabled
  // For now, we'll estimate based on a simple search
  const tagPattern = new RegExp(`<${element.name}[^>]*data-editable="${element.attribs['data-editable']}"`, 'i')
  const match = html.match(tagPattern)

  if (match && match.index !== undefined) {
    const beforeMatch = html.slice(0, match.index)
    const lines = beforeMatch.split('\n')
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    }
  }

  return { line: 1, column: 1 }
}

/**
 * Extract CSS color variables from HTML
 */
export function extractColors(html: string): ColorConfig[] {
  const colors: ColorConfig[] = []

  // Find :root block in style tags
  const rootPattern = /:root\s*\{([^}]+)\}/g
  const match = html.match(rootPattern)

  if (!match) return colors

  for (const rootBlock of match) {
    // Extract CSS variables
    const varPattern = /(--color[^:]+):\s*([^;]+);/g
    let varMatch: RegExpExecArray | null

    while ((varMatch = varPattern.exec(rootBlock)) !== null) {
      const [, variable, value] = varMatch
      colors.push({
        variable: variable.trim(),
        value: value.trim(),
      })
    }
  }

  return colors
}

/**
 * Validate markers and return validation messages
 */
export function validateMarkers(
  markers: EditableMarker[],
  repeatBlocks: RepeatBlock[]
): ValidationMessage[] {
  const validations: ValidationMessage[] = []

  // Check for duplicate IDs
  const idCounts = new Map<string, EditableMarker[]>()
  for (const marker of markers) {
    const existing = idCounts.get(marker.id) || []
    existing.push(marker)
    idCounts.set(marker.id, existing)
  }

  for (const [id, occurrences] of idCounts) {
    if (occurrences.length > 1) {
      validations.push({
        severity: 'error',
        line: occurrences[1].line,
        column: occurrences[1].column,
        message: `Duplicate data-editable ID "${id}"`,
        markerId: id,
        rule: 'unique-id',
      })
    }
  }

  // Validate each marker
  for (const marker of markers) {
    // Image validations
    if (marker.type === 'image') {
      // Check for alt attribute
      if (!marker.attributes.alt) {
        validations.push({
          severity: 'warning',
          line: marker.line,
          column: marker.column,
          message: `Image "${marker.id}" has no alt attribute`,
          markerId: marker.id,
          rule: 'image-alt',
        })
      }

      // Check for external URL
      const src = marker.attributes.src || ''
      if (src.startsWith('http://') || src.startsWith('https://')) {
        validations.push({
          severity: 'warning',
          line: marker.line,
          column: marker.column,
          message: `External URL detected in image "${marker.id}"`,
          markerId: marker.id,
          rule: 'external-url',
        })
      }
    }

    // Check for missing label
    if (!marker.label) {
      validations.push({
        severity: 'info',
        line: marker.line,
        column: marker.column,
        message: `Consider adding data-label to "${marker.id}"`,
        markerId: marker.id,
        rule: 'missing-label',
      })
    }
  }

  // Validate repeat blocks
  for (const repeatBlock of repeatBlocks) {
    if (repeatBlock.min > repeatBlock.max) {
      validations.push({
        severity: 'error',
        line: repeatBlock.line,
        column: 1,
        message: `Repeat block "${repeatBlock.id}" has min (${repeatBlock.min}) greater than max (${repeatBlock.max})`,
        markerId: repeatBlock.id,
        rule: 'repeat-min-max',
      })
    }
  }

  return validations
}

/**
 * Full parse with validation
 */
export function parseHtml(html: string): {
  markers: EditableMarker[]
  repeatBlocks: RepeatBlock[]
  colors: ColorConfig[]
  validations: ValidationMessage[]
} {
  const { markers, repeatBlocks } = parseMarkers(html)
  const colors = extractColors(html)
  const validations = validateMarkers(markers, repeatBlocks)

  return {
    markers,
    repeatBlocks,
    colors,
    validations,
  }
}
