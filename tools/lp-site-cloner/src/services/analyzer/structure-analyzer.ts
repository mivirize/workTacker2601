import * as cheerio from 'cheerio'
import { SectionInfo } from '../../types/index.js'

export class StructureAnalyzer {
  private $: cheerio.CheerioAPI

  constructor(html: string) {
    this.$ = cheerio.load(html)
  }

  analyzeSections(): SectionInfo[] {
    const sections: SectionInfo[] = []
    let order = 0

    const sectionSelectors = [
      'header',
      'nav:not(header nav)',
      'main > section',
      'main > div[class]',
      'section',
      'article',
      'aside',
      'footer',
    ]

    const processedElements = new Set<cheerio.Element>()

    for (const selector of sectionSelectors) {
      this.$(selector).each((_, el) => {
        if (processedElements.has(el)) return

        const $el = this.$(el)
        const parent = $el.parent()[0]

        if (parent && processedElements.has(parent)) return

        processedElements.add(el)

        const sectionInfo = this.extractSectionInfo($el, order++)
        if (sectionInfo) {
          sections.push(sectionInfo)
        }
      })
    }

    return sections.sort((a, b) => a.order - b.order)
  }

  private extractSectionInfo($el: cheerio.Cheerio<cheerio.Element>, order: number): SectionInfo | null {
    const tagName = $el.prop('tagName')?.toLowerCase() || ''
    const id = $el.attr('id') || ''
    const className = ($el.attr('class') || '').split(' ').filter(Boolean)[0] || ''

    if (!tagName) return null

    const selector = id
      ? `#${id}`
      : className
        ? `.${className}`
        : `${tagName}:nth-of-type(${order + 1})`

    const suggestedLabel = this.generateLabel($el, tagName, id, className)

    return {
      id: id || `section-${order}`,
      tagName,
      className,
      order,
      suggestedLabel,
      selector,
      children: this.extractChildSections($el),
    }
  }

  private extractChildSections($parent: cheerio.Cheerio<cheerio.Element>): SectionInfo[] {
    const children: SectionInfo[] = []
    let childOrder = 0

    $parent.children('section, article, div[class*="section"], div[class*="block"]').each((_, el) => {
      const $el = this.$(el)
      const info = this.extractSectionInfo($el, childOrder++)
      if (info) {
        children.push(info)
      }
    })

    return children
  }

  private generateLabel(
    $el: cheerio.Cheerio<cheerio.Element>,
    tagName: string,
    id: string,
    className: string
  ): string {
    const labelMap: Record<string, string> = {
      header: 'ヘッダー',
      nav: 'ナビゲーション',
      main: 'メインコンテンツ',
      footer: 'フッター',
      aside: 'サイドバー',
      article: '記事',
    }

    if (labelMap[tagName]) {
      return labelMap[tagName]
    }

    const heading = $el.find('h1, h2, h3').first().text().trim()
    if (heading && heading.length < 30) {
      return heading
    }

    if (id) {
      return this.formatIdToLabel(id)
    }

    if (className) {
      return this.formatClassToLabel(className)
    }

    return `セクション ${tagName}`
  }

  private formatIdToLabel(id: string): string {
    return id
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private formatClassToLabel(className: string): string {
    return this.formatIdToLabel(className)
  }

  getHtml(): string {
    return this.$.html()
  }

  getCheerio(): cheerio.CheerioAPI {
    return this.$
  }
}
