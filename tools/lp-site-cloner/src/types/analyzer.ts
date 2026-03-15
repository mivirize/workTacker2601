export type EditableType = 'text' | 'richtext' | 'image' | 'link' | 'number' | 'icon' | 'counter'

export interface SectionInfo {
  id: string
  tagName: string
  className: string
  order: number
  suggestedLabel: string
  selector: string
  children: SectionInfo[]
}

export interface EditableCandidate {
  selector: string
  type: EditableType
  confidence: number
  currentValue: string
  suggestedId: string
  suggestedLabel: string
  suggestedGroup: string
  suggestedOrder: number
}

export interface RepeatField {
  key: string
  selector: string
  type: EditableType
  sampleValues: string[]
}

export interface RepeatPattern {
  id: string
  containerSelector: string
  itemSelector: string
  itemCount: number
  templateHtml: string
  fields: RepeatField[]
  confidence: number
}

export interface ColorInfo {
  variable: string
  value: string
  label: string
  usage: string[]
}

export interface AnimationInfo {
  selector: string
  type: 'scroll' | 'hover' | 'load' | 'transition'
  library?: string
  properties: string[]
  triggerPoint?: number
}

export interface FontInfo {
  family: string
  weight: string
  style: string
  src?: string
}

export interface AnalysisResult {
  sections: SectionInfo[]
  editableElements: EditableCandidate[]
  repeatPatterns: RepeatPattern[]
  colorPalette: ColorInfo[]
  animations: AnimationInfo[]
  fonts: FontInfo[]
}
