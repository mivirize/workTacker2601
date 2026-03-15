#!/usr/bin/env node
/**
 * LP Site Cloner CLI
 *
 * Usage:
 *   npx tsx src/cli/clone.ts <url> [options]
 *
 * Options:
 *   --output, -o    Output directory (default: ./output/<domain>)
 *   --analyze-only  Only analyze, don't download assets
 *   --full          Full clone with all assets
 */

import { chromium } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'
import { analyzeSite, SiteAnalysis } from '../analyzer/site-analyzer'

interface CloneOptions {
  url: string
  outputDir: string
  analyzeOnly: boolean
  full: boolean
}

async function parseArgs(): Promise<CloneOptions> {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
LP Site Cloner - Comprehensive website cloning tool

Usage:
  npx tsx src/cli/clone.ts <url> [options]

Options:
  --output, -o <dir>  Output directory (default: ./output/<domain>)
  --analyze-only      Only analyze, don't download assets
  --full              Full clone with all assets and LP-Editor markers

Examples:
  npx tsx src/cli/clone.ts https://example.com
  npx tsx src/cli/clone.ts https://example.com -o ./my-project
  npx tsx src/cli/clone.ts https://example.com --analyze-only
`)
    process.exit(0)
  }

  const url = args[0]
  const domain = new URL(url).hostname.replace('www.', '')

  let outputDir = `./output/${domain}`
  let analyzeOnly = false
  let full = false

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      outputDir = args[++i]
    } else if (args[i] === '--analyze-only') {
      analyzeOnly = true
    } else if (args[i] === '--full') {
      full = true
    }
  }

  return { url, outputDir, analyzeOnly, full }
}

async function downloadAssets(
  analysis: SiteAnalysis,
  outputDir: string,
  baseUrl: string
) {
  console.log('\n📦 Downloading assets...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const imagesDir = path.join(outputDir, 'src', 'images')
  const cssDir = path.join(outputDir, 'src', 'css')
  const jsDir = path.join(outputDir, 'src', 'js')

  await fs.mkdir(imagesDir, { recursive: true })
  await fs.mkdir(cssDir, { recursive: true })
  await fs.mkdir(jsDir, { recursive: true })

  let downloaded = 0

  // Download images
  const allImages = [...analysis.assets.images, ...analysis.assets.svgs]
  for (const img of allImages) {
    try {
      const response = await page.request.get(img.url)
      if (response.ok()) {
        const buffer = await response.body()
        const filename = img.filename || `image_${downloaded}.${img.type}`
        await fs.writeFile(path.join(imagesDir, filename), buffer)
        downloaded++
      }
    } catch (e) {
      // Skip failed downloads
    }
  }

  console.log(`  Downloaded ${downloaded} images`)

  // Download CSS
  const cssLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.getAttribute('href'))
      .filter(href => href && !href.includes('cdn'))
  })

  for (const href of cssLinks) {
    try {
      const url = href?.startsWith('http') ? href : new URL(href!, baseUrl).href
      const response = await page.request.get(url)
      if (response.ok()) {
        const content = await response.text()
        const filename = path.basename(new URL(url).pathname)
        await fs.writeFile(path.join(cssDir, filename), content)
      }
    } catch (e) {
      // Skip
    }
  }

  // Download JS
  const jsScripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[src]'))
      .map(script => script.getAttribute('src'))
      .filter(src => src && !src.includes('cdn') && !src.includes('gtag') && !src.includes('analytics'))
  })

  for (const src of jsScripts) {
    try {
      const url = src?.startsWith('http') ? src : new URL(src!, baseUrl).href
      const response = await page.request.get(url)
      if (response.ok()) {
        const content = await response.text()
        const filename = path.basename(new URL(url).pathname)
        await fs.writeFile(path.join(jsDir, filename), content)
      }
    } catch (e) {
      // Skip
    }
  }

  await browser.close()
}

async function downloadHtml(url: string, outputDir: string) {
  console.log('\n📄 Downloading HTML...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })

  // Get full HTML
  const html = await page.content()

  // Save original HTML
  const htmlPath = path.join(outputDir, 'src', 'index.html')
  await fs.mkdir(path.dirname(htmlPath), { recursive: true })
  await fs.writeFile(htmlPath, html)

  console.log(`  Saved: ${htmlPath}`)

  await browser.close()
}

async function generateLpConfig(analysis: SiteAnalysis, outputDir: string) {
  console.log('\n⚙️ Generating LP config...')

  const config = {
    name: analysis.meta.title || 'Cloned Site',
    version: '1.0.0',
    entry: 'src/index.html',
    output: {
      appName: analysis.meta.title?.replace(/[^\w\s-]/g, '').trim() || 'cloned-site',
      fileName: 'index.html',
    },
    colors: {},
    groups: {},
  }

  // Extract color variables
  analysis.styles.colors.slice(0, 10).forEach((color, i) => {
    const key = `color-${i + 1}`
    ;(config.colors as any)[key] = {
      value: color,
      label: `Color ${i + 1}`,
    }
  })

  // Extract section groups
  analysis.structure.sections.slice(0, 15).forEach((section, i) => {
    if (section.id) {
      const key = `${String(i + 1).padStart(2, '0')}-${section.id}`
      ;(config.groups as any)[key] = {
        label: section.id.charAt(0).toUpperCase() + section.id.slice(1),
        order: i + 1,
      }
    }
  })

  const configPath = path.join(outputDir, 'lp-config.json')
  await fs.writeFile(configPath, JSON.stringify(config, null, 2))

  console.log(`  Saved: ${configPath}`)
}

async function generateReference(analysis: SiteAnalysis, outputDir: string) {
  console.log('\n📚 Generating reference document...')

  const refDir = path.join(outputDir, '.lp-editor')
  await fs.mkdir(refDir, { recursive: true })

  // Save full analysis
  await fs.writeFile(
    path.join(refDir, 'site-analysis.json'),
    JSON.stringify(analysis, null, 2)
  )

  // Generate markdown reference
  const markdown = generateMarkdownReference(analysis)
  await fs.writeFile(path.join(refDir, 'REFERENCE.md'), markdown)

  console.log(`  Saved: ${path.join(refDir, 'REFERENCE.md')}`)
}

function generateMarkdownReference(analysis: SiteAnalysis): string {
  let md = `# ${analysis.meta.title}\n\n`
  md += `> Analyzed: ${analysis.meta.analyzedAt}\n`
  md += `> Original URL: ${analysis.meta.url}\n\n`

  // Structure
  md += `## ページ構成\n\n`
  md += `| セクション | クラス | 高さ |\n`
  md += `|-----------|--------|------|\n`
  for (const section of analysis.structure.sections.slice(0, 15)) {
    md += `| #${section.id || 'N/A'} | ${section.classes.join(' ')} | ${Math.round(section.position.height)}px |\n`
  }

  // Animations
  md += `\n## アニメーション (${analysis.animations.cssKeyframes.length}種類)\n\n`
  for (const anim of analysis.animations.cssKeyframes.slice(0, 15)) {
    md += `### ${anim.name}\n\`\`\`css\n`
    for (const kf of anim.keyframes) {
      md += `${kf.key} { ${kf.style} }\n`
    }
    md += `\`\`\`\n\n`
  }

  // Effects
  md += `## 特殊効果\n\n`
  md += `### グラデーション (${analysis.effects.gradients.length})\n`
  for (const g of analysis.effects.gradients.slice(0, 5)) {
    md += `- \`${g.selector}\`: ${g.type}\n`
  }

  md += `\n### マスク (${analysis.effects.masks.length})\n`
  for (const m of analysis.effects.masks.slice(0, 5)) {
    md += `- \`${m.selector}\`: ${m.purpose}\n`
  }

  // Components
  md += `\n## コンポーネント\n\n`
  md += `### スライダー (${analysis.components.sliders.length})\n`
  for (const s of analysis.components.sliders) {
    md += `- ${s.selector}: ${s.library} (${s.slideCount}枚, ${s.effect})\n`
  }

  // Technologies
  md += `\n## 使用技術\n\n`
  md += `- ライブラリ: ${analysis.technologies.libraries.join(', ') || 'なし'}\n`
  md += `- フレームワーク: ${analysis.technologies.frameworks.join(', ') || 'なし'}\n`

  // Colors
  md += `\n## カラーパレット\n\n`
  for (const color of analysis.styles.colors.slice(0, 10)) {
    md += `- \`${color}\`\n`
  }

  // Typography
  md += `\n## タイポグラフィ\n\n`
  md += `フォント: ${analysis.styles.typography.fonts.join(', ')}\n\n`
  md += `| 要素 | サイズ | 行間 | 字間 |\n`
  md += `|------|--------|------|------|\n`
  for (const [tag, style] of Object.entries(analysis.styles.typography.sizes)) {
    md += `| ${tag} | ${style.fontSize} | ${style.lineHeight} | ${style.letterSpacing} |\n`
  }

  return md
}

