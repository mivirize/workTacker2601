export interface ViewportConfig {
  name: 'desktop' | 'tablet' | 'mobile'
  width: number
  height: number
}

export interface CaptureOptions {
  url: string
  viewports?: ViewportConfig[]
  fullPage?: boolean
  waitForSelector?: string
  waitForTimeout?: number
  scrollCapture?: boolean
  outputDir?: string
}

export interface ScriptInfo {
  src: string | null
  inline: boolean
  content?: string
}

export interface StylesheetInfo {
  href: string | null
  inline: boolean
  content?: string
}

export interface AssetInfo {
  url: string
  type: 'image' | 'font' | 'video' | 'other'
  localPath?: string
}

export interface PageMetadata {
  url: string
  title: string
  description: string
  viewport: ViewportConfig
  capturedAt: string
  scrollHeight: number
  scripts: ScriptInfo[]
  stylesheets: StylesheetInfo[]
}

export interface ScrollState {
  position: number
  percentage: number
  screenshot: Buffer
  visibleElements: string[]
}

export interface SectionScreenshot {
  selector: string
  name: string
  screenshot: Buffer
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ScreenshotSet {
  viewport: ViewportConfig
  fullPage: Buffer
  sections: SectionScreenshot[]
  scrollStates: ScrollState[]
}

export interface CaptureResult {
  screenshots: ScreenshotSet[]
  html: string
  css: StylesheetInfo[]
  js: ScriptInfo[]
  assets: AssetInfo[]
  metadata: PageMetadata
}

export const DEFAULT_VIEWPORTS: ViewportConfig[] = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]
