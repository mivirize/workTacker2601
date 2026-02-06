/**
 * Semantic color constants for use in inline styles
 * These match the CSS variables defined in styles/index.css
 */
export const COLORS = {
  /** Color for idle/inactive states */
  idle: '#d1d5db',

  /** Default color for uncategorized items */
  uncategorized: '#6b7280',

  /** Color for grid lines and borders */
  grid: '#e5e7eb',

  /** Color for productive/active time */
  productive: '#10b981',

  /** Color for muted text */
  textMuted: '#6b7280',

  /** Color for dark text on charts */
  textDark: '#374151',

  /** Color for empty/no-data states */
  empty: '#e5e7eb',
} as const

/**
 * Get category color with fallback to uncategorized
 */
export function getCategoryColor(color: string | undefined | null): string {
  return color ?? COLORS.uncategorized
}

/**
 * Get color based on idle state
 */
export function getActivityColor(
  isIdle: boolean,
  categoryColor: string | undefined | null
): string {
  return isIdle ? COLORS.idle : getCategoryColor(categoryColor)
}
