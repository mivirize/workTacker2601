import * as fs from 'fs/promises'
import * as path from 'path'
import { VisualCompare, VisualCompareOptions } from './visual-compare.js'
import { StructureCompare } from './structure-compare.js'
import { ReportGenerator, ReportData } from './report-generator.js'
import { ComparisonResult, ComparisonOptions } from '../../types/index.js'

export { VisualCompare, type VisualCompareOptions } from './visual-compare.js'
export { StructureCompare } from './structure-compare.js'
export { ReportGenerator, type ReportData } from './report-generator.js'

export class SiteComparer {
  private visualCompare: VisualCompare
  private structureCompare: StructureCompare
  private reportGenerator: ReportGenerator

  constructor(options?: VisualCompareOptions) {
    this.visualCompare = new VisualCompare(options)
    this.structureCompare = new StructureCompare()
    this.reportGenerator = new ReportGenerator()
  }

  async compare(options: ComparisonOptions): Promise<ComparisonResult> {
    const outputDir = options.outputPath || path.join(options.generatedPath, '.lp-editor', 'comparison')
    await fs.mkdir(outputDir, { recursive: true })

    this.visualCompare = new VisualCompare({
      threshold: options.threshold,
      outputDir,
    })

    const visualResult = await this.visualCompare.compare(
      options.originalUrl,
      options.generatedPath
    )

    const generatedHtmlPath = path.join(options.generatedPath, 'src', 'index.html')
    const generatedHtml = await fs.readFile(generatedHtmlPath, 'utf-8')

    const metadataPath = path.join(options.generatedPath, '.lp-editor', 'capture-metadata.json')
    let originalHtml = ''
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'))
      originalHtml = metadata.html || ''
    } catch {
      // No original HTML available
    }

    let structureResult = { score: 50, diff: { missingElements: [], extraElements: [], modifiedElements: [] }, details: { originalElementCount: 0, generatedElementCount: 0, matchedElements: 0, structuralSimilarity: 0.5 } }
    if (originalHtml) {
      structureResult = await this.structureCompare.compare(originalHtml, generatedHtml)
    }

    const animationScore = 50

    const reportData: ReportData = {
      originalUrl: options.originalUrl,
      generatedPath: options.generatedPath,
      timestamp: new Date().toISOString(),
      overallScore: 0,
      pixelMatchScore: visualResult.score,
      structureScore: structureResult.score,
      animationScore,
      details: visualResult.details.map((d) => ({
        ...d,
        structureDiff: structureResult.diff,
      })),
      diffImages: visualResult.diffImages,
    }

    const reportPath = await this.reportGenerator.generateReport(reportData, outputDir)

    const result = this.reportGenerator.createComparisonResult(
      visualResult.score,
      structureResult.score,
      animationScore,
      reportData.details,
      visualResult.diffImages,
      reportPath
    )

    reportData.overallScore = result.overallScore
    await fs.writeFile(
      path.join(outputDir, 'comparison-data.json'),
      JSON.stringify(reportData, null, 2),
      'utf-8'
    )

    return result
  }
}
