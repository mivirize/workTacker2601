/**
 * Fix Clone Issues Script
 *
 * Identifies and fixes issues in cloned sites by comparing with original.
 */

import { chromium } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'

const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'
const PROJECT_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime'
const SRC_DIR = path.join(PROJECT_DIR, 'src')

interface Issue {
  type: 'missing_file' | 'css_mismatch' | 'js_error' | 'layout_diff'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  fix?: string
}

async function fixCloneIssues() {
  console.log('='.repeat(60))
  console.log('Clone Issue Fixer')
  console.log('='.repeat(60))

  const browser = await chromium.launch({ headless: true })
  const issues: Issue[] = []

  // 1. Check for missing resources
  console.log('\n[1/5] Checking for missing resources...')
  const clonePage = await browser.newPage()
  const missingResources: string[] = []

  clonePage.on('response', response => {
    if (response.status() === 404) {
      missingResources.push(response.url())
    }
  })

  await clonePage.goto(`file:///${SRC_DIR}/index.html`, { waitUntil: 'networkidle', timeout: 60000 })
  await clonePage.waitForTimeout(3000)

  if (missingResources.length > 0) {
    console.log(`  Found ${missingResources.length} missing resources`)
    for (const url of missingResources) {
      issues.push({
        type: 'missing_file',
        severity: 'high',
        description: `Missing: ${url}`,
      })
    }
  }

  // 2. Download any missing files from original
  console.log('\n[2/5] Downloading missing files...')
  const originalPage = await browser.newPage()
  await originalPage.goto(ORIGINAL_URL, { waitUntil: 'networkidle', timeout: 60000 })

  for (const url of missingResources) {
    try {
      const filename = path.basename(new URL(url).pathname)
      if (!filename || filename.length < 3) continue

      // Try to find on original site
      const possiblePaths = [
        `/assets/img/common/${filename}`,
        `/assets/img/top/${filename}`,
        `/assets/img/news/${filename}`,
        `/assets/img/movie/${filename}`,
        `/assets/img/music/${filename}`,
        `/assets/img/character/${filename}`,
        `/assets/css/${filename}`,
        `/assets/js/${filename}`,
      ]

      for (const tryPath of possiblePaths) {
        try {
          const response = await originalPage.request.get(ORIGINAL_URL + tryPath)
          if (response.ok()) {
            const buffer = await response.body()
            const destDir = filename.endsWith('.css') ? 'css' :
                           filename.endsWith('.js') ? 'js' : 'images'
            const destPath = path.join(SRC_DIR, destDir, filename)
            await fs.writeFile(destPath, buffer)
            console.log(`  Downloaded: ${filename}`)
            break
          }
        } catch (e) {
          // Continue trying
        }
      }
    } catch (e) {
      // Skip
    }
  }

  // 3. Compare CSS computed styles for key elements
  console.log('\n[3/5] Comparing CSS styles...')

  const keyElements = [
    '.news__content',
    '.music__wrap',
    '.music__wrap::before',
    '.kv__fixedInner',
    '.character__swiper',
  ]

  const originalStyles = await originalPage.evaluate((selectors) => {
    const results: Record<string, any> = {}
    for (const selector of selectors) {
      const isPseudo = selector.includes('::')
      const [base, pseudo] = isPseudo ? selector.split('::') : [selector, null]
      const el = document.querySelector(base)
      if (el) {
        const style = window.getComputedStyle(el, pseudo ? `::${pseudo}` : null)
        results[selector] = {
          background: style.background,
          backgroundImage: style.backgroundImage,
          mask: style.mask || (style as any).webkitMask,
          maskImage: style.maskImage || (style as any).webkitMaskImage,
          transform: style.transform,
          opacity: style.opacity,
          display: style.display,
        }
      }
    }
    return results
  }, keyElements)

  // 4. Check and fix HTML structure issues
  console.log('\n[4/5] Checking HTML structure...')

  // Ensure CSS variables are defined
  const cssVarsCheck = await clonePage.evaluate(() => {
    const root = document.documentElement
    const style = getComputedStyle(root)
    return {
      vwMin: style.getPropertyValue('--vw-min'),
      kvCircleWidth: style.getPropertyValue('--kv-circle-width'),
    }
  })

  if (!cssVarsCheck.vwMin) {
    console.log('  Missing CSS variable: --vw-min')
    issues.push({
      type: 'css_mismatch',
      severity: 'critical',
      description: 'CSS variable --vw-min not defined',
      fix: 'Add :root { --vw-min: 1920; } to CSS',
    })
  }

  // 5. Generate fix report
  console.log('\n[5/5] Generating report...')

  const report = {
    timestamp: new Date().toISOString(),
    originalUrl: ORIGINAL_URL,
    projectDir: PROJECT_DIR,
    issues,
    originalStyles,
    recommendations: [] as string[],
  }

  // Add recommendations
  if (issues.some(i => i.type === 'missing_file')) {
    report.recommendations.push('Run asset downloader to fetch missing files')
  }

  if (!cssVarsCheck.vwMin) {
    report.recommendations.push('Add CSS variables to :root in stylesheets')
  }

  // Save report
  const reportPath = path.join(PROJECT_DIR, '.lp-editor', 'clone-fix-report.json')
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

  await browser.close()

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total issues: ${issues.length}`)
  console.log(`  Critical: ${issues.filter(i => i.severity === 'critical').length}`)
  console.log(`  High: ${issues.filter(i => i.severity === 'high').length}`)
  console.log(`  Medium: ${issues.filter(i => i.severity === 'medium').length}`)
  console.log(`  Low: ${issues.filter(i => i.severity === 'low').length}`)

  console.log('\nRecommendations:')
  report.recommendations.forEach(r => console.log(`  - ${r}`))

  console.log(`\nReport saved to: ${reportPath}`)

  return report
}

fixCloneIssues().catch(console.error)
