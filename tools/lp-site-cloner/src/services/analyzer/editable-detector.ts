import * as cheerio from 'cheerio'
import { EditableCandidate, EditableType } from '../../types/index.js'

export interface DetectionOptions {
  minTextLength?: number
  maxTextLength?: number
  confidenceThreshold?: number
}

const DEFAULT_OPTIONS: DetectionOptions = {
  minTextLength: 2,
  maxTextLength: 500,
  confidenceThreshold: 0.5,
}

export class EditableDetector {
  private $: cheerio.CheerioAPI
  private options: DetectionOptions
  private orderCounter: number = 0
  private sectionCounter: number = 0

  constructor(html: string, options?: Partial<DetectionOptions>) {
    this.$ = cheerio.load(html)
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  detect(): EditableCandidate[] {
    const candidates: EditableCandidate[] = []

    candidates.push(...this.detectTextElements())
    candidates.push(...this.detectImageElements())
    candidates.push(...this.detectLinkElements())

    return candidates
      .filter((c) => c.confidence >= this.options.confidenceThreshold!)
      .sort((a, b) => {
        if (a.suggestedGroup !== b.suggestedGroup) {
          return a.suggestedGroup.localeCompare(b.suggestedGroup)
        }
        return a.suggestedOrder - b.suggestedOrder
      })
  }

  private detectTextElements(): EditableCandidate[] {
    const candidates: EditableCandidate[] = []

    this.$('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const candidate = this.createTextCandidate(el, 'text')
      if (candidate) {
        candidate.confidence = Math.min(candidate.confidence + 0.3, 1)
        candidates.push(candidate)
      }
    })

    this.$('p').each((_, el) => {
      const $el = this.$(el)
      const text = $el.text().trim()

      if (text.length > 100) {
        const candidate = this.createTextCandidate(el, 'richtext')
        if (candidate) candidates.push(candidate)
      } else {
        const candidate = this.createTextCandidate(el, 'text')
        if (candidate) candidates.push(candidate)
      }
    })

    this.$('span, div').each((_, el) => {
      const $el = this.$(el)
      if ($el.children().length > 0) return

      const candidate = this.createTextCandidate(el, 'text')
      if (candidate) {
        candidate.confidence = Math.max(candidate.confidence - 0.2, 0.3)
        candidates.push(candidate)
      }
    })

    this.$('button, .btn, [class*="button"]').each((_, el) => {
      const candidate = this.createTextCandidate(el, 'text')
      if (candidate) {
        candidate.confidence = 0.85
        candidates.push(candidate)
      }
    })

    return candidates
  }

  private detectImageElements(): EditableCandidate[] {
    const candidates: EditableCandidate[] = []

    this.$('img').each((_, el) => {
      const $el = this.$(el)
      const src = $el.attr('src')

      if (!src) return
      if (this.isIconOrDecoration($el)) return

      const candidate: EditableCandidate = {
        selector: this.generateSelector($el),
        type: 'image',
        confidence: 0.9,
        currentValue: src,
        suggestedId: this.generateId($el),
        suggestedLabel: $el.attr('alt') || '画像',
        suggestedGroup: this.detectGroup($el),
        suggestedOrder: this.orderCounter++,
      }

      candidates.push(candidate)
    })

    return candidates
  }

  private detectLinkElements(): EditableCandidate[] {
    const candidates: EditableCandidate[] = []

    this.$('a[href]').each((_, el) => {
      const $el = this.$(el)
      const href = $el.attr('href') || ''
      const text = $el.text().trim()

      if (!text || text.length < 2) return
      if (href.startsWith('#') && href.length < 3) return
      if (href === 'javascript:;' || href === 'javascript:void(0)') return

      const candidate: EditableCandidate = {
        selector: this.generateSelector($el),
        type: 'link',
        confidence: 0.7,
        currentValue: href,
        suggestedId: this.generateId($el),
        suggestedLabel: text.slice(0, 30),
        suggestedGroup: this.detectGroup($el),
        suggestedOrder: this.orderCounter++,
      }

      candidates.push(candidate)
    })

    return candidates
  }

