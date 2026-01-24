import { describe, it, expect } from 'vitest'
import {
  formatDuration,
  formatDurationHMS,
  formatPercentage,
  formatBytes,
  truncate,
  getContrastColor,
} from '../../src/renderer/utils/format'

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(30)).toBe('30秒')
    expect(formatDuration(59)).toBe('59秒')
  })

  it('formats minutes correctly', () => {
    expect(formatDuration(60)).toBe('1分')
    expect(formatDuration(120)).toBe('2分')
    expect(formatDuration(150)).toBe('2分30秒')
  })

  it('formats hours correctly', () => {
    expect(formatDuration(3600)).toBe('1時間')
    expect(formatDuration(7200)).toBe('2時間')
  })

  it('formats hours and minutes correctly', () => {
    expect(formatDuration(3660)).toBe('1時間1分')
    expect(formatDuration(5400)).toBe('1時間30分')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0秒')
  })
})

describe('formatDurationHMS', () => {
  it('formats as HH:MM:SS', () => {
    expect(formatDurationHMS(0)).toBe('00:00:00')
    expect(formatDurationHMS(30)).toBe('00:00:30')
    expect(formatDurationHMS(90)).toBe('00:01:30')
    expect(formatDurationHMS(3661)).toBe('01:01:01')
    expect(formatDurationHMS(36000)).toBe('10:00:00')
  })
})

describe('formatPercentage', () => {
  it('formats with default decimal places', () => {
    expect(formatPercentage(50)).toBe('50.0%')
    expect(formatPercentage(33.333)).toBe('33.3%')
  })

  it('formats with custom decimal places', () => {
    expect(formatPercentage(50, 0)).toBe('50%')
    expect(formatPercentage(33.333, 2)).toBe('33.33%')
  })
})

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(500)).toBe('500 B')
  })

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(1572864)).toBe('1.5 MB')
  })

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })
})

describe('truncate', () => {
  it('returns original string if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates long strings with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('handles edge cases', () => {
    expect(truncate('hi', 3)).toBe('hi')
    expect(truncate('hello', 5)).toBe('hello')
  })
})

describe('getContrastColor', () => {
  it('returns black for light colors', () => {
    expect(getContrastColor('#ffffff')).toBe('#000000')
    expect(getContrastColor('#f0f0f0')).toBe('#000000')
    expect(getContrastColor('#ffff00')).toBe('#000000')
  })

  it('returns white for dark colors', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff')
    expect(getContrastColor('#333333')).toBe('#ffffff')
    expect(getContrastColor('#0000ff')).toBe('#ffffff')
  })

  it('handles colors without #', () => {
    expect(getContrastColor('ffffff')).toBe('#000000')
    expect(getContrastColor('000000')).toBe('#ffffff')
  })
})
