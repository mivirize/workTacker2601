/**
 * Site Analyzer
 *
 * Comprehensive website analysis tool that extracts:
 * - Page structure
 * - Animations & interactions
 * - Visual effects
 * - Assets
 * - Technologies
 */

import { chromium, Browser, Page } from 'playwright'
import * as path from 'path'

export interface SiteAnalysis {
  meta: {
    url: string
    title: string
    description: string
    analyzedAt: string
    totalHeight: number
    viewport: { width: number; height: number }
  }
  structure: {
    sections: SectionInfo[]
    navigation: NavigationInfo
    forms: FormInfo[]
  }
  animations: {
    cssKeyframes: CSSKeyframeInfo[]
    animatedElements: AnimatedElementInfo[]
    scrollTriggers: ScrollTriggerInfo[]
  }
  effects: {
    gradients: GradientInfo[]
    masks: MaskInfo[]
    filters: FilterInfo[]
    parallax: ParallaxInfo[]
  }
  components: {
    sliders: SliderInfo[]
    modals: ModalInfo[]
    videoPlayers: VideoPlayerInfo[]
  }
  assets: {
    images: AssetInfo[]
    fonts: FontInfo[]
    svgs: AssetInfo[]
    videos: AssetInfo[]
  }
  technologies: {
    libraries: string[]
    frameworks: string[]
    analytics: string[]
  }
  styles: {
    colors: string[]
    typography: TypographyInfo
    spacing: SpacingInfo
  }
}

interface SectionInfo {
  id: string | null
  tag: string
  classes: string[]
  position: { top: number; height: number }
  hasAnimation: boolean
}

interface NavigationInfo {
  type: 'sticky' | 'fixed' | 'static'
  items: { text: string; href: string }[]
  hasHamburger: boolean
  hasSmoothScroll: boolean
}

interface FormInfo {
  action: string | null
  method: string | null
  fields: { type: string; name: string | null; placeholder: string | null }[]
}

interface CSSKeyframeInfo {
  name: string
  keyframes: { key: string; style: string }[]
  usage: string[]
}

interface AnimatedElementInfo {
  selector: string
  animation: string
  duration: string
  timing: string
  iterationCount: string
}

interface ScrollTriggerInfo {
  selector: string
  type: 'inview' | 'parallax' | 'reveal'
  dataAttributes: Record<string, string>
}

interface GradientInfo {
  selector: string
  gradient: string
  type: 'linear' | 'radial' | 'conic'
}

interface MaskInfo {
  selector: string
  maskImage: string
  maskSize: string
  purpose: string
}

interface FilterInfo {
  selector: string
  filter: string
  type: 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'other'
}

interface ParallaxInfo {
  selector: string
  speed: number | null
  direction: 'vertical' | 'horizontal'
}

interface SliderInfo {
  selector: string
  library: 'swiper' | 'slick' | 'owl' | 'custom'
  slideCount: number
  effect: string
  autoplay: boolean
  navigation: boolean
  pagination: boolean
}

interface ModalInfo {
  selector: string
  type: 'video' | 'image' | 'content'
  trigger: string | null
}

interface VideoPlayerInfo {
  type: 'youtube' | 'vimeo' | 'html5'
  id: string | null
  autoplay: boolean
}

interface AssetInfo {
  url: string
  filename: string
  type: string
  size?: number
}

interface FontInfo {
  family: string
  source: 'google' | 'typekit' | 'custom' | 'system'
  weights: string[]
}

interface TypographyInfo {
  fonts: string[]
  sizes: Record<string, { fontSize: string; lineHeight: string; letterSpacing: string }>
}

interface SpacingInfo {
  containerWidth: string
  sectionPadding: string
  gridGap: string
}

export class SiteAnalyzer {
  private browser: Browser | null = null
  private page: Page | null = null

  async init() {
    this.browser = await chromium.launch({ headless: true })
    this.page = await this.browser.newPage({ viewport: { width: 1920, height: 1080 } })
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async analyze(url: string): Promise<SiteAnalysis> {
    if (!this.page) throw new Error('Analyzer not initialized')

    console.log(`Analyzing: ${url}`)

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    await this.page.waitForTimeout(3000)

    // Scroll to trigger lazy loading
    await this.triggerLazyLoad()

    const analysis: SiteAnalysis = {
      meta: await this.extractMeta(url),
      structure: await this.extractStructure(),
      animations: await this.extractAnimations(),
      effects: await this.extractEffects(),
      components: await this.extractComponents(),
      assets: await this.extractAssets(url),
      technologies: await this.extractTechnologies(),
      styles: await this.extractStyles(),
    }

    return analysis
  }

  private async triggerLazyLoad() {
    if (!this.page) return

    await this.page.evaluate(async () => {
      for (let i = 0; i < 20; i++) {
        window.scrollBy(0, window.innerHeight)
        await new Promise(r => setTimeout(r, 200))
      }
      window.scrollTo(0, 0)
    })
    await this.page.waitForTimeout(1000)
  }

  private async extractMeta(url: string): Promise<SiteAnalysis['meta']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate((pageUrl) => {
      return {
        url: pageUrl,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        analyzedAt: new Date().toISOString(),
        totalHeight: document.documentElement.scrollHeight,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }
    }, url)
  }

