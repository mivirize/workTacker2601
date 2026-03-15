import * as fs from 'fs/promises'
import * as path from 'path'
import { ComparisonResult, DiffImage, ComparisonDetails } from '../../types/index.js'

export interface ReportData {
  originalUrl: string
  generatedPath: string
  timestamp: string
  overallScore: number
  pixelMatchScore: number
  structureScore: number
  animationScore: number
  details: ComparisonDetails[]
  diffImages: DiffImage[]
}

export class ReportGenerator {
  async generateReport(data: ReportData, outputPath: string): Promise<string> {
    const reportContent = this.createMarkdownReport(data)

    const reportPath = path.join(outputPath, 'comparison-report.md')
    await fs.writeFile(reportPath, reportContent, 'utf-8')

    const jsonPath = path.join(outputPath, 'comparison-data.json')
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8')

    return reportPath
  }

  private createMarkdownReport(data: ReportData): string {
    const scoreEmoji = (score: number): string => {
      if (score >= 90) return '🟢'
      if (score >= 70) return '🟡'
      if (score >= 50) return '🟠'
      return '🔴'
    }

    const report = `# 再現度比較レポート

## 概要

| 項目 | 値 |
|------|-----|
| オリジナルURL | ${data.originalUrl} |
| 生成パス | ${data.generatedPath} |
| 比較日時 | ${data.timestamp} |

## スコアサマリー

| 評価項目 | スコア | 判定 |
|---------|--------|------|
| **総合スコア** | **${data.overallScore.toFixed(1)}%** | ${scoreEmoji(data.overallScore)} |
| ピクセル一致率 | ${data.pixelMatchScore.toFixed(1)}% | ${scoreEmoji(data.pixelMatchScore)} |
| 構造一致率 | ${data.structureScore.toFixed(1)}% | ${scoreEmoji(data.structureScore)} |
| アニメーション | ${data.animationScore.toFixed(1)}% | ${scoreEmoji(data.animationScore)} |

## 判定基準

- 🟢 90%以上: 優秀（ほぼ完全な再現）
- 🟡 70-89%: 良好（軽微な差異あり）
- 🟠 50-69%: 要改善（目立つ差異あり）
- 🔴 50%未満: 大幅な修正が必要

## ビューポート別詳細

${data.details.map((d) => `
### ${d.viewport}

| 項目 | 値 |
|------|-----|
| 一致ピクセル | ${d.matchedPixels.toLocaleString()} |
| 総ピクセル | ${d.totalPixels.toLocaleString()} |
| 差異ピクセル | ${d.diffPixels.toLocaleString()} |
| 一致率 | ${(((d.totalPixels - d.diffPixels) / d.totalPixels) * 100).toFixed(2)}% |

${d.structureDiff.missingElements.length > 0 ? `
#### 欠落している要素
${d.structureDiff.missingElements.map((e) => `- \`${e}\``).join('\n')}
` : ''}

${d.structureDiff.extraElements.length > 0 ? `
#### 追加された要素
${d.structureDiff.extraElements.map((e) => `- \`${e}\``).join('\n')}
` : ''}

${d.structureDiff.modifiedElements.length > 0 ? `
#### 変更された要素
${d.structureDiff.modifiedElements.map((m) => `- \`${m.selector}\`: ${m.changes.join(', ')}`).join('\n')}
` : ''}
`).join('\n')}

## 差分画像

${data.diffImages.map((img) => `
### ${img.viewport}

| 画像タイプ | パス |
|-----------|------|
| オリジナル | \`${img.originalPath}\` |
| 生成版 | \`${img.generatedPath}\` |
| 差分 | \`${img.diffPath}\` |

**一致率**: ${img.matchPercentage.toFixed(2)}%
`).join('\n')}

## 改善提案

${this.generateSuggestions(data)}

---

*このレポートは lp-site-cloner によって自動生成されました。*
`

    return report
  }

  private generateSuggestions(data: ReportData): string {
    const suggestions: string[] = []

    if (data.pixelMatchScore < 70) {
      suggestions.push('- **レイアウト調整**: CSSのmargin/paddingや幅の設定を確認してください')
      suggestions.push('- **フォント**: 使用フォントが正しくロードされているか確認してください')
      suggestions.push('- **画像**: 画像パスが正しく設定されているか確認してください')
    }

    if (data.structureScore < 70) {
      suggestions.push('- **DOM構造**: 元サイトのHTML構造との差異を確認してください')
      suggestions.push('- **セクション**: 主要セクションが全て含まれているか確認してください')
    }

    for (const detail of data.details) {
      if (detail.structureDiff.missingElements.length > 5) {
        suggestions.push(`- **${detail.viewport}**: ${detail.structureDiff.missingElements.length}個の要素が欠落しています`)
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('- 再現度は良好です。細部の微調整を行うことでさらに向上できます。')
    }

    return suggestions.join('\n')
  }

  createComparisonResult(
    pixelScore: number,
    structureScore: number,
    animationScore: number,
    details: ComparisonDetails[],
    diffImages: DiffImage[],
    reportPath: string
  ): ComparisonResult {
    const weights = { pixel: 0.5, structure: 0.3, animation: 0.2 }
    const overallScore =
      pixelScore * weights.pixel +
      structureScore * weights.structure +
      animationScore * weights.animation

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      pixelMatchScore: pixelScore,
      structureScore,
      animationScore,
      details,
      diffImages,
      report: reportPath,
    }
  }
}
