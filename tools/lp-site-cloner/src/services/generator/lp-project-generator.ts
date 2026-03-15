import * as fs from 'fs/promises'
import * as path from 'path'
import { HtmlMarker } from './html-marker.js'
import { ConfigBuilder } from './config-builder.js'
import { SiteAnalyzer } from '../analyzer/index.js'
import {
  CaptureResult,
  GeneratorOptions,
  GeneratorResult,
  GeneratedFile,
  LpProjectConfig,
} from '../../types/index.js'

export class LpProjectGenerator {
  private options: GeneratorOptions

  constructor(options: GeneratorOptions) {
    this.options = options
  }

  async generate(captureResult: CaptureResult): Promise<GeneratorResult> {
    const analyzer = new SiteAnalyzer(captureResult.html, captureResult.css)
    const analysis = analyzer.analyze()

    const htmlMarker = new HtmlMarker(captureResult.html, this.options.markerConfig)

    htmlMarker.removeProblematicElements()
    htmlMarker.fixRelativeUrls(captureResult.metadata.url)

    htmlMarker.applyEditableMarkers(analysis.editableElements)
    htmlMarker.applyRepeatMarkers(analysis.repeatPatterns)

    const markedHtml = htmlMarker.getHtml()

    const configBuilder = new ConfigBuilder({
      projectName: this.options.projectName,
      clientName: this.options.clientName,
    })
    const config = configBuilder.build(analysis)

    const files = await this.prepareFiles(captureResult, markedHtml, config)

    const projectPath = this.options.outputPath
    await this.writeFiles(projectPath, files)

    await this.saveScreenshots(captureResult, projectPath)

    return {
      projectPath,
      config,
      files,
    }
  }

  private async prepareFiles(
    captureResult: CaptureResult,
    markedHtml: string,
    config: LpProjectConfig
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    files.push({
      path: 'lp-config.json',
      content: JSON.stringify(config, null, 2),
      type: 'json',
    })

    files.push({
      path: 'src/index.html',
      content: markedHtml,
      type: 'html',
    })

    const combinedCss = captureResult.css
      .map((s) => s.content || '')
      .filter(Boolean)
      .join('\n\n')

    if (combinedCss) {
      files.push({
        path: 'src/css/styles.css',
        content: this.processCss(combinedCss),
        type: 'css',
      })
    }

    const combinedJs = captureResult.js
      .filter((s) => !this.isTrackingScript(s.src || '', s.content || ''))
      .map((s) => s.content || '')
      .filter(Boolean)
      .join('\n\n')

    if (combinedJs) {
      files.push({
        path: 'src/js/main.js',
        content: combinedJs,
        type: 'js',
      })
    }

    return files
  }

  private processCss(css: string): string {
    let processed = css

    processed = processed.replace(
      /url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/g,
      (match, url) => {
        try {
          const urlObj = new URL(url)
          const filename = path.basename(urlObj.pathname)
          return `url('../images/${filename}')`
        } catch {
          return match
        }
      }
    )

    return processed
  }

  private isTrackingScript(src: string, content: string): boolean {
    const trackingPatterns = [
      'gtag',
      'analytics',
      'gtm',
      'google-analytics',
      'facebook',
      'pixel',
      'hotjar',
      'clarity',
    ]

    const lowerSrc = src.toLowerCase()
    const lowerContent = content.toLowerCase()

    return trackingPatterns.some(
      (pattern) => lowerSrc.includes(pattern) || lowerContent.includes(pattern)
    )
  }

  private async writeFiles(projectPath: string, files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(projectPath, file.path)
      const dir = path.dirname(fullPath)

      await fs.mkdir(dir, { recursive: true })

      if (typeof file.content === 'string') {
        await fs.writeFile(fullPath, file.content, 'utf-8')
      } else {
        await fs.writeFile(fullPath, file.content)
      }
    }

    const dataDir = path.join(projectPath, 'data')
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(
      path.join(dataDir, 'content.json'),
      JSON.stringify({}, null, 2),
      'utf-8'
    )

    const imagesDir = path.join(projectPath, 'src', 'images')
    await fs.mkdir(imagesDir, { recursive: true })
    await fs.writeFile(
      path.join(imagesDir, '.gitkeep'),
      '',
      'utf-8'
    )
  }

  private async saveScreenshots(
    captureResult: CaptureResult,
    projectPath: string
  ): Promise<void> {
    const screenshotsDir = path.join(projectPath, '.lp-editor', 'original-screenshots')
    await fs.mkdir(screenshotsDir, { recursive: true })

    for (const set of captureResult.screenshots) {
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
        const state = set.scrollStates[i]
        await fs.writeFile(
          path.join(viewportDir, `scroll-${i}-${state.position}px.png`),
          state.screenshot
        )
      }
    }

    const metadataPath = path.join(projectPath, '.lp-editor', 'capture-metadata.json')
    await fs.writeFile(
      metadataPath,
      JSON.stringify(captureResult.metadata, null, 2),
      'utf-8'
    )
  }
}
