import { chromium } from 'playwright'
import * as fs from 'fs/promises'
import * as path from 'path'

const BASE_URL = 'https://www.cho-kaguyahime.com'
const IMAGES_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/images'

// Missing SVG files identified from errors
const missingSvgs = [
  '/assets/img/common/nav_flash.svg',
  '/assets/img/common/icon_x.svg',
  '/assets/img/common/icon_tiktok.svg',
  '/assets/img/common/icon_youtube.svg',
  '/assets/img/common/icon_instagram.svg',
  '/assets/img/common/icon_niconico.svg',
  '/assets/img/common/icon_dia-arrow.svg',
  '/assets/img/music/music_line.svg',
]

async function downloadMissingSvgs() {
  console.log('Downloading missing SVG files...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  let downloaded = 0
  let failed = 0

  for (const svgPath of missingSvgs) {
    try {
      const url = BASE_URL + svgPath
      const filename = path.basename(svgPath)
      const destPath = path.join(IMAGES_DIR, filename)

      // Check if already exists
      try {
        await fs.access(destPath)
        console.log(`Already exists: ${filename}`)
        continue
      } catch {
        // File doesn't exist, download it
      }

      console.log(`Downloading: ${url}`)
      const response = await page.request.get(url)

      if (response.ok()) {
        const buffer = await response.body()
        await fs.writeFile(destPath, buffer)
        downloaded++
        console.log(`  -> Saved: ${filename}`)
      } else {
        console.log(`  -> Failed: ${response.status()}`)
        failed++
      }
    } catch (e) {
      console.log(`  -> Error: ${e}`)
      failed++
    }
  }

  // Also search for other SVGs on the page
  console.log('\nSearching for additional SVGs on the page...')
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 })

  const svgUrls = await page.evaluate(() => {
    const urls: string[] = []

    // Find all img tags with .svg extension
    document.querySelectorAll('img[src*=".svg"]').forEach(img => {
      urls.push((img as HTMLImageElement).src)
    })

    // Find SVG in CSS backgrounds
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      const bgImage = style.backgroundImage
      if (bgImage && bgImage.includes('.svg')) {
        const match = bgImage.match(/url\(["']?([^"')]+\.svg)["']?\)/)
        if (match) urls.push(match[1])
      }
    })

    // Find SVG in use elements
    document.querySelectorAll('use').forEach(use => {
      const href = use.getAttribute('href') || use.getAttribute('xlink:href')
      if (href && href.endsWith('.svg')) urls.push(href)
    })

    return [...new Set(urls)]
  })

  console.log(`Found ${svgUrls.length} SVG URLs on page`)

  for (const url of svgUrls) {
    try {
      const absoluteUrl = url.startsWith('http') ? url : new URL(url, BASE_URL).href
      const filename = path.basename(new URL(absoluteUrl).pathname)
      const destPath = path.join(IMAGES_DIR, filename)

      // Check if already exists
      try {
        await fs.access(destPath)
        continue
      } catch {
        // Download
      }

      console.log(`Downloading: ${filename}`)
      const response = await page.request.get(absoluteUrl)

      if (response.ok()) {
        const buffer = await response.body()
        await fs.writeFile(destPath, buffer)
        downloaded++
        console.log(`  -> Saved: ${filename}`)
      }
    } catch (e) {
      // Skip errors
    }
  }

  await browser.close()

  console.log(`\n=== Summary ===`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Failed: ${failed}`)
}

downloadMissingSvgs().catch(console.error)
