/**
 * Batch Analyzer
 *
 * Analyzes multiple sites sequentially with a single browser instance
 * for efficiency. Includes rate limiting and error handling.
 */

import { SiteAnalyzer, SiteAnalysis } from '../analyzer/site-analyzer'
import { addSiteToLibrary, initLibrary } from '../reference/pattern-library'
import { ScrapedSite } from '../scraper/types'
import {
  BatchConfig,
  BatchProgress,
  BatchResult,
  AnalysisResult,
  DEFAULT_BATCH_CONFIG,
} from './types'

export class BatchAnalyzer {
  private config: BatchConfig
  private progress: BatchProgress

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config }
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      currentSite: null,
      startedAt: '',
      estimatedTimeRemaining: null,
    }
  }

  async analyze(sites: ScrapedSite[]): Promise<BatchResult> {
    const startTime = Date.now()
    this.progress = {
      total: sites.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      currentSite: null,
      startedAt: new Date().toISOString(),
      estimatedTimeRemaining: null,
    }

    const results: AnalysisResult[] = []
    const patternsAdded = {
      animation: 0,
      component: 0,
      effect: 0,
      color: 0,
      typography: 0,
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Batch Analysis`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Sites: ${sites.length}`)
    console.log(`Max retries: ${this.config.maxRetries}`)
    console.log(`Rate Limit: ${this.config.rateLimit}ms`)
    console.log(`${'='.repeat(60)}\n`)

    // Get initial library state
    const libraryBefore = await initLibrary()
    const patternsBefore = libraryBefore.patterns.length

    // Create a single analyzer instance and reuse its browser
    const analyzer = new SiteAnalyzer()
    await analyzer.init()

    let consecutiveFailures = 0
    const MAX_CONSECUTIVE_FAILURES = 5

    try {
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i]
        const idx = i + 1

        this.progress.currentSite = site.url
        console.log(`\n[${idx}/${sites.length}] ${site.title}`)
        console.log(`  URL: ${site.url}`)

        const result = await this.analyzeSingleSite(analyzer, site, idx)
        results.push(result)

        if (result.status === 'success') {
          this.progress.completed++
          consecutiveFailures = 0
        } else {
          this.progress.failed++
          consecutiveFailures++
        }

        this.updateETA(startTime)
        this.printProgress()

        // Stop if too many consecutive failures (browser likely broken)
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`\n  ${MAX_CONSECUTIVE_FAILURES} consecutive failures. Restarting browser...`)
          await analyzer.close()
          await analyzer.init()
          consecutiveFailures = 0
        }

        // Rate limiting between sites
        if (i < sites.length - 1) {
          await this.wait(this.config.rateLimit)
        }
      }
    } finally {
      await analyzer.close()
    }

    // Calculate patterns added
    const libraryAfter = await initLibrary()
    const patternsAfter = libraryAfter.patterns.length

    for (const pattern of libraryAfter.patterns) {
      if (pattern.category === 'animation') patternsAdded.animation++
      else if (pattern.category === 'component') patternsAdded.component++
      else if (pattern.category === 'effect') patternsAdded.effect++
      else if (pattern.category === 'color') patternsAdded.color++
      else if (pattern.category === 'typography') patternsAdded.typography++
    }

    const duration = Date.now() - startTime

    const batchResult: BatchResult = {
      startedAt: this.progress.startedAt,
      completedAt: new Date().toISOString(),
      totalSites: sites.length,
      successCount: this.progress.completed,
      failCount: this.progress.failed,
      skipCount: this.progress.skipped,
      results,
      patternsAdded,
      duration,
    }

    this.printSummary(batchResult, patternsAfter - patternsBefore)
    return batchResult
  }

  private async analyzeSingleSite(
    analyzer: SiteAnalyzer,
    site: ScrapedSite,
    idx: number,
  ): Promise<AnalysisResult> {
    const startTime = Date.now()

    for (let retry = 0; retry <= this.config.maxRetries; retry++) {
      try {
        const analysis = await analyzer.analyze(site.url)

        // Add to pattern library (updates global reference too)
        await addSiteToLibrary(analysis)

        const duration = Date.now() - startTime
        console.log(`  OK (${(duration / 1000).toFixed(1)}s) - ${analysis.animations.cssKeyframes.length} anims, ${analysis.components.sliders.length} sliders`)

        return {
          url: site.url,
          title: analysis.meta.title || site.title,
          status: 'success',
          analysis,
          retries: retry,
          duration,
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        const shortError = errorMsg.split('\n')[0].substring(0, 80)

        if (retry < this.config.maxRetries) {
          console.log(`  Retry ${retry + 1}/${this.config.maxRetries}: ${shortError}`)
          await this.wait(2000 * (retry + 1))
        } else {
          console.log(`  FAILED: ${shortError}`)
          return {
            url: site.url,
            title: site.title,
            status: 'failed',
            error: shortError,
            retries: retry,
            duration: Date.now() - startTime,
          }
        }
      }
    }

    return {
      url: site.url,
      title: site.title,
      status: 'failed',
      error: 'Max retries exceeded',
      retries: this.config.maxRetries,
      duration: Date.now() - startTime,
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private updateETA(startTime: number): void {
    const elapsed = Date.now() - startTime
    const processed = this.progress.completed + this.progress.failed + this.progress.skipped
    const remaining = this.progress.total - processed

    if (processed > 0) {
      const avgTime = elapsed / processed
      this.progress.estimatedTimeRemaining = Math.round(avgTime * remaining)
    }
  }

  private printProgress(): void {
    const done = this.progress.completed + this.progress.failed
    const eta = this.progress.estimatedTimeRemaining
    const etaStr = eta ? `ETA: ${(eta / 1000 / 60).toFixed(1)}min` : ''
    console.log(`  Progress: ${done}/${this.progress.total} (${this.progress.completed} ok, ${this.progress.failed} fail) ${etaStr}`)
  }

  private printSummary(result: BatchResult, newPatterns: number): void {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`BATCH ANALYSIS COMPLETE`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Duration: ${(result.duration / 1000 / 60).toFixed(1)} minutes`)
    console.log(`\nResults:`)
    console.log(`  Total:      ${result.totalSites}`)
    console.log(`  Successful: ${result.successCount}`)
    console.log(`  Failed:     ${result.failCount}`)
    console.log(`\nNew Patterns: ${newPatterns}`)
    console.log(`  Animation:  ${result.patternsAdded.animation}`)
    console.log(`  Component:  ${result.patternsAdded.component}`)
    console.log(`  Effect:     ${result.patternsAdded.effect}`)
    console.log(`  Color:      ${result.patternsAdded.color}`)
    console.log(`  Typography: ${result.patternsAdded.typography}`)

    if (result.failCount > 0) {
      console.log(`\nFailed Sites:`)
      for (const r of result.results.filter(r => r.status === 'failed')) {
        console.log(`  - ${r.url}: ${r.error}`)
      }
    }

    console.log(`${'='.repeat(60)}\n`)
  }
}

export async function batchAnalyze(
  sites: ScrapedSite[],
  config: Partial<BatchConfig> = {}
): Promise<BatchResult> {
  const analyzer = new BatchAnalyzer(config)
  return analyzer.analyze(sites)
}
