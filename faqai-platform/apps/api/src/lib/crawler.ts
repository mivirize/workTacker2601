import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { FAQ_URL_PATTERNS, FAQ_TITLE_PATTERNS } from './faq-constants.js';
import { logger } from './logger.js';

export type CrawledPage = {
  url: string;
  title: string | null;
  contentText: string | null;
  depth: number;
  httpStatus: number;
  contentHash: string;
  links: string[];
  isFaqPage: boolean;
  structuredContent: StructuredContent | null;
};

export type StructuredContent = {
  headings: Array<{ level: number; text: string }>;
  mainContent: string;
  metaDescription: string | null;
  faqItems: Array<{ question: string; answer: string }>;
  pageType: 'faq' | 'about' | 'pricing' | 'contact' | 'product' | 'blog' | 'general';
};

/**
 * 構造化コンテンツ抽出対応Webクローラー
 * - FAQページを自動検出して優先クロール
 * - ページの構造化コンテンツ抽出
 * - ヘッディング階層の保持
 */
export class WebCrawler {
  private readonly baseUrl: string;
  private readonly domain: string;
  private readonly maxPages: number;
  private readonly maxDepth: number;
  private readonly rateLimitMs: number;
  private readonly visited = new Set<string>();

  constructor(options: {
    url: string;
    maxPages?: number;
    maxDepth?: number;
    rateLimitMs?: number;
  }) {
    this.baseUrl = options.url;
    this.domain = new URL(options.url).hostname;
    this.maxPages = options.maxPages ?? 50;
    this.maxDepth = options.maxDepth ?? 3;
    this.rateLimitMs = options.rateLimitMs ?? 1000;
  }

  async crawl(
    onPage: (page: CrawledPage) => Promise<void>,
  ): Promise<{ crawledCount: number; failedCount: number; faqPagesFound: number }> {
    // 2段階キュー: FAQページを優先するためpriority queueを使用
    const priorityQueue: Array<{ url: string; depth: number; priority: number }> = [];
    const normalQueue: Array<{ url: string; depth: number }> = [];

    // 初期URLをキューに追加
    priorityQueue.push({ url: this.baseUrl, depth: 0, priority: 0 });

    let crawledCount = 0;
    let failedCount = 0;
    let faqPagesFound = 0;

    while (
      (priorityQueue.length > 0 || normalQueue.length > 0) &&
      crawledCount < this.maxPages
    ) {
      // 優先キューを先に処理
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

        const page = await this.fetchPage(normalized, item.depth);

        if (page) {
          if (page.isFaqPage) faqPagesFound++;
          await onPage(page);
          crawledCount++;

          // リンクをキューへ追加（FAQリンクは優先キューへ）
          if (item.depth < this.maxDepth) {
            for (const link of page.links) {
              const normalizedLink = this.normalizeUrl(link);
              if (normalizedLink && !this.visited.has(normalizedLink)) {
                if (this.isFaqUrl(normalizedLink)) {
                  priorityQueue.push({
                    url: normalizedLink,
                    depth: item.depth + 1,
                    priority: 10,
                  });
                } else {
                  normalQueue.push({ url: normalizedLink, depth: item.depth + 1 });
                }
              }
            }
          }

          logger.debug(
            { url: normalized, depth: item.depth, crawledCount, isFaq: page.isFaqPage },
            'Page crawled',
          );
        } else {
          failedCount++;
        }
      } catch (err) {
        logger.warn({ url: normalized, err }, 'Failed to crawl page');
        failedCount++;
      }
    }

