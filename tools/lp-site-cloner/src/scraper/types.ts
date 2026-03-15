/**
 * Scraper Types
 *
 * Type definitions for gallery scraping functionality.
 */

export interface GalleryConfig {
  name: string
  baseUrl: string
  categoryPath: string
  pagePattern: 'query' | 'path'  // ?p=番号 or /page/番号/
  queryParam?: string            // for query pattern (e.g., 'p')
  selectors: {
    container: string            // Site list container
    item: string                 // Individual item
    link: string                 // Site URL link
    title: string                // Site name
    thumbnail?: string           // Thumbnail image
    tags?: string                // Tags
  }
  maxPages: number
  rateLimit: number              // ms between requests
}

export interface ScrapedSite {
  url: string
  title: string
  thumbnail?: string
  tags: string[]
  source: string                 // Gallery name
  scrapedAt: string
}

export interface ScrapeResult {
  gallery: string
  sites: ScrapedSite[]
  totalPages: number
  scrapedPages: number
  errors: ScrapeError[]
  duration: number
}

export interface ScrapeError {
  page: number
  url: string
  error: string
  timestamp: string
}

export interface ScrapeOptions {
  pages?: number                 // Number of pages to scrape
  limit?: number                 // Max sites to collect
  dryRun?: boolean               // Don't actually scrape, just log
}

// Gallery configurations
export const GALLERY_CONFIGS: Record<string, GalleryConfig> = {
  ikesai: {
    name: 'イケサイ',
    baseUrl: 'https://www.ikesai.com',
    categoryPath: '/cat/special/',
    pagePattern: 'query',
    queryParam: 'p',
    selectors: {
      container: 'ul',
      item: 'li',
      link: 'a[href^="http"]',
      title: 'a strong',
      thumbnail: 'img',
    },
    maxPages: 50,
    rateLimit: 2000,
  },
  'webdesign-garden': {
    name: 'Web Design Garden',
    baseUrl: 'https://webdesigngarden.com',
    categoryPath: '/category/type/special/',
    pagePattern: 'path',
    selectors: {
      container: '.p-postList',
      item: '.p-postList__item',
      link: 'a[href^="http"]',
      title: 'a',
      thumbnail: 'img',
    },
    maxPages: 30,
    rateLimit: 2000,
  },
  'webdesign-clip': {
    name: 'Web Design Clip',
    baseUrl: 'https://webdesignclip.com',
    categoryPath: '/tag/special-site/',
    pagePattern: 'path',
    selectors: {
      container: 'ul',
      item: 'li',
      link: 'a[href^="http"]',
      title: 'a',
      thumbnail: 'img',
    },
    maxPages: 30,
    rateLimit: 2000,
  },
  choudoii: {
    name: 'ちょうどいいWebデザイン',
    baseUrl: 'https://choooodoii.com',
    categoryPath: '/site-type/special/',
    pagePattern: 'path',
    selectors: {
      container: 'main',
      item: 'article',
      link: 'a[href^="http"]',
      title: 'h3, h2',
      thumbnail: 'img',
    },
    maxPages: 30,
    rateLimit: 2000,
  },
  sankou: {
    name: 'SANKOU!',
    baseUrl: 'https://sankoudesign.com',
    categoryPath: '/category/campaign-event-special/',
    pagePattern: 'path',
    selectors: {
      container: 'ul',
      item: 'li',
      link: 'a[href^="http"]',
      title: 'a',
      thumbnail: 'img',
    },
    maxPages: 100,
    rateLimit: 2000,
  },
}
