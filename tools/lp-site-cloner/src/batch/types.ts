/**
 * Batch Types
 *
 * Type definitions for batch analysis functionality.
 */

import { SiteAnalysis } from '../analyzer/site-analyzer'
import { ScrapedSite } from '../scraper/types'

export interface BatchConfig {
  concurrency: number          // Number of parallel analyses (3-5)
  rateLimit: number            // ms between analyses
  maxRetries: number           // Max retry attempts
  timeout: number              // Timeout per site (ms)
  skipExisting: boolean        // Skip already analyzed sites
}

export interface BatchProgress {
  total: number
  completed: number
  failed: number
  skipped: number
  currentSite: string | null
  startedAt: string
  estimatedTimeRemaining: number | null
}

export interface AnalysisResult {
  url: string
  title: string
  status: 'success' | 'failed' | 'skipped'
  analysis?: SiteAnalysis
  error?: string
  retries: number
  duration: number
}

export interface BatchResult {
  startedAt: string
  completedAt: string
  totalSites: number
  successCount: number
  failCount: number
  skipCount: number
  results: AnalysisResult[]
  patternsAdded: {
    animation: number
    component: number
    effect: number
    color: number
    typography: number
  }
  duration: number
}

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  concurrency: 3,
  rateLimit: 2000,
  maxRetries: 3,
  timeout: 60000,
  skipExisting: false,
}
