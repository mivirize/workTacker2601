import { Page } from 'playwright'
import { ScrollState } from '../../types/index.js'

export interface ScrollRecorderOptions {
  steps?: number
  delayBetweenSteps?: number
  captureVisibleElements?: boolean
}

const DEFAULT_OPTIONS: ScrollRecorderOptions = {
  steps: 10,
  delayBetweenSteps: 500,
  captureVisibleElements: true,
}

export class ScrollRecorder {
  private options: ScrollRecorderOptions

  constructor(options?: Partial<ScrollRecorderOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  async recordScrollStates(page: Page): Promise<ScrollState[]> {
    const states: ScrollState[] = []

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    const maxScroll = scrollHeight - viewportHeight

    if (maxScroll <= 0) {
      const screenshot = await page.screenshot()
      return [{
        position: 0,
        percentage: 0,
        screenshot,
        visibleElements: await this.getVisibleElements(page),
      }]
    }

    const stepSize = maxScroll / (this.options.steps! - 1)

    for (let i = 0; i < this.options.steps!; i++) {
      const position = Math.min(Math.round(stepSize * i), maxScroll)
      const percentage = (position / maxScroll) * 100

      await page.evaluate((pos) => {
        window.scrollTo({ top: pos, behavior: 'instant' })
      }, position)

      await page.waitForTimeout(this.options.delayBetweenSteps!)

      const screenshot = await page.screenshot()

      const visibleElements = this.options.captureVisibleElements
        ? await this.getVisibleElements(page)
        : []

      states.push({
        position,
        percentage,
        screenshot,
        visibleElements,
      })
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))

    return states
  }

  private async getVisibleElements(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const elements: string[] = []
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      const selectors = [
        'header', 'nav', 'main', 'section', 'article', 'aside', 'footer',
        '[class*="hero"]', '[class*="banner"]', '[class*="section"]',
        'h1', 'h2', 'h3',
      ]

      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((el) => {
          const rect = el.getBoundingClientRect()
          if (
            rect.top < viewportHeight &&
            rect.bottom > 0 &&
            rect.left < viewportWidth &&
            rect.right > 0
          ) {
            const id = el.id ? `#${el.id}` : ''
            const classes = el.className
              ? `.${el.className.toString().split(' ').filter(Boolean).join('.')}`
              : ''
            elements.push(`${el.tagName.toLowerCase()}${id}${classes}`)
          }
        })
      }

      return [...new Set(elements)]
    })
  }

  async captureAnimationTriggers(page: Page): Promise<Map<number, string[]>> {
    const triggers = new Map<number, string[]>()

    const animatedElements = await page.evaluate(() => {
      const elements: { selector: string; triggerPoint: number }[] = []

      document.querySelectorAll('[data-aos], [class*="animate"], [class*="fade"], [class*="slide"]').forEach((el) => {
        const rect = el.getBoundingClientRect()
        const scrollTop = window.scrollY
        const triggerPoint = rect.top + scrollTop - window.innerHeight * 0.8

        const id = el.id ? `#${el.id}` : ''
        const classes = el.className
          ? `.${el.className.toString().split(' ').filter(Boolean).slice(0, 2).join('.')}`
          : ''

        elements.push({
          selector: `${el.tagName.toLowerCase()}${id}${classes}`,
          triggerPoint: Math.max(0, triggerPoint),
        })
      })

      return elements
    })

    for (const { selector, triggerPoint } of animatedElements) {
      const roundedPoint = Math.round(triggerPoint / 100) * 100
      if (!triggers.has(roundedPoint)) {
        triggers.set(roundedPoint, [])
      }
      triggers.get(roundedPoint)!.push(selector)
    }

    return triggers
  }
}
