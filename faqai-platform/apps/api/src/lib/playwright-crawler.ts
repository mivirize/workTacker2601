import { chromium, type Browser, type Page } from 'playwright';
import { createHash } from 'crypto';
import {
  FAQ_URL_PATTERNS,
  FAQ_TITLE_PATTERNS,
  FAQ_NAV_PATTERN_DEFS,
  PAGINATION_SELECTORS,
  PAGINATION_URL_PATTERNS,
  PAGINATION_TEXT_PATTERN_DEFS,
  MAIN_CONTENT_SELECTORS,
  FAQ_SECTION_SCREENSHOT_SELECTORS,
} from './faq-constants.js';
import { logger } from './logger.js';
import type { CrawledPage, StructuredContent } from './crawler.js';

export type PlaywrightCrawledPage = CrawledPage & {
  screenshot?: Buffer | undefined;
  faqSectionScreenshots?: Array<{ selector: string; screenshot: Buffer }> | undefined;
};

const NAV_LINK_SELECTORS = [
  'nav a',
  'footer a',
  'aside a',
  'header a',
  '[role="navigation"] a',
];

const MAX_FAQ_SCREENSHOTS = 20;

/**
 * extractPageData の戻り値型（内部用）
 */
type ExtractedPageData = {
  title: string | null;
  metaDescription: string | null;
  headings: Array<{ level: number; text: string }>;
  contentText: string | null;
  mainContent: string;
  links: string[];
  faqItems: Array<{ question: string; answer: string }>;
  hasFaqContent: boolean;
};

/**
 * Playwright版 構造化コンテンツ抽出Webクローラー
 * - JS レンダリング対応（SPA, 動的コンテンツ）
 * - アコーディオン自動展開
 * - FAQ ナビゲーション検出による優先クロール
 * - スクリーンショット取得
 */
export class PlaywrightCrawler {
  private readonly baseUrl: string;
  private readonly domain: string;
  private readonly maxPages: number;
  private readonly maxDepth: number;
  private readonly rateLimitMs: number;
  private readonly screenshotEnabled: boolean;
  private readonly maxPaginationPages: number;
  private readonly visited = new Set<string>();
  private readonly paginationCountByBase = new Map<string, number>();
  private browser: Browser | null = null;

