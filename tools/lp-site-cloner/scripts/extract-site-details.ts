import { chromium } from 'playwright'
import * as fs from 'fs/promises'

const ORIGINAL_URL = 'https://www.cho-kaguyahime.com/'
const OUTPUT_FILE = 'c:/Users/owner/Dev/tools/lp-site-cloner/site-analysis.json'

async function extractSiteDetails() {
  console.log('Extracting detailed site information...')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  await page.goto(ORIGINAL_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(5000)

  const analysis: any = {}

  // 1. ページ構成（セクション）
  console.log('\n=== 1. ページ構成 ===')
  analysis.sections = await page.evaluate(() => {
    const sections: any[] = []
    document.querySelectorAll('section, [id]').forEach(el => {
      if (el.id || el.tagName === 'SECTION') {
        const rect = el.getBoundingClientRect()
        sections.push({
          id: el.id || null,
          tag: el.tagName,
          classes: Array.from(el.classList).slice(0, 5),
          position: { top: rect.top + window.scrollY, height: rect.height },
        })
      }
    })
    return sections.filter(s => s.id).slice(0, 20)
  })

  // 2. アニメーション定義（CSS）
  console.log('\n=== 2. CSSアニメーション ===')
  analysis.cssAnimations = await page.evaluate(() => {
    const animations: any[] = []
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSKeyframesRule) {
            animations.push({
              name: rule.name,
              keyframes: Array.from(rule.cssRules).map(kf => ({
                keyText: (kf as CSSKeyframeRule).keyText,
                style: (kf as CSSKeyframeRule).style.cssText.substring(0, 200)
              })).slice(0, 5)
            })
          }
        }
      } catch (e) {
        // Cross-origin stylesheets
      }
    }
    return animations.slice(0, 30)
  })

  // 3. アニメーション適用要素
  console.log('\n=== 3. アニメーション適用要素 ===')
  analysis.animatedElements = await page.evaluate(() => {
    const elements: any[] = []
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      if (style.animation && style.animation !== 'none') {
        elements.push({
          selector: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          animation: style.animation,
          animationName: style.animationName,
          animationDuration: style.animationDuration,
          animationDelay: style.animationDelay,
        })
      }
      if (style.transition && style.transition !== 'all 0s ease 0s' && style.transition !== 'none') {
        elements.push({
          selector: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          transition: style.transition,
        })
      }
    })
    return elements.slice(0, 50)
  })

  // 4. スクロールトリガーアニメーション検出
  console.log('\n=== 4. スクロールトリガー ===')
  analysis.scrollTriggers = await page.evaluate(() => {
    const triggers: any[] = []

    // data属性でスクロールアニメーションを検出
    document.querySelectorAll('[data-scroll], [data-aos], [data-animate], .js-scroll, .js-animate, .scroll-animate, .inview').forEach(el => {
      triggers.push({
        selector: el.tagName + '.' + Array.from(el.classList).join('.'),
        dataAttributes: Array.from(el.attributes)
          .filter(a => a.name.startsWith('data-'))
          .map(a => ({ name: a.name, value: a.value }))
      })
    })

    // IntersectionObserver対象の要素（クラス名から推測）
    document.querySelectorAll('.fade-in, .slide-in, .scale-in, .js-inview, .is-inview, .animated').forEach(el => {
      triggers.push({
        selector: el.tagName + '.' + Array.from(el.classList).join('.'),
        type: 'inview-animation'
      })
    })

    return triggers.slice(0, 30)
  })

  // 5. ホバーエフェクト
  console.log('\n=== 5. ホバーエフェクト ===')
  analysis.hoverEffects = await page.evaluate(() => {
    const effects: any[] = []

    // リンク、ボタン、画像のホバー
    document.querySelectorAll('a, button, .hover-effect, img').forEach(el => {
      const style = window.getComputedStyle(el)
      if (style.transition && style.transition !== 'all 0s ease 0s') {
        effects.push({
          element: el.tagName + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          transition: style.transition,
          cursor: style.cursor,
        })
      }
    })

    return [...new Map(effects.map(e => [e.element, e])).values()].slice(0, 20)
  })

  // 6. パララックス要素
  console.log('\n=== 6. パララックス ===')
  analysis.parallax = await page.evaluate(() => {
    const parallax: any[] = []

    document.querySelectorAll('[data-parallax], [data-speed], .parallax, .rellax').forEach(el => {
      parallax.push({
        selector: el.tagName + '.' + Array.from(el.classList).join('.'),
        attributes: Array.from(el.attributes)
          .filter(a => a.name.startsWith('data-'))
          .map(a => ({ name: a.name, value: a.value }))
      })
    })

    return parallax
  })

  // 7. Swiper/カルーセル
  console.log('\n=== 7. スライダー/カルーセル ===')
  analysis.sliders = await page.evaluate(() => {
    const sliders: any[] = []

    document.querySelectorAll('.swiper, .swiper-container, .slick-slider, .owl-carousel').forEach(el => {
      const wrapper = el.querySelector('.swiper-wrapper, .slick-track')
      const slides = el.querySelectorAll('.swiper-slide, .slick-slide')

      sliders.push({
        selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
        slideCount: slides.length,
        hasNavigation: !!el.querySelector('.swiper-button-next, .slick-next'),
        hasPagination: !!el.querySelector('.swiper-pagination, .slick-dots'),
        autoplay: el.getAttribute('data-autoplay') || 'unknown',
      })
    })

    return sliders
  })

  // 8. モーダル/ポップアップ
  console.log('\n=== 8. モーダル/ポップアップ ===')
  analysis.modals = await page.evaluate(() => {
    const modals: any[] = []

    document.querySelectorAll('.modal, .popup, .lightbox, [data-modal], [data-popup], .fancybox, .magnific-popup').forEach(el => {
      modals.push({
        selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
        trigger: el.getAttribute('data-target') || el.getAttribute('href'),
      })
    })

    // YouTube埋め込みモーダル
    document.querySelectorAll('[data-youtube], .js-moviePlay, [data-video]').forEach(el => {
      modals.push({
        type: 'video-modal',
        selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
        videoId: el.getAttribute('data-youtube') || el.getAttribute('data-video-id'),
      })
    })

    return modals
  })

  // 9. 背景エフェクト
  console.log('\n=== 9. 背景エフェクト ===')
  analysis.backgroundEffects = await page.evaluate(() => {
    const effects: any[] = []

    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)

      // グラデーション
      if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
        effects.push({
          type: 'gradient',
          selector: el.tagName + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          gradient: style.backgroundImage.substring(0, 150),
        })
      }

      // filter/backdrop-filter
      if (style.filter && style.filter !== 'none') {
        effects.push({
          type: 'filter',
          selector: el.tagName + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          filter: style.filter,
        })
      }
      if (style.backdropFilter && style.backdropFilter !== 'none') {
        effects.push({
          type: 'backdrop-filter',
          selector: el.tagName + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          backdropFilter: style.backdropFilter,
        })
      }

      // mask
      const mask = style.maskImage || (style as any).webkitMaskImage
      if (mask && mask !== 'none') {
        effects.push({
          type: 'mask',
          selector: el.tagName + (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
          mask: mask.substring(0, 100),
        })
      }
    })

    return effects.slice(0, 30)
  })

  // 10. 特殊なビジュアル要素
  console.log('\n=== 10. 特殊ビジュアル要素 ===')
  analysis.specialVisuals = await page.evaluate(() => {
    const visuals: any[] = []

    // Canvas要素
    document.querySelectorAll('canvas').forEach(el => {
      visuals.push({
        type: 'canvas',
        id: el.id,
        size: { width: el.width, height: el.height },
      })
    })

    // SVGアニメーション
    document.querySelectorAll('svg animate, svg animateTransform, svg animateMotion').forEach(el => {
      visuals.push({
        type: 'svg-animation',
        attributeName: el.getAttribute('attributeName'),
        dur: el.getAttribute('dur'),
        repeatCount: el.getAttribute('repeatCount'),
      })
    })

    // Video要素
    document.querySelectorAll('video').forEach(el => {
      visuals.push({
        type: 'video',
        autoplay: el.autoplay,
        loop: el.loop,
        muted: el.muted,
        src: el.src || el.querySelector('source')?.src,
      })
    })

    // Lottie/アニメーションJSON
    document.querySelectorAll('[data-lottie], .lottie, lottie-player').forEach(el => {
      visuals.push({
        type: 'lottie',
        selector: el.tagName + '.' + Array.from(el.classList).join('.'),
      })
    })

    return visuals
  })

  // 11. ナビゲーション
  console.log('\n=== 11. ナビゲーション ===')
  analysis.navigation = await page.evaluate(() => {
    const nav: any = {}

    // グローバルナビ
    const gnav = document.querySelector('.gnav, nav, header nav')
    if (gnav) {
      nav.global = {
        type: 'header-nav',
        items: Array.from(gnav.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim().substring(0, 30),
          href: a.getAttribute('href'),
        })).slice(0, 15),
        isSticky: window.getComputedStyle(gnav).position === 'fixed' ||
                  window.getComputedStyle(gnav).position === 'sticky',
      }
    }

    // ハンバーガーメニュー
    const hamburger = document.querySelector('.hamburger, .menu-toggle, .js-menu, [class*="menuBtn"]')
    if (hamburger) {
      nav.hamburgerMenu = {
        exists: true,
        selector: hamburger.tagName + '.' + Array.from(hamburger.classList).join('.'),
      }
    }

    // スムーススクロール
    const anchorLinks = document.querySelectorAll('a[href^="#"], .js-anchor')
    nav.smoothScroll = {
      count: anchorLinks.length,
      targets: Array.from(anchorLinks).slice(0, 10).map(a => a.getAttribute('href')),
    }

    return nav
  })

  // 12. フォーム要素
  console.log('\n=== 12. フォーム ===')
  analysis.forms = await page.evaluate(() => {
    const forms: any[] = []

    document.querySelectorAll('form, .form').forEach(form => {
      forms.push({
        action: form.getAttribute('action'),
        method: form.getAttribute('method'),
        fields: Array.from(form.querySelectorAll('input, textarea, select')).map(f => ({
          type: f.getAttribute('type') || f.tagName.toLowerCase(),
          name: f.getAttribute('name'),
          placeholder: f.getAttribute('placeholder'),
        })).slice(0, 10),
      })
    })

    return forms
  })

  // 13. JavaScript検出
  console.log('\n=== 13. 使用ライブラリ ===')
  analysis.libraries = await page.evaluate(() => {
    const libs: string[] = []

    if ((window as any).jQuery) libs.push('jQuery ' + (window as any).jQuery.fn.jquery)
    if ((window as any).Swiper) libs.push('Swiper')
    if ((window as any).gsap || (window as any).TweenMax) libs.push('GSAP')
    if ((window as any).ScrollTrigger) libs.push('GSAP ScrollTrigger')
    if ((window as any).anime) libs.push('Anime.js')
    if ((window as any).AOS) libs.push('AOS')
    if ((window as any).Rellax) libs.push('Rellax')
    if ((window as any).lottie) libs.push('Lottie')
    if ((window as any).particlesJS) libs.push('Particles.js')
    if ((window as any).THREE) libs.push('Three.js')
    if ((window as any).PIXI) libs.push('PixiJS')

    return libs
  })

  // 14. カラーパレット
  console.log('\n=== 14. カラーパレット ===')
  analysis.colors = await page.evaluate(() => {
    const colors = new Set<string>()

    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el)
      const color = style.color
      const bg = style.backgroundColor

      if (color && color !== 'rgba(0, 0, 0, 0)') colors.add(color)
      if (bg && bg !== 'rgba(0, 0, 0, 0)') colors.add(bg)
    })

    return Array.from(colors).slice(0, 20)
  })

  // 15. タイポグラフィ
  console.log('\n=== 15. タイポグラフィ ===')
  analysis.typography = await page.evaluate(() => {
    const fonts = new Set<string>()
    const sizes: any = {}

    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, span').forEach(el => {
      const style = window.getComputedStyle(el)
      fonts.add(style.fontFamily.split(',')[0].trim())

      const tag = el.tagName
      if (!sizes[tag]) {
        sizes[tag] = {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
        }
      }
    })

    return {
      fonts: Array.from(fonts).slice(0, 10),
      sizes,
    }
  })

  // Save analysis
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(analysis, null, 2), 'utf-8')
  console.log(`\nAnalysis saved to: ${OUTPUT_FILE}`)

  await browser.close()

  return analysis
}

extractSiteDetails().then(analysis => {
  console.log('\n========================================')
  console.log('SITE ANALYSIS SUMMARY')
  console.log('========================================')
  console.log('\n【ページ構成】')
  analysis.sections?.forEach((s: any) => console.log(`  - #${s.id}: ${s.classes.join(' ')}`))

  console.log('\n【CSSアニメーション数】:', analysis.cssAnimations?.length)
  analysis.cssAnimations?.slice(0, 10).forEach((a: any) => console.log(`  - ${a.name}`))

  console.log('\n【スライダー】:')
  analysis.sliders?.forEach((s: any) => console.log(`  - ${s.selector} (${s.slideCount} slides)`))

  console.log('\n【使用ライブラリ】:')
  analysis.libraries?.forEach((l: string) => console.log(`  - ${l}`))

  console.log('\n【特殊効果】:')
  analysis.backgroundEffects?.slice(0, 10).forEach((e: any) => console.log(`  - ${e.type}: ${e.selector}`))

}).catch(console.error)
