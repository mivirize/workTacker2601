/**
 * Full Flow Test Script
 *
 * Tests the complete site cloning and pattern extraction workflow.
 */

import { analyzeSite } from '../src/analyzer/site-analyzer'
import { addSiteToLibrary, exportPatternsToMarkdown, initLibrary } from '../src/reference/pattern-library'
import * as fs from 'fs/promises'
import * as path from 'path'

const TEST_URL = 'https://www.cho-kaguyahime.com/'
const OUTPUT_DIR = 'c:/Users/owner/Dev/tools/lp-projects/cho-kaguyahime'

async function runFullFlowTest() {
  console.log('═'.repeat(60))
  console.log('🧪 Full Flow Test')
  console.log('═'.repeat(60))

  // Step 1: Analyze site
  console.log('\n[1/4] Analyzing site...')
  const analysis = await analyzeSite(TEST_URL)

  console.log(`  ✓ Title: ${analysis.meta.title}`)
  console.log(`  ✓ Sections: ${analysis.structure.sections.length}`)
  console.log(`  ✓ Animations: ${analysis.animations.cssKeyframes.length}`)
  console.log(`  ✓ Sliders: ${analysis.components.sliders.length}`)
  console.log(`  ✓ Masks: ${analysis.effects.masks.length}`)
  console.log(`  ✓ Libraries: ${analysis.technologies.libraries.join(', ')}`)

  // Step 2: Save analysis to project
  console.log('\n[2/4] Saving analysis to project...')
  const lpEditorDir = path.join(OUTPUT_DIR, '.lp-editor')
  await fs.mkdir(lpEditorDir, { recursive: true })

  await fs.writeFile(
    path.join(lpEditorDir, 'site-analysis.json'),
    JSON.stringify(analysis, null, 2)
  )

  // Generate reference markdown
  const refMd = generateProjectReference(analysis)
  await fs.writeFile(path.join(lpEditorDir, 'REFERENCE.md'), refMd)

  console.log(`  ✓ Saved: .lp-editor/site-analysis.json`)
  console.log(`  ✓ Saved: .lp-editor/REFERENCE.md`)

  // Step 3: Add to pattern library
  console.log('\n[3/4] Adding patterns to library...')
  await addSiteToLibrary(analysis)

  const library = await initLibrary()
  console.log(`  ✓ Library now has ${library.patterns.length} patterns`)
  console.log(`  ✓ Library now has ${library.sites.length} sites`)

  // Step 4: Export pattern library
  console.log('\n[4/4] Exporting pattern library...')
  const libraryMd = await exportPatternsToMarkdown()
  await fs.writeFile(
    'c:/Users/owner/Dev/tools/lp-site-cloner/pattern-library/PATTERNS.md',
    libraryMd
  )

  console.log(`  ✓ Exported: pattern-library/PATTERNS.md`)

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('✅ Full Flow Test Complete!')
  console.log('═'.repeat(60))

  console.log('\n📁 Created files:')
  console.log(`  ${OUTPUT_DIR}/.lp-editor/site-analysis.json`)
  console.log(`  ${OUTPUT_DIR}/.lp-editor/REFERENCE.md`)
  console.log(`  c:/Users/owner/Dev/tools/lp-site-cloner/pattern-library/library.json`)
  console.log(`  c:/Users/owner/Dev/tools/lp-site-cloner/pattern-library/PATTERNS.md`)

  console.log('\n📊 Pattern Summary:')
  const categories = ['animation', 'component', 'effect', 'color', 'typography']
  for (const cat of categories) {
    const count = library.patterns.filter(p => p.category === cat).length
    console.log(`  ${cat}: ${count}`)
  }

  return { analysis, library }
}

