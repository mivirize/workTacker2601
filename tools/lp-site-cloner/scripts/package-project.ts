import * as fs from 'fs/promises'
import * as path from 'path'
import * as cheerio from 'cheerio'

const PROJECT_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime'

async function packageProject() {
  console.log('Packaging project...')

  // Load config
  const configPath = path.join(PROJECT_DIR, 'lp-config.json')
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'))

  // Create output directory
  const outputName = `${config.output?.appName || config.name}_v${config.version}`
  const outputDir = path.join(PROJECT_DIR, outputName)

  await fs.rm(outputDir, { recursive: true, force: true })
  await fs.mkdir(outputDir, { recursive: true })

  // Load and clean HTML
  const htmlPath = path.join(PROJECT_DIR, config.entry)
  let html = await fs.readFile(htmlPath, 'utf-8')

  const $ = cheerio.load(html, { decodeEntities: false })

  // Remove LP-Editor data attributes
  const attributesToRemove = [
    'data-editable',
    'data-type',
    'data-label',
    'data-group',
    'data-order',
    'data-placeholder',
    'data-recommended-size',
    'data-max-size',
    'data-accept',
    'data-text-editable',
    'data-allow-external',
    'data-css-var',
    'data-repeat',
    'data-repeat-item',
    'data-repeat-min',
    'data-repeat-max',
    'data-original-src',
  ]

  $('*').each((_, el) => {
    const element = $(el)
    for (const attr of attributesToRemove) {
      element.removeAttr(attr)
    }
  })

  // Remove tracking scripts
  $('script[src*="gtag"], script[src*="analytics"], script[src*="gtm"]').remove()
  $('script').each((_, el) => {
    const content = $(el).html() || ''
    if (content.includes('gtag') || content.includes('GoogleAnalytics') || content.includes('dataLayer')) {
      $(el).remove()
    }
  })

  // Remove CSP meta tag
  $('meta[http-equiv="Content-Security-Policy"]').remove()

  // Write clean HTML
  const cleanHtml = $.html()
  await fs.writeFile(path.join(outputDir, 'index.html'), cleanHtml, 'utf-8')
  console.log('Written: index.html')

  // Copy CSS
  const cssDir = path.join(PROJECT_DIR, 'src', 'css')
  const outputCssDir = path.join(outputDir, 'css')
  await fs.mkdir(outputCssDir, { recursive: true })

  const cssFiles = await fs.readdir(cssDir).catch(() => [])
  for (const file of cssFiles) {
    if (file.endsWith('.css')) {
      await fs.copyFile(path.join(cssDir, file), path.join(outputCssDir, file))
      console.log(`Copied: css/${file}`)
    }
  }

  // Copy JS
  const jsDir = path.join(PROJECT_DIR, 'src', 'js')
  const outputJsDir = path.join(outputDir, 'js')
  await fs.mkdir(outputJsDir, { recursive: true })

  const jsFiles = await fs.readdir(jsDir).catch(() => [])
  for (const file of jsFiles) {
    if (file.endsWith('.js')) {
      await fs.copyFile(path.join(jsDir, file), path.join(outputJsDir, file))
      console.log(`Copied: js/${file}`)
    }
  }

  // Copy images
  const imagesDir = path.join(PROJECT_DIR, 'src', 'images')
  const outputImagesDir = path.join(outputDir, 'images')
  await fs.mkdir(outputImagesDir, { recursive: true })

  const imageFiles = await fs.readdir(imagesDir).catch(() => [])
  let imageCount = 0
  for (const file of imageFiles) {
    const src = path.join(imagesDir, file)
    const dest = path.join(outputImagesDir, file)
    const stat = await fs.stat(src)
    if (stat.isFile()) {
      await fs.copyFile(src, dest)
      imageCount++
    }
  }
  console.log(`Copied: ${imageCount} images`)

  // Calculate total size
  let totalSize = 0
  const walk = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else {
        const stat = await fs.stat(fullPath)
        totalSize += stat.size
      }
    }
  }
  await walk(outputDir)

  console.log('\n===================================')
  console.log('パッケージング完了!')
  console.log('===================================')
  console.log(`出力先: ${outputDir}`)
  console.log(`サイズ: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`ファイル数: ${cssFiles.length} CSS, ${jsFiles.length} JS, ${imageCount} 画像`)
  console.log('===================================')

  return outputDir
}

packageProject().catch(console.error)