  private async extractStructure(): Promise<SiteAnalysis['structure']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate(() => {
      // Sections
      const sections: SectionInfo[] = []
      document.querySelectorAll('section, [id]').forEach(el => {
        if (el.id || el.tagName === 'SECTION') {
          const rect = el.getBoundingClientRect()
          const style = window.getComputedStyle(el)
          sections.push({
            id: el.id || null,
            tag: el.tagName,
            classes: Array.from(el.classList).slice(0, 5),
            position: { top: rect.top + window.scrollY, height: rect.height },
            hasAnimation: style.animation !== 'none' || style.transition !== 'all 0s ease 0s',
          })
        }
      })

      // Navigation
      const nav = document.querySelector('.gnav, nav, header nav, .header')
      const navStyle = nav ? window.getComputedStyle(nav) : null
      const navigation: NavigationInfo = {
        type: navStyle?.position === 'fixed' ? 'fixed' :
              navStyle?.position === 'sticky' ? 'sticky' : 'static',
        items: Array.from(document.querySelectorAll('nav a, .gnav a')).map(a => ({
          text: a.textContent?.trim().substring(0, 30) || '',
          href: a.getAttribute('href') || '',
        })).slice(0, 20),
        hasHamburger: !!document.querySelector('.hamburger, .menu-toggle, [class*="menuBtn"], .js-menu'),
        hasSmoothScroll: document.querySelectorAll('a[href^="#"], .js-anchor').length > 0,
      }

      // Forms
      const forms: FormInfo[] = []
      document.querySelectorAll('form').forEach(form => {
        forms.push({
          action: form.getAttribute('action'),
          method: form.getAttribute('method'),
          fields: Array.from(form.querySelectorAll('input, textarea, select')).map(f => ({
            type: f.getAttribute('type') || f.tagName.toLowerCase(),
            name: f.getAttribute('name'),
            placeholder: f.getAttribute('placeholder'),
          })),
        })
      })

      return { sections: sections.filter(s => s.id).slice(0, 30), navigation, forms }
    })
  }

  private async extractAnimations(): Promise<SiteAnalysis['animations']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate(() => {
      // CSS Keyframes
      const cssKeyframes: CSSKeyframeInfo[] = []
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSKeyframesRule) {
              cssKeyframes.push({
                name: rule.name,
                keyframes: Array.from(rule.cssRules).map(kf => ({
                  key: (kf as CSSKeyframeRule).keyText,
                  style: (kf as CSSKeyframeRule).style.cssText.substring(0, 200),
                })).slice(0, 5),
                usage: [],
              })
            }
          }
        } catch (e) {
          // Cross-origin stylesheets
        }
      }

      // Animated elements
      const animatedElements: AnimatedElementInfo[] = []
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el)
        if (style.animationName && style.animationName !== 'none') {
          animatedElements.push({
            selector: el.tagName + (el.id ? `#${el.id}` : '') +
                     (el.className ? `.${el.className.toString().split(' ')[0]}` : ''),
            animation: style.animationName,
            duration: style.animationDuration,
            timing: style.animationTimingFunction,
            iterationCount: style.animationIterationCount,
          })
        }
      })

      // Scroll triggers
      const scrollTriggers: ScrollTriggerInfo[] = []
      document.querySelectorAll('[data-scroll], [data-aos], [data-animate], .js-scroll, .inview').forEach(el => {
        const dataAttrs: Record<string, string> = {}
        Array.from(el.attributes).forEach(a => {
          if (a.name.startsWith('data-')) {
            dataAttrs[a.name] = a.value
          }
        })
        scrollTriggers.push({
          selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
          type: 'inview',
          dataAttributes: dataAttrs,
        })
      })

      return {
        cssKeyframes: cssKeyframes.slice(0, 30),
        animatedElements: animatedElements.slice(0, 50),
        scrollTriggers: scrollTriggers.slice(0, 30),
      }
    })
  }

  private async extractEffects(): Promise<SiteAnalysis['effects']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate(() => {
      const gradients: GradientInfo[] = []
      const masks: MaskInfo[] = []
      const filters: FilterInfo[] = []
      const parallax: ParallaxInfo[] = []

      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el)
        const selector = el.tagName + (el.className ? `.${el.className.toString().split(' ')[0]}` : '')

        // Gradients
        if (style.backgroundImage?.includes('gradient')) {
          const type = style.backgroundImage.includes('linear') ? 'linear' :
                      style.backgroundImage.includes('radial') ? 'radial' : 'conic'
          gradients.push({
            selector,
            gradient: style.backgroundImage.substring(0, 200),
            type,
          })
        }

        // Masks
        const maskImage = style.maskImage || (style as any).webkitMaskImage
        if (maskImage && maskImage !== 'none') {
          masks.push({
            selector,
            maskImage: maskImage.substring(0, 100),
            maskSize: style.maskSize || (style as any).webkitMaskSize || '',
            purpose: maskImage.includes('svg') ? 'decorative' : 'shape',
          })
        }

        // Filters
        if (style.filter && style.filter !== 'none') {
          const type = style.filter.includes('blur') ? 'blur' :
                      style.filter.includes('brightness') ? 'brightness' : 'other'
          filters.push({ selector, filter: style.filter, type })
        }
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          filters.push({ selector, filter: `backdrop: ${style.backdropFilter}`, type: 'blur' })
        }
      })

      // Parallax elements
      document.querySelectorAll('[data-parallax], [data-speed], [data-rellax-speed], .parallax').forEach(el => {
        parallax.push({
          selector: el.tagName + '.' + Array.from(el.classList).join('.'),
          speed: parseFloat(el.getAttribute('data-speed') || el.getAttribute('data-rellax-speed') || '0') || null,
          direction: 'vertical',
        })
      })

      return {
        gradients: gradients.slice(0, 20),
        masks: masks.slice(0, 20),
        filters: filters.slice(0, 20),
        parallax,
      }
    })
  }

  private async extractComponents(): Promise<SiteAnalysis['components']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate(() => {
      // Sliders
      const sliders: SliderInfo[] = []
      document.querySelectorAll('.swiper, .slick-slider, .owl-carousel').forEach(el => {
        const isSwiper = el.classList.contains('swiper')
        const isSlick = el.classList.contains('slick-slider')

        sliders.push({
          selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
          library: isSwiper ? 'swiper' : isSlick ? 'slick' : 'owl',
          slideCount: el.querySelectorAll('.swiper-slide, .slick-slide').length,
          effect: el.classList.contains('swiper-fade') ? 'fade' :
                 el.classList.contains('swiper-coverflow') ? 'coverflow' : 'slide',
          autoplay: el.hasAttribute('data-autoplay') || el.classList.contains('swiper-autoplay'),
          navigation: !!el.querySelector('.swiper-button-next, .slick-next'),
          pagination: !!el.querySelector('.swiper-pagination, .slick-dots'),
        })
      })

      // Modals
      const modals: ModalInfo[] = []
      document.querySelectorAll('.modal, [data-modal], .lightbox, .fancybox').forEach(el => {
        modals.push({
          selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
          type: 'content',
          trigger: el.getAttribute('data-target'),
        })
      })

      // Video modals
      document.querySelectorAll('.js-moviePlay, [data-youtube], [data-video]').forEach(el => {
        modals.push({
          selector: el.tagName + '.' + Array.from(el.classList).slice(0, 3).join('.'),
          type: 'video',
          trigger: el.getAttribute('data-youtube') || el.getAttribute('data-video'),
        })
      })

      // Video players
      const videoPlayers: VideoPlayerInfo[] = []
      document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], video').forEach(el => {
        const src = el.getAttribute('src') || ''
        videoPlayers.push({
          type: src.includes('youtube') ? 'youtube' :
               src.includes('vimeo') ? 'vimeo' : 'html5',
          id: src.match(/(?:youtube\.com\/embed\/|vimeo\.com\/)([^?&]+)/)?.[1] || null,
          autoplay: src.includes('autoplay') || (el as HTMLVideoElement).autoplay,
        })
      })

      return { sliders, modals: modals.slice(0, 30), videoPlayers }
    })
  }

  private async extractAssets(baseUrl: string): Promise<SiteAnalysis['assets']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate((base) => {
      const images: AssetInfo[] = []
      const svgs: AssetInfo[] = []
      const videos: AssetInfo[] = []

      // Images
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset.src
        if (src && !src.startsWith('data:')) {
          const isSvg = src.endsWith('.svg')
          const list = isSvg ? svgs : images
          list.push({
            url: src,
            filename: src.split('/').pop()?.split('?')[0] || '',
            type: isSvg ? 'svg' : src.split('.').pop()?.split('?')[0] || 'unknown',
          })
        }
      })

      // Background images
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el)
        const bgImage = style.backgroundImage
        if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
          const matches = bgImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)
          for (const match of matches) {
            const url = match[1]
            if (!url.startsWith('data:')) {
              const isSvg = url.endsWith('.svg')
              const list = isSvg ? svgs : images
              list.push({
                url,
                filename: url.split('/').pop()?.split('?')[0] || '',
                type: isSvg ? 'svg' : url.split('.').pop()?.split('?')[0] || 'unknown',
              })
            }
          }
        }
      })

      // Videos
      document.querySelectorAll('video source, video[src]').forEach(el => {
        const src = el.getAttribute('src')
        if (src) {
          videos.push({
            url: src,
            filename: src.split('/').pop()?.split('?')[0] || '',
            type: src.split('.').pop()?.split('?')[0] || 'video',
          })
        }
      })

      // Fonts
      const fonts: FontInfo[] = []
      const fontFamilies = new Set<string>()
      document.querySelectorAll('*').forEach(el => {
        const family = window.getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/["']/g, '')
        fontFamilies.add(family)
      })

      fontFamilies.forEach(family => {
        const source = family.includes('vdl') || family.includes('adobe') ? 'typekit' :
                      family.includes('sans-serif') || family.includes('serif') ? 'system' : 'custom'
        fonts.push({ family, source, weights: ['400'] })
      })

      return {
        images: [...new Map(images.map(i => [i.url, i])).values()].slice(0, 100),
        fonts: fonts.slice(0, 10),
        svgs: [...new Map(svgs.map(s => [s.url, s])).values()].slice(0, 50),
        videos,
      }
    }, baseUrl)
  }

  private async extractTechnologies(): Promise<SiteAnalysis['technologies']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate(() => {
      const libraries: string[] = []
      const frameworks: string[] = []
      const analytics: string[] = []

      // Libraries
      if ((window as any).jQuery) libraries.push(`jQuery ${(window as any).jQuery.fn.jquery}`)
      if ((window as any).Swiper) libraries.push('Swiper')
      if ((window as any).gsap || (window as any).TweenMax) libraries.push('GSAP')
      if ((window as any).ScrollTrigger) libraries.push('GSAP ScrollTrigger')
      if ((window as any).anime) libraries.push('Anime.js')
      if ((window as any).AOS) libraries.push('AOS')
      if ((window as any).Rellax) libraries.push('Rellax')
      if ((window as any).lottie) libraries.push('Lottie')
      if ((window as any).THREE) libraries.push('Three.js')
      if ((window as any).PIXI) libraries.push('PixiJS')
      if ((window as any).particlesJS) libraries.push('Particles.js')
      if ((window as any).Vue) frameworks.push('Vue.js')
      if ((window as any).React) frameworks.push('React')
      if ((window as any).angular) frameworks.push('Angular')

      // Analytics
      if ((window as any).ga || (window as any).gtag) analytics.push('Google Analytics')
      if ((window as any).fbq) analytics.push('Facebook Pixel')
      if (document.querySelector('script[src*="gtm"]')) analytics.push('Google Tag Manager')

      return { libraries, frameworks, analytics }
    })
  }

  private async extractStyles(): Promise<SiteAnalysis['styles']> {
    if (!this.page) throw new Error('Page not initialized')

    return await this.page.evaluate(() => {
      const colors = new Set<string>()
      const fonts = new Set<string>()
      const sizes: Record<string, any> = {}

      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el)

        // Colors
        const color = style.color
        const bg = style.backgroundColor
        if (color && color !== 'rgba(0, 0, 0, 0)') colors.add(color)
        if (bg && bg !== 'rgba(0, 0, 0, 0)') colors.add(bg)

        // Fonts
        fonts.add(style.fontFamily.split(',')[0].trim())

        // Typography sizes
        const tag = el.tagName
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'].includes(tag) && !sizes[tag]) {
          sizes[tag] = {
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
          }
        }
      })

      // Container/spacing
      const container = document.querySelector('.container, .wrapper, main')
      const containerStyle = container ? window.getComputedStyle(container) : null

      return {
        colors: Array.from(colors).slice(0, 20),
        typography: {
          fonts: Array.from(fonts).slice(0, 10),
          sizes,
        },
        spacing: {
          containerWidth: containerStyle?.maxWidth || 'auto',
          sectionPadding: containerStyle?.padding || '0',
          gridGap: '16px',
        },
      }
    })
  }
}

export async function analyzeSite(url: string): Promise<SiteAnalysis> {
  const analyzer = new SiteAnalyzer()
  await analyzer.init()

  try {
    return await analyzer.analyze(url)
  } finally {
    await analyzer.close()
  }
}
