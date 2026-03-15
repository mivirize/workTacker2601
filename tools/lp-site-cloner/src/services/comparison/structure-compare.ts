import * as cheerio from 'cheerio'
import { StructureDiff } from '../../types/index.js'

export interface StructureCompareResult {
  score: number
  diff: StructureDiff
  details: {
    originalElementCount: number
    generatedElementCount: number
    matchedElements: number
    structuralSimilarity: number
  }
}

export class StructureCompare {
  async compare(originalHtml: string, generatedHtml: string): Promise<StructureCompareResult> {
    const $original = cheerio.load(originalHtml)
    const $generated = cheerio.load(generatedHtml)

    const originalStructure = this.extractStructure($original)
    const generatedStructure = this.extractStructure($generated)

    const missingElements = this.findMissingElements(originalStructure, generatedStructure)
    const extraElements = this.findMissingElements(generatedStructure, originalStructure)
    const modifiedElements = this.findModifiedElements($original, $generated)

    const originalCount = originalStructure.length
    const generatedCount = generatedStructure.length
    const matchedCount = originalCount - missingElements.length

    const structuralSimilarity = this.calculateSimilarity(
      originalStructure,
      generatedStructure
    )

    const score = this.calculateScore(
      originalCount,
      generatedCount,
      matchedCount,
      structuralSimilarity
    )

    return {
      score,
      diff: {
        missingElements,
        extraElements,
        modifiedElements,
      },
      details: {
        originalElementCount: originalCount,
        generatedElementCount: generatedCount,
        matchedElements: matchedCount,
        structuralSimilarity,
      },
    }
  }

  private extractStructure($: cheerio.CheerioAPI): string[] {
    const elements: string[] = []
    const significantTags = [
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'ul', 'ol', 'li',
      'img', 'video', 'audio',
      'form', 'input', 'button', 'a',
      'div[class]', 'span[class]',
    ]

    for (const selector of significantTags) {
      $(selector).each((_, el) => {
        const $el = $(el)
        const signature = this.getElementSignature($el)
        if (signature) {
          elements.push(signature)
        }
      })
    }

    return [...new Set(elements)]
  }

  private getElementSignature($el: cheerio.Cheerio<cheerio.Element>): string {
    const tagName = $el.prop('tagName')?.toLowerCase() || ''
    const id = $el.attr('id') || ''
    const classes = ($el.attr('class') || '')
      .split(' ')
      .filter(Boolean)
      .sort()
      .slice(0, 3)
      .join('.')

    const attrs: string[] = []
    if (id) attrs.push(`#${id}`)
    if (classes) attrs.push(`.${classes}`)

    return `${tagName}${attrs.join('')}`
  }

  private findMissingElements(original: string[], generated: string[]): string[] {
    const generatedSet = new Set(generated)
    return original.filter((sig) => !generatedSet.has(sig))
  }

  private findModifiedElements(
    $original: cheerio.CheerioAPI,
    $generated: cheerio.CheerioAPI
  ): { selector: string; changes: string[] }[] {
    const modifications: { selector: string; changes: string[] }[] = []

    const checkElements = ['header', 'nav', 'main', 'footer', 'section']

    for (const selector of checkElements) {
      const $origEl = $original(selector).first()
      const $genEl = $generated(selector).first()

      if ($origEl.length === 0 || $genEl.length === 0) continue

      const changes: string[] = []

      const origChildren = $origEl.children().length
      const genChildren = $genEl.children().length
      if (Math.abs(origChildren - genChildren) > 2) {
        changes.push(`子要素数の差異 (${origChildren} → ${genChildren})`)
      }

      const origClass = $origEl.attr('class') || ''
      const genClass = $genEl.attr('class') || ''
      if (origClass !== genClass) {
        changes.push('クラス名の変更')
      }

      if (changes.length > 0) {
        modifications.push({ selector, changes })
      }
    }

    return modifications
  }

  private calculateSimilarity(original: string[], generated: string[]): number {
    const originalSet = new Set(original)
    const generatedSet = new Set(generated)

    let matches = 0
    for (const sig of originalSet) {
      if (generatedSet.has(sig)) {
        matches++
      }
    }

    const union = new Set([...original, ...generated]).size
    return union > 0 ? matches / union : 1
  }

  private calculateScore(
    originalCount: number,
    generatedCount: number,
    matchedCount: number,
    structuralSimilarity: number
  ): number {
    const elementRatio = originalCount > 0 ? matchedCount / originalCount : 1
    const countPenalty = Math.abs(originalCount - generatedCount) / Math.max(originalCount, 1)
    const normalizedCountPenalty = Math.min(countPenalty, 0.5)

    const score =
      (elementRatio * 0.4 + structuralSimilarity * 0.4 + (1 - normalizedCountPenalty) * 0.2) * 100

    return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100
  }
}
