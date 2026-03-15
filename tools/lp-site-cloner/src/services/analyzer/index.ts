import { StructureAnalyzer } from './structure-analyzer.js'
import { EditableDetector, DetectionOptions } from './editable-detector.js'
import { RepeatDetector, RepeatDetectorOptions } from './repeat-detector.js'
import { ColorExtractor } from './color-extractor.js'
import { AnalysisResult, StylesheetInfo } from '../../types/index.js'

export { StructureAnalyzer } from './structure-analyzer.js'
export { EditableDetector, type DetectionOptions } from './editable-detector.js'
export { RepeatDetector, type RepeatDetectorOptions } from './repeat-detector.js'
export { ColorExtractor } from './color-extractor.js'

export interface AnalyzerOptions {
  editable?: DetectionOptions
  repeat?: RepeatDetectorOptions
}

export class SiteAnalyzer {
  private html: string
  private css: StylesheetInfo[]
  private options: AnalyzerOptions

  constructor(html: string, css: StylesheetInfo[], options?: AnalyzerOptions) {
    this.html = html
    this.css = css
    this.options = options || {}
  }

  analyze(): AnalysisResult {
    const structureAnalyzer = new StructureAnalyzer(this.html)
    const editableDetector = new EditableDetector(this.html, this.options.editable)
    const repeatDetector = new RepeatDetector(this.html, this.options.repeat)

    const cssContent = this.css
      .map((s) => s.content || '')
      .filter(Boolean)
      .join('\n')
    const colorExtractor = new ColorExtractor(cssContent)

    return {
      sections: structureAnalyzer.analyzeSections(),
      editableElements: editableDetector.detect(),
      repeatPatterns: repeatDetector.detect(),
      colorPalette: colorExtractor.extract(),
      animations: [],
      fonts: [],
    }
  }
}