async function main() {
  const options = await parseArgs()

  console.log('═'.repeat(60))
  console.log('🌐 LP Site Cloner')
  console.log('═'.repeat(60))
  console.log(`URL: ${options.url}`)
  console.log(`Output: ${options.outputDir}`)
  console.log('')

  // Create output directory
  await fs.mkdir(options.outputDir, { recursive: true })

  // Step 1: Analyze site
  console.log('🔍 Analyzing site...')
  const analysis = await analyzeSite(options.url)
  console.log(`  Found ${analysis.structure.sections.length} sections`)
  console.log(`  Found ${analysis.animations.cssKeyframes.length} animations`)
  console.log(`  Found ${analysis.assets.images.length} images`)
  console.log(`  Libraries: ${analysis.technologies.libraries.join(', ')}`)

  // Generate reference
  await generateReference(analysis, options.outputDir)

  if (options.analyzeOnly) {
    console.log('\n✅ Analysis complete (--analyze-only mode)')
    return
  }

  // Step 2: Download HTML
  await downloadHtml(options.url, options.outputDir)

  // Step 3: Download assets
  await downloadAssets(analysis, options.outputDir, options.url)

  // Step 4: Generate LP config
  await generateLpConfig(analysis, options.outputDir)

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('✅ Clone complete!')
  console.log('═'.repeat(60))
  console.log(`Output: ${options.outputDir}`)
  console.log('')
  console.log('Files created:')
  console.log('  - src/index.html')
  console.log('  - src/css/')
  console.log('  - src/js/')
  console.log('  - src/images/')
  console.log('  - lp-config.json')
  console.log('  - .lp-editor/site-analysis.json')
  console.log('  - .lp-editor/REFERENCE.md')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Open the project in LP-Editor')
  console.log('  2. Fix any path issues in HTML/CSS')
  console.log('  3. Add data-editable markers')
}

main().catch(console.error)
