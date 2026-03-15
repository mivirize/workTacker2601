import * as fs from 'fs/promises'
import * as path from 'path'
import { chromium } from 'playwright'

const BASE_URL = 'https://www.cho-kaguyahime.com'
const IMAGES_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/images'
const CSS_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/css'

async function downloadCssImages() {
  console.log('Downloading CSS referenced images...')

  // Read all CSS files and extract image references
  const cssFiles = await fs.readdir(CSS_DIR)
  const imageNames = new Set<string>()

  for (const file of cssFiles) {
    if (!file.endsWith('.css')) continue
    const css = await fs.readFile(path.join(CSS_DIR, file), 'utf-8')
    const matches = css.matchAll(/url\(['"]?\.\.\/images\/([^'")\s]+)['"]?\)/g)
    for (const match of matches) {
      imageNames.add(match[1])
    }
  }

  console.log(`Found ${imageNames.size} unique image references in CSS`)

  // Check which ones are missing
  const existingFiles = new Set(await fs.readdir(IMAGES_DIR))
  const missing = [...imageNames].filter(name => !existingFiles.has(name))

  console.log(`Missing ${missing.length} images`)

  if (missing.length === 0) {
    console.log('All CSS images are present!')
    return
  }

  // Download missing images
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Try different path patterns
  const pathPatterns = [
    '/wp-content/themes/cho-kaguyahime/assets/images/',
    '/assets/img/common/',
    '/assets/img/top/',
    '/assets/img/character/',
    '/assets/img/news/',
    '/assets/img/movie/',
    '/assets/img/story/',
    '/assets/img/music/',
    '/assets/img/staffcast/',
    '/assets/img/introduction/',
  ]

  let downloaded = 0
  for (const filename of missing) {
    let found = false
    for (const pattern of pathPatterns) {
      try {
        const url = BASE_URL + pattern + filename
        const response = await page.request.get(url)
        if (response.ok()) {
          const buffer = await response.body()
          await fs.writeFile(path.join(IMAGES_DIR, filename), buffer)
          downloaded++
          console.log(`Downloaded: ${filename}`)
          found = true
          break
        }
      } catch (e) {
        // Try next pattern
      }
    }
    if (!found) {
      console.log(`Not found: ${filename}`)
    }
  }

  await browser.close()

  console.log(`\nDownloaded ${downloaded} of ${missing.length} missing images`)
}

downloadCssImages().catch(console.error)
