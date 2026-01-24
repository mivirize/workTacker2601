import { describe, it, expect } from 'vitest'
import type { Goal, GoalProgress, Activity } from '../../src/shared/types'

// Helper function to calculate goal progress (mirrors repository logic)
function calculateGoalProgress(
  goal: Goal,
  todayActivities: Activity[],
  weekActivities: Activity[],
  categoryName?: string
): GoalProgress {
  let currentMinutes = 0

  if (goal.type === 'daily') {
    currentMinutes = todayActivities
      .filter(a => !a.isIdle)
      .reduce((sum, a) => sum + Math.floor(a.durationSeconds / 60), 0)
  } else if (goal.type === 'weekly') {
    currentMinutes = weekActivities
      .filter(a => !a.isIdle)
      .reduce((sum, a) => sum + Math.floor(a.durationSeconds / 60), 0)
  } else if (goal.type === 'category' && goal.categoryId) {
    currentMinutes = todayActivities
      .filter(a => a.categoryId === goal.categoryId && !a.isIdle)
      .reduce((sum, a) => sum + Math.floor(a.durationSeconds / 60), 0)
  }

  const percentage = goal.targetMinutes > 0
    ? Math.min(100, (currentMinutes / goal.targetMinutes) * 100)
    : 0

  return {
    goal,
    currentMinutes,
    percentage,
    categoryName,
  }
}

describe('Goal Progress Calculation', () => {
  const baseActivities: Activity[] = [
    {
      id: 1,
      appName: 'VSCode',
      windowTitle: 'Test',
      startTime: Date.now() - 3600000,
      endTime: Date.now(),
      durationSeconds: 3600, // 1 hour = 60 minutes
      categoryId: 1,
      isIdle: false,
    },
    {
      id: 2,
      appName: 'Slack',
      windowTitle: 'Chat',
      startTime: Date.now() - 1800000,
      endTime: Date.now(),
      durationSeconds: 1800, // 30 minutes
      categoryId: 2,
      isIdle: false,
    },
    {
      id: 3,
      appName: 'Idle',
      windowTitle: '',
      startTime: Date.now() - 600000,
      endTime: Date.now(),
      durationSeconds: 600, // 10 minutes (idle)
      categoryId: null,
      isIdle: true,
    },
  ]

  describe('Daily Goal', () => {
    it('calculates progress for daily goal', () => {
      const goal: Goal = {
        id: 1,
        type: 'daily',
        targetMinutes: 480, // 8 hours
        categoryId: null,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, baseActivities, baseActivities)

      // 60 + 30 = 90 minutes (excluding idle)
      expect(progress.currentMinutes).toBe(90)
      expect(progress.percentage).toBeCloseTo(18.75, 1) // 90/480 * 100
    })

    it('caps percentage at 100%', () => {
      const goal: Goal = {
        id: 1,
        type: 'daily',
        targetMinutes: 60, // 1 hour
        categoryId: null,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, baseActivities, baseActivities)

      expect(progress.currentMinutes).toBe(90)
      expect(progress.percentage).toBe(100) // Capped at 100
    })

    it('excludes idle activities', () => {
      const activities: Activity[] = [
        {
          id: 1,
          appName: 'Idle',
          windowTitle: '',
          startTime: Date.now() - 3600000,
          endTime: Date.now(),
          durationSeconds: 3600,
          categoryId: null,
          isIdle: true,
        },
      ]

      const goal: Goal = {
        id: 1,
        type: 'daily',
        targetMinutes: 480,
        categoryId: null,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, activities, activities)
      expect(progress.currentMinutes).toBe(0)
      expect(progress.percentage).toBe(0)
    })
  })

  describe('Weekly Goal', () => {
    it('calculates progress for weekly goal', () => {
      const goal: Goal = {
        id: 1,
        type: 'weekly',
        targetMinutes: 2400, // 40 hours
        categoryId: null,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, baseActivities, baseActivities)

      expect(progress.currentMinutes).toBe(90)
      expect(progress.percentage).toBeCloseTo(3.75, 1) // 90/2400 * 100
    })
  })

  describe('Category Goal', () => {
    it('calculates progress for category goal', () => {
      const goal: Goal = {
        id: 1,
        type: 'category',
        targetMinutes: 120, // 2 hours
        categoryId: 1,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, baseActivities, baseActivities, 'Development')

      // Only category 1 activity (60 minutes)
      expect(progress.currentMinutes).toBe(60)
      expect(progress.percentage).toBe(50) // 60/120 * 100
      expect(progress.categoryName).toBe('Development')
    })

    it('returns 0 for category with no matching activities', () => {
      const goal: Goal = {
        id: 1,
        type: 'category',
        targetMinutes: 120,
        categoryId: 999, // Non-existent category
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, baseActivities, baseActivities)
      expect(progress.currentMinutes).toBe(0)
      expect(progress.percentage).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty activities', () => {
      const goal: Goal = {
        id: 1,
        type: 'daily',
        targetMinutes: 480,
        categoryId: null,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, [], [])
      expect(progress.currentMinutes).toBe(0)
      expect(progress.percentage).toBe(0)
    })

    it('handles zero target minutes', () => {
      const goal: Goal = {
        id: 1,
        type: 'daily',
        targetMinutes: 0,
        categoryId: null,
        isEnabled: true,
      }

      const progress = calculateGoalProgress(goal, baseActivities, baseActivities)
      expect(progress.percentage).toBe(0)
    })
  })
})