  private createTextCandidate(
    el: cheerio.Element,
    type: EditableType
  ): EditableCandidate | null {
    const $el = this.$(el)
    const text = $el.clone().children().remove().end().text().trim()
      || $el.text().trim()

    if (text.length < this.options.minTextLength!) return null
    if (text.length > this.options.maxTextLength!) return null

    const confidence = this.calculateTextConfidence($el, text)

    return {
      selector: this.generateSelector($el),
      type,
      confidence,
      currentValue: text,
      suggestedId: this.generateId($el),
      suggestedLabel: this.generateLabel($el, text),
      suggestedGroup: this.detectGroup($el),
      suggestedOrder: this.orderCounter++,
    }
  }

  private calculateTextConfidence(
    $el: cheerio.Cheerio<cheerio.Element>,
    text: string
  ): number {
    let confidence = 0.5
    const tagName = $el.prop('tagName')?.toLowerCase() || ''

    if (/^h[1-6]$/.test(tagName)) {
      confidence += 0.3
    }

    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      confidence += 0.1
    }

    if (tagName === 'span' || tagName === 'div') {
      confidence -= 0.1
    }

    if ($el.closest('nav, footer').length > 0) {
      confidence -= 0.15
    }

    return Math.min(Math.max(confidence, 0), 1)
  }

  private isIconOrDecoration($el: cheerio.Cheerio<cheerio.Element>): boolean {
    const src = $el.attr('src') || ''
    const className = $el.attr('class') || ''
    const width = parseInt($el.attr('width') || '999', 10)
    const height = parseInt($el.attr('height') || '999', 10)

    if (width < 50 || height < 50) return true
    if (/icon|logo|arrow|bullet|decoration/i.test(src)) return true
    if (/icon|logo|arrow|bullet|decoration/i.test(className)) return true
    if (src.includes('.svg') && (width < 100 || height < 100)) return true

    return false
  }

  private generateSelector($el: cheerio.Cheerio<cheerio.Element>): string {
    const id = $el.attr('id')
    if (id) return `#${id}`

    const tagName = $el.prop('tagName')?.toLowerCase() || ''
    const className = ($el.attr('class') || '').split(' ').filter(Boolean)[0]

    if (className) {
      const siblings = this.$(`.${className}`)
      if (siblings.length === 1) {
        return `.${className}`
      }
      const index = siblings.index($el)
      return `.${className}:nth-of-type(${index + 1})`
    }

    const parent = $el.parent()
    const siblings = parent.children(tagName)
    const index = siblings.index($el)

    if (siblings.length === 1) {
      return tagName
    }
    return `${tagName}:nth-of-type(${index + 1})`
  }

  private generateId($el: cheerio.Cheerio<cheerio.Element>): string {
    const id = $el.attr('id')
    if (id) return id

    const section = $el.closest('section, article, header, footer, main')
    const sectionId = section.attr('id') || section.attr('class')?.split(' ')[0] || 'section'
    const tagName = $el.prop('tagName')?.toLowerCase() || 'element'

    const orderStr = String(this.orderCounter).padStart(3, '0')
    return `${orderStr}-${sectionId}-${tagName}`
  }

  private generateLabel(
    $el: cheerio.Cheerio<cheerio.Element>,
    text: string
  ): string {
    const tagName = $el.prop('tagName')?.toLowerCase() || ''

    const tagLabels: Record<string, string> = {
      h1: 'メインタイトル',
      h2: 'セクションタイトル',
      h3: '見出し',
      h4: '小見出し',
      p: 'テキスト',
      button: 'ボタン',
    }

    if (tagLabels[tagName] && text.length > 20) {
      return tagLabels[tagName]
    }

    return text.slice(0, 30) + (text.length > 30 ? '...' : '')
  }

  private detectGroup($el: cheerio.Cheerio<cheerio.Element>): string {
    const section = $el.closest('section, article, header, footer, main, nav, aside')

    if (section.length === 0) {
      return '00-Other'
    }

    const tagName = section.prop('tagName')?.toLowerCase() || ''
    const id = section.attr('id') || ''
    const className = (section.attr('class') || '').split(' ')[0] || ''

    const groupMap: Record<string, string> = {
      header: '01-Header',
      nav: '02-Navigation',
      main: '03-Main',
      footer: '99-Footer',
      aside: '98-Sidebar',
    }

    if (groupMap[tagName]) {
      return groupMap[tagName]
    }

    const sectionNum = String(++this.sectionCounter).padStart(2, '0')
    const label = id || className || 'Section'

    return `${sectionNum}-${label}`
  }
}
