import {
  LpProjectConfig,
  GroupConfig,
  RepeatBlockConfig,
  AnalysisResult,
  EditableCandidate,
  RepeatPattern,
  ColorInfo,
} from '../../types/index.js'

export interface ConfigBuilderOptions {
  projectName: string
  clientName?: string
  version?: string
}

export class ConfigBuilder {
  private options: ConfigBuilderOptions

  constructor(options: ConfigBuilderOptions) {
    this.options = options
  }

  build(analysis: AnalysisResult): LpProjectConfig {
    const groups = this.buildGroups(analysis.editableElements)
    const colors = this.buildColors(analysis.colorPalette)
    const repeatBlocks = this.buildRepeatBlocks(analysis.repeatPatterns)

    const sanitizedName = this.options.projectName
      .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, '')
      .trim()

    const fileName = this.options.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    return {
      name: sanitizedName,
      client: this.options.clientName || 'Unknown',
      version: this.options.version || '1.0.0',
      entry: 'src/index.html',
      output: {
        appName: sanitizedName,
        fileName,
      },
      groups,
      colors: Object.keys(colors).length > 0 ? colors : undefined,
      repeatBlocks: Object.keys(repeatBlocks).length > 0 ? repeatBlocks : undefined,
    }
  }

  private buildGroups(candidates: EditableCandidate[]): Record<string, GroupConfig> {
    const groups: Record<string, GroupConfig> = {}
    const groupSet = new Set<string>()

    for (const candidate of candidates) {
      if (candidate.suggestedGroup && !groupSet.has(candidate.suggestedGroup)) {
        groupSet.add(candidate.suggestedGroup)
      }
    }

    const sortedGroups = Array.from(groupSet).sort()

    sortedGroups.forEach((groupId, index) => {
      const label = this.formatGroupLabel(groupId)
      groups[groupId] = {
        label,
        order: index + 1,
      }
    })

    return groups
  }

  private buildColors(palette: ColorInfo[]): Record<string, { value: string; label: string }> {
    const colors: Record<string, { value: string; label: string }> = {}

    for (const color of palette) {
      const key = color.variable.replace(/^--/, '')
      colors[key] = {
        value: color.value,
        label: color.label,
      }
    }

    return colors
  }

  private buildRepeatBlocks(patterns: RepeatPattern[]): Record<string, RepeatBlockConfig> {
    const blocks: Record<string, RepeatBlockConfig> = {}

    for (const pattern of patterns) {
      const fields: Record<string, { type: string; label: string }> = {}

      for (const field of pattern.fields) {
        fields[field.key] = {
          type: field.type,
          label: this.formatFieldLabel(field.key),
        }
      }

      blocks[pattern.id] = {
        label: this.formatBlockLabel(pattern.id),
        min: 1,
        max: Math.max(pattern.itemCount * 2, 10),
        fields,
      }
    }

    return blocks
  }

  private formatGroupLabel(groupId: string): string {
    const parts = groupId.split('-')
    if (parts.length > 1) {
      return parts.slice(1).join(' ')
    }
    return groupId
  }

  private formatBlockLabel(id: string): string {
    return id
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private formatFieldLabel(key: string): string {
    const labelMap: Record<string, string> = {
      'image': '画像',
      'img': '画像',
      'title': 'タイトル',
      'name': '名前',
      'text': 'テキスト',
      'desc': '説明',
      'description': '説明',
      'price': '価格',
      'date': '日付',
      'link': 'リンク',
      'url': 'URL',
      'button': 'ボタン',
      'btn': 'ボタン',
      'h1': '大見出し',
      'h2': '見出し',
      'h3': '小見出し',
      'p': 'テキスト',
      'span': 'テキスト',
      'a': 'リンク',
    }

    const lowerKey = key.toLowerCase()

    for (const [pattern, label] of Object.entries(labelMap)) {
      if (lowerKey.includes(pattern)) {
        return label
      }
    }

    return key
      .replace(/[-_]/g, ' ')
      .replace(/(\d+)$/, '')
      .trim() || 'フィールド'
  }
}
