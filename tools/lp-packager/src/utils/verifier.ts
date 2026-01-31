/**
 * LP Package Verifier
 *
 * Verifies the integrity and quality of LP packages.
 */

import { readFile, readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import { parseMarkers, extractColors } from './marker-parser'

// Check result for individual verification
export interface CheckResult {
  passed: boolean
  message: string
  details?: string[]
}

// Overall verification result
export interface VerifyResult {
  success: boolean
  checks: {
    structure: CheckResult
    htmlValid: CheckResult
    cssValid: CheckResult
    imagesExist: CheckResult
    linksValid: CheckResult
    markersValid: CheckResult
    performance: CheckResult
  }
  summary: {
    passed: number
    failed: number
    warnings: number
  }
  report: string
}

// Required files for a valid LP package
const REQUIRED_FILES = [
  'src/index.html',
]

const RECOMMENDED_FILES = [
  'lp-config.json',
  'data/content.json',
]

/**
 * Verify LP package structure
 */
async function verifyStructure(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  let passed = true

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = join(outputPath, file)
    if (!existsSync(filePath)) {
      details.push(`Missing required file: ${file}`)
      passed = false
    }
  }

  // Check recommended files
  for (const file of RECOMMENDED_FILES) {
    const filePath = join(outputPath, file)
    if (!existsSync(filePath)) {
      details.push(`Missing recommended file: ${file}`)
    }
  }

  // Check for common directories
  const srcPath = join(outputPath, 'src')
  if (existsSync(srcPath)) {
    const srcContents = await readdir(srcPath)
    if (!srcContents.includes('css')) {
      details.push('No css directory found in src/')
    }
    if (!srcContents.includes('images')) {
      details.push('No images directory found in src/')
    }
  }

  return {
    passed,
    message: passed ? 'Package structure is valid' : 'Package structure has issues',
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Verify HTML validity
 */
async function verifyHtml(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  const htmlPath = join(outputPath, 'src', 'index.html')

  if (!existsSync(htmlPath)) {
    return {
      passed: false,
      message: 'index.html not found',
    }
  }

  const html = await readFile(htmlPath, 'utf-8')

  // Check for DOCTYPE
  if (!html.toLowerCase().includes('<!doctype html>')) {
    details.push('Missing DOCTYPE declaration')
  }

  // Check for essential tags
  if (!html.includes('<html')) {
    details.push('Missing <html> tag')
  }
  if (!html.includes('<head>') && !html.includes('<head ')) {
    details.push('Missing <head> tag')
  }
  if (!html.includes('<body>') && !html.includes('<body ')) {
    details.push('Missing <body> tag')
  }
  if (!html.includes('<title>') && !html.includes('<title ')) {
    details.push('Missing <title> tag (SEO issue)')
  }

  // Check for meta viewport (mobile responsiveness)
  if (!html.includes('viewport')) {
    details.push('Missing viewport meta tag (mobile responsiveness)')
  }

  // Check for meta description
  if (!html.includes('meta') || !html.includes('description')) {
    details.push('Missing meta description (SEO issue)')
  }

  // Check for unclosed tags (basic check)
  const openTags = (html.match(/<[a-z][a-z0-9]*(?:\s[^>]*)?>/gi) || []).length
  const closeTags = (html.match(/<\/[a-z][a-z0-9]*>/gi) || []).length
  const selfClosing = (html.match(/<[a-z][a-z0-9]*(?:\s[^>]*)?\s*\/>/gi) || []).length
  const voidElements = (html.match(/<(?:img|br|hr|input|meta|link|area|base|col|embed|param|source|track|wbr)(?:\s[^>]*)?>/gi) || []).length

  const expectedCloseTags = openTags - selfClosing - voidElements
  if (Math.abs(expectedCloseTags - closeTags) > 5) {
    details.push(`Potential unclosed tags detected (open: ${openTags}, close: ${closeTags})`)
  }

  return {
    passed: details.length === 0,
    message: details.length === 0 ? 'HTML is valid' : 'HTML has potential issues',
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Verify CSS files
 */
async function verifyCss(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  const cssDir = join(outputPath, 'src', 'css')

  if (!existsSync(cssDir)) {
    return {
      passed: true,
      message: 'No CSS directory found (inline styles only)',
    }
  }

  const cssFiles = await readdir(cssDir)
  const cssFilesFiltered = cssFiles.filter((f) => f.endsWith('.css'))

  if (cssFilesFiltered.length === 0) {
    return {
      passed: true,
      message: 'No CSS files found',
    }
  }

  for (const file of cssFilesFiltered) {
    const cssPath = join(cssDir, file)
    const css = await readFile(cssPath, 'utf-8')

    // Check for common CSS issues
    const unclosedBraces = (css.match(/{/g) || []).length - (css.match(/}/g) || []).length
    if (unclosedBraces !== 0) {
      details.push(`${file}: Mismatched braces (${unclosedBraces > 0 ? 'unclosed' : 'extra closing'})`)
    }

    // Check for vendor prefixes without standard property
    if (css.includes('-webkit-') && !css.includes('/* autoprefixer */')) {
      details.push(`${file}: Vendor prefixes found (consider using autoprefixer)`)
    }
  }

  return {
    passed: details.filter((d) => !d.includes('Vendor prefixes')).length === 0,
    message: details.length === 0 ? 'CSS files are valid' : 'CSS has potential issues',
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Verify image references
 */
async function verifyImages(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  const htmlPath = join(outputPath, 'src', 'index.html')

  if (!existsSync(htmlPath)) {
    return {
      passed: false,
      message: 'index.html not found',
    }
  }

  const html = await readFile(htmlPath, 'utf-8')

  // Extract image sources
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const bgImageRegex = /url\(["']?([^"')]+)["']?\)/gi

  const imgSources: string[] = []
  let match

  while ((match = imgSrcRegex.exec(html)) !== null) {
    imgSources.push(match[1])
  }

  while ((match = bgImageRegex.exec(html)) !== null) {
    imgSources.push(match[1])
  }

  // Check each image
  for (const src of imgSources) {
    // Skip external URLs and data URLs
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      continue
    }

    const imagePath = join(outputPath, 'src', src)
    if (!existsSync(imagePath)) {
      details.push(`Missing image: ${src}`)
    }
  }

  return {
    passed: details.length === 0,
    message: details.length === 0 ? 'All images exist' : 'Some images are missing',
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Verify link validity
 */
async function verifyLinks(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  const htmlPath = join(outputPath, 'src', 'index.html')

  if (!existsSync(htmlPath)) {
    return {
      passed: false,
      message: 'index.html not found',
    }
  }

  const html = await readFile(htmlPath, 'utf-8')

  // Extract anchor hrefs
  const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi
  let match

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1]

    // Check for empty href
    if (href === '' || href === '#') {
      continue // These are intentional
    }

    // Check for javascript: links
    if (href.startsWith('javascript:')) {
      details.push(`JavaScript link found: ${href.substring(0, 30)}...`)
    }

    // Check for broken anchor links
    if (href.startsWith('#') && href.length > 1) {
      const anchorId = href.substring(1)
      if (!html.includes(`id="${anchorId}"`) && !html.includes(`id='${anchorId}'`)) {
        details.push(`Broken anchor link: ${href}`)
      }
    }
  }

  return {
    passed: details.length === 0,
    message: details.length === 0 ? 'All links are valid' : 'Some links have issues',
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Verify markers in HTML
 */
async function verifyMarkers(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  const htmlPath = join(outputPath, 'src', 'index.html')

  if (!existsSync(htmlPath)) {
    return {
      passed: false,
      message: 'index.html not found',
    }
  }

  const html = await readFile(htmlPath, 'utf-8')
  const { markers, repeatBlocks, validationIssues } = parseMarkers(html)

  // Report validation issues
  for (const issue of validationIssues) {
    if (issue.type === 'error') {
      details.push(`Error: ${issue.message} (line ${issue.line})`)
    } else if (issue.type === 'warning') {
      details.push(`Warning: ${issue.message} (line ${issue.line})`)
    }
  }

  // Check for markers without labels
  for (const marker of markers) {
    if (!marker.label) {
      details.push(`Marker without label: ${marker.id}`)
    }
  }

  // Check for repeat blocks without proper structure
  for (const block of repeatBlocks) {
    if (block.items.length === 0) {
      details.push(`Empty repeat block: ${block.id}`)
    }
  }

  const errorCount = validationIssues.filter((i) => i.type === 'error').length

  return {
    passed: errorCount === 0,
    message: errorCount === 0
      ? `${markers.length} markers, ${repeatBlocks.length} repeat blocks found`
      : 'Marker validation failed',
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Estimate performance metrics
 */
async function verifyPerformance(outputPath: string): Promise<CheckResult> {
  const details: string[] = []
  let totalSize = 0

  // Calculate total size of src directory
  const srcPath = join(outputPath, 'src')
  if (existsSync(srcPath)) {
    totalSize = await calculateDirSize(srcPath)
  }

  // Check HTML size
  const htmlPath = join(outputPath, 'src', 'index.html')
  if (existsSync(htmlPath)) {
    const htmlStat = await stat(htmlPath)
    if (htmlStat.size > 100 * 1024) {
      details.push(`HTML file is large (${Math.round(htmlStat.size / 1024)}KB)`)
    }
  }

  // Check for large images
  const imagesPath = join(outputPath, 'src', 'images')
  if (existsSync(imagesPath)) {
    const images = await readdir(imagesPath)
    for (const img of images) {
      const imgPath = join(imagesPath, img)
      const imgStat = await stat(imgPath)
      if (imgStat.size > 500 * 1024) {
        details.push(`Large image: ${img} (${Math.round(imgStat.size / 1024)}KB)`)
      }
    }
  }

  // Check total size
  if (totalSize > 5 * 1024 * 1024) {
    details.push(`Total size is large (${Math.round(totalSize / 1024 / 1024)}MB)`)
  }

  return {
    passed: details.length === 0,
    message: `Total size: ${Math.round(totalSize / 1024)}KB`,
    details: details.length > 0 ? details : undefined,
  }
}

/**
 * Calculate directory size recursively
 */
async function calculateDirSize(dirPath: string): Promise<number> {
  let size = 0
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      size += await calculateDirSize(entryPath)
    } else {
      const entryStat = await stat(entryPath)
      size += entryStat.size
    }
  }

  return size
}

/**
 * Generate verification report
 */
function generateReport(checks: VerifyResult['checks']): string {
  const lines: string[] = []
  lines.push('='.repeat(50))
  lines.push('LP Package Verification Report')
  lines.push('='.repeat(50))
  lines.push('')

  const checkEntries = Object.entries(checks) as [keyof typeof checks, CheckResult][]

  for (const [name, result] of checkEntries) {
    const status = result.passed ? '✓' : '✗'
    const statusColor = result.passed ? 'PASS' : 'FAIL'
    lines.push(`[${statusColor}] ${name}: ${result.message}`)

    if (result.details) {
      for (const detail of result.details) {
        lines.push(`       - ${detail}`)
      }
    }
  }

  lines.push('')
  lines.push('='.repeat(50))

  return lines.join('\n')
}

/**
 * Main verification function
 */
export async function verifyBuild(outputPath: string): Promise<VerifyResult> {
  const checks = {
    structure: await verifyStructure(outputPath),
    htmlValid: await verifyHtml(outputPath),
    cssValid: await verifyCss(outputPath),
    imagesExist: await verifyImages(outputPath),
    linksValid: await verifyLinks(outputPath),
    markersValid: await verifyMarkers(outputPath),
    performance: await verifyPerformance(outputPath),
  }

  const checkValues = Object.values(checks)
  const passed = checkValues.filter((c) => c.passed).length
  const failed = checkValues.filter((c) => !c.passed).length
  const warnings = checkValues.filter((c) => c.details && c.details.length > 0).length

  return {
    success: failed === 0,
    checks,
    summary: {
      passed,
      failed,
      warnings,
    },
    report: generateReport(checks),
  }
}
