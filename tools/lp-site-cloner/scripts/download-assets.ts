import * as fs from 'fs/promises'
import * as path from 'path'
import { chromium } from 'playwright'

const BASE_URL = 'https://www.cho-kaguyahime.com'
const OUTPUT_DIR = 'c:/Users/owner/Dev/tools/lp-site-cloner/output/cho-kaguyahime/src'

async function downloadAssets() {
  console.log('Starting asset download...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 })

  // Extract all image URLs
  const imageUrls = await page.evaluate(() => {
    const urls: string[] = []

    // img tags
    document.querySelectorAll('img').forEach(img => {
      if (img.src) urls.push(img.src)
    })

    // Background images
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      const bgImage = style.backgroundImage
      if (bgImage && bgImage !== 'none') {
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/g)
        if (match) {
          match.forEach(m => {
            const url = m.replace(/url\(["']?|["']?\)/g, '')
            if (url && !url.startsWith('data:')) urls.push(url)
          })
        }
      }
    })

    return [...new Set(urls)]
  })

  console.log(`Found ${imageUrls.length} images`)

  const imagesDir = path.join(OUTPUT_DIR, 'images')
  await fs.mkdir(imagesDir, { recursive: true })

  let downloaded = 0
  let failed = 0

  for (const url of imageUrls) {
    try {
      const absoluteUrl = url.startsWith('http') ? url : new URL(url, BASE_URL).href

      // Skip external domains
      if (!absoluteUrl.includes('cho-kaguyahime.com')) {
        continue
      }

      const urlObj = new URL(absoluteUrl)
      const filename = path.basename(urlObj.pathname)

      if (!filename || filename === '/') continue

      const response = await page.request.get(absoluteUrl)
      const buffer = await response.body()

      const localPath = path.join(imagesDir, filename)
      await fs.writeFile(localPath, buffer)

      downloaded++
      console.log(`Downloaded: ${filename}`)
    } catch (error) {
      failed++
      console.error(`Failed: ${url}`)
    }
  }

  // Download CSS files
  const cssUrls = await page.evaluate(() => {
    const urls: string[] = []
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href')
      if (href) urls.push(href)
    })
    return urls
  })

  const cssDir = path.join(OUTPUT_DIR, 'css')
  await fs.mkdir(cssDir, { recursive: true })

  for (const url of cssUrls) {
    try {
      const absoluteUrl = url.startsWith('http') ? url : new URL(url, BASE_URL).href
      if (!absoluteUrl.includes('cho-kaguyahime.com')) continue

      const response = await page.request.get(absoluteUrl)
      const content = await response.text()

      const filename = path.basename(new URL(absoluteUrl).pathname)
      await fs.writeFile(path.join(cssDir, filename), content)
      console.log(`Downloaded CSS: ${filename}`)
    } catch (error) {
      console.error(`Failed CSS: ${url}`)
    }
  }

  // Download JS files
  const jsUrls = await page.evaluate(() => {
    const urls: string[] = []
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src')
      if (src) urls.push(src)
    })
    return urls
  })

  const jsDir = path.join(OUTPUT_DIR, 'js')
  await fs.mkdir(jsDir, { recursive: true })

  for (const url of jsUrls) {
    try {
      const absoluteUrl = url.startsWith('http') ? url : new URL(url, BASE_URL).href
      if (!absoluteUrl.includes('cho-kaguyahime.com')) continue

      const response = await page.request.get(absoluteUrl)
      const content = await response.text()

      const filename = path.basename(new URL(absoluteUrl).pathname)
      await fs.writeFile(path.join(jsDir, filename), content)
      console.log(`Downloaded JS: ${filename}`)
    } catch (error) {
      console.error(`Failed JS: ${url}`)
    }
  }

  await browser.close()

  console.log(`\nCompleted: ${downloaded} downloaded, ${failed} failed`)
}

downloadAssets().catch(console.error)
