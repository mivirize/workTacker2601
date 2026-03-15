export interface GroupConfig {
  label: string
  order: number
}

export interface RepeatBlockFieldConfig {
  type: string
  label: string
}

export interface RepeatBlockConfig {
  label: string
  min: number
  max: number
  fields: Record<string, RepeatBlockFieldConfig>
}

export interface LpProjectConfig {
  name: string
  client: string
  version: string
  entry: string
  output?: {
    appName: string
    fileName: string
  }
  groups: Record<string, GroupConfig>
  colors?: Record<string, { value: string; label: string }>
  repeatBlocks?: Record<string, RepeatBlockConfig>
}

export interface MarkerConfig {
  idPrefix: string
  groupPrefix: string
  labelLanguage: 'ja' | 'en'
}

export interface GeneratedFile {
  path: string
  content: string | Buffer
  type: 'html' | 'css' | 'js' | 'image' | 'json' | 'other'
}

export interface GeneratorOptions {
  outputPath: string
  projectName: string
  clientName?: string
  markerConfig?: Partial<MarkerConfig>
}

export interface GeneratorResult {
  projectPath: string
  config: LpProjectConfig
  files: GeneratedFile[]
}
