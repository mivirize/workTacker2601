import * as fs from 'fs/promises'
import * as path from 'path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { chromium } from 'playwright'
import { DiffImage, ComparisonDetails, ViewportConfig, DEFAULT_VIEWPORTS } from '../../types/index.js'

export interface VisualCompareOptions {
  threshold?: number
  viewports?: ViewportConfig[]
  outputDir?: string
}

const DEFAULT_OPTIONS: VisualCompareOptions = {
  threshold: 0.1,
  viewports: DEFAULT_VIEWPORTS,
}

export class VisualCompare {
  private options: VisualCompareOptions

  constructor(options?: Partial<VisualCompareOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  async compare(
    originalUrl: string,
    generatedPath: string
  ): Promise<{ score: number; details: ComparisonDetails[]; diffImages: DiffImage[] }> {
    const details: ComparisonDetails[] = []
    const diffImages: DiffImage[] = []

    const browser = await chromium.launch({ headless: true })

    try {
      for (const viewport of this.options.viewports!) {
        const originalScreenshot = await this.captureUrl(browser, originalUrl, viewport)

        const generatedHtmlPath = path.join(generatedPath, 'src', 'index.html')
        const generatedUrl = `file://${generatedHtmlPath.replace(/\\/g, '/')}`
        const generatedScreenshot = await this.captureUrl(browser, generatedUrl, viewport)

        const { diffPixels, totalPixels, diffBuffer } = await this.compareImages(
          originalScreenshot,
          generatedScreenshot
        )

        const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100

        if (this.options.outputDir) {
          const diffDir = path.join(this.options.outputDir, 'diff', viewport.name)
          await fs.mkdir(diffDir, { recursive: true })

          const originalPath = path.join(diffDir, 'original.png')
          const genPath = path.join(diffDir, 'generated.png')
          const diffPath = path.join(diffDir, 'diff.png')

          await fs.writeFile(originalPath, originalScreenshot)
          await fs.writeFile(genPath, generatedScreenshot)
          await fs.writeFile(diffPath, PNG.sync.write(diffBuffer))

          diffImages.push({
            viewport: viewport.name,
            originalPath,
            generatedPath: genPath,
            diffPath,
            diffPixels,
            totalPixels,
            matchPercentage,
          })
        }

        details.push({
          viewport: viewport.name,
          matchedPixels: totalPixels - diffPixels,
          totalPixels,
          diffPixels,
          structureDiff: {
            missingElements: [],
            extraElements: [],
            modifiedElements: [],
          },
        })
      }
    } finally {
      await browser.close()
    }

    const avgScore =
      details.reduce((sum, d) => sum + ((d.totalPixels - d.diffPixels) / d.totalPixels) * 100, 0) /
      details.length

    return {
      score: Math.round(avgScore * 100) / 100,
      details,
      diffImages,
    }
  }

  private async captureUrl(
    browser: ReturnType<typeof chromium.launch> extends Promise<infer T> ? T : never,
    url: string,
    viewport: ViewportConfig
  ): Promise<Buffer> {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      ignoreHTTPSErrors: true,
    })

    const page = await context.newPage()

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      await page.waitForTimeout(2000)

      const screenshot = await page.screenshot({ fullPage: true })
      return screenshot
    } finally {
      await context.close()
    }
  }

  private async compareImages(
    img1Buffer: Buffer,
    img2Buffer: Buffer
  ): Promise<{ diffPixels: number; totalPixels: number; diffBuffer: PNG }> {
    const img1 = PNG.sync.read(img1Buffer)
    const img2 = PNG.sync.read(img2Buffer)

    const width = Math.max(img1.width, img2.width)
    const height = Math.max(img1.height, img2.height)

    const normalizedImg1 = this.normalizeImage(img1, width, height)
    const normalizedImg2 = this.normalizeImage(img2, width, height)

    const diff = new PNG({ width, height })

    const diffPixels = pixelmatch(
      normalizedImg1.data,
      normalizedImg2.data,
      diff.data,
      width,
      height,
      { threshold: this.options.threshold }
    )

    return {
      diffPixels,
      totalPixels: width * height,
      diffBuffer: diff,
    }
  }

  private normalizeImage(img: PNG, targetWidth: number, targetHeight: number): PNG {
    if (img.width === targetWidth && img.height === targetHeight) {
      return img
    }

    const normalized = new PNG({ width: targetWidth, height: targetHeight })

    for (let y = 0; y < img.height && y < targetHeight; y++) {
      for (let x = 0; x < img.width && x < targetWidth; x++) {
        const srcIdx = (img.width * y + x) << 2
        const dstIdx = (targetWidth * y + x) << 2

        normalized.data[dstIdx] = img.data[srcIdx]
        normalized.data[dstIdx + 1] = img.data[srcIdx + 1]
        normalized.data[dstIdx + 2] = img.data[srcIdx + 2]
        normalized.data[dstIdx + 3] = img.data[srcIdx + 3]
      }
    }

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        if (y >= img.height || x >= img.width) {
          const idx = (targetWidth * y + x) << 2
          normalized.data[idx] = 255
          normalized.data[idx + 1] = 255
          normalized.data[idx + 2] = 255
          normalized.data[idx + 3] = 255
        }
      }
    }

    return normalized
  }
}
