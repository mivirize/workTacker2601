import { Page } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'
import { AssetInfo, StylesheetInfo, ScriptInfo } from '../../types/index.js'

export interface DownloadResult {
  css: StylesheetInfo[]
  js: ScriptInfo[]
  images: AssetInfo[]
  fonts: AssetInfo[]
}

export class AssetDownloader {
  private baseUrl: string
  private outputDir: string

  constructor(baseUrl: string, outputDir: string) {
    this.baseUrl = baseUrl
    this.outputDir = outputDir
  }

  async downloadAll(page: Page): Promise<DownloadResult> {
    const [css, js, images, fonts] = await Promise.all([
      this.extractStylesheets(page),
      this.extractScripts(page),
      this.extractImages(page),
      this.extractFonts(page),
    ])

    return { css, js, images, fonts }
  }

  private async extractStylesheets(page: Page): Promise<StylesheetInfo[]> {
    const stylesheets: StylesheetInfo[] = []

    const linkTags = await page.$$eval('link[rel="stylesheet"]', (links) =>
      links.map((link) => ({
        href: link.getAttribute('href'),
      }))
    )

    for (const link of linkTags) {
      if (link.href) {
        const fullUrl = this.resolveUrl(link.href)
        try {
          const response = await page.request.get(fullUrl)
          const content = await response.text()
          stylesheets.push({
            href: link.href,
            inline: false,
            content,
          })
        } catch {
          stylesheets.push({
            href: link.href,
            inline: false,
          })
        }
      }
    }

    const inlineStyles = await page.$$eval('style', (styles) =>
      styles.map((style) => style.textContent || '')
    )

    for (const content of inlineStyles) {
      if (content.trim()) {
        stylesheets.push({
          href: null,
          inline: true,
          content,
        })
      }
    }

    return stylesheets
  }

  private async extractScripts(page: Page): Promise<ScriptInfo[]> {
    const scripts: ScriptInfo[] = []

    const scriptTags = await page.$$eval('script', (tags) =>
      tags.map((script) => ({
        src: script.getAttribute('src'),
        content: script.textContent || '',
      }))
    )

    for (const script of scriptTags) {
      if (script.src) {
        const fullUrl = this.resolveUrl(script.src)
        try {
          const response = await page.request.get(fullUrl)
          const content = await response.text()
          scripts.push({
            src: script.src,
            inline: false,
            content,
          })
        } catch {
          scripts.push({
            src: script.src,
            inline: false,
          })
        }
      } else if (script.content.trim()) {
        scripts.push({
          src: null,
          inline: true,
          content: script.content,
        })
      }
    }

    return scripts
  }

  private async extractImages(page: Page): Promise<AssetInfo[]> {
    const images: AssetInfo[] = []

    const imgUrls = await page.$$eval('img', (imgs) =>
      imgs
        .map((img) => img.getAttribute('src'))
        .filter((src): src is string => !!src)
    )

    const bgUrls = await page.$$eval('*', (elements) => {
      const urls: string[] = []
      elements.forEach((el) => {
        const style = window.getComputedStyle(el)
        const bgImage = style.backgroundImage
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/)
          if (match) urls.push(match[1])
        }
      })
      return urls
    })

    const allUrls = [...new Set([...imgUrls, ...bgUrls])]

    for (const url of allUrls) {
      if (url.startsWith('data:')) continue

      const fullUrl = this.resolveUrl(url)
      images.push({
        url: fullUrl,
        type: 'image',
      })
    }

    return images
  }

  private async extractFonts(page: Page): Promise<AssetInfo[]> {
    const fonts: AssetInfo[] = []

    const fontUrls = await page.evaluate(() => {
      const urls: string[] = []
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSFontFaceRule) {
              const src = rule.style.getPropertyValue('src')
              const matches = src.matchAll(/url\(["']?([^"')]+)["']?\)/g)
              for (const match of matches) {
                urls.push(match[1])
              }
            }
          }
        } catch {
          // CORS restriction
        }
      }
      return urls
    })

    for (const url of fontUrls) {
      if (url.startsWith('data:')) continue

      const fullUrl = this.resolveUrl(url)
      fonts.push({
        url: fullUrl,
        type: 'font',
      })
    }

    return fonts
  }

  async downloadAsset(url: string, localPath: string): Promise<void> {
    const response = await fetch(url)
    const buffer = Buffer.from(await response.arrayBuffer())

    const dir = path.dirname(localPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(localPath, buffer)
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    if (url.startsWith('//')) {
      return 'https:' + url
    }
    return new URL(url, this.baseUrl).href
  }
}
