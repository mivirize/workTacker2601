import { chromium, Browser, BrowserContext, Page } from 'playwright'

export interface BrowserConfig {
  headless?: boolean
  timeout?: number
  userAgent?: string
}

export interface BrowserContextResult {
  context: BrowserContext
  page: Page
}

const DEFAULT_CONFIG: BrowserConfig = {
  headless: true,
  timeout: 60000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

export class BrowserManager {
  private browser: Browser | null = null
  private config: BrowserConfig

  constructor(config?: Partial<BrowserConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async initialize(): Promise<void> {
    if (this.browser) return

    this.browser = await chromium.launch({
      headless: this.config.headless,
    })
  }

  async createContext(): Promise<BrowserContextResult> {
    if (!this.browser) {
      await this.initialize()
    }

    const context = await this.browser!.newContext({
      userAgent: this.config.userAgent,
      viewport: null,
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
    })

    context.setDefaultTimeout(this.config.timeout!)

    const page = await context.newPage()

    return { context, page }
  }

  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  getBrowser(): Browser | null {
    return this.browser
  }
}
