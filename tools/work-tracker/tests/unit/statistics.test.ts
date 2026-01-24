import { describe, it, expect } from 'vitest'
import type { Activity, CategoryDuration, AppDuration } from '../../src/shared/types'

// Helper function to calculate activity duration (mirrors the one in statistics-repository)
function calculateActivityDuration(activity: Activity, now: number): number {
  if (activity.endTime) {
    if (activity.durationSeconds > 0) {
      return activity.durationSeconds
    }
    return Math.floor((activity.endTime - activity.startTime) / 1000)
  }
  return Math.floor((now - activity.startTime) / 1000)
}

// Helper function to calculate category breakdown
function calculateCategoryBreakdown(
  activities: Activity[],
  categories: { id: number; name: string; color: string }[]
): CategoryDuration[] {
  const now = Date.now()
  let totalDuration = 0
  const categoryMap = new Map<number, number>()

  for (const activity of activities) {
    const duration = calculateActivityDuration(activity, now)
    totalDuration += duration

    if (activity.categoryId) {
      categoryMap.set(
        activity.categoryId,
        (categoryMap.get(activity.categoryId) ?? 0) + duration
      )
    }
  }

  const result: CategoryDuration[] = []
  for (const [categoryId, duration] of categoryMap) {
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      result.push({
        categoryId,
        categoryName: category.name,
        color: category.color,
        duration,
        percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
      })
    }
  }

  return result.sort((a, b) => b.duration - a.duration)
}

// Helper function to calculate app breakdown
function calculateAppBreakdown(activities: Activity[]): AppDuration[] {
  const now = Date.now()
  let totalDuration = 0
  const appMap = new Map<string, { duration: number; categoryId: number | null }>()

  for (const activity of activities) {
    const duration = calculateActivityDuration(activity, now)
    totalDuration += duration

    const existing = appMap.get(activity.appName)
    if (existing) {
      existing.duration += duration
    } else {
      appMap.set(activity.appName, {
        duration,
        categoryId: activity.categoryId,
      })
    }
  }

  return Array.from(appMap.entries())
    .map(([appName, data]) => ({
      appName,
      duration: data.duration,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
      categoryId: data.categoryId,
    }))
    .sort((a, b) => b.duration - a.duration)
}

