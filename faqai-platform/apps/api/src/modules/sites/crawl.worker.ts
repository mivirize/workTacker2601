import { WebCrawler } from '../../lib/crawler.js';
import type { CrawledPage } from '../../lib/crawler.js';
import { PlaywrightCrawler } from '../../lib/playwright-crawler.js';
import type { PlaywrightCrawledPage } from '../../lib/playwright-crawler.js';
import {
  generateFaqFromContent,
  analyzeSiteForFaqTopics,
  extractStructuredFaqs,
  extractFaqsWithLlm,
  validateAndDeduplicateFaqs,
  getLlmProviderName,
} from '../../lib/faq-generator.js';
import type { GeneratedFaq, FaqGenerationContext } from '../../lib/faq-generator.js';
import { ScreenshotService } from '../../lib/screenshot-service.js';
import { SiteRepository } from './site.repository.js';
import { FaqRepository } from '../faq/faq.repository.js';
import { logger } from '../../lib/logger.js';

type CrawledPageData = {
  pageId: string;
  title: string | null;
  contentText: string | null;
  url: string;
  isFaqPage: boolean;
  structuredFaqs: Array<{ question: string; answer: string }>;
  pageType: string;
};

const PERSPECTIVES = ['user_problems', 'product_info', 'procedures', 'troubleshooting'] as const;

// ---------------------------------------------------------------------------
// Factcheck helpers (ported from scripts/faq-factcheck.ts)
// ---------------------------------------------------------------------------

