export interface DiffImage {
  viewport: string
  originalPath: string
  generatedPath: string
  diffPath: string
  diffPixels: number
  totalPixels: number
  matchPercentage: number
}

export interface StructureDiff {
  missingElements: string[]
  extraElements: string[]
  modifiedElements: {
    selector: string
    changes: string[]
  }[]
}

export interface ComparisonDetails {
  viewport: string
  matchedPixels: number
  totalPixels: number
  diffPixels: number
  structureDiff: StructureDiff
}

export interface ComparisonResult {
  overallScore: number
  pixelMatchScore: number
  structureScore: number
  animationScore: number
  details: ComparisonDetails[]
  diffImages: DiffImage[]
  report: string
}

export interface ComparisonOptions {
  originalUrl: string
  generatedPath: string
  outputPath?: string
  threshold?: number
  viewports?: string[]
}

export interface ScrollComparisonResult {
  position: number
  matchPercentage: number
  animationMatched: boolean
}
