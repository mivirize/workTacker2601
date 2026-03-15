import { chromium } from 'playwright'
import * as path from 'path'
import * as fs from 'fs/promises'

const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'
const CLONE_URL = 'http://localhost:5555/'
const OUTPUT_DIR = 'c:/Users/owner/Dev/tools/lp-site-cloner/comparison-output'

async function captureHttp() {
  console.log('Capturing via HTTP server...')

  const browser = await chromium.launch({ headless: true })

  // Capture clone via HTTP
  const clonePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await clonePage.goto(CLONE_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await clonePage.waitForTimeout(3000)

  // Scroll to trigger lazy loading
  await clonePage.evaluate(async () => {
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, window.innerHeight)
      await new Promise(r => setTimeout(r, 300))
    }
    window.scrollTo(0, 0)
  })
  await clonePage.waitForTimeout(2000)

  // Capture sections
  const sections = ['top', 'news', 'movie', 'introduction', 'story', 'music', 'character', 'staffcast']

  for (const section of sections) {
    try {
      const element = await clonePage.$(`#${section}`)
      if (element) {
        await element.scrollIntoViewIfNeeded()
        await clonePage.waitForTimeout(1000)
        await clonePage.screenshot({
          path: path.join(OUTPUT_DIR, `clone-http-${section}.png`),
          fullPage: false
        })
        console.log(`Captured: clone-http-${section}.png`)
      }
    } catch (e) {
      console.log(`Section ${section} not found`)
    }
  }

  // Full page
  await clonePage.evaluate(() => window.scrollTo(0, 0))
  await clonePage.waitForTimeout(1000)
  await clonePage.screenshot({
    path: path.join(OUTPUT_DIR, 'clone-http-fullpage.png'),
    fullPage: true
  })
  console.log('Captured: clone-http-fullpage.png')

  // Check console errors
  const errors: string[] = []
  clonePage.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // Reload to capture errors
  await clonePage.reload({ waitUntil: 'networkidle' })
  await clonePage.waitForTimeout(2000)

  if (errors.length > 0) {
    console.log('\nConsole errors:')
    errors.forEach(e => console.log(`  - ${e}`))
  } else {
    console.log('\nNo console errors!')
  }

  await browser.close()
  console.log('\nDone!')
}

captureHttp().catch(console.error)
