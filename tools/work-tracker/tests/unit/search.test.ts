import { describe, it, expect } from 'vitest'
import type { Activity, SearchFilters } from '../../src/shared/types'

// Helper function to filter activities (mirrors repository search logic)
function filterActivities(activities: Activity[], filters: SearchFilters): Activity[] {
  return activities.filter(activity => {
    // Date range filter
    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start).setHours(0, 0, 0, 0)
      const end = new Date(filters.dateRange.end).setHours(23, 59, 59, 999)
      if (activity.startTime < start || activity.startTime > end) {
        return false
      }
    }

    // Text query filter
    if (filters.query && filters.query.trim()) {
      const query = filters.query.toLowerCase().trim()
      const matchesApp = activity.appName.toLowerCase().includes(query)
      const matchesTitle = activity.windowTitle.toLowerCase().includes(query)
      if (!matchesApp && !matchesTitle) {
        return false
      }
    }

    // Category filter
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      if (!activity.categoryId || !filters.categoryIds.includes(activity.categoryId)) {
        return false
      }
    }

    // App name filter
    if (filters.appNames && filters.appNames.length > 0) {
      if (!filters.appNames.includes(activity.appName)) {
        return false
      }
    }

    // Idle filter
    if (filters.showIdle === false && activity.isIdle) {
      return false
    }

    return true
  })
}

describe('Search/Filter Functionality', () => {
  const testActivities: Activity[] = [
    {
      id: 1,
      appName: 'VSCode',
      windowTitle: 'index.ts - work-tracker',
      startTime: new Date('2025-01-23T10:00:00').getTime(),
      endTime: new Date('2025-01-23T11:00:00').getTime(),
      durationSeconds: 3600,
      categoryId: 1,
      isIdle: false,
    },
    {
      id: 2,
      appName: 'Chrome',
      windowTitle: 'Google Search',
      startTime: new Date('2025-01-23T11:00:00').getTime(),
      endTime: new Date('2025-01-23T11:30:00').getTime(),
      durationSeconds: 1800,
      categoryId: 2,
      isIdle: false,
    },
    {
      id: 3,
      appName: 'Slack',
      windowTitle: 'Team Chat',
      startTime: new Date('2025-01-22T14:00:00').getTime(),
      endTime: new Date('2025-01-22T14:30:00').getTime(),
      durationSeconds: 1800,
      categoryId: 3,
      isIdle: false,
    },
    {
      id: 4,
      appName: 'System',
      windowTitle: 'Idle',
      startTime: new Date('2025-01-23T12:00:00').getTime(),
      endTime: new Date('2025-01-23T12:30:00').getTime(),
      durationSeconds: 1800,
      categoryId: null,
      isIdle: true,
    },
  ]

  describe('Query Filter', () => {
    it('filters by app name', () => {
      const result = filterActivities(testActivities, { query: 'VSCode' })
      expect(result.length).toBe(1)
      expect(result[0].appName).toBe('VSCode')
    })

    it('filters by window title', () => {
      const result = filterActivities(testActivities, { query: 'Google' })
      expect(result.length).toBe(1)
      expect(result[0].appName).toBe('Chrome')
    })

    it('is case insensitive', () => {
      const result = filterActivities(testActivities, { query: 'vscode' })
      expect(result.length).toBe(1)
    })

    it('handles partial matches', () => {
      const result = filterActivities(testActivities, { query: 'Code' })
      expect(result.length).toBe(1)
      expect(result[0].appName).toBe('VSCode')
    })

    it('returns all when query is empty', () => {
      const result = filterActivities(testActivities, { query: '' })
      expect(result.length).toBe(4)
    })
  })

  describe('Date Range Filter', () => {
    it('filters by date range', () => {
      const result = filterActivities(testActivities, {
        dateRange: { start: '2025-01-23', end: '2025-01-23' },
      })
      expect(result.length).toBe(3) // VSCode, Chrome, Idle on 23rd
    })

    it('excludes activities outside range', () => {
      const result = filterActivities(testActivities, {
        dateRange: { start: '2025-01-22', end: '2025-01-22' },
      })
      expect(result.length).toBe(1) // Only Slack on 22nd
      expect(result[0].appName).toBe('Slack')
    })

    it('handles multi-day range', () => {
      const result = filterActivities(testActivities, {
        dateRange: { start: '2025-01-22', end: '2025-01-23' },
      })
      expect(result.length).toBe(4)
    })
  })

  describe('Category Filter', () => {
    it('filters by single category', () => {
      const result = filterActivities(testActivities, { categoryIds: [1] })
      expect(result.length).toBe(1)
      expect(result[0].appName).toBe('VSCode')
    })

    it('filters by multiple categories', () => {
      const result = filterActivities(testActivities, { categoryIds: [1, 2] })
      expect(result.length).toBe(2)
    })

    it('excludes activities without category', () => {
      const result = filterActivities(testActivities, { categoryIds: [1, 2, 3] })
      expect(result.length).toBe(3) // Idle has no category
    })

    it('returns all when categoryIds is empty', () => {
      const result = filterActivities(testActivities, { categoryIds: [] })
      expect(result.length).toBe(4)
    })
  })

  describe('App Name Filter', () => {
    it('filters by single app name', () => {
      const result = filterActivities(testActivities, { appNames: ['Chrome'] })
      expect(result.length).toBe(1)
    })

    it('filters by multiple app names', () => {
      const result = filterActivities(testActivities, { appNames: ['VSCode', 'Slack'] })
      expect(result.length).toBe(2)
    })
  })

  describe('Idle Filter', () => {
    it('hides idle activities when showIdle is false', () => {
      const result = filterActivities(testActivities, { showIdle: false })
      expect(result.length).toBe(3)
      expect(result.every(a => !a.isIdle)).toBe(true)
    })

    it('shows idle activities when showIdle is true', () => {
      const result = filterActivities(testActivities, { showIdle: true })
      expect(result.length).toBe(4)
    })

    it('shows idle activities when showIdle is undefined', () => {
      const result = filterActivities(testActivities, {})
      expect(result.length).toBe(4)
    })
  })

  describe('Combined Filters', () => {
    it('applies multiple filters together', () => {
      const result = filterActivities(testActivities, {
        query: 'VSCode',
        dateRange: { start: '2025-01-23', end: '2025-01-23' },
        categoryIds: [1],
        showIdle: false,
      })
      expect(result.length).toBe(1)
      expect(result[0].appName).toBe('VSCode')
    })

    it('returns empty when filters conflict', () => {
      const result = filterActivities(testActivities, {
        query: 'VSCode',
        categoryIds: [2], // VSCode has categoryId 1, not 2
      })
      expect(result.length).toBe(0)
    })
  })
})