function generateProjectReference(analysis: any): string {
  let md = `# ${analysis.meta.title} - サイト分析リファレンス\n\n`
  md += `> 分析日時: ${analysis.meta.analyzedAt}\n`
  md += `> 元URL: ${analysis.meta.url}\n\n`

  // Quick Stats
  md += `## 概要\n\n`
  md += `| 項目 | 数 |\n`
  md += `|------|----|\n`
  md += `| セクション | ${analysis.structure.sections.length} |\n`
  md += `| CSSアニメーション | ${analysis.animations.cssKeyframes.length} |\n`
  md += `| スライダー | ${analysis.components.sliders.length} |\n`
  md += `| モーダル | ${analysis.components.modals.length} |\n`
  md += `| マスク効果 | ${analysis.effects.masks.length} |\n`
  md += `| グラデーション | ${analysis.effects.gradients.length} |\n\n`

  // Page Structure
  md += `## ページ構成\n\n`
  md += `| ID | クラス | 高さ | アニメーション |\n`
  md += `|----|--------|------|---------------|\n`
  for (const section of analysis.structure.sections.slice(0, 20)) {
    md += `| ${section.id || '-'} | ${section.classes.slice(0, 2).join(' ')} | ${Math.round(section.position.height)}px | ${section.hasAnimation ? '✓' : '-'} |\n`
  }

  // Navigation
  md += `\n## ナビゲーション\n\n`
  md += `- タイプ: ${analysis.structure.navigation.type}\n`
  md += `- ハンバーガーメニュー: ${analysis.structure.navigation.hasHamburger ? 'あり' : 'なし'}\n`
  md += `- スムーススクロール: ${analysis.structure.navigation.hasSmoothScroll ? 'あり' : 'なし'}\n\n`

  // Animations
  md += `## アニメーション一覧\n\n`
  for (const anim of analysis.animations.cssKeyframes.slice(0, 20)) {
    md += `### \`${anim.name}\`\n\`\`\`css\n@keyframes ${anim.name} {\n`
    for (const kf of anim.keyframes.slice(0, 3)) {
      md += `  ${kf.key} { ${kf.style.substring(0, 100)}${kf.style.length > 100 ? '...' : ''} }\n`
    }
    md += `}\n\`\`\`\n\n`
  }

  // Sliders
  md += `## スライダー\n\n`
  for (const slider of analysis.components.sliders) {
    md += `### ${slider.selector.split('.')[1] || 'Slider'}\n`
    md += `- ライブラリ: ${slider.library}\n`
    md += `- エフェクト: ${slider.effect}\n`
    md += `- スライド数: ${slider.slideCount}\n`
    md += `- 自動再生: ${slider.autoplay ? 'あり' : 'なし'}\n`
    md += `- ナビゲーション: ${slider.navigation ? 'あり' : 'なし'}\n\n`
  }

  // Effects
  md += `## 特殊効果\n\n`

  if (analysis.effects.gradients.length > 0) {
    md += `### グラデーション\n`
    for (const g of analysis.effects.gradients.slice(0, 5)) {
      md += `- \`${g.selector}\`: ${g.type}\n`
    }
    md += '\n'
  }

  if (analysis.effects.masks.length > 0) {
    md += `### マスク\n`
    for (const m of analysis.effects.masks.slice(0, 5)) {
      md += `- \`${m.selector}\`: ${m.purpose} (${m.maskImage.substring(0, 50)}...)\n`
    }
    md += '\n'
  }

  if (analysis.effects.filters.length > 0) {
    md += `### フィルター\n`
    for (const f of analysis.effects.filters.slice(0, 5)) {
      md += `- \`${f.selector}\`: ${f.filter}\n`
    }
    md += '\n'
  }

  // Technologies
  md += `## 使用技術\n\n`
  md += `### ライブラリ\n`
  for (const lib of analysis.technologies.libraries) {
    md += `- ${lib}\n`
  }
  md += '\n'

  // Colors
  md += `## カラーパレット\n\n`
  md += `\`\`\`css\n:root {\n`
  analysis.styles.colors.slice(0, 10).forEach((c: string, i: number) => {
    md += `  --color-${i + 1}: ${c};\n`
  })
  md += `}\n\`\`\`\n\n`

  // Typography
  md += `## タイポグラフィ\n\n`
  md += `フォント: ${analysis.styles.typography.fonts.join(', ')}\n\n`
  md += `| 要素 | サイズ | 行間 | 字間 |\n`
  md += `|------|--------|------|------|\n`
  for (const [tag, style] of Object.entries(analysis.styles.typography.sizes) as any) {
    md += `| ${tag} | ${style.fontSize} | ${style.lineHeight} | ${style.letterSpacing} |\n`
  }

  return md
}

runFullFlowTest().catch(console.error)
