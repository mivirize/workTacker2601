/**
 * Pattern Library
 *
 * Stores and retrieves design patterns extracted from analyzed sites.
 * Used as a reference for LP-Editor site creation.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { SiteAnalysis } from '../analyzer/site-analyzer'

const LIBRARY_DIR = 'c:/Users/owner/Dev/tools/lp-site-cloner/pattern-library'
const GLOBAL_REFERENCE_PATH = 'c:/Users/owner/Dev/.claude/rules/lp-site-patterns.md'

export interface Pattern {
  id: string
  name: string
  category: 'animation' | 'component' | 'effect' | 'layout' | 'color' | 'typography'
  source: string // URL of the site it was extracted from
  extractedAt: string
  code: string
  preview?: string // Base64 screenshot
  tags: string[]
  usage: string
}

export interface PatternLibrary {
  version: string
  updatedAt: string
  patterns: Pattern[]
  sites: SiteReference[]
}

export interface SiteReference {
  url: string
  name: string
  analyzedAt: string
  thumbnail?: string
  tags: string[]
  highlights: string[]
}

export async function initLibrary(): Promise<PatternLibrary> {
  const libraryPath = path.join(LIBRARY_DIR, 'library.json')

  try {
    const content = await fs.readFile(libraryPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    // Create new library
    const library: PatternLibrary = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      patterns: [],
      sites: [],
    }

    await fs.mkdir(LIBRARY_DIR, { recursive: true })
    await fs.writeFile(libraryPath, JSON.stringify(library, null, 2))

    return library
  }
}

export async function saveLibrary(library: PatternLibrary): Promise<void> {
  const libraryPath = path.join(LIBRARY_DIR, 'library.json')
  library.updatedAt = new Date().toISOString()
  await fs.writeFile(libraryPath, JSON.stringify(library, null, 2))
}

export async function addSiteToLibrary(analysis: SiteAnalysis): Promise<void> {
  const library = await initLibrary()

  // Add site reference
  const siteRef: SiteReference = {
    url: analysis.meta.url,
    name: analysis.meta.title,
    analyzedAt: analysis.meta.analyzedAt,
    tags: [
      ...analysis.technologies.libraries,
      ...analysis.technologies.frameworks,
    ],
    highlights: [
      `${analysis.animations.cssKeyframes.length} animations`,
      `${analysis.components.sliders.length} sliders`,
      `${analysis.effects.masks.length} masks`,
    ],
  }

  // Check if site already exists
  const existingIndex = library.sites.findIndex(s => s.url === siteRef.url)
  if (existingIndex >= 0) {
    library.sites[existingIndex] = siteRef
  } else {
    library.sites.push(siteRef)
  }

  // Extract patterns from analysis
  const patterns = extractPatterns(analysis)

  for (const pattern of patterns) {
    const existingPatternIndex = library.patterns.findIndex(p => p.id === pattern.id)
    if (existingPatternIndex >= 0) {
      library.patterns[existingPatternIndex] = pattern
    } else {
      library.patterns.push(pattern)
    }
  }

  await saveLibrary(library)

  // Update global reference for LP-Editor
  await updateGlobalReference(library)

  console.log(`Added ${patterns.length} patterns from ${analysis.meta.title}`)
}

function extractPatterns(analysis: SiteAnalysis): Pattern[] {
  const patterns: Pattern[] = []
  const sourceUrl = analysis.meta.url
  const timestamp = analysis.meta.analyzedAt

  // Extract animation patterns
  for (const anim of analysis.animations.cssKeyframes) {
    const keyframeCode = anim.keyframes
      .map(kf => `  ${kf.key} { ${kf.style} }`)
      .join('\n')

    patterns.push({
      id: `anim-${anim.name}-${hashCode(sourceUrl)}`,
      name: anim.name,
      category: 'animation',
      source: sourceUrl,
      extractedAt: timestamp,
      code: `@keyframes ${anim.name} {\n${keyframeCode}\n}`,
      tags: categorizeAnimation(anim.name),
      usage: `animation: ${anim.name} 1s ease infinite;`,
    })
  }

  // Extract gradient patterns
  for (const gradient of analysis.effects.gradients) {
    patterns.push({
      id: `gradient-${hashCode(gradient.gradient)}`,
      name: `${gradient.type} gradient`,
      category: 'effect',
      source: sourceUrl,
      extractedAt: timestamp,
      code: `background: ${gradient.gradient};`,
      tags: ['gradient', gradient.type],
      usage: `Apply to any element for gradient background`,
    })
  }

  // Extract mask patterns
  for (const mask of analysis.effects.masks) {
    patterns.push({
      id: `mask-${hashCode(mask.maskImage)}`,
      name: `${mask.purpose} mask`,
      category: 'effect',
      source: sourceUrl,
      extractedAt: timestamp,
      code: `-webkit-mask: ${mask.maskImage};\nmask: ${mask.maskImage};`,
      tags: ['mask', mask.purpose],
      usage: 'Apply mask to create shaped elements',
    })
  }

  // Extract slider patterns
  for (const slider of analysis.components.sliders) {
    patterns.push({
      id: `slider-${slider.library}-${slider.effect}`,
      name: `${slider.library} ${slider.effect} slider`,
      category: 'component',
      source: sourceUrl,
      extractedAt: timestamp,
      code: generateSliderCode(slider),
      tags: ['slider', slider.library, slider.effect],
      usage: `${slider.slideCount} slides with ${slider.effect} effect`,
    })
  }

  // Extract color palettes
  if (analysis.styles.colors.length >= 3) {
    patterns.push({
      id: `colors-${hashCode(analysis.styles.colors.join(','))}`,
      name: `Color palette from ${new URL(sourceUrl).hostname}`,
      category: 'color',
      source: sourceUrl,
      extractedAt: timestamp,
      code: analysis.styles.colors
        .slice(0, 10)
        .map((c, i) => `--color-${i + 1}: ${c};`)
        .join('\n'),
      tags: ['color', 'palette'],
      usage: 'CSS custom properties for color scheme',
    })
  }

  // Extract typography patterns
  patterns.push({
    id: `typography-${hashCode(sourceUrl)}`,
    name: `Typography from ${new URL(sourceUrl).hostname}`,
    category: 'typography',
    source: sourceUrl,
    extractedAt: timestamp,
    code: Object.entries(analysis.styles.typography.sizes)
      .map(([tag, style]) =>
        `${tag.toLowerCase()} {\n  font-size: ${style.fontSize};\n  line-height: ${style.lineHeight};\n  letter-spacing: ${style.letterSpacing};\n}`
      )
      .join('\n\n'),
    tags: ['typography', ...analysis.styles.typography.fonts],
    usage: 'Typography styles for headings and text',
  })

  return patterns
}

function categorizeAnimation(name: string): string[] {
  const tags: string[] = ['animation']

  const keywords: Record<string, string[]> = {
    'fade': ['fade', 'opacity'],
    'slide': ['slide', 'move', 'translate'],
    'rotate': ['rotate', 'spin', 'turn'],
    'scale': ['scale', 'zoom', 'grow'],
    'float': ['float', 'hover', 'levitate'],
    'bounce': ['bounce', 'jump'],
    'pulse': ['pulse', 'beat'],
    'shake': ['shake', 'vibrate'],
  }

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(w => name.toLowerCase().includes(w))) {
      tags.push(category)
    }
  }

  return tags
}

function generateSliderCode(slider: any): string {
  if (slider.library === 'swiper') {
    return `new Swiper('.${slider.selector.split('.')[1]}', {
  effect: '${slider.effect}',
  slidesPerView: 1,
  ${slider.autoplay ? 'autoplay: { delay: 5000 },' : ''}
  ${slider.navigation ? 'navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },' : ''}
  ${slider.pagination ? 'pagination: { el: ".swiper-pagination", clickable: true },' : ''}
});`
  }

  return `// ${slider.library} slider configuration`
}

function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).substring(0, 8)
}

// Search patterns
export async function searchPatterns(
  query: string,
  category?: Pattern['category']
): Promise<Pattern[]> {
  const library = await initLibrary()

  return library.patterns.filter(p => {
    const matchesCategory = !category || p.category === category
    const matchesQuery = !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))

    return matchesCategory && matchesQuery
  })
}

// Get patterns by category
export async function getPatternsByCategory(
  category: Pattern['category']
): Promise<Pattern[]> {
  const library = await initLibrary()
  return library.patterns.filter(p => p.category === category)
}

// Update global reference file for LP-Editor
export async function updateGlobalReference(library: PatternLibrary): Promise<void> {
  try {
    let content = await fs.readFile(GLOBAL_REFERENCE_PATH, 'utf-8')

    // Update sites section
    const sitesContent = generateSitesSection(library.sites)
    content = replaceSection(content, 'SITES', sitesContent)

    // Update animations section
    const animPatterns = library.patterns.filter(p => p.category === 'animation')
    const animContent = generateAnimationsSection(animPatterns)
    content = replaceSection(content, 'ANIMATIONS', animContent)

    // Update sliders section
    const sliderPatterns = library.patterns.filter(p => p.category === 'component' && p.tags.includes('slider'))
    const sliderContent = generateSlidersSection(sliderPatterns)
    content = replaceSection(content, 'SLIDERS', sliderContent)

    // Update effects section
    const effectPatterns = library.patterns.filter(p => p.category === 'effect')
    const effectContent = generateEffectsSection(effectPatterns)
    content = replaceSection(content, 'EFFECTS', effectContent)

    // Update colors section
    const colorPatterns = library.patterns.filter(p => p.category === 'color')
    const colorContent = generateColorsSection(colorPatterns)
    content = replaceSection(content, 'COLORS', colorContent)

    // Update typography section
    const typoPatterns = library.patterns.filter(p => p.category === 'typography')
    const typoContent = generateTypographySection(typoPatterns)
    content = replaceSection(content, 'TYPOGRAPHY', typoContent)

    await fs.writeFile(GLOBAL_REFERENCE_PATH, content)
    console.log(`Updated global reference: ${GLOBAL_REFERENCE_PATH}`)
  } catch (error) {
    console.error('Failed to update global reference:', error)
  }
}

function replaceSection(content: string, sectionName: string, newContent: string): string {
  const startMarker = `<!-- ${sectionName}_START -->`
  const endMarker = `<!-- ${sectionName}_END -->`
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g')
  return content.replace(regex, `${startMarker}\n${newContent}\n${endMarker}`)
}

function generateSitesSection(sites: SiteReference[]): string {
  if (sites.length === 0) return '*まだ分析済みサイトはありません*'

  let md = `| サイト名 | URL | 特徴 | 技術 |\n`
  md += `|----------|-----|------|------|\n`

  for (const site of sites) {
    const hostname = new URL(site.url).hostname
    md += `| ${site.name.substring(0, 30)} | [${hostname}](${site.url}) | ${site.highlights.slice(0, 2).join(', ')} | ${site.tags.slice(0, 3).join(', ')} |\n`
  }

  return md
}

function generateAnimationsSection(patterns: Pattern[]): string {
  if (patterns.length === 0) return '*まだアニメーションパターンはありません*'

  // Group by tags for better organization
  const categories: Record<string, Pattern[]> = {
    'float/hover': [],
    'rotate/spin': [],
    'fade/opacity': [],
    'slide/translate': [],
    'scale/zoom': [],
    'other': [],
  }

  for (const p of patterns) {
    if (p.tags.includes('float')) categories['float/hover'].push(p)
    else if (p.tags.includes('rotate')) categories['rotate/spin'].push(p)
    else if (p.tags.includes('fade')) categories['fade/opacity'].push(p)
    else if (p.tags.includes('slide')) categories['slide/translate'].push(p)
    else if (p.tags.includes('scale')) categories['scale/zoom'].push(p)
    else categories['other'].push(p)
  }

  let md = ''

  for (const [category, items] of Object.entries(categories)) {
    if (items.length === 0) continue

    md += `### ${category} (${items.length})\n\n`

    for (const p of items.slice(0, 5)) { // Limit to 5 per category
      const hostname = new URL(p.source).hostname
      md += `**${p.name}** (from ${hostname})\n`
      md += `\`\`\`css\n${p.code}\n\`\`\`\n`
      md += `使用例: \`${p.usage}\`\n\n`
    }
  }

  return md
}

function generateSlidersSection(patterns: Pattern[]): string {
  if (patterns.length === 0) return '*まだスライダーパターンはありません*'

  let md = ''

  for (const p of patterns) {
    const hostname = new URL(p.source).hostname
    md += `### ${p.name} (from ${hostname})\n\n`
    md += `\`\`\`javascript\n${p.code}\n\`\`\`\n`
    md += `${p.usage}\n\n`
  }

  return md
}

function generateEffectsSection(patterns: Pattern[]): string {
  if (patterns.length === 0) return '*まだエフェクトパターンはありません*'

  const gradients = patterns.filter(p => p.tags.includes('gradient'))
  const masks = patterns.filter(p => p.tags.includes('mask'))

  let md = ''

  if (gradients.length > 0) {
    md += `### グラデーション\n\n`
    for (const p of gradients.slice(0, 5)) {
      md += `\`\`\`css\n${p.code}\n\`\`\`\n\n`
    }
  }

  if (masks.length > 0) {
    md += `### マスク効果\n\n`
    for (const p of masks.slice(0, 5)) {
      md += `**${p.name}**\n`
      md += `\`\`\`css\n${p.code}\n\`\`\`\n\n`
    }
  }

  return md
}

function generateColorsSection(patterns: Pattern[]): string {
  if (patterns.length === 0) return '*まだカラーパレットはありません*'

  let md = ''

  for (const p of patterns) {
    const hostname = new URL(p.source).hostname
    md += `### ${hostname}\n\n`
    md += `\`\`\`css\n:root {\n  ${p.code.split('\n').join('\n  ')}\n}\n\`\`\`\n\n`
  }

  return md
}

function generateTypographySection(patterns: Pattern[]): string {
  if (patterns.length === 0) return '*まだタイポグラフィ設定はありません*'

  let md = ''

  for (const p of patterns) {
    const hostname = new URL(p.source).hostname
    md += `### ${hostname}\n\n`
    md += `フォント: ${p.tags.filter(t => t !== 'typography').join(', ')}\n\n`
    md += `\`\`\`css\n${p.code}\n\`\`\`\n\n`
  }

  return md
}

// Export patterns to markdown
export async function exportPatternsToMarkdown(): Promise<string> {
  const library = await initLibrary()

  let md = `# LP Design Pattern Library\n\n`
  md += `> Updated: ${library.updatedAt}\n`
  md += `> Total patterns: ${library.patterns.length}\n`
  md += `> Sites analyzed: ${library.sites.length}\n\n`

  // Group by category
  const categories = ['animation', 'component', 'effect', 'layout', 'color', 'typography'] as const

  for (const category of categories) {
    const patterns = library.patterns.filter(p => p.category === category)
    if (patterns.length === 0) continue

    md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}s (${patterns.length})\n\n`

    for (const pattern of patterns) {
      md += `### ${pattern.name}\n`
      md += `Source: ${pattern.source}\n`
      md += `Tags: ${pattern.tags.join(', ')}\n\n`
      md += `\`\`\`css\n${pattern.code}\n\`\`\`\n\n`
      md += `Usage: ${pattern.usage}\n\n`
      md += `---\n\n`
    }
  }

  // Sites reference
  md += `## Analyzed Sites\n\n`
  for (const site of library.sites) {
    md += `### ${site.name}\n`
    md += `- URL: ${site.url}\n`
    md += `- Analyzed: ${site.analyzedAt}\n`
    md += `- Highlights: ${site.highlights.join(', ')}\n`
    md += `- Tags: ${site.tags.join(', ')}\n\n`
  }

  return md
}
