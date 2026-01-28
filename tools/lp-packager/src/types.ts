/**
 * LP-CMS Packager Type Definitions
 */

// Marker Types
export type MarkerType =
  | 'text'
  | 'richtext'
  | 'image'
  | 'link'
  | 'background-image'

// Editable Marker
export interface EditableMarker {
  id: string
  type: MarkerType
  label?: string
  group?: string
  placeholder?: string
  element: string
  line: number
  column: number
  currentValue: string | null
  attributes: Record<string, string>
}

// Image Marker Options
export interface ImageMarkerOptions {
  recommendedSize?: string
  maxSize?: string
  accept?: string[]
}

// Link Marker Options
export interface LinkMarkerOptions {
  textEditable?: boolean
  allowExternal?: boolean
}

// Repeat Block
export interface RepeatBlock {
  id: string
  min: number
  max: number
  items: RepeatItem[]
  line: number
}

export interface RepeatItem {
  index: number
  markers: EditableMarker[]
}

// Color Config
export interface ColorConfig {
  variable: string
  value: string
  label?: string
  description?: string
}

// Validation
export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationMessage {
  severity: ValidationSeverity
  line: number
  column: number
  message: string
  markerId?: string
  rule: string
}

// Parse Result
export interface ParseResult {
  markers: EditableMarker[]
  repeatBlocks: RepeatBlock[]
  colors: ColorConfig[]
  validations: ValidationMessage[]
}

// LP Config
export interface LpConfig {
  name: string
  client: string
  version: string
  entry: string
  output: {
    appName: string
    fileName: string
  }
  editables?: Record<string, EditableConfig>
  repeatBlocks?: Record<string, RepeatBlockConfig>
  colors?: Record<string, ColorConfigInput>
  groups?: Record<string, GroupConfig>
}

export interface EditableConfig {
  type: MarkerType
  label?: string
  group?: string
  recommendedSize?: string
}

export interface RepeatBlockConfig {
  label: string
  min?: number
  max?: number
  fields: Record<string, EditableConfig>
}

export interface ColorConfigInput {
  value: string
  label?: string
  description?: string
}

export interface GroupConfig {
  label: string
  order?: number
}

// CLI Options
export interface ValidateOptions {
  verbose?: boolean
  format?: 'text' | 'json'
}

export interface BuildOptions {
  client?: string
  output?: string
  includeSource?: boolean
  editorPath?: string
}

export interface InitOptions {
  template?: 'basic' | 'full'
}
