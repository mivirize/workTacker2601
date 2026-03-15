import { chromium } from 'playwright'
import * as fs from 'fs/promises'

const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'

async function compareCSS() {
  console.log('Fetching original CSS...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Get CSS files
  await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle' })

  // Download top.css
  const topCssResponse = await page.request.get('https://www.cho-kaguyahime.com/assets/css/top.css')
  const originalTopCss = await topCssResponse.text()

  // Read local CSS
  const localTopCss = await fs.readFile('c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/css/top.css', 'utf-8')

  // Compare news section CSS
  console.log('\n=== NEWS frame CSS ===')
  const newsFrameOriginal = originalTopCss.match(/\.news__content\s*\{[^}]+\}/g)
  const newsFrameLocal = localTopCss.match(/\.news__content\s*\{[^}]+\}/g)

  console.log('Original news__content:')
  console.log(newsFrameOriginal?.[0]?.substring(0, 500))
  console.log('\nLocal news__content:')
  console.log(newsFrameLocal?.[0]?.substring(0, 500))

  // Compare music section CSS
  console.log('\n\n=== MUSIC line CSS ===')
  const musicLineOriginal = originalTopCss.match(/music_line\.svg[^;]+;/g)
  const musicLineLocal = localTopCss.match(/music_line\.svg[^;]+;/g)

  console.log('Original music_line references:')
  musicLineOriginal?.forEach(m => console.log(`  ${m}`))
  console.log('\nLocal music_line references:')
  musicLineLocal?.forEach(m => console.log(`  ${m}`))

  // Check for the music title decorations
  console.log('\n\n=== MUSIC title decorations ===')
  const musicTitleOriginal = originalTopCss.match(/\.music__title[^{]*\{[^}]+\}/g)
  const musicTitleLocal = localTopCss.match(/\.music__title[^{]*\{[^}]+\}/g)

  console.log('Original music__title selectors:', musicTitleOriginal?.length || 0)
  console.log('Local music__title selectors:', musicTitleLocal?.length || 0)

  // Check for --sun
  const sunOriginal = originalTopCss.match(/\.music__title--sun[^{]*\{[^}]+\}/g)
  const sunLocal = localTopCss.match(/\.music__title--sun[^{]*\{[^}]+\}/g)

  console.log('\nOriginal --sun:')
  sunOriginal?.forEach(s => console.log(s.substring(0, 300)))
  console.log('\nLocal --sun:')
  sunLocal?.forEach(s => console.log(s.substring(0, 300)))

  // Check CSS file sizes
  console.log('\n\n=== File sizes ===')
  console.log(`Original top.css: ${originalTopCss.length} bytes`)
  console.log(`Local top.css: ${localTopCss.length} bytes`)

  await browser.close()
}

compareCSS().catch(console.error)
