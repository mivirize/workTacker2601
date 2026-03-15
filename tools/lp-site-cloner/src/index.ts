export * from './types/index.js'

export { PageCapture, BrowserManager, AssetDownloader, ScrollRecorder } from './services/capture/index.js'

export {
  SiteAnalyzer,
  StructureAnalyzer,
  EditableDetector,
  RepeatDetector,
  ColorExtractor,
} from './services/analyzer/index.js'

export {
  LpProjectGenerator,
  HtmlMarker,
  ConfigBuilder,
} from './services/generator/index.js'

export {
  SiteComparer,
  VisualCompare,
  StructureCompare,
  ReportGenerator,
} from './services/comparison/index.js'

export async function cloneSite(
  url: string,
  outputPath: string,
  options?: {
    projectName?: string
    clientName?: string
    scrollCapture?: boolean
  }
): Promise<{
  projectPath: string
  config: import('./types/index.js').LpProjectConfig
}> {
  const { PageCapture } = await import('./services/capture/index.js')
  const { LpProjectGenerator } = await import('./services/generator/index.js')

  const projectName = options?.projectName || extractProjectName(url)
  const fullOutputPath = `${outputPath}/${projectName}`

  const capture = new PageCapture()
  const captureResult = await capture.capture({
    url,
    fullPage: true,
    scrollCapture: options?.scrollCapture ?? false,
    outputDir: fullOutputPath,
  })

  const generator = new LpProjectGenerator({
    outputPath: fullOutputPath,
    projectName,
    clientName: options?.clientName,
  })

  const result = await generator.generate(captureResult)

  return {
    projectPath: result.projectPath,
    config: result.config,
  }
}

export async function compareSites(
  originalUrl: string,
  generatedPath: string,
  options?: {
    outputPath?: string
    threshold?: number
  }
): Promise<import('./types/index.js').ComparisonResult> {
  const { SiteComparer } = await import('./services/comparison/index.js')

  const comparer = new SiteComparer({
    threshold: options?.threshold,
  })

  return comparer.compare({
    originalUrl,
    generatedPath,
    outputPath: options?.outputPath,
    threshold: options?.threshold,
  })
}

function extractProjectName(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
      .replace(/^www\./, '')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
  } catch {
    return 'cloned-site'
  }
}
