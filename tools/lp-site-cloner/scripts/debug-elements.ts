import { chromium } from 'playwright'

const CLONE_URL = 'http://localhost:5555/'

async function debugElements() {
  console.log('Debugging element styles...')

  const browser = await chromium.launch({ headless: false }) // headless: false to see the browser
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  await page.goto(CLONE_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2000)

  // Check NEWS section
  console.log('\n=== NEWS section debug ===')
  const newsDebug = await page.evaluate(() => {
    const newsContent = document.querySelector('.news__content')
    if (!newsContent) return { error: 'news__content not found' }

    const style = window.getComputedStyle(newsContent)
    return {
      exists: true,
      backgroundImage: style.backgroundImage,
      background: style.background,
      width: style.width,
      height: style.height,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      classList: Array.from(newsContent.classList),
    }
  })
  console.log('news__content:', newsDebug)

  // Check MUSIC section
  console.log('\n=== MUSIC section debug ===')
  const musicDebug = await page.evaluate(() => {
    // Check for music__lists:before pseudo element
    const musicLists = document.querySelector('.music__lists')
    if (!musicLists) return { error: 'music__lists not found' }

    const style = window.getComputedStyle(musicLists)
    const beforeStyle = window.getComputedStyle(musicLists, '::before')

    // Check music title decorations
    const musicTitle = document.querySelector('.music__title')
    const sunSpan = document.querySelector('.music__title--sun')

    return {
      musicLists: {
        exists: true,
        maskImage: style.maskImage || style.webkitMaskImage,
        background: style.background,
      },
      beforePseudo: {
        maskImage: beforeStyle.maskImage || beforeStyle.webkitMaskImage,
        background: beforeStyle.background,
        content: beforeStyle.content,
      },
      musicTitle: musicTitle ? {
        exists: true,
        innerHTML: musicTitle.innerHTML.substring(0, 200),
      } : { exists: false },
      sunSpan: sunSpan ? {
        exists: true,
        backgroundImage: window.getComputedStyle(sunSpan).backgroundImage,
        width: window.getComputedStyle(sunSpan).width,
        height: window.getComputedStyle(sunSpan).height,
      } : { exists: false },
    }
  })
  console.log('MUSIC debug:', JSON.stringify(musicDebug, null, 2))

  // Check if images are loading
  console.log('\n=== Checking image loading ===')
  const imageCheck = await page.evaluate(async () => {
    const results: Record<string, string> = {}

    // Check specific images
    const imagesToCheck = [
      '/images/news_frame.png',
      '/images/news_frame.webp',
      '/images/music_line.svg',
      '/images/title_sun.webp',
    ]

    for (const imgPath of imagesToCheck) {
      try {
        const response = await fetch(imgPath, { method: 'HEAD' })
        results[imgPath] = response.ok ? 'OK' : `Error: ${response.status}`
      } catch (e) {
        results[imgPath] = `Fetch error: ${e}`
      }
    }

    return results
  })
  console.log('Image loading:', imageCheck)

  // Wait to observe
  console.log('\nBrowser open for inspection. Press Ctrl+C to close.')
  await page.waitForTimeout(30000) // Keep open for 30 seconds

  await browser.close()
}

debugElements().catch(console.error)