  constructor(options: {
    url: string;
    maxPages?: number;
    maxDepth?: number;
    rateLimitMs?: number;
    screenshotEnabled?: boolean;
    maxPaginationPages?: number;
  }) {
    this.baseUrl = options.url;
    this.domain = new URL(options.url).hostname;
    this.maxPages = options.maxPages ?? 50;
    this.maxDepth = options.maxDepth ?? 3;
    this.rateLimitMs = options.rateLimitMs ?? 1000;
    this.screenshotEnabled = options.screenshotEnabled ?? false;
    this.maxPaginationPages = options.maxPaginationPages ?? 10;
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    logger.info('Playwright browser launched');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Playwright browser closed');
    }
  }

  async crawl(
    onPage: (page: PlaywrightCrawledPage) => Promise<void>,
  ): Promise<{ crawledCount: number; failedCount: number; faqPagesFound: number }> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const priorityQueue: Array<{ url: string; depth: number }> = [];
    const normalQueue: Array<{ url: string; depth: number }> = [];

    // Step 1: Discover FAQ links from navigation
    const faqUrls = await this.discoverFaqLinks();
    for (const faqUrl of faqUrls) {
      const normalized = this.normalizeUrl(faqUrl);
      if (normalized) {
        priorityQueue.push({ url: normalized, depth: 1 });
      }
    }

    // Add base URL to normal queue
    normalQueue.push({ url: this.baseUrl, depth: 0 });

    let crawledCount = 0;
    let failedCount = 0;
    let faqPagesFound = 0;

    while (
      (priorityQueue.length > 0 || normalQueue.length > 0) &&
      crawledCount < this.maxPages
    ) {
      const item = priorityQueue.length > 0
        ? priorityQueue.shift()!
        : normalQueue.shift()!;

      const normalized = this.normalizeUrl(item.url);
      if (!normalized || this.visited.has(normalized)) continue;
      this.visited.add(normalized);

      try {
        if (crawledCount > 0) {
          await this.sleep(this.rateLimitMs);
        }

        const result = await this.fetchPage(normalized, item.depth);

        if (result) {
          if (result.isFaqPage) faqPagesFound++;
          await onPage(result);
          crawledCount++;

          // Discover pagination links for FAQ pages
          if (result.isFaqPage) {
            const paginationUrls = await this.discoverPaginationLinks(normalized);
            const baseKey = this.getPaginationBaseUrl(normalized);
            const currentCount = this.paginationCountByBase.get(baseKey) ?? 1;

            for (const pgUrl of paginationUrls) {
              const normalizedPg = this.normalizeUrl(pgUrl);
              if (
                normalizedPg &&
                !this.visited.has(normalizedPg) &&
                currentCount < this.maxPaginationPages
              ) {
                priorityQueue.push({ url: normalizedPg, depth: item.depth });
                this.paginationCountByBase.set(baseKey, currentCount + 1);
                logger.debug(
                  { url: normalizedPg, base: baseKey, pageNum: currentCount + 1 },
                  'Pagination link discovered',
                );
              }
            }
          }

          if (item.depth < this.maxDepth) {
            for (const link of result.links) {
              const normalizedLink = this.normalizeUrl(link);
              if (normalizedLink && !this.visited.has(normalizedLink)) {
                // FAQページ内のリンクは全てFAQ関連として優先クロール
                if (this.isFaqUrl(normalizedLink) || result.isFaqPage) {
                  priorityQueue.push({ url: normalizedLink, depth: item.depth + 1 });
                } else {
                  normalQueue.push({ url: normalizedLink, depth: item.depth + 1 });
                }
              }
            }
          }

          logger.debug(
            { url: normalized, depth: item.depth, crawledCount, isFaq: result.isFaqPage },
            'Page crawled (Playwright)',
          );
        } else {
          failedCount++;
        }
      } catch (err) {
        logger.warn({ url: normalized, err }, 'Failed to crawl page (Playwright)');
        failedCount++;
      }
    }

    return { crawledCount, failedCount, faqPagesFound };
  }

  /**
   * ベースURLのナビゲーションからFAQ関連リンクを検出する
   */
  private async discoverFaqLinks(): Promise<string[]> {
    if (!this.browser) return [];

    const context = await this.browser.newContext({
      userAgent: 'FAQAI-Crawler/2.0 (+https://faqai.example.com/crawler)',
      locale: 'ja-JP',
    });
    const browserPage = await context.newPage();

    try {
      await browserPage.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30_000 });

      const faqUrls: string[] = await browserPage.evaluate(
        evaluateDiscoverFaqLinks,
        {
          selectors: NAV_LINK_SELECTORS,
          patterns: FAQ_NAV_PATTERN_DEFS,
          baseUrl: this.baseUrl,
        },
      );

      logger.info({ count: faqUrls.length, urls: faqUrls }, 'FAQ links discovered from navigation');
      return faqUrls;
    } catch (err) {
      logger.warn({ err }, 'Failed to discover FAQ links from navigation');
      return [];
    } finally {
      await browserPage.close();
      await context.close();
    }
  }

  /**
   * FAQページからページネーションリンクを検出する
   */
  private async discoverPaginationLinks(pageUrl: string): Promise<string[]> {
    if (!this.browser) return [];

    const context = await this.browser.newContext({
      userAgent: 'FAQAI-Crawler/2.0 (+https://faqai.example.com/crawler)',
      locale: 'ja-JP',
    });
    const browserPage = await context.newPage();

    try {
      await browserPage.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30_000 });

      const paginationUrls: string[] = await browserPage.evaluate(
        evaluateDiscoverPaginationLinks,
        {
          selectors: PAGINATION_SELECTORS,
          textPatterns: PAGINATION_TEXT_PATTERN_DEFS,
          urlPatterns: PAGINATION_URL_PATTERNS.map((r) => ({
            source: r.source,
            flags: r.flags,
          })),
          currentUrl: pageUrl,
          domain: this.domain,
        },
      );

      if (paginationUrls.length > 0) {
        logger.info(
          { count: paginationUrls.length, source: pageUrl, urls: paginationUrls },
          'Pagination links discovered',
        );
      }

      return paginationUrls;
    } catch (err) {
      logger.warn({ err, url: pageUrl }, 'Failed to discover pagination links');
      return [];
    } finally {
      await browserPage.close();
      await context.close();
    }
  }

  /**
   * ページネーション追跡用のベースURLを取得する
   * クエリパラメータやページ番号部分を除去して同一リスト系列を識別する
   */
  private getPaginationBaseUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove pagination query params
      for (const key of ['page', 'p', 'pg', 'paged']) {
        parsed.searchParams.delete(key);
      }
      // Remove /page/N or /p/N from path
      const cleanedPath = parsed.pathname.replace(/\/page\/\d+\/?$/, '').replace(/\/p\/\d+\/?$/, '');
      parsed.pathname = cleanedPath;
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /**
   * Playwrightでページを取得し、構造化コンテンツを抽出する
   */
  private async fetchPage(url: string, depth: number): Promise<PlaywrightCrawledPage | null> {
    if (!this.browser) return null;

    const context = await this.browser.newContext({
      userAgent: 'FAQAI-Crawler/2.0 (+https://faqai.example.com/crawler)',
      locale: 'ja-JP',
    });
    const browserPage = await context.newPage();

    try {
      const response = await browserPage.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

      if (!response) return null;

      const httpStatus = response.status();
      const contentType = response.headers()['content-type'] ?? '';
      if (!contentType.includes('html')) return null;

      // Expand accordions before extraction
      await this.expandAccordions(browserPage);

      // Extract page data via DOM evaluation
      const pageData: ExtractedPageData | null = await browserPage.evaluate(
        evaluateExtractPageData,
        { mainSelectors: MAIN_CONTENT_SELECTORS, domain: this.domain },
      );
      if (!pageData) return null;

      const isFaqPage = this.isFaqUrl(url) ||
        (pageData.title !== null && this.isFaqTitle(pageData.title)) ||
        pageData.hasFaqContent;

      const structuredContent = this.buildStructuredContent(pageData, url, isFaqPage);

      const contentHash = createHash('sha256')
        .update(pageData.contentText ?? '')
        .digest('hex')
        .slice(0, 32);

      // Screenshots
      const screenshotResult = this.screenshotEnabled
        ? await this.captureScreenshots(browserPage, isFaqPage)
        : { screenshot: undefined, faqSectionScreenshots: undefined };

      return {
        url,
        title: pageData.title,
        contentText: pageData.contentText,
        depth,
        httpStatus,
        contentHash,
        links: pageData.links,
        isFaqPage,
        structuredContent,
        ...screenshotResult,
      };
    } catch (err) {
      logger.warn({ url, err: String(err) }, 'Playwright fetch failed');
      return null;
    } finally {
      await browserPage.close();
      await context.close();
    }
  }

  /**
   * スクリーンショットを取得する
   */
  private async captureScreenshots(
    browserPage: Page,
    isFaqPage: boolean,
  ): Promise<Pick<PlaywrightCrawledPage, 'screenshot' | 'faqSectionScreenshots'>> {
    const screenshot = Buffer.from(
      await browserPage.screenshot({ fullPage: true, type: 'png' }),
    );

    let faqSectionScreenshots: Array<{ selector: string; screenshot: Buffer }> | undefined;
    if (isFaqPage) {
      const sections = await this.takeFaqSectionScreenshots(browserPage);
      faqSectionScreenshots = sections.length > 0 ? sections : undefined;
    }

    return { screenshot, faqSectionScreenshots };
  }

  /**
   * アコーディオン要素を展開する
   */
  private async expandAccordions(browserPage: Page): Promise<void> {
    try {
      // Open all <details> elements
      await browserPage.evaluate(evaluateExpandDetails);

      // Click all aria-expanded="false" buttons
      const collapsedButtons = browserPage.locator('[aria-expanded="false"]');
      const count = await collapsedButtons.count();
      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          await collapsedButtons.nth(i).click({ timeout: 2000 });
          await browserPage.waitForTimeout(200);
        } catch {
          // Skip elements that fail to click
        }
      }
    } catch (err) {
      logger.debug({ err: String(err) }, 'Accordion expansion had partial failures');
    }
  }

  /**
   * FAQセクションのスクリーンショットを取得する
   */
  private async takeFaqSectionScreenshots(
    browserPage: Page,
  ): Promise<Array<{ selector: string; screenshot: Buffer }>> {
    const results: Array<{ selector: string; screenshot: Buffer }> = [];

    for (const selector of FAQ_SECTION_SCREENSHOT_SELECTORS) {
      const elements = browserPage.locator(selector);
      const count = await elements.count();

      if (count === 0) continue;

      const limit = Math.min(count, MAX_FAQ_SCREENSHOTS);
      for (let i = 0; i < limit; i++) {
        try {
          const el = elements.nth(i);
          if (await el.isVisible()) {
            const buf = Buffer.from(await el.screenshot({ type: 'png' }));
            results.push({ selector, screenshot: buf });
          }
        } catch {
          // Element not screenshottable
        }
      }

      // Use first matching selector pattern only
      if (results.length > 0) break;
    }

    return results;
  }

  private buildStructuredContent(
    data: ExtractedPageData,
    url: string,
    isFaqPage: boolean,
  ): StructuredContent {
    const pageType = this.classifyPageType(url, data.headings, isFaqPage);

    return {
      headings: data.headings,
      mainContent: data.mainContent,
      metaDescription: data.metaDescription,
      faqItems: isFaqPage ? data.faqItems : [],
      pageType,
    };
  }

  private classifyPageType(
    url: string,
    headings: Array<{ level: number; text: string }>,
    isFaqPage: boolean,
  ): StructuredContent['pageType'] {
    if (isFaqPage) return 'faq';

    const urlLower = url.toLowerCase();
    const headingText = headings.map((h) => h.text).join(' ').toLowerCase();
    const combined = `${urlLower} ${headingText}`;

    if (/about|会社概要|私たちについて|企業情報/.test(combined)) return 'about';
    if (/pricing|price|料金|プラン|価格/.test(combined)) return 'pricing';
    if (/contact|お問い合わせ|連絡|相談/.test(combined)) return 'contact';
    if (/product|service|サービス|製品|商品/.test(combined)) return 'product';
    if (/blog|news|ニュース|ブログ|記事|コラム/.test(combined)) return 'blog';

    return 'general';
  }

  private isFaqUrl(url: string): boolean {
    return FAQ_URL_PATTERNS.some((pattern) => pattern.test(url));
  }

  private isFaqTitle(title: string): boolean {
    return FAQ_TITLE_PATTERNS.some((pattern) => pattern.test(title));
  }

  private normalizeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      if (parsed.hostname !== this.domain) return null;

      parsed.hash = '';
      const str = parsed.toString();
      return str.endsWith('/') && str !== `${parsed.origin}/`
        ? str.slice(0, -1)
        : str;
    } catch {
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Browser-context evaluate functions
// These functions run inside Playwright's browser context via page.evaluate().
// They are defined as standalone functions to keep DOM types isolated.
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// Browser-context global reference (avoids TS error for `window`/`document` in Node lib)
declare const window: any; // eslint-disable-line no-var
declare const document: any; // eslint-disable-line no-var

/**
 * details要素をすべて展開する（ブラウザコンテキスト実行）
 */
function evaluateExpandDetails(): void {
  const details = document.querySelectorAll('details');
  for (const d of details) {
    (d as any).setAttribute('open', '');
  }
}

/**
 * ナビゲーションからFAQリンクを検出する（ブラウザコンテキスト実行）
 */
function evaluateDiscoverFaqLinks(args: {
  selectors: string[];
  patterns: Array<{ source: string; flags: string }>;
  baseUrl: string;
}): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  const compiledPatterns = args.patterns.map(
    (p) => new RegExp(p.source, p.flags),
  );

  for (const selector of args.selectors) {
    const anchors = window.document.querySelectorAll(selector);
    for (const anchor of anchors) {
      const href: string = (anchor as any).href ?? '';
      const text: string = (anchor as any).textContent?.trim() ?? '';

      const matchesPattern = compiledPatterns.some(
        (re) => re.test(text) || re.test(href),
      );

      if (matchesPattern && href && !seen.has(href)) {
        try {
          const url = new URL(href, args.baseUrl);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            seen.add(href);
            results.push(url.toString());
          }
        } catch {
          // invalid URL
        }
      }
    }
  }

  return results;
}

