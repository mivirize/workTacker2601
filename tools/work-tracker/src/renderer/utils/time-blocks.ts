import { startOfDay, addMinutes, format } from 'date-fns'
import type { Activity, TimeBlock, TimeBlockInterval, AppBreakdownEntry, Category } from '../../shared/types'

/**
 * Generate time blocks for a given day with the specified interval
 */
export function generateTimeBlocks(
  activities: Activity[],
  date: Date,
  intervalMinutes: TimeBlockInterval,
  categories: Category[]
): TimeBlock[] {
  const dayStart = startOfDay(date)
  const blocks: TimeBlock[] = []

  // Generate blocks for 24 hours
  const totalBlocks = Math.ceil((24 * 60) / intervalMinutes)

  for (let i = 0; i < totalBlocks; i++) {
    const blockStart = addMinutes(dayStart, i * intervalMinutes)
    const blockEnd = addMinutes(blockStart, intervalMinutes)

    const block = createTimeBlock(
      activities,
      blockStart.getTime(),
      blockEnd.getTime(),
      categories
    )

    blocks.push(block)
  }

  return blocks
}

/**
 * Create a single time block from activities within the time range
 */
function createTimeBlock(
  activities: Activity[],
  startTime: number,
  endTime: number,
  categories: Category[]
): TimeBlock {
  const safeCategories = categories ?? []
  // Filter activities that overlap with this time block
  const blockActivities = (activities ?? []).filter(activity => {
    const activityStart = activity.startTime
    const activityEnd = activity.endTime ?? Date.now()

    // Check if activity overlaps with block
    return activityStart < endTime && activityEnd > startTime
  })

  // Calculate duration for each activity within this block
  const appDurations = new Map<string, {
    duration: number
    categoryId: number | null
    activities: Activity[]
  }>()

  let totalDuration = 0
  let idleDuration = 0

  for (const activity of blockActivities) {
    const activityStart = Math.max(activity.startTime, startTime)
    const activityEnd = Math.min(activity.endTime ?? Date.now(), endTime)
    const durationInBlock = Math.max(0, Math.floor((activityEnd - activityStart) / 1000))

    if (durationInBlock > 0) {
      totalDuration += durationInBlock

      if (activity.isIdle) {
        idleDuration += durationInBlock
      }

      const existing = appDurations.get(activity.appName)
      if (existing) {
        existing.duration += durationInBlock
        existing.activities.push(activity)
      } else {
        appDurations.set(activity.appName, {
          duration: durationInBlock,
          categoryId: activity.categoryId,
          activities: [activity],
        })
      }
    }
  }

  // Build app breakdown sorted by duration
  const appBreakdown: AppBreakdownEntry[] = Array.from(appDurations.entries())
    .map(([appName, data]) => ({
      appName,
      duration: data.duration,
      percentage: totalDuration > 0 ? Math.round((data.duration / totalDuration) * 100) : 0,
      categoryId: data.categoryId,
      activities: data.activities,
    }))
    .sort((a, b) => b.duration - a.duration)

  // Find dominant app (excluding idle)
  const nonIdleBreakdown = appBreakdown.filter(app =>
    !app.activities.some(a => a.isIdle)
  )
  const dominantAppEntry = nonIdleBreakdown[0] ?? appBreakdown[0]
  const dominantApp = dominantAppEntry?.appName ?? null

  // Find dominant category
  let dominantCategory: TimeBlock['dominantCategory'] = null
  if (dominantAppEntry?.categoryId) {
    const category = safeCategories.find(c => c.id === dominantAppEntry.categoryId)
    if (category) {
      dominantCategory = {
        id: category.id,
        name: category.name,
        color: category.color,
      }
    }
  }

  return {
    startTime,
    endTime,
    dominantApp,
    dominantCategory,
    totalDuration,
    idleDuration,
    activities: blockActivities,
    appBreakdown,
  }
}

/**
 * Filter time blocks to only include those with activity
 */
export function filterActiveBlocks(blocks: TimeBlock[]): TimeBlock[] {
  return blocks.filter(block => block.totalDuration > 0)
}

/**
 * Get blocks within a specific hour range
 */
export function getBlocksInRange(
  blocks: TimeBlock[],
  startHour: number,
  endHour: number
): TimeBlock[] {
  return blocks.filter(block => {
    const blockHour = new Date(block.startTime).getHours()
    return blockHour >= startHour && blockHour < endHour
  })
}

/**
 * Format time block time range for display
 */
export function formatBlockTimeRange(block: TimeBlock): string {
  const start = format(new Date(block.startTime), 'HH:mm')
  const end = format(new Date(block.endTime), 'HH:mm')
  return `${start}-${end}`
}

/**
 * Calculate activity percentage of block (vs idle/empty)
 */
export function calculateActivityPercentage(
  block: TimeBlock,
  intervalMinutes: TimeBlockInterval
): number {
  const blockDurationSeconds = intervalMinutes * 60
  const activeSeconds = block.totalDuration - block.idleDuration
  return Math.round((activeSeconds / blockDurationSeconds) * 100)
}

/**
 * Get summary statistics for multiple time blocks
 */
export function getBlocksSummary(blocks: TimeBlock[]): {
  totalDuration: number
  totalIdle: number
  activeBlocks: number
  idleBlocks: number
  topApp: string | null
  topCategory: TimeBlock['dominantCategory']
} {
  let totalDuration = 0
  let totalIdle = 0
  let activeBlocks = 0
  let idleBlocks = 0

  const appTotals = new Map<string, number>()
  const categoryTotals = new Map<number, { duration: number; category: TimeBlock['dominantCategory'] }>()

  for (const block of blocks) {
    totalDuration += block.totalDuration
    totalIdle += block.idleDuration

    if (block.totalDuration > 0) {
      if (block.totalDuration - block.idleDuration > 0) {
        activeBlocks++
      } else {
        idleBlocks++
      }
    }

    for (const app of block.appBreakdown) {
      const current = appTotals.get(app.appName) ?? 0
      appTotals.set(app.appName, current + app.duration)

      if (app.categoryId) {
        const existing = categoryTotals.get(app.categoryId)
        if (existing) {
          existing.duration += app.duration
        } else {
          const blockCategory = block.dominantCategory?.id === app.categoryId
            ? block.dominantCategory
            : null
          if (blockCategory) {
            categoryTotals.set(app.categoryId, {
              duration: app.duration,
              category: blockCategory,
            })
          }
        }
      }
    }
  }

  // Find top app
  let topApp: string | null = null
  let topAppDuration = 0
  for (const [app, duration] of appTotals) {
    if (duration > topAppDuration) {
      topAppDuration = duration
      topApp = app
    }
  }

  // Find top category
  let topCategory: TimeBlock['dominantCategory'] = null
  let topCategoryDuration = 0
  for (const [, data] of categoryTotals) {
    if (data.duration > topCategoryDuration && data.category) {
      topCategoryDuration = data.duration
      topCategory = data.category
    }
  }

  return {
    totalDuration,
    totalIdle,
    activeBlocks,
    idleBlocks,
    topApp,
    topCategory,
  }
}

/**
 * Available interval options for UI
 */
export const INTERVAL_OPTIONS: { value: TimeBlockInterval; label: string }[] = [
  { value: 5, label: '5分' },
  { value: 10, label: '10分' },
  { value: 15, label: '15分' },
  { value: 30, label: '30分' },
  { value: 60, label: '60分' },
]
