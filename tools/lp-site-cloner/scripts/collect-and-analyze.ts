/**
 * Collect and Analyze Script
 *
 * Full automation script that:
 * 1. Scrapes design galleries for special/campaign site URLs
 * 2. Batch analyzes collected sites
 * 3. Updates the global reference file (lp-site-patterns.md)
 *
 * Usage:
 *   npx tsx scripts/collect-and-analyze.ts --galleries ikesai,sankou --pages 2 --limit 20
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { scrapeGallery } from '../src/scraper/gallery-scraper'
import { GALLERY_CONFIGS, ScrapedSite, ScrapeResult } from '../src/scraper/types'
import { batchAnalyze } from '../src/batch/batch-analyzer'
import { BatchResult } from '../src/batch/types'

interface CollectOptions {
  galleries: string[]
  pages: number
  limit: number
  outputDir: string
  dryRun: boolean
}

function parseArgs(): CollectOptions {
  const args = process.argv.slice(2)
  const options: CollectOptions = {
    galleries: ['ikesai'],
    pages: 2,
    limit: 20,
    outputDir: 'c:/Users/owner/Dev/tools/lp-site-cloner/scraped',
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const value = args[i + 1]

    switch (arg) {
      case '--galleries':
      case '-g':
        options.galleries = value.split(',').map(g => g.trim())
        i++
        break
      case '--pages':
      case '-p':
        options.pages = parseInt(value, 10)
        i++
        break
      case '--limit':
      case '-l':
        options.limit = parseInt(value, 10)
        i++
        break
      case '--output':
      case '-o':
        options.outputDir = value
        i++
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
    }
  }

  return options
}

function printHelp(): void {
  console.log(`
Collect and Analyze - Gallery Site Scraper & Batch Analyzer

Usage:
  npx tsx scripts/collect-and-analyze.ts [options]

Options:
  -g, --galleries <list>  Comma-separated gallery names (default: ikesai)
                          Available: ${Object.keys(GALLERY_CONFIGS).join(', ')}
  -p, --pages <n>         Number of pages to scrape per gallery (default: 2)
  -l, --limit <n>         Maximum total sites to analyze (default: 20)
  -o, --output <dir>      Output directory for scraped data
  --dry-run               Only scrape URLs, don't analyze
  -h, --help              Show this help message

Examples:
  # Scrape and analyze 5 sites from ikesai
  npx tsx scripts/collect-and-analyze.ts -g ikesai -p 1 -l 5

  # Scrape from multiple galleries
  npx tsx scripts/collect-and-analyze.ts -g ikesai,sankou -p 2 -l 20

  # Dry run (only scrape URLs)
  npx tsx scripts/collect-and-analyze.ts -g ikesai --dry-run
`)
}

async function main(): Promise<void> {
  const options = parseArgs()
  const startTime = Date.now()

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           GALLERY SITE COLLECTOR & ANALYZER                  ║
╚══════════════════════════════════════════════════════════════╝
`)
  console.log(`Galleries: ${options.galleries.join(', ')}`)
  console.log(`Pages per gallery: ${options.pages}`)
  console.log(`Site limit: ${options.limit}`)
  console.log(`Dry run: ${options.dryRun}`)
  console.log('')

  // Validate galleries
  for (const gallery of options.galleries) {
    if (!GALLERY_CONFIGS[gallery]) {
      console.error(`Unknown gallery: ${gallery}`)
      console.error(`Available: ${Object.keys(GALLERY_CONFIGS).join(', ')}`)
      process.exit(1)
    }
  }

  // Phase 1: Scrape galleries
  console.log('\n' + '═'.repeat(60))
  console.log('PHASE 1: SCRAPING GALLERIES')
  console.log('═'.repeat(60))

  const allSites: ScrapedSite[] = []
  const scrapeResults: ScrapeResult[] = []

  // Distribute limit evenly across galleries
  const limitPerGallery = Math.ceil(options.limit / options.galleries.length)
  console.log(`Limit per gallery: ${limitPerGallery}`)

  for (const galleryName of options.galleries) {
    const result = await scrapeGallery(galleryName, {
      pages: options.pages,
      limit: limitPerGallery,
    })

    scrapeResults.push(result)

    // Add unique sites
    for (const site of result.sites) {
      if (!allSites.some(s => s.url === site.url)) {
        allSites.push(site)
      }
    }
  }

  console.log(`\nTotal unique sites collected: ${allSites.length}`)

  // Save scraped data
  await fs.mkdir(options.outputDir, { recursive: true })
  const scrapedFile = path.join(options.outputDir, `scraped-${Date.now()}.json`)
  await fs.writeFile(scrapedFile, JSON.stringify(allSites, null, 2))
  console.log(`Saved scraped data to: ${scrapedFile}`)

  if (options.dryRun) {
    console.log('\nDry run complete. Skipping analysis.')
    printScrapeSummary(scrapeResults, allSites)
    return
  }

  // Phase 2: Batch analyze
  console.log('\n' + '═'.repeat(60))
  console.log('PHASE 2: BATCH ANALYSIS')
  console.log('═'.repeat(60))

  const batchResult = await batchAnalyze(allSites, {
    concurrency: 3,
    rateLimit: 2000,
    maxRetries: 2,
  })

  // Phase 3: Generate report
  console.log('\n' + '═'.repeat(60))
  console.log('PHASE 3: GENERATING REPORT')
  console.log('═'.repeat(60))

  const report = generateReport(options, scrapeResults, allSites, batchResult)
  const reportFile = path.join(options.outputDir, `report-${Date.now()}.md`)
  await fs.writeFile(reportFile, report)
  console.log(`Report saved to: ${reportFile}`)

  // Final summary
  const totalDuration = Date.now() - startTime
  console.log('\n' + '═'.repeat(60))
  console.log('COMPLETE')
  console.log('═'.repeat(60))
  console.log(`Total duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`)
  console.log(`Sites analyzed: ${batchResult.successCount}/${allSites.length}`)
  console.log(`Global reference updated: ~/.claude/rules/lp-site-patterns.md`)
}

function printScrapeSummary(results: ScrapeResult[], allSites: ScrapedSite[]): void {
  console.log('\n' + '═'.repeat(60))
  console.log('SCRAPE SUMMARY')
  console.log('═'.repeat(60))

  for (const result of results) {
    console.log(`\n${result.gallery}:`)
    console.log(`  Pages scraped: ${result.scrapedPages}/${result.totalPages}`)
    console.log(`  Sites found: ${result.sites.length}`)
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`)
    }
  }

  console.log(`\nTotal unique sites: ${allSites.length}`)

  // Show sample URLs
  console.log('\nSample URLs:')
  for (const site of allSites.slice(0, 5)) {
    console.log(`  - ${site.title}: ${site.url}`)
  }
  if (allSites.length > 5) {
    console.log(`  ... and ${allSites.length - 5} more`)
  }
}

function generateReport(
  options: CollectOptions,
  scrapeResults: ScrapeResult[],
  sites: ScrapedSite[],
  batchResult: BatchResult
): string {
  const timestamp = new Date().toISOString()

  let report = `# バッチ分析レポート

実行日時: ${timestamp}

## 設定

| 項目 | 値 |
|------|-----|
| ギャラリー | ${options.galleries.join(', ')} |
| ページ数/ギャラリー | ${options.pages} |
| サイト上限 | ${options.limit} |

## スクレイピング結果

| ギャラリー | ページ数 | サイト数 | エラー |
|-----------|---------|---------|--------|
`

  for (const result of scrapeResults) {
    report += `| ${result.gallery} | ${result.scrapedPages} | ${result.sites.length} | ${result.errors.length} |\n`
  }

  report += `
**合計収集サイト数: ${sites.length}**

## 分析結果

| 項目 | 件数 |
|------|-----|
| 分析成功 | ${batchResult.successCount} |
| 分析失敗 | ${batchResult.failCount} |
| スキップ | ${batchResult.skipCount} |
| 所要時間 | ${(batchResult.duration / 1000 / 60).toFixed(1)}分 |

## 追加パターン

| カテゴリ | 件数 |
|---------|-----|
| アニメーション | ${batchResult.patternsAdded.animation} |
| コンポーネント | ${batchResult.patternsAdded.component} |
| エフェクト | ${batchResult.patternsAdded.effect} |
| カラー | ${batchResult.patternsAdded.color} |
| タイポグラフィ | ${batchResult.patternsAdded.typography} |

## 成功サイト一覧

`

  for (const result of batchResult.results.filter(r => r.status === 'success')) {
    report += `- [${result.title}](${result.url})\n`
  }

  if (batchResult.failCount > 0) {
    report += `
## 失敗サイト一覧

| URL | エラー | リトライ回数 |
|-----|--------|------------|
`
    for (const result of batchResult.results.filter(r => r.status === 'failed')) {
      report += `| ${result.url} | ${result.error} | ${result.retries} |\n`
    }
  }

  report += `
---

> このレポートは \`lp-site-cloner\` によって自動生成されました。
`

  return report
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