describe('Statistics Calculation', () => {
  const categories = [
    { id: 1, name: 'Development', color: '#10b981' },
    { id: 2, name: 'Communication', color: '#f59e0b' },
  ]

  describe('calculateActivityDuration', () => {
    it('returns durationSeconds for completed activity', () => {
      const activity: Activity = {
        id: 1,
        appName: 'VSCode',
        windowTitle: 'Test',
        startTime: 1000,
        endTime: 2000,
        durationSeconds: 60,
        categoryId: 1,
        isIdle: false,
      }

      expect(calculateActivityDuration(activity, Date.now())).toBe(60)
    })

    it('calculates duration from endTime when durationSeconds is 0', () => {
      const activity: Activity = {
        id: 1,
        appName: 'VSCode',
        windowTitle: 'Test',
        startTime: 1000,
        endTime: 61000, // 60 seconds later
        durationSeconds: 0,
        categoryId: 1,
        isIdle: false,
      }

      expect(calculateActivityDuration(activity, Date.now())).toBe(60)
    })

    it('calculates duration for ongoing activity', () => {
      const now = Date.now()
      const activity: Activity = {
        id: 1,
        appName: 'VSCode',
        windowTitle: 'Test',
        startTime: now - 30000, // 30 seconds ago
        endTime: null,
        durationSeconds: 0,
        categoryId: 1,
        isIdle: false,
      }

      const duration = calculateActivityDuration(activity, now)
      expect(duration).toBe(30)
    })
  })

  describe('calculateCategoryBreakdown', () => {
    it('calculates category duration breakdown', () => {
      const activities: Activity[] = [
        {
          id: 1,
          appName: 'VSCode',
          windowTitle: 'Test',
          startTime: 0,
          endTime: 1,
          durationSeconds: 3600, // 1 hour
          categoryId: 1,
          isIdle: false,
        },
        {
          id: 2,
          appName: 'Slack',
          windowTitle: 'Chat',
          startTime: 0,
          endTime: 1,
          durationSeconds: 1800, // 30 minutes
          categoryId: 2,
          isIdle: false,
        },
      ]

      const breakdown = calculateCategoryBreakdown(activities, categories)

      expect(breakdown.length).toBe(2)
      expect(breakdown[0].categoryId).toBe(1) // Higher duration first
      expect(breakdown[0].duration).toBe(3600)
      expect(breakdown[0].percentage).toBeCloseTo(66.67, 1)
      expect(breakdown[1].categoryId).toBe(2)
      expect(breakdown[1].duration).toBe(1800)
      expect(breakdown[1].percentage).toBeCloseTo(33.33, 1)
    })

    it('handles activities without category', () => {
      const activities: Activity[] = [
        {
          id: 1,
          appName: 'Unknown App',
          windowTitle: 'Test',
          startTime: 0,
          endTime: 1,
          durationSeconds: 3600,
          categoryId: null,
          isIdle: false,
        },
      ]

      const breakdown = calculateCategoryBreakdown(activities, categories)
      expect(breakdown.length).toBe(0)
    })

    it('returns empty array for no activities', () => {
      const breakdown = calculateCategoryBreakdown([], categories)
      expect(breakdown.length).toBe(0)
    })
  })

  describe('calculateAppBreakdown', () => {
    it('calculates app duration breakdown', () => {
      const activities: Activity[] = [
        {
          id: 1,
          appName: 'VSCode',
          windowTitle: 'file1.ts',
          startTime: 0,
          endTime: 1,
          durationSeconds: 1800,
          categoryId: 1,
          isIdle: false,
        },
        {
          id: 2,
          appName: 'VSCode',
          windowTitle: 'file2.ts',
          startTime: 0,
          endTime: 1,
          durationSeconds: 1200,
          categoryId: 1,
          isIdle: false,
        },
        {
          id: 3,
          appName: 'Chrome',
          windowTitle: 'Google',
          startTime: 0,
          endTime: 1,
          durationSeconds: 600,
          categoryId: null,
          isIdle: false,
        },
      ]

      const breakdown = calculateAppBreakdown(activities)

      expect(breakdown.length).toBe(2) // VSCode and Chrome
      expect(breakdown[0].appName).toBe('VSCode')
      expect(breakdown[0].duration).toBe(3000) // 1800 + 1200
      expect(breakdown[1].appName).toBe('Chrome')
      expect(breakdown[1].duration).toBe(600)
    })

    it('preserves category association', () => {
      const activities: Activity[] = [
        {
          id: 1,
          appName: 'VSCode',
          windowTitle: 'Test',
          startTime: 0,
          endTime: 1,
          durationSeconds: 3600,
          categoryId: 1,
          isIdle: false,
        },
      ]

      const breakdown = calculateAppBreakdown(activities)
      expect(breakdown[0].categoryId).toBe(1)
    })

    it('calculates percentages correctly', () => {
      const activities: Activity[] = [
        {
          id: 1,
          appName: 'App1',
          windowTitle: 'Test',
          startTime: 0,
          endTime: 1,
          durationSeconds: 50,
          categoryId: null,
          isIdle: false,
        },
        {
          id: 2,
          appName: 'App2',
          windowTitle: 'Test',
          startTime: 0,
          endTime: 1,
          durationSeconds: 50,
          categoryId: null,
          isIdle: false,
        },
      ]

      const breakdown = calculateAppBreakdown(activities)
      expect(breakdown[0].percentage).toBe(50)
      expect(breakdown[1].percentage).toBe(50)
    })
  })
})
