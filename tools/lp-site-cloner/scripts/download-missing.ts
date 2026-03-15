import * as fs from 'fs/promises'
import * as path from 'path'
import { chromium } from 'playwright'

const BASE_URL = 'https://www.cho-kaguyahime.com'
const IMAGES_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/images'

async function downloadMissing() {
  console.log('Downloading missing images...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Go to page and extract ALL image URLs
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 })

  // Wait for lazy loaded content
  await page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    // Scroll to trigger lazy loading
    for (let i = 0; i < 10; i++) {
      window.scrollBy(0, window.innerHeight)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    window.scrollTo(0, 0)
  })

  await page.waitForTimeout(2000)

  // Get all image URLs including lazy loaded
  const imageUrls = await page.evaluate(() => {
    const urls: string[] = []

    document.querySelectorAll('img').forEach(img => {
      if (img.src) urls.push(img.src)
      if (img.dataset.src) urls.push(img.dataset.src)
    })

    document.querySelectorAll('source').forEach(source => {
      if (source.srcset) urls.push(source.srcset)
    })

    // Background images
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      const bgImage = style.backgroundImage
      if (bgImage && bgImage !== 'none') {
        const matches = bgImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)
        for (const match of matches) {
          if (!match[1].startsWith('data:')) urls.push(match[1])
        }
      }
    })

    return [...new Set(urls)]
  })

  console.log(`Found ${imageUrls.length} image URLs`)

  // Get existing files
  const existingFiles = new Set(await fs.readdir(IMAGES_DIR).catch(() => []))

  let downloaded = 0
  for (const url of imageUrls) {
    try {
      const absoluteUrl = url.startsWith('http') ? url : new URL(url, BASE_URL).href

      // Get filename
      const urlObj = new URL(absoluteUrl)
      let filename = decodeURIComponent(path.basename(urlObj.pathname))

      if (!filename || filename === '/' || filename.length < 3) continue
      if (existingFiles.has(filename)) continue

      // Download
      const response = await page.request.get(absoluteUrl)
      if (response.ok()) {
        const buffer = await response.body()
        await fs.writeFile(path.join(IMAGES_DIR, filename), buffer)
        existingFiles.add(filename)
        downloaded++
        console.log(`Downloaded: ${filename}`)
      }
    } catch (e) {
      // Skip errors
    }
  }

  // Also try common patterns
  const commonPatterns = [
    '/assets/img/common/gnav_c1.png',
    '/assets/img/common/gnav_c2.png',
    '/assets/img/common/gnav_c3.png',
  ]

  for (const pattern of commonPatterns) {
    try {
      const url = BASE_URL + pattern
      const filename = path.basename(pattern)
      if (existingFiles.has(filename)) continue

      const response = await page.request.get(url)
      if (response.ok()) {
        const buffer = await response.body()
        await fs.writeFile(path.join(IMAGES_DIR, filename), buffer)
        downloaded++
        console.log(`Downloaded: ${filename}`)
      }
    } catch (e) {
      // Skip
    }
  }

  await browser.close()

  console.log(`\nTotal downloaded: ${downloaded}`)
  console.log(`Total images: ${existingFiles.size}`)
}

downloadMissing().catch(console.error)
