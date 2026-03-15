import { ColorInfo } from '../../types/index.js'

export class ColorExtractor {
  private cssContent: string

  constructor(cssContent: string) {
    this.cssContent = cssContent
  }

  extract(): ColorInfo[] {
    const colors: ColorInfo[] = []

    const cssVarColors = this.extractCssVariables()
    colors.push(...cssVarColors)

    if (colors.length === 0) {
      const usedColors = this.extractUsedColors()
      colors.push(...usedColors)
    }

    return colors
  }

  private extractCssVariables(): ColorInfo[] {
    const colors: ColorInfo[] = []
    const rootMatch = this.cssContent.match(/:root\s*\{([^}]+)\}/s)

    if (!rootMatch) return colors

    const rootContent = rootMatch[1]
    const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g
    let match

    while ((match = varRegex.exec(rootContent)) !== null) {
      const [, varName, value] = match
      const trimmedValue = value.trim()

      if (this.isColorValue(trimmedValue)) {
        colors.push({
          variable: `--${varName}`,
          value: trimmedValue,
          label: this.generateColorLabel(varName),
          usage: this.findVariableUsage(`--${varName}`),
        })
      }
    }

    return colors
  }

  private extractUsedColors(): ColorInfo[] {
    const colorMap = new Map<string, { count: number; usage: string[] }>()

    const colorPatterns = [
      /#[0-9a-fA-F]{3,8}\b/g,
      /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,
      /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g,
      /hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)/g,
      /hsla\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)/g,
    ]

    for (const pattern of colorPatterns) {
      let match
      while ((match = pattern.exec(this.cssContent)) !== null) {
        const color = match[0].toLowerCase()

        if (this.isBasicColor(color)) continue

        const existing = colorMap.get(color) || { count: 0, usage: [] }
        existing.count++

        const context = this.getColorContext(match.index)
        if (context && !existing.usage.includes(context)) {
          existing.usage.push(context)
        }

        colorMap.set(color, existing)
      }
    }

    const sorted = Array.from(colorMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)

    return sorted.map(([value, data], index) => ({
      variable: `--color-${index + 1}`,
      value,
      label: this.guessColorLabel(value, data.usage),
      usage: data.usage,
    }))
  }

  private isColorValue(value: string): boolean {
    return (
      /^#[0-9a-fA-F]{3,8}$/.test(value) ||
      /^rgb/.test(value) ||
      /^hsl/.test(value) ||
      /^(transparent|inherit|currentColor)$/i.test(value)
    )
  }

  private isBasicColor(color: string): boolean {
    const basicColors = ['#000', '#000000', '#fff', '#ffffff', 'transparent']
    return basicColors.includes(color.toLowerCase())
  }

  private findVariableUsage(varName: string): string[] {
    const usage: string[] = []
    const varRegex = new RegExp(`var\\(\\s*${varName}\\s*\\)`, 'g')

    const propertyPatterns = [
      { pattern: /background(-color)?/, label: '背景色' },
      { pattern: /color/, label: 'テキスト色' },
      { pattern: /border(-color)?/, label: 'ボーダー色' },
      { pattern: /box-shadow/, label: 'シャドウ' },
      { pattern: /fill|stroke/, label: 'SVG' },
    ]

    let match
    while ((match = varRegex.exec(this.cssContent)) !== null) {
      const context = this.cssContent.slice(Math.max(0, match.index - 50), match.index)
      const lastProperty = context.match(/[\w-]+(?=\s*:)/g)?.pop()

      if (lastProperty) {
        for (const { pattern, label } of propertyPatterns) {
          if (pattern.test(lastProperty) && !usage.includes(label)) {
            usage.push(label)
            break
          }
        }
      }
    }

    return usage
  }

  private getColorContext(index: number): string | null {
    const context = this.cssContent.slice(Math.max(0, index - 50), index)
    const property = context.match(/[\w-]+(?=\s*:)/g)?.pop()

    if (!property) return null

    if (/background/.test(property)) return '背景色'
    if (/^color$/.test(property)) return 'テキスト色'
    if (/border/.test(property)) return 'ボーダー'
    if (/box-shadow/.test(property)) return 'シャドウ'

    return property
  }

  private generateColorLabel(varName: string): string {
    const labelMap: Record<string, string> = {
      primary: 'プライマリカラー',
      secondary: 'セカンダリカラー',
      accent: 'アクセントカラー',
      background: '背景色',
      text: 'テキスト色',
      border: 'ボーダー色',
      success: '成功色',
      error: 'エラー色',
      warning: '警告色',
      info: '情報色',
    }

    for (const [key, label] of Object.entries(labelMap)) {
      if (varName.toLowerCase().includes(key)) {
        return label
      }
    }

    return varName
      .replace(/^color-?/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
  }

  private guessColorLabel(value: string, usage: string[]): string {
    if (usage.length > 0) {
      return usage[0]
    }

    const hex = this.toHex(value)
    if (!hex) return 'カラー'

    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    const lightness = (r + g + b) / 3

    if (lightness > 200) return '明るい色'
    if (lightness < 50) return '暗い色'
    if (r > g && r > b) return '赤系'
    if (g > r && g > b) return '緑系'
    if (b > r && b > g) return '青系'

    return 'カラー'
  }

  private toHex(color: string): string | null {
    if (color.startsWith('#')) {
      if (color.length === 4) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      }
      return color
    }

    const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    return null
  }
}