/**
 * ページからコンテンツ・FAQ・リンクを抽出する（ブラウザコンテキスト実行）
 */
function evaluateExtractPageData(args: {
  mainSelectors: string[];
  domain: string;
}): {
  title: string | null;
  metaDescription: string | null;
  headings: Array<{ level: number; text: string }>;
  contentText: string | null;
  mainContent: string;
  links: string[];
  faqItems: Array<{ question: string; answer: string }>;
  hasFaqContent: boolean;
} | null {
  const doc = window.document;

  const title: string | null = doc.title?.trim() || null;
  const metaEl = doc.querySelector('meta[name="description"]');
  const metaDescription: string | null = metaEl?.content?.trim() ?? null;

  // Headings
  const headings: Array<{ level: number; text: string }> = [];
  const headingEls = doc.querySelectorAll('h1, h2, h3, h4');
  for (const el of headingEls) {
    const level = parseInt((el as any).tagName.replace('H', ''), 10);
    const text: string = (el as any).textContent?.trim() ?? '';
    if (text && text.length < 200) {
      headings.push({ level, text });
    }
  }

  // FAQ content detection
  let hasFaqContent = false;

  // JSON-LD check
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const jsonLdTexts: string[] = [];
  for (const s of jsonLdScripts) {
    const text: string = (s as any).textContent ?? '';
    jsonLdTexts.push(text);
    if (text.includes('FAQPage') || text.includes('Question')) {
      hasFaqContent = true;
    }
  }

  // FAQ element count
  const faqElementCount =
    doc.querySelectorAll('details summary').length +
    doc.querySelectorAll('[itemtype*="Question"]').length +
    doc.querySelectorAll('.faq, .faq-item, .qa-item, [class*="accordion"]').length;

  if (faqElementCount >= 3) {
    hasFaqContent = true;
  }

  // FAQ items extraction
  const faqItems: Array<{ question: string; answer: string }> = [];

  // 1. JSON-LD FAQPage
  for (const jsonLdText of jsonLdTexts) {
    try {
      const data = JSON.parse(jsonLdText);
      if (data['@type'] === 'FAQPage' && Array.isArray(data.mainEntity)) {
        for (const entity of data.mainEntity) {
          if (entity['@type'] === 'Question') {
            faqItems.push({
              question: entity.name ?? '',
              answer: entity.acceptedAnswer?.text ?? '',
            });
          }
        }
      }
    } catch {
      // parse error
    }
  }

  // 2. details > summary
  const detailsEls = doc.querySelectorAll('details');
  for (const el of detailsEls) {
    const summary = (el as any).querySelector('summary');
    if (!summary) continue;
    const question: string = summary.textContent?.trim() ?? '';
    const answerParts: string[] = [];
    for (const child of (el as any).children) {
      if ((child as any).tagName !== 'SUMMARY') {
        answerParts.push((child as any).textContent?.trim() ?? '');
      }
    }
    const answer = answerParts.join(' ').trim();
    if (question && answer) {
      faqItems.push({ question, answer });
    }
  }

  // 3. microdata
  const microdataEls = doc.querySelectorAll('[itemtype*="Question"]');
  for (const el of microdataEls) {
    const question: string = (el as any).querySelector('[itemprop="name"]')?.textContent?.trim() ?? '';
    const answer: string = (
      (el as any).querySelector('[itemprop="text"]')?.textContent ??
      (el as any).querySelector('[itemprop="acceptedAnswer"]')?.textContent ??
      ''
    ).trim();
    if (question && answer) {
      faqItems.push({ question, answer });
    }
  }

  // 4. Accordion CSS classes
  if (faqItems.length === 0) {
    const accordionEls = doc.querySelectorAll('.faq-item, .qa-item, [class*="accordion-item"]');
    for (const el of accordionEls) {
      const question: string = (
        (el as any).querySelector('.question, .faq-question, [class*="accordion-header"], [class*="accordion-title"]')
          ?.textContent ?? ''
      ).trim();
      const answer: string = (
        (el as any).querySelector('.answer, .faq-answer, [class*="accordion-body"], [class*="accordion-content"]')
          ?.textContent ?? ''
      ).trim();
      if (question && answer) {
        faqItems.push({ question, answer });
      }
    }
  }

  // 5. dl > dt + dd pattern (common in Japanese sites)
  if (faqItems.length === 0) {
    const dlEls = doc.querySelectorAll('dl');
    for (const dl of dlEls) {
      const dts = (dl as any).querySelectorAll(':scope > dt');
      const dds = (dl as any).querySelectorAll(':scope > dd');
      const pairCount = Math.min(dts.length, dds.length);
      for (let i = 0; i < pairCount; i++) {
        const question: string = dts[i]?.textContent?.trim() ?? '';
        const answer: string = dds[i]?.textContent?.trim() ?? '';
        if (question && answer) {
          faqItems.push({ question, answer });
        }
      }
    }
  }

  // 6. [class*="question"] + next sibling
  if (faqItems.length === 0) {
    const questionEls = doc.querySelectorAll('[class*="question"]');
    for (const el of questionEls) {
      const question: string = (el as any).textContent?.trim() ?? '';
      const sibling = (el as any).nextElementSibling;
      const answer: string = sibling?.textContent?.trim() ?? '';
      if (question && answer) {
        faqItems.push({ question, answer });
      }
    }
  }

  // 7. [class*="faq-q"] + [class*="faq-a"]
  if (faqItems.length === 0) {
    const qs = doc.querySelectorAll('[class*="faq-q"]');
    const ansEls = doc.querySelectorAll('[class*="faq-a"]');
    const count = Math.min(qs.length, ansEls.length);
    for (let i = 0; i < count; i++) {
      const question: string = qs[i]?.textContent?.trim() ?? '';
      const answer: string = ansEls[i]?.textContent?.trim() ?? '';
      if (question && answer) {
        faqItems.push({ question, answer });
      }
    }
  }

  // Remove noise elements for content text extraction
  const clone: any = doc.body.cloneNode(true);
  const noiseEls = clone.querySelectorAll(
    'script, style, nav, footer, header, aside, .cookie-banner, #cookie-banner, [role="navigation"]',
  );
  for (const el of noiseEls) {
    (el as any).remove();
  }

  // Find main content area
  let contentEl: any = clone;
  for (const sel of args.mainSelectors) {
    const found = clone.querySelector(sel);
    if (found) {
      contentEl = found;
      break;
    }
  }

  const rawText: string = contentEl.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const contentText: string | null = rawText.slice(0, 50_000) || null;
  const mainContent: string = rawText.slice(0, 30_000);

  // Collect same-domain links
  const links: string[] = [];
  const seen = new Set<string>();
  const allAnchors = doc.querySelectorAll('a[href]');
  for (const a of allAnchors) {
    try {
      const absolute = new URL((a as any).href, doc.location.href).toString();
      const parsed = new URL(absolute);
      if (parsed.hostname === args.domain && !seen.has(absolute)) {
        seen.add(absolute);
        links.push(absolute);
      }
    } catch {
      // invalid URL
    }
  }

  return {
    title,
    metaDescription,
    headings,
    contentText,
    mainContent,
    links: links.slice(0, 100),
    faqItems,
    hasFaqContent,
  };
}

