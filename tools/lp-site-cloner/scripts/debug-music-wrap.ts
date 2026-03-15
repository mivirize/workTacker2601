import { chromium } from 'playwright'

const CLONE_URL = 'http://localhost:5555/'
const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'

async function debugMusicWrap() {
  console.log('Debugging music__wrap styles...')

  const browser = await chromium.launch({ headless: true })

  // Check CLONE
  console.log('\n=== CLONE ===')
  const clonePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await clonePage.goto(CLONE_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await clonePage.waitForTimeout(2000)

  const cloneDebug = await clonePage.evaluate(() => {
    const musicWrap = document.querySelector('.music__wrap')
    if (!musicWrap) return { error: 'music__wrap not found' }

    const wrapStyle = window.getComputedStyle(musicWrap)
    const beforeStyle = window.getComputedStyle(musicWrap, '::before')
    const afterStyle = window.getComputedStyle(musicWrap, '::after')

    return {
      wrap: {
        position: wrapStyle.position,
        display: wrapStyle.display,
        overflow: wrapStyle.overflow,
      },
      before: {
        content: beforeStyle.content,
        position: beforeStyle.position,
        left: beforeStyle.left,
        right: beforeStyle.right,
        top: beforeStyle.top,
        bottom: beforeStyle.bottom,
        maskImage: beforeStyle.maskImage || beforeStyle.webkitMaskImage || 'none',
        mask: beforeStyle.mask || beforeStyle.webkitMask || 'none',
        background: beforeStyle.background,
        display: beforeStyle.display,
      },
      after: {
        content: afterStyle.content,
        background: afterStyle.background,
        backgroundImage: afterStyle.backgroundImage,
        width: afterStyle.width,
        height: afterStyle.height,
      }
    }
  })
  console.log('Clone music__wrap:', JSON.stringify(cloneDebug, null, 2))

  // Check ORIGINAL
  console.log('\n=== ORIGINAL ===')
  const originalPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await originalPage.goto(ORIGINAL_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await originalPage.waitForTimeout(2000)

  const originalDebug = await originalPage.evaluate(() => {
    const musicWrap = document.querySelector('.music__wrap')
    if (!musicWrap) return { error: 'music__wrap not found' }

    const wrapStyle = window.getComputedStyle(musicWrap)
    const beforeStyle = window.getComputedStyle(musicWrap, '::before')
    const afterStyle = window.getComputedStyle(musicWrap, '::after')

    return {
      wrap: {
        position: wrapStyle.position,
        display: wrapStyle.display,
        overflow: wrapStyle.overflow,
      },
      before: {
        content: beforeStyle.content,
        position: beforeStyle.position,
        left: beforeStyle.left,
        right: beforeStyle.right,
        top: beforeStyle.top,
        bottom: beforeStyle.bottom,
        maskImage: beforeStyle.maskImage || beforeStyle.webkitMaskImage || 'none',
        mask: beforeStyle.mask || beforeStyle.webkitMask || 'none',
        background: beforeStyle.background,
        display: beforeStyle.display,
      },
      after: {
        content: afterStyle.content,
        background: afterStyle.background,
        backgroundImage: afterStyle.backgroundImage,
        width: afterStyle.width,
        height: afterStyle.height,
      }
    }
  })
  console.log('Original music__wrap:', JSON.stringify(originalDebug, null, 2))

  await browser.close()
}

debugMusicWrap().catch(console.error)
