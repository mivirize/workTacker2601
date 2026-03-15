import * as cheerio from 'cheerio'
import { EditableCandidate, RepeatPattern, MarkerConfig } from '../../types/index.js'

const DEFAULT_MARKER_CONFIG: MarkerConfig = {
  idPrefix: '',
  groupPrefix: '',
  labelLanguage: 'ja',
}

export class HtmlMarker {
  private $: cheerio.CheerioAPI
  private config: MarkerConfig

  constructor(html: string, config?: Partial<MarkerConfig>) {
    this.$ = cheerio.load(html, { decodeEntities: false })
    this.config = { ...DEFAULT_MARKER_CONFIG, ...config }
  }

  applyEditableMarkers(candidates: EditableCandidate[]): void {
    const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence)
    const markedSelectors = new Set<string>()

    for (const candidate of sorted) {
      if (markedSelectors.has(candidate.selector)) continue

      const $el = this.$(candidate.selector)
      if ($el.length === 0) continue

      const first = $el.first()

      if (first.attr('data-editable')) continue

      first.attr('data-editable', this.formatId(candidate.suggestedId))
      first.attr('data-type', candidate.type)
      first.attr('data-label', candidate.suggestedLabel)

      if (candidate.suggestedGroup) {
        first.attr('data-group', candidate.suggestedGroup)
      }

      const orderStr = String(candidate.suggestedOrder).padStart(3, '0')
      first.attr('data-order', orderStr)

      if (candidate.type === 'image') {
        this.addImageAttributes(first)
      }

      markedSelectors.add(candidate.selector)
    }
  }

  applyRepeatMarkers(patterns: RepeatPattern[]): void {
    for (const pattern of patterns) {
      const $container = this.$(pattern.containerSelector)
      if ($container.length === 0) continue

      $container.attr('data-repeat', pattern.id)
      $container.attr('data-repeat-min', '1')
      $container.attr('data-repeat-max', String(Math.max(pattern.itemCount * 2, 10)))

      $container.find(pattern.itemSelector).each((index, el) => {
        const $item = this.$(el)
        $item.attr('data-repeat-item', String(index + 1))

        for (const field of pattern.fields) {
          const $field = $item.find(field.selector)
          if ($field.length === 0) continue

          const fieldId = `${pattern.id}-${index + 1}-${field.key}`
          $field.attr('data-editable', fieldId)
          $field.attr('data-type', field.type)
          $field.attr('data-label', this.generateFieldLabel(field.key))

          if (field.type === 'image') {
            this.addImageAttributes($field)
          }
        }
      })
    }
  }

  private addImageAttributes($el: cheerio.Cheerio<cheerio.Element>): void {
    const width = $el.attr('width')
    const height = $el.attr('height')

    if (width && height) {
      $el.attr('data-recommended-size', `${width}x${height}`)
    }

    $el.attr('data-accept', 'image/*')
    $el.attr('data-max-size', '5242880')
  }

  private formatId(id: string): string {
    return this.config.idPrefix + id
  }

  private generateFieldLabel(key: string): string {
    const labelMap: Record<string, string> = {
      'image': '画像',
      'title': 'タイトル',
      'name': '名前',
      'text': 'テキスト',
      'description': '説明',
      'price': '価格',
      'date': '日付',
      'link': 'リンク',
      'button': 'ボタン',
    }

    for (const [pattern, label] of Object.entries(labelMap)) {
      if (key.toLowerCase().includes(pattern)) {
        return label
      }
    }

    return key
      .replace(/[-_]/g, ' ')
      .replace(/(\d+)$/, ' $1')
      .trim()
  }

  removeProblematicElements(): void {
    this.$('meta[http-equiv="Content-Security-Policy"]').remove()

    this.$('script[src*="gtag"], script[src*="analytics"], script[src*="gtm"]').remove()

    this.$('script').each((_, el) => {
      const content = this.$(el).html() || ''
      if (
        content.includes('gtag') ||
        content.includes('GoogleAnalytics') ||
        content.includes('dataLayer')
      ) {
        this.$(el).remove()
      }
    })

    this.$('link[rel="preconnect"][href*="google"]').remove()
    this.$('link[rel="dns-prefetch"][href*="google"]').remove()
  }

  fixRelativeUrls(baseUrl: string): void {
    const base = new URL(baseUrl)

    this.$('img[src], source[srcset]').each((_, el) => {
      const $el = this.$(el)
      const src = $el.attr('src') || $el.attr('srcset')

      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const absoluteUrl = new URL(src, base).href
        if ($el.attr('src')) {
          $el.attr('data-original-src', absoluteUrl)
        }
      }
    })

    this.$('a[href]').each((_, el) => {
      const $el = this.$(el)
      const href = $el.attr('href')

      if (href === '#' || href === 'javascript:;' || href === 'javascript:void(0)') {
        $el.attr('onclick', 'event.preventDefault()')
      }
    })
  }

  getHtml(): string {
    return this.$.html()
  }

  getCheerio(): cheerio.CheerioAPI {
    return this.$
  }
}
