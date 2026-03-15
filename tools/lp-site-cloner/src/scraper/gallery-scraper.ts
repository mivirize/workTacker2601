/**
 * Gallery Scraper
 *
 * Base class for scraping design gallery websites.
 * Uses Playwright for browser automation.
 */

import { chromium, Browser, Page } from 'playwright'
import {
  GalleryConfig,
  ScrapedSite,
  ScrapeResult,
  ScrapeError,
  ScrapeOptions,
  GALLERY_CONFIGS,
} from './types'

export class GalleryScraper {
  private browser: Browser | null = null
  private page: Page | null = null
  private config: GalleryConfig

  constructor(galleryName: string) {
    const config = GALLERY_CONFIGS[galleryName]
    if (!config) {
      throw new Error(`Unknown gallery: ${galleryName}. Available: ${Object.keys(GALLERY_CONFIGS).join(', ')}`)
    }
    this.config = config
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true })
    this.page = await this.browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }

  async scrape(options: ScrapeOptions = {}): Promise<ScrapeResult> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call init() first.')
    }

    const { pages = 3, limit = 100, dryRun = false } = options
    const startTime = Date.now()
    const sites: ScrapedSite[] = []
    const errors: ScrapeError[] = []
    let scrapedPages = 0

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Scraping: ${this.config.name}`)
    console.log(`${'='.repeat(60)}`)

    for (let pageNum = 1; pageNum <= pages && sites.length < limit; pageNum++) {
      const pageUrl = this.getPageUrl(pageNum)

      console.log(`\n[Page ${pageNum}/${pages}] ${pageUrl}`)

      if (dryRun) {
        console.log('  (dry run - skipping)')
        continue
      }

      try {
        await this.page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 })
        await this.page.waitForTimeout(1000)

        const pageSites = await this.extractSites()
        console.log(`  Found ${pageSites.length} sites`)

        for (const site of pageSites) {
          if (sites.length >= limit) break
          if (!sites.some(s => s.url === site.url)) {
            sites.push(site)
          }
        }

        scrapedPages++

        // Rate limiting
        if (pageNum < pages) {
          console.log(`  Waiting ${this.config.rateLimit}ms...`)
          await this.page.waitForTimeout(this.config.rateLimit)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`  Error: ${errorMsg}`)
        errors.push({
          page: pageNum,
          url: pageUrl,
          error: errorMsg,
          timestamp: new Date().toISOString(),
        })
      }
    }

    const duration = Date.now() - startTime

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Completed: ${sites.length} sites from ${scrapedPages} pages`)
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`)
    console.log(`${'='.repeat(60)}`)

    return {
      gallery: this.config.name,
      sites,
      totalPages: pages,
      scrapedPages,
      errors,
      duration,
    }
  }

  private getPageUrl(pageNum: number): string {
    const base = this.config.baseUrl + this.config.categoryPath

    if (this.config.pagePattern === 'query') {
      // Always include page param for query-type pagination
      const param = this.config.queryParam || 'p'
      return `${base}?${param}=${pageNum}`
    } else {
      if (pageNum === 1) return base
      return `${base}page/${pageNum}/`
    }
  }

  private async extractSites(): Promise<ScrapedSite[]> {
    if (!this.page) return []

    const sites = await this.page.evaluate((config) => {
      const results: Array<{
        url: string
        title: string
        thumbnail?: string
        tags: string[]
      }> = []

      // Find all items
      const items = document.querySelectorAll(config.selectors.item)

      items.forEach(item => {
        // Find external link (site URL)
        const links = item.querySelectorAll('a[href^="http"]')
        let siteUrl: string | null = null

        // Filter to find external links (not gallery internal links)
        for (const link of links) {
          const href = link.getAttribute('href')
          if (href && !href.includes(config.baseUrl) && !href.includes('ikesai.com') &&
              !href.includes('webdesigngarden.com') && !href.includes('webdesignclip.com') &&
              !href.includes('choooodoii.com') && !href.includes('sankoudesign.com')) {
            siteUrl = href
            break
          }
        }

        if (!siteUrl) return

        // Get title - try multiple strategies
        let title = ''

        // Strategy 1: Use title selector
        const titleEl = item.querySelector(config.selectors.title)
        if (titleEl) {
          // Get only direct text content, not child HTML
          const textNodes = Array.from(titleEl.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent?.trim())
            .filter(Boolean)
          title = textNodes.join(' ').trim()

          // Fallback to textContent if no direct text
          if (!title) {
            title = titleEl.textContent?.trim() || ''
          }
        }

        // Strategy 2: img alt text
        if (!title || title.length > 100) {
          const img = item.querySelector('img')
          if (img) {
            const alt = img.getAttribute('alt')?.trim()
            if (alt && alt.length > 2 && alt.length < 100) {
              title = alt
            }
          }
        }

        // Strategy 3: link text
        if (!title || title.length > 100) {
          for (const link of links) {
            const text = link.textContent?.trim()
            if (text && text.length > 2 && text.length < 100 && !text.includes('<')) {
              title = text
              break
            }
          }
        }

        // Strategy 4: hostname fallback
        if (!title || title.length > 100) {
          try { title = new URL(siteUrl).hostname } catch { title = siteUrl }
        }

        // Clean up title (remove excessive whitespace, newlines)
        title = title.replace(/\s+/g, ' ').trim().substring(0, 80)

        // Get thumbnail
        let thumbnail: string | undefined
        if (config.selectors.thumbnail) {
          const imgEl = item.querySelector(config.selectors.thumbnail)
          if (imgEl) {
            thumbnail = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || undefined
          }
        }

        // Get tags if available
        const tags: string[] = []
        if (config.selectors.tags) {
          item.querySelectorAll(config.selectors.tags).forEach(tag => {
            const tagText = tag.textContent?.trim()
            if (tagText) tags.push(tagText)
          })
        }

        if (siteUrl && title) {
          results.push({
            url: siteUrl,
            title,
            thumbnail,
            tags,
          })
        }
      })

      return results
    }, this.config)

    return sites.map(site => ({
      ...site,
      source: this.config.name,
      scrapedAt: new Date().toISOString(),
    }))
  }
}

// Convenience function
export async function scrapeGallery(
  galleryName: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const scraper = new GalleryScraper(galleryName)
  await scraper.init()

  try {
    return await scraper.scrape(options)
  } finally {
    await scraper.close()
  }
}
