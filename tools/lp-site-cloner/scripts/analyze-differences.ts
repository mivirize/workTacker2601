import { chromium } from 'playwright'
import * as fs from 'fs/promises'

const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'
const CLONE_PATH = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime/src/index.html'

async function analyzeDifferences() {
  const browser = await chromium.launch({ headless: true })

  // Get original HTML structure for MUSIC section
  console.log('=== Analyzing MUSIC section ===')
  const originalPage = await browser.newPage()
  await originalPage.goto(ORIGINAL_URL, { waitUntil: 'networkidle', timeout: 60000 })

  const originalMusic = await originalPage.evaluate(() => {
    const section = document.querySelector('#music')
    if (!section) return null
    return {
      html: section.outerHTML.substring(0, 2000),
      classes: Array.from(section.querySelectorAll('*')).map(el => el.className).filter(c => c).slice(0, 50),
      images: Array.from(section.querySelectorAll('img')).map(img => img.src),
      svgCount: section.querySelectorAll('svg').length,
    }
  })

  console.log('\nOriginal MUSIC section:')
  console.log('SVG count:', originalMusic?.svgCount)
  console.log('Images:', originalMusic?.images?.slice(0, 5))
  console.log('Key classes:', originalMusic?.classes?.slice(0, 20))

  // Check for animated/dynamic elements
  const originalAnimations = await originalPage.evaluate(() => {
    const musicSection = document.querySelector('#music')
    if (!musicSection) return []

    const animated: string[] = []
    musicSection.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      if (style.animation && style.animation !== 'none') {
        animated.push(`${el.tagName}.${el.className}: ${style.animation}`)
      }
      if (style.transform && style.transform !== 'none') {
        animated.push(`${el.tagName}.${el.className}: transform=${style.transform}`)
      }
    })
    return animated.slice(0, 20)
  })

  console.log('\nAnimated elements:', originalAnimations)

  // Analyze NEWS section
  console.log('\n=== Analyzing NEWS section ===')
  const originalNews = await originalPage.evaluate(() => {
    const section = document.querySelector('#news')
    if (!section) return null
    return {
      html: section.innerHTML.substring(0, 3000),
      svgElements: Array.from(section.querySelectorAll('svg')).map(svg => ({
        class: svg.className?.baseVal || '',
        viewBox: svg.getAttribute('viewBox'),
        pathCount: svg.querySelectorAll('path').length
      })),
      pseudoElements: (() => {
        const elements: string[] = []
        section.querySelectorAll('*').forEach(el => {
          const before = window.getComputedStyle(el, '::before')
          const after = window.getComputedStyle(el, '::after')
          if (before.content && before.content !== 'none' && before.content !== '""') {
            elements.push(`${el.tagName}.${el.className}::before`)
          }
          if (after.content && after.content !== 'none' && after.content !== '""') {
            elements.push(`${el.tagName}.${el.className}::after`)
          }
        })
        return elements.slice(0, 20)
      })()
    }
  })

  console.log('\nOriginal NEWS section:')
  console.log('SVG elements:', originalNews?.svgElements)
  console.log('Pseudo elements:', originalNews?.pseudoElements)

  // Check which CSS files are loaded
  const cssFiles = await originalPage.evaluate(() => {
    return Array.from(document.styleSheets)
      .filter(sheet => sheet.href)
      .map(sheet => sheet.href)
  })
  console.log('\nCSS files loaded:', cssFiles)

  // Check for missing CSS/background images
  console.log('\n=== Checking for background images ===')
  const bgImages = await originalPage.evaluate(() => {
    const images: string[] = []
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        images.push(style.backgroundImage)
      }
      if (style.maskImage && style.maskImage !== 'none') {
        images.push(`mask: ${style.maskImage}`)
      }
    })
    return [...new Set(images)].slice(0, 30)
  })
  console.log('Background/mask images:', bgImages)

  await browser.close()
}

analyzeDifferences().catch(console.error)