    return { crawledCount, failedCount, faqPagesFound };
  }

  private isFaqUrl(url: string): boolean {
    return FAQ_URL_PATTERNS.some((pattern) => pattern.test(url));
  }

  private isFaqTitle(title: string): boolean {
    return FAQ_TITLE_PATTERNS.some((pattern) => pattern.test(title));
  }

  private async fetchPage(url: string, depth: number): Promise<CrawledPage | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'FAQAI-Crawler/2.0 (+https://faqai.example.com/crawler)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('html')) {
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('title').text().trim() || null;
      const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? null;

      // FAQページ判定
      const isFaqPage = this.isFaqUrl(url) ||
        (title !== null && this.isFaqTitle(title)) ||
        this.detectFaqContent($);

      // 構造化コンテンツ抽出
      const structuredContent = this.extractStructuredContent($, url, isFaqPage, metaDescription);

      // ノイズ除去してテキスト抽出
      $('script, style, nav, footer, header, aside, .cookie-banner, #cookie-banner, [role="navigation"]').remove();

      const mainSelectors = [
        'main', 'article', '[role="main"]',
        '.main-content', '#main-content',
        '.content', '#content',
        '.entry-content', '.post-content',
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let contentEl: cheerio.CheerioAPI | any = $('body');
      for (const sel of mainSelectors) {
        const found = $(sel);
        if (found.length > 0) {
          contentEl = found;
          break;
        }
      }

      const contentText = contentEl.text().replace(/\s+/g, ' ').trim().slice(0, 50_000) || null;
      const contentHash = createHash('sha256')
        .update(contentText ?? '')
        .digest('hex')
        .slice(0, 32);

      // リンク収集
      const links: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        try {
          const absolute = new URL(href, url).toString();
          if (new URL(absolute).hostname === this.domain) {
            links.push(absolute);
          }
        } catch {
          // 無効なURLはスキップ
        }
      });

      return {
        url,
        title,
        contentText,
        depth,
        httpStatus: response.status,
        contentHash,
        links: [...new Set(links)].slice(0, 100),
        isFaqPage,
        structuredContent,
      };
    } catch (err) {
      clearTimeout(timeout);
      logger.warn({ url, err: String(err) }, 'Fetch failed');
      return null;
    }
  }

  /**
   * ページ内のFAQコンテンツを検出する
   */
  private detectFaqContent($: cheerio.CheerioAPI): boolean {
    // JSON-LD FAQPage スキーマ
    const jsonLd = $('script[type="application/ld+json"]').text();
    if (jsonLd.includes('FAQPage') || jsonLd.includes('Question')) {
      return true;
    }

    // FAQ的なHTMLパターン（detailsタグ、accordion等）
    const faqElements =
      $('details summary').length +
      $('[itemtype*="Question"]').length +
      $('.faq, .faq-item, .qa-item, [class*="accordion"]').length;

    return faqElements >= 3;
  }

  /**
   * 構造化コンテンツを抽出する
   */
  private extractStructuredContent(
    $: cheerio.CheerioAPI,
    url: string,
    isFaqPage: boolean,
    metaDescription: string | null,
  ): StructuredContent {
    // ヘッディング抽出
    const headings: Array<{ level: number; text: string }> = [];
    $('h1, h2, h3, h4').each((_, el) => {
      const tagName = 'tagName' in el ? (el.tagName as string) : '';
      const level = parseInt(tagName.replace('h', ''), 10);
      const text = $(el).text().trim();
      if (text && text.length < 200) {
        headings.push({ level, text });
      }
    });

    // メインコンテンツ（構造保持）
    const mainSelectors = ['main', 'article', '[role="main"]', '.main-content', '#content'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mainEl: ReturnType<typeof $> = $('body');
    for (const sel of mainSelectors) {
      const found = $(sel);
      if (found.length > 0) {
        mainEl = found;
        break;
      }
    }

    // ノイズを除去したクローンで構造化テキスト抽出
    const clone = mainEl.clone();
    clone.find('script, style, nav, footer, header, aside').remove();
    const mainContent = clone.text().replace(/\s+/g, ' ').trim().slice(0, 30_000);

    // FAQ項目の抽出
    const faqItems: Array<{ question: string; answer: string }> = [];

    if (isFaqPage) {
      // 1. JSON-LDからFAQ抽出
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).text());
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
          // JSON parse error, skip
        }
      });

      // 2. details/summary パターン
      $('details').each((_, el) => {
        const question = $(el).find('summary').text().trim();
        const answer = $(el).find('summary').nextAll().text().trim();
        if (question && answer) {
          faqItems.push({ question, answer });
        }
      });

      // 3. microdata パターン
      $('[itemtype*="Question"]').each((_, el) => {
        const question = $(el).find('[itemprop="name"]').text().trim();
        const answer = $(el).find('[itemprop="text"], [itemprop="acceptedAnswer"]').text().trim();
        if (question && answer) {
          faqItems.push({ question, answer });
        }
      });

      // 4. アコーディオンパターン
      if (faqItems.length === 0) {
        $('.faq-item, .qa-item, [class*="accordion-item"]').each((_, el) => {
          const question = $(el).find('.question, .faq-question, [class*="accordion-header"], [class*="accordion-title"]').text().trim();
          const answer = $(el).find('.answer, .faq-answer, [class*="accordion-body"], [class*="accordion-content"]').text().trim();
          if (question && answer) {
            faqItems.push({ question, answer });
          }
        });
      }
    }

    // ページタイプの判定
    const pageType = this.classifyPageType(url, headings, isFaqPage);

    return {
      headings,
      mainContent,
      metaDescription,
      faqItems,
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
