import * as cheerio from 'cheerio'
import { RepeatPattern, RepeatField, EditableType } from '../../types/index.js'

export interface RepeatDetectorOptions {
  minRepeatCount?: number
  maxDepth?: number
}

const DEFAULT_OPTIONS: RepeatDetectorOptions = {
  minRepeatCount: 3,
  maxDepth: 5,
}

export class RepeatDetector {
  private $: cheerio.CheerioAPI
  private options: RepeatDetectorOptions

  constructor(html: string, options?: Partial<RepeatDetectorOptions>) {
    this.$ = cheerio.load(html)
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  detect(): RepeatPattern[] {
    const patterns: RepeatPattern[] = []
    const processedContainers = new Set<cheerio.Element>()

    const containerSelectors = [
      'ul',
      'ol',
      '.grid',
      '.list',
      '[class*="grid"]',
      '[class*="list"]',
      '[class*="cards"]',
      '[class*="items"]',
      '[class*="gallery"]',
      'div[class]',
    ]

    for (const selector of containerSelectors) {
      this.$(selector).each((_, container) => {
        if (processedContainers.has(container)) return

        const pattern = this.analyzeContainer(container)
        if (pattern) {
          processedContainers.add(container)
          patterns.push(pattern)
        }
      })
    }

    return this.filterOverlappingPatterns(patterns)
  }

  private analyzeContainer(container: cheerio.Element): RepeatPattern | null {
    const $container = this.$(container)
    const children = $container.children()

    if (children.length < this.options.minRepeatCount!) {
      return null
    }

    const childStructures = children.toArray().map((child) =>
      this.getElementStructure(this.$(child))
    )

    const structureCounts = new Map<string, number>()
    for (const structure of childStructures) {
      structureCounts.set(structure, (structureCounts.get(structure) || 0) + 1)
    }

    let dominantStructure = ''
    let maxCount = 0
    for (const [structure, count] of structureCounts) {
      if (count > maxCount) {
        maxCount = count
        dominantStructure = structure
      }
    }

    if (maxCount < this.options.minRepeatCount!) {
      return null
    }

    const confidence = maxCount / children.length

    if (confidence < 0.7) {
      return null
    }

    const matchingChildren = children.toArray().filter(
      (child) => this.getElementStructure(this.$(child)) === dominantStructure
    )

    const templateHtml = this.$(matchingChildren[0]).html() || ''
    const fields = this.extractFields(matchingChildren)

    const containerId = $container.attr('id') || ''
    const containerClass = ($container.attr('class') || '').split(' ')[0] || ''

    return {
      id: containerId || containerClass || `repeat-${Date.now()}`,
      containerSelector: this.generateSelector($container),
      itemSelector: this.generateItemSelector(matchingChildren[0]),
      itemCount: matchingChildren.length,
      templateHtml,
      fields,
      confidence,
    }
  }

  private getElementStructure($el: cheerio.Cheerio<cheerio.Element>): string {
    const tagName = $el.prop('tagName')?.toLowerCase() || ''
    const classes = ($el.attr('class') || '').split(' ').sort().join('.')

    const childSignatures = $el
      .children()
      .map((_, child) => {
        const $child = this.$(child)
        const childTag = $child.prop('tagName')?.toLowerCase() || ''
        const childClasses = ($child.attr('class') || '').split(' ').sort().join('.')
        return `${childTag}.${childClasses}`
      })
      .get()
      .join('|')

    return `${tagName}.${classes}[${childSignatures}]`
  }

  private extractFields(items: cheerio.Element[]): RepeatField[] {
    const fields: RepeatField[] = []
    const firstItem = this.$(items[0])

    firstItem.find('img').each((i, el) => {
      const values = items.map((item) => {
        const $img = this.$(item).find('img').eq(i)
        return $img.attr('src') || ''
      })

      if (this.hasVariation(values)) {
        fields.push({
          key: `image-${i}`,
          selector: `img:nth-of-type(${i + 1})`,
          type: 'image',
          sampleValues: values.slice(0, 3),
        })
      }
    })

    const textSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a']
    for (const sel of textSelectors) {
      firstItem.find(sel).each((i, el) => {
        const $el = this.$(el)
        if ($el.children().length > 0 && sel !== 'a') return

        const values = items.map((item) => {
          return this.$(item).find(sel).eq(i).text().trim()
        })

        if (this.hasVariation(values)) {
          const type: EditableType = sel === 'a' ? 'link' : 'text'
          fields.push({
            key: `${sel}-${i}`,
            selector: `${sel}:nth-of-type(${i + 1})`,
            type,
            sampleValues: values.slice(0, 3),
          })
        }
      })
    }

    return fields
  }

  private hasVariation(values: string[]): boolean {
    const nonEmpty = values.filter((v) => v.length > 0)
    if (nonEmpty.length < 2) return false

    const uniqueValues = new Set(nonEmpty)
    return uniqueValues.size > 1 || (uniqueValues.size === 1 && nonEmpty.length >= 2)
  }

  private generateSelector($el: cheerio.Cheerio<cheerio.Element>): string {
    const id = $el.attr('id')
    if (id) return `#${id}`

    const tagName = $el.prop('tagName')?.toLowerCase() || ''
    const className = ($el.attr('class') || '').split(' ').filter(Boolean)[0]

    if (className) {
      return `.${className}`
    }

    return tagName
  }

  private generateItemSelector(el: cheerio.Element): string {
    const $el = this.$(el)
    const tagName = $el.prop('tagName')?.toLowerCase() || ''
    const className = ($el.attr('class') || '').split(' ').filter(Boolean)[0]

    if (className) {
      return `.${className}`
    }

    return tagName
  }

  private filterOverlappingPatterns(patterns: RepeatPattern[]): RepeatPattern[] {
    const sorted = patterns.sort((a, b) => b.itemCount - a.itemCount)
    const result: RepeatPattern[] = []
    const usedContainers = new Set<string>()

    for (const pattern of sorted) {
      const container = this.$(pattern.containerSelector)
      let isOverlapping = false

      for (const usedSelector of usedContainers) {
        const usedContainer = this.$(usedSelector)
        if (
          container.find(usedSelector).length > 0 ||
          usedContainer.find(pattern.containerSelector).length > 0
        ) {
          isOverlapping = true
          break
        }
      }

      if (!isOverlapping) {
        result.push(pattern)
        usedContainers.add(pattern.containerSelector)
      }
    }

    return result
  }
}
