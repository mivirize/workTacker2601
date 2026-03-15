export interface LpColors {
  primary?: string
  secondary?: string
  accent?: string
}

/**
 * Generate CSS custom properties (variables) for LP theming
 */
export function generateColorCssVars(colors: LpColors): Record<string, string> {
  const vars: Record<string, string> = {}

  if (colors.primary) {
    vars['--lp-primary'] = colors.primary
    vars['--lp-primary-rgb'] = hexToRgb(colors.primary)
  }

  if (colors.secondary) {
    vars['--lp-secondary'] = colors.secondary
    vars['--lp-secondary-rgb'] = hexToRgb(colors.secondary)
  }

  if (colors.accent) {
    vars['--lp-accent'] = colors.accent
    vars['--lp-accent-rgb'] = hexToRgb(colors.accent)
  }

  return vars
}

/**
 * Generate inline style object for LP container
 */
export function generateColorStyle(colors: LpColors): React.CSSProperties {
  const vars = generateColorCssVars(colors)
  return vars as React.CSSProperties
}

/**
 * Generate CSS string for LP styles
 */
export function generateColorCss(colors: LpColors): string {
  const vars = generateColorCssVars(colors)
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')
}

/**
 * Convert hex color to RGB values string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0, 0, 0'

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  return `${r}, ${g}, ${b}`
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  const r = Math.min(255, parseInt(result[1], 16) + Math.round(255 * percent / 100))
  const g = Math.min(255, parseInt(result[2], 16) + Math.round(255 * percent / 100))
  const b = Math.min(255, parseInt(result[3], 16) + Math.round(255 * percent / 100))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex

  const r = Math.max(0, parseInt(result[1], 16) - Math.round(255 * percent / 100))
  const g = Math.max(0, parseInt(result[2], 16) - Math.round(255 * percent / 100))
  const b = Math.max(0, parseInt(result[3], 16) - Math.round(255 * percent / 100))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(hex: string): '#000000' | '#FFFFFF' {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '#000000'

  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