/**
 * ページネーションリンクを検出する（ブラウザコンテキスト実行）
 */
function evaluateDiscoverPaginationLinks(args: {
  selectors: string[];
  textPatterns: Array<{ source: string; flags: string }>;
  urlPatterns: Array<{ source: string; flags: string }>;
  currentUrl: string;
  domain: string;
}): string[] {
  const results: string[] = [];
  const seen = new Set<string>();
  seen.add(args.currentUrl);

  const compiledTextPatterns = args.textPatterns.map(
    (p) => new RegExp(p.source, p.flags),
  );
  const compiledUrlPatterns = args.urlPatterns.map(
    (p) => new RegExp(p.source, p.flags),
  );

  // Strategy 1: Selector-based detection
  for (const selector of args.selectors) {
    try {
      const anchors = window.document.querySelectorAll(selector);
      for (const anchor of anchors) {
        const href: string = (anchor as any).href ?? '';
        if (!href) continue;

        try {
          const url = new URL(href, window.location.href);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
          if (url.hostname !== args.domain) continue;

          const absolute = url.toString();
          if (seen.has(absolute)) continue;
          seen.add(absolute);
          results.push(absolute);
        } catch {
          // invalid URL
        }
      }
    } catch {
      // selector error
    }
  }

  // Strategy 2: Find links matching pagination URL patterns within the page
  const allAnchors = window.document.querySelectorAll('a[href]');
  for (const anchor of allAnchors) {
    const href: string = (anchor as any).href ?? '';
    if (!href) continue;

    try {
      const url = new URL(href, window.location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
      if (url.hostname !== args.domain) continue;

      const absolute = url.toString();
      if (seen.has(absolute)) continue;

      const text: string = ((anchor as any).textContent ?? '').trim();
      const ariaLabel: string = ((anchor as any).getAttribute('aria-label') ?? '').trim();
      const rel: string = ((anchor as any).getAttribute('rel') ?? '').trim();

      // Check if the link text matches pagination text patterns
      const textMatches = compiledTextPatterns.some(
        (re) => re.test(text) || re.test(ariaLabel),
      );

      // Check if the URL matches pagination URL patterns
      const urlMatches = compiledUrlPatterns.some((re) => re.test(absolute));

      // Check rel="next"
      const isRelNext = rel === 'next';

      if ((textMatches && urlMatches) || isRelNext) {
        seen.add(absolute);
        results.push(absolute);
      }
    } catch {
      // invalid URL
    }
  }

  return results;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
