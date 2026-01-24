/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}秒`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours === 0) {
    if (secs === 0) {
      return `${minutes}分`
    }
    return `${minutes}分${secs}秒`
  }

  if (minutes === 0 && secs === 0) {
    return `${hours}時間`
  }

  if (secs === 0) {
    return `${hours}時間${minutes}分`
  }

  return `${hours}時間${minutes}分${secs}秒`
}

/**
 * Format duration in seconds to HH:MM:SS format
 */
export function formatDurationHMS(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':')
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 3)}...`
}

/**
 * Get contrast color (black or white) based on background color
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}