function normalizeQuestion(q: string): string {
  return q
    .replace(/[？?！!。、・\s]+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .toLowerCase();
}

function bigramSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return 0;
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

function findSimilarQuestion(
  needle: string,
  haystack: ReadonlyArray<string>,
  threshold = 0.5,
): { match: string; score: number } | null {
  const normNeedle = normalizeQuestion(needle);
  let bestMatch = '';
  let bestScore = 0;

  for (const h of haystack) {
    const normH = normalizeQuestion(h);

    if (normNeedle === normH) return { match: h, score: 1.0 };

    if (normNeedle.includes(normH) || normH.includes(normNeedle)) {
      const score =
        Math.min(normNeedle.length, normH.length) /
        Math.max(normNeedle.length, normH.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = h;
      }
    }

    const bScore = bigramSimilarity(normNeedle, normH);
    if (bScore > bestScore) {
      bestScore = bScore;
      bestMatch = h;
    }
  }

  return bestScore >= threshold ? { match: bestMatch, score: bestScore } : null;
}

type FactcheckResult = {
  generatedCount: number;
  actualCount: number;
  matchedCount: number;
  hallucinatedCount: number;
  coverageRate: number;
  hallucinationRate: number;
};

function runFactcheck(
  generatedQuestions: ReadonlyArray<string>,
  actualQuestions: ReadonlyArray<string>,
): FactcheckResult {
  const matchedActuals = new Set<string>();
  let matchedCount = 0;
  let hallucinatedCount = 0;

  for (const gq of generatedQuestions) {
    const result = findSimilarQuestion(gq, actualQuestions);
    if (result) {
      matchedCount++;
      matchedActuals.add(result.match);
    } else {
      hallucinatedCount++;
    }
  }

  const coverageRate =
    actualQuestions.length > 0 ? matchedCount / actualQuestions.length : 0;
  const hallucinationRate =
    generatedQuestions.length > 0
      ? hallucinatedCount / generatedQuestions.length
      : 0;

  return {
    generatedCount: generatedQuestions.length,
    actualCount: actualQuestions.length,
    matchedCount,
    hallucinatedCount,
    coverageRate,
    hallucinationRate,
  };
}

export class CrawlWorker {
  private readonly siteRepo = new SiteRepository();
  private readonly faqRepo = new FaqRepository();
  private readonly screenshotService = new ScreenshotService();

  async processCrawlJob(
    jobId: string,
    siteId: string,
    organizationId: string,
  ): Promise<void> {
    logger.info({ jobId, siteId }, 'Starting AI-driven crawl job');

    await this.siteRepo.updateCrawlJob(jobId, 'running');

    const site = await this.siteRepo.findById(siteId, organizationId);
    if (!site) {
      await this.siteRepo.updateCrawlJob(jobId, 'failed', {
        errorLog: [{ error: 'Site not found' }],
      });
      return;
    }

    const defaultCategoryId = await this.siteRepo.getDefaultCategoryId(siteId, organizationId);
    if (!defaultCategoryId) {
      await this.siteRepo.updateCrawlJob(jobId, 'failed', {
        errorLog: [{ error: 'Default category not found' }],
      });
      return;
    }

    // 既存FAQを取得（重複排除のため）
    const { items: existingFaqItems } = await this.faqRepo.findAll(organizationId, {
      siteId,
      limit: 500,
    });
    const existingFaqs = existingFaqItems.map((f) => ({
      question: f.question,
      answer: f.answer,
    }));

    const context: FaqGenerationContext = {
      siteUrl: site.url,
      siteName: site.name,
      ...(site.aiContext ? { aiContext: site.aiContext } : {}),
      existingFaqs,
      existingSiteFaqs: existingFaqs,
    };

    const usePlaywright = site.crawlConfig.js_rendering === true;
    const screenshotEnabled = site.crawlConfig.screenshot_enabled === true;

    const crawledPages: CrawledPageData[] = [];
    let crawledCount = 0;
    let failedCount = 0;
    let faqGenerated = 0;
    const errors: Record<string, unknown>[] = [];

    try {
      // ============================================================
      // Step 1: クロール実行（FAQページ優先）
      // ============================================================
      logger.info({ jobId, usePlaywright, screenshotEnabled }, 'Step 1: Crawling pages with FAQ priority');

      const crawlOptions = {
        url: site.url,
        maxPages: Math.min(site.crawlConfig.max_pages, 50),
        maxDepth: Math.min(site.crawlConfig.max_depth, 4),
        rateLimitMs: Math.max(site.crawlConfig.rate_limit_ms, 500),
      };

      const onPageCallback = async (page: CrawledPage | PlaywrightCrawledPage) => {
        try {
          const savedPage = await this.siteRepo.saveCrawlPage({
            crawlJobId: jobId,
            siteId,
            organizationId,
            url: page.url,
            title: page.title,
            contentText: page.contentText,
            depth: page.depth,
            httpStatus: page.httpStatus,
            contentHash: page.contentHash,
          });

          if (savedPage) {
            // テキストからもFAQ抽出を試みる
            const textFaqs = page.contentText
              ? extractStructuredFaqs(page.contentText)
              : [];

            const structuredFaqs = [
              ...(page.structuredContent?.faqItems ?? []),
              ...textFaqs,
            ];

            // 重複排除
            const uniqueFaqs = structuredFaqs.reduce<Array<{ question: string; answer: string }>>(
              (acc, faq) => {
                if (!acc.some((f) => f.question === faq.question)) {
                  acc.push(faq);
                }
                return acc;
              },
              [],
            );

            crawledPages.push({
              pageId: savedPage.id,
              title: page.title,
              contentText: page.contentText,
              url: page.url,
              isFaqPage: page.isFaqPage,
              structuredFaqs: uniqueFaqs,
              pageType: page.structuredContent?.pageType ?? 'general',
            });

            // スクリーンショット保存（Playwrightクローラーのみ）
            if ('screenshot' in page && page.screenshot) {
              try {
                const ssResult = await this.screenshotService.savePageScreenshot({
                  organizationId,
                  crawlPageId: savedPage.id,
                  screenshot: page.screenshot,
                });
                await this.siteRepo.saveScreenshot({
                  crawlPageId: savedPage.id,
                  organizationId,
                  storagePath: ssResult.storagePath,
                  thumbnailPath: ssResult.thumbnailPath,
                  width: ssResult.width,
                  height: ssResult.height,
                  fileSizeBytes: ssResult.fileSizeBytes,
                });
              } catch (ssErr) {
                logger.warn({ url: page.url, err: String(ssErr) }, 'Failed to save page screenshot');
              }
            }

            // FAQセクションスクリーンショット保存
            if ('faqSectionScreenshots' in page && page.faqSectionScreenshots) {
              for (const ss of page.faqSectionScreenshots) {
                try {
                  const ssResult = await this.screenshotService.savePageScreenshot({
                    organizationId,
                    crawlPageId: savedPage.id,
                    screenshot: ss.screenshot,
                    sectionSelector: ss.selector,
                  });
                  await this.siteRepo.saveScreenshot({
                    crawlPageId: savedPage.id,
                    organizationId,
                    storagePath: ssResult.storagePath,
                    thumbnailPath: ssResult.thumbnailPath,
                    width: ssResult.width,
                    height: ssResult.height,
                    fileSizeBytes: ssResult.fileSizeBytes,
                    sectionSelector: ss.selector,
                  });
                } catch (ssErr) {
                  logger.warn({ url: page.url, selector: ss.selector, err: String(ssErr) }, 'Failed to save FAQ section screenshot');
                }
              }
            }
          }

          crawledCount++;
          await this.siteRepo.updateCrawlJob(jobId, 'running', {
            crawledPages: crawledCount,
          });
        } catch (err) {
          logger.warn({ url: page.url, err: String(err) }, 'Failed to save crawl page');
          failedCount++;
        }
      };

      let result: { crawledCount: number; failedCount: number; faqPagesFound: number };

      if (usePlaywright) {
        const playwrightCrawler = new PlaywrightCrawler({
          ...crawlOptions,
          screenshotEnabled,
        });
        try {
          await playwrightCrawler.init();
          result = await playwrightCrawler.crawl(onPageCallback);
        } finally {
          await playwrightCrawler.close();
        }
      } else {
        const crawler = new WebCrawler(crawlOptions);
        result = await crawler.crawl(onPageCallback);
      }

      crawledCount = result.crawledCount;
      failedCount += result.failedCount;

      logger.info(
        { jobId, crawledCount, faqPagesFound: result.faqPagesFound, usePlaywright },
        'Step 1 complete: Pages crawled',
      );

      // ============================================================
      // Step 2: サイト分析 - AI でFAQトピック提案
      // ============================================================
      logger.info({ jobId }, 'Step 2: Analyzing site for FAQ topics');

      const siteAnalysis = await analyzeSiteForFaqTopics(
        crawledPages.map((p) => ({
          url: p.url,
          title: p.title,
          contentText: p.contentText,
        })),
        context,
      );

      logger.info(
        {
          jobId,
          siteCategory: siteAnalysis.siteCategory,
          topicCount: siteAnalysis.suggestedTopics.length,
        },
        'Step 2 complete: Site analyzed',
      );

      // ============================================================
      // Step 3: FAQ生成（FAQページ → 重要ページ → その他）
      // ============================================================
      logger.info({ jobId }, 'Step 3: Generating FAQs from crawled pages');

      const allGeneratedFaqs: GeneratedFaq[] = [];

      // 3-A: FAQページから直接抽出（最優先）
      const faqPages = crawledPages.filter((p) => p.isFaqPage);
      for (const page of faqPages) {
        // 構造化FAQを直接使用
        const extractedFaqs = [...page.structuredFaqs];

        // 構造化抽出が少ない場合、LLMフォールバック抽出
        if (extractedFaqs.length < 3 && page.contentText && page.contentText.length >= 200) {
          logger.info(
            { url: page.url, structuredCount: extractedFaqs.length },
            'Structured extraction insufficient, trying LLM extraction',
          );
          const llmExtracted = await extractFaqsWithLlm(page.contentText, page.url);
          for (const faq of llmExtracted) {
            const isDuplicate = extractedFaqs.some(
              (sf) => sf.question.includes(faq.question.slice(0, 20)) ||
                      faq.question.includes(sf.question.slice(0, 20)),
            );
            if (!isDuplicate) {
              extractedFaqs.push(faq);
            }
          }
          logger.info(
            { url: page.url, llmExtracted: llmExtracted.length, totalAfterMerge: extractedFaqs.length },
            'LLM fallback extraction complete',
          );
        }

        if (extractedFaqs.length > 0) {
          for (const faq of extractedFaqs) {
            allGeneratedFaqs.push({
              question: faq.question,
              answer: faq.answer,
              category: 'よくある質問（既存）',
              qualityScore: 1.0,
              tags: ['既存FAQ', '最優先'],
            });
          }
          logger.info(
            { url: page.url, extracted: extractedFaqs.length },
            'Extracted FAQs from FAQ page',
          );
        }

        // FAQページからAI生成も実施
        if (page.contentText && page.contentText.length >= 100) {
          try {
            const faqs = await generateFaqFromContent(
              {
                url: page.url,
                title: page.title,
                contentText: page.contentText,
                isFaqPage: true,
                structuredFaqs: page.structuredFaqs,
              },
              { maxFaqs: 10, context },
            );
            allGeneratedFaqs.push(...faqs);
          } catch (err) {
            errors.push({ pageId: page.pageId, phase: 'faq_page_generation', error: String(err) });
          }
        }
      }

      // 3-B: 重要ページ（pricing, about, product, contact）からFAQ生成
      const importantTypes = ['pricing', 'about', 'product', 'contact'];
      const importantPages = crawledPages.filter(
        (p) => !p.isFaqPage && importantTypes.includes(p.pageType),
      );

      for (const page of importantPages) {
        if (!page.contentText || page.contentText.length < 100) continue;
        try {
          const perspective = this.getPagePerspective(page.pageType);
          const faqs = await generateFaqFromContent(
            {
              url: page.url,
              title: page.title,
              contentText: page.contentText,
            },
            { maxFaqs: 5, context, perspective },
          );
          allGeneratedFaqs.push(...faqs);
        } catch (err) {
          errors.push({ pageId: page.pageId, phase: 'important_page', error: String(err) });
        }
      }

      // 3-C: その他のページから多角的視点でFAQ生成
      const otherPages = crawledPages.filter(
        (p) => !p.isFaqPage && !importantTypes.includes(p.pageType),
      );
      const pagesToProcess = otherPages
        .filter((p) => p.contentText && p.contentText.length >= 500)
        .slice(0, 10);

      for (let i = 0; i < pagesToProcess.length; i++) {
        const page = pagesToProcess[i]!;
        const perspective = PERSPECTIVES[i % PERSPECTIVES.length];
        try {
          const faqs = await generateFaqFromContent(
            {
              url: page.url,
              title: page.title,
              contentText: page.contentText,
            },
            { maxFaqs: 3, context, ...(perspective !== undefined ? { perspective } : {}) },
          );
          allGeneratedFaqs.push(...faqs);
        } catch (err) {
          errors.push({ pageId: page.pageId, phase: 'general_page', error: String(err) });
        }
      }

      logger.info(
        { jobId, totalRaw: allGeneratedFaqs.length },
        'Step 3 complete: Raw FAQs generated',
      );

      // ============================================================
      // Step 4: 品質検証・重複排除
      // ============================================================
      logger.info({ jobId }, 'Step 4: Validating and deduplicating FAQs');

      const validatedFaqs = await validateAndDeduplicateFaqs(
        allGeneratedFaqs,
        existingFaqs,
      );

      logger.info(
        { jobId, validated: validatedFaqs.length, removed: allGeneratedFaqs.length - validatedFaqs.length },
        'Step 4 complete: FAQs validated',
      );

      // ============================================================
      // Step 5: FAQをDBに保存
      // ============================================================
      logger.info({ jobId }, 'Step 5: Saving FAQs to database');

      for (const faq of validatedFaqs) {
        try {
          // 元ページを特定（最初にマッチしたものをソースとする）
          const sourcePage = crawledPages.find((p) =>
            p.structuredFaqs.some((sf) => sf.question === faq.question) ||
            (p.contentText && p.contentText.includes(faq.question.slice(0, 20))),
          );

          await this.faqRepo.create({
            organizationId,
            siteId,
            categoryId: defaultCategoryId,
            question: faq.question,
            answer: faq.answer,
            status: 'draft',
            ...(sourcePage?.pageId ? { sourcePageId: sourcePage.pageId } : {}),
            aiGenerated: (faq.qualityScore ?? 0) < 1.0,
            generationModel: getLlmProviderName(),
          });
          faqGenerated++;
        } catch (err) {
          logger.warn({ question: faq.question.slice(0, 50), err: String(err) }, 'Failed to save FAQ');
          errors.push({ question: faq.question.slice(0, 50), error: String(err) });
        }
      }

      // ============================================================
      // Step 6 (optional): Factcheck - 生成FAQをサイト実FAQと照合
      // ============================================================
      if (site.crawlConfig.auto_factcheck === true) {
        try {
          logger.info({ jobId }, 'Step 6: Running auto-factcheck');

          // Collect actual FAQ questions extracted from FAQ pages
          const actualFaqQuestions = crawledPages
            .filter((p) => p.isFaqPage)
            .flatMap((p) => p.structuredFaqs.map((sf) => sf.question));

          if (actualFaqQuestions.length === 0) {
            logger.info(
              { jobId },
              'Factcheck skipped: no actual FAQ questions found on crawled pages',
            );
          } else {
            const generatedQuestions = validatedFaqs.map((f) => f.question);
            const factcheckResult = runFactcheck(generatedQuestions, actualFaqQuestions);

            const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

            logger.info(
              {
                jobId,
                generated: factcheckResult.generatedCount,
                actual: factcheckResult.actualCount,
                matched: factcheckResult.matchedCount,
                hallucinated: factcheckResult.hallucinatedCount,
                coverageRate: pct(factcheckResult.coverageRate),
                hallucinationRate: pct(factcheckResult.hallucinationRate),
              },
              'Factcheck complete',
            );

            if (factcheckResult.coverageRate < 0.8) {
              logger.warn(
                {
                  jobId,
                  coverageRate: pct(factcheckResult.coverageRate),
                  matched: factcheckResult.matchedCount,
                  actual: factcheckResult.actualCount,
                },
                'Factcheck WARNING: coverage rate below 80% - some actual FAQs may be missing from generated set',
              );
            }

            if (factcheckResult.hallucinationRate > 0.3) {
              logger.warn(
                {
                  jobId,
                  hallucinationRate: pct(factcheckResult.hallucinationRate),
                  hallucinated: factcheckResult.hallucinatedCount,
                  generated: factcheckResult.generatedCount,
                },
                'Factcheck WARNING: high hallucination rate - many generated FAQs do not match actual site FAQs',
              );
            }
          }
        } catch (factcheckErr) {
          logger.warn(
            { jobId, err: String(factcheckErr) },
            'Factcheck failed (non-blocking)',
          );
        }
      }

      // ============================================================
      // 完了
      // ============================================================
      await this.siteRepo.updateCrawlJob(jobId, 'completed', {
        totalPages: crawledCount + failedCount,
        crawledPages: crawledCount,
        faqGenerated,
        ...(errors.length > 0 ? { errorLog: errors } : {}),
      });

      await this.siteRepo.updateSiteLastCrawled(siteId);

      logger.info(
        {
          jobId,
          crawledCount,
          faqGenerated,
          faqPagesFound: result.faqPagesFound,
          siteCategory: siteAnalysis.siteCategory,
        },
        'AI-driven crawl job completed successfully',
      );
    } catch (err) {
      logger.error({ jobId, err: String(err) }, 'Crawl job failed with error');
      errors.push({ error: String(err) });
      await this.siteRepo.updateCrawlJob(jobId, 'failed', {
        totalPages: crawledCount + failedCount,
        crawledPages: crawledCount,
        errorLog: errors,
      });
    }
  }

  private getPagePerspective(
    pageType: string,
  ): 'user_problems' | 'product_info' | 'procedures' | 'troubleshooting' {
    switch (pageType) {
      case 'pricing':
        return 'product_info';
      case 'about':
        return 'product_info';
      case 'product':
        return 'user_problems';
      case 'contact':
        return 'procedures';
      default:
        return 'user_problems';
    }
  }
}
