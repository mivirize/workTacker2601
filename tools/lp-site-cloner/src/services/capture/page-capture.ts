import { Page } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BrowserManager, BrowserConfig } from './browser-manager.js'
import { AssetDownloader } from './asset-downloader.js'
import { ScrollRecorder, ScrollRecorderOptions } from './scroll-recorder.js'
import {
  CaptureOptions,
  CaptureResult,
  ScreenshotSet,
  SectionScreenshot,
  PageMetadata,
  ViewportConfig,
  DEFAULT_VIEWPORTS,
} from '../../types/index.js'

export interface PageCaptureConfig extends BrowserConfig {
  scrollRecorder?: ScrollRecorderOptions
}

export class PageCapture {
  private browserManager: BrowserManager
  private scrollRecorder: ScrollRecorder

  constructor(config?: Partial<PageCaptureConfig>) {
    this.browserManager = new BrowserManager(config)
    this.scrollRecorder = new ScrollRecorder(config?.scrollRecorder)
  }

  async capture(options: CaptureOptions): Promise<CaptureResult> {
    await this.browserManager.initialize()

    try {
      const { context, page } = await this.browserManager.createContext()

      await page.goto(options.url, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector)
      }
      if (options.waitForTimeout) {
        await page.waitForTimeout(options.waitForTimeout)
      }

      const viewports = options.viewports || DEFAULT_VIEWPORTS
      const screenshots = await this.captureAllViewports(page, viewports, options)

      const html = await page.content()

      const downloader = new AssetDownloader(options.url, options.outputDir || './output')
      const assets = await downloader.downloadAll(page)

      const metadata = await this.extractMetadata(page, viewports[0])

      await context.close()

      return {
        screenshots,
        html,
        css: assets.css,
        js: assets.js,
        assets: [...assets.images, ...assets.fonts],
        metadata,
      }
    } finally {
      await this.browserManager.dispose()
    }
  }

  private async captureAllViewports(
    page: Page,
    viewports: ViewportConfig[],
    options: CaptureOptions
  ): Promise<ScreenshotSet[]> {
    const results: ScreenshotSet[] = []

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })

      await page.waitForTimeout(500)

      const fullPage = await page.screenshot({
        fullPage: options.fullPage !== false,
      })

      const sections = await this.captureSections(page)

      const scrollStates = options.scrollCapture
        ? await this.scrollRecorder.recordScrollStates(page)
        : []

      results.push({
        viewport,
        fullPage,
        sections,
        scrollStates,
      })
    }

    return results
  }

  private async captureSections(page: Page): Promise<SectionScreenshot[]> {
    const sections: SectionScreenshot[] = []

    const sectionSelectors = [
      'header',
      'nav',
      'main',
      'section',
      'article',
      'aside',
      'footer',
      '[id*="section"]',
      '[class*="section"]',
    ]

    for (const selector of sectionSelectors) {
      const elements = await page.$$(selector)

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        const boundingBox = await element.boundingBox()

        if (!boundingBox || boundingBox.height < 50) continue

        try {
          const screenshot = await element.screenshot()
          const tagName = await element.evaluate((el) => el.tagName.toLowerCase())
          const id = await element.evaluate((el) => el.id || '')
          const className = await element.evaluate((el) => el.className?.toString().split(' ')[0] || '')

          const name = id || className || `${tagName}-${i + 1}`

          sections.push({
            selector: id ? `#${id}` : className ? `.${className}` : `${tagName}:nth-of-type(${i + 1})`,
            name,
            screenshot,
            boundingBox,
          })
        } catch {
          // Element may not be visible
        }
      }
    }

    return sections
  }

  private async extractMetadata(page: Page, viewport: ViewportConfig): Promise<PageMetadata> {
    const metadata = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      scrollHeight: document.documentElement.scrollHeight,
    }))

    const scripts = await page.$$eval('script', (tags) =>
      tags.map((script) => ({
        src: script.getAttribute('src'),
        inline: !script.getAttribute('src'),
      }))
    )

    const stylesheets = await page.$$eval('link[rel="stylesheet"], style', (tags) =>
      tags.map((tag) => ({
        href: tag.getAttribute('href'),
        inline: tag.tagName === 'STYLE',
      }))
    )

    return {
      url: page.url(),
      title: metadata.title,
      description: metadata.description,
      viewport,
      capturedAt: new Date().toISOString(),
      scrollHeight: metadata.scrollHeight,
      scripts,
      stylesheets,
    }
  }

  async saveScreenshots(result: CaptureResult, outputDir: string): Promise<void> {
    const screenshotsDir = path.join(outputDir, '.lp-editor', 'original-screenshots')
    await fs.mkdir(screenshotsDir, { recursive: true })

    for (const set of result.screenshots) {
      const viewportDir = path.join(screenshotsDir, set.viewport.name)
      await fs.mkdir(viewportDir, { recursive: true })

      await fs.writeFile(
        path.join(viewportDir, 'fullpage.png'),
        set.fullPage
      )

      for (const section of set.sections) {
        await fs.writeFile(
          path.join(viewportDir, `section-${section.name}.png`),
          section.screenshot
        )
      }

      for (let i = 0; i < set.scrollStates.length; i++) {
        await fs.writeFile(
          path.join(viewportDir, `scroll-${i}-${set.scrollStates[i].position}px.png`),
          set.scrollStates[i].screenshot
        )
      }
    }
  }
}
