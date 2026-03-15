import { chromium } from 'playwright'
import * as path from 'path'
import * as fs from 'fs/promises'

const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'
const CLONE_PATH = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/index.html'
const OUTPUT_DIR = 'c:/Users/owner/Dev/tools/lp-site-cloner/comparison-output'

async function captureScreenshots() {
  console.log('Starting screenshot comparison...')

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  // Capture original site
  console.log('\n=== Capturing Original Site ===')
  const originalPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await originalPage.goto(ORIGINAL_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await originalPage.waitForTimeout(3000)

  // Scroll to trigger lazy loading
  await originalPage.evaluate(async () => {
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, window.innerHeight)
      await new Promise(r => setTimeout(r, 300))
    }
    window.scrollTo(0, 0)
  })
  await originalPage.waitForTimeout(2000)

  // Take section screenshots
  const sections = ['#top', '#news', '#movie', '#introduction', '#story', '#music', '#character', '#staffcast']

  for (const section of sections) {
    try {
      const element = await originalPage.$(section)
      if (element) {
        await element.scrollIntoViewIfNeeded()
        await originalPage.waitForTimeout(1000)
        await originalPage.screenshot({
          path: path.join(OUTPUT_DIR, `original-${section.replace('#', '')}.png`),
          fullPage: false
        })
        console.log(`Captured: original-${section.replace('#', '')}.png`)
      }
    } catch (e) {
      console.log(`Section ${section} not found`)
    }
  }

  // Full page screenshot
  await originalPage.evaluate(() => window.scrollTo(0, 0))
  await originalPage.waitForTimeout(1000)
  await originalPage.screenshot({
    path: path.join(OUTPUT_DIR, 'original-fullpage.png'),
    fullPage: true
  })
  console.log('Captured: original-fullpage.png')

  await originalPage.close()

  // Capture clone site
  console.log('\n=== Capturing Clone Site ===')
  const clonePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await clonePage.goto(`file:///${CLONE_PATH}`, { waitUntil: 'networkidle', timeout: 60000 })
  await clonePage.waitForTimeout(3000)

  // Scroll to trigger animations
  await clonePage.evaluate(async () => {
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, window.innerHeight)
      await new Promise(r => setTimeout(r, 300))
    }
    window.scrollTo(0, 0)
  })
  await clonePage.waitForTimeout(2000)

  for (const section of sections) {
    try {
      const element = await clonePage.$(section)
      if (element) {
        await element.scrollIntoViewIfNeeded()
        await clonePage.waitForTimeout(1000)
        await clonePage.screenshot({
          path: path.join(OUTPUT_DIR, `clone-${section.replace('#', '')}.png`),
          fullPage: false
        })
        console.log(`Captured: clone-${section.replace('#', '')}.png`)
      }
    } catch (e) {
      console.log(`Section ${section} not found in clone`)
    }
  }

  // Full page screenshot
  await clonePage.evaluate(() => window.scrollTo(0, 0))
  await clonePage.waitForTimeout(1000)
  await clonePage.screenshot({
    path: path.join(OUTPUT_DIR, 'clone-fullpage.png'),
    fullPage: true
  })
  console.log('Captured: clone-fullpage.png')

  // Check for console errors
  console.log('\n=== Checking Clone Console Errors ===')
  const clonePage2 = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const errors: string[] = []
  const warnings: string[] = []

  clonePage2.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
    if (msg.type() === 'warning') warnings.push(msg.text())
  })

  clonePage2.on('pageerror', err => errors.push(err.message))

  await clonePage2.goto(`file:///${CLONE_PATH}`, { waitUntil: 'networkidle', timeout: 60000 })
  await clonePage2.waitForTimeout(3000)

  if (errors.length > 0) {
    console.log('\nErrors found:')
    errors.forEach(e => console.log(`  - ${e}`))
  } else {
    console.log('No errors found')
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:')
    warnings.slice(0, 5).forEach(w => console.log(`  - ${w}`))
  }

  await browser.close()

  console.log(`\n=== Screenshots saved to ${OUTPUT_DIR} ===`)
}

captureScreenshots().catch(console.error)
