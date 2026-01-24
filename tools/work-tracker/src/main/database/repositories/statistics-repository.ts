import { getActivitiesForDate, getActivitiesForRange, getTimelineForDate } from './activity-repository'
import { getAllCategories } from './category-repository'
import type {
  DailySummary,
  WeeklySummary,
  MonthlySummary,
  CategoryDuration,
  AppDuration,
  Activity,
} from '../../../shared/types'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from 'date-fns'

/**
 * Calculate duration for an activity.
 * Handles ongoing activities, completed activities, and edge cases where durationSeconds is 0.
 */
function calculateActivityDuration(activity: Activity, now: number): number {
  if (activity.endTime) {
    // Completed activity - use durationSeconds, or calculate if it's 0
    if (activity.durationSeconds > 0) {
      return activity.durationSeconds
    }
    return Math.floor((activity.endTime - activity.startTime) / 1000)
  }
  // Ongoing activity - calculate from start time
  return Math.floor((now - activity.startTime) / 1000)
}

export function getDailySummary(date: string): DailySummary {
  const activities = getActivitiesForDate(date)
  const categories = getAllCategories()
  const timeline = getTimelineForDate(date)
  const now = Date.now()

  // Calculate totals
  let totalDuration = 0
  let idleDuration = 0
  const categoryMap = new Map<number, number>()
  const appMap = new Map<string, number>()

  for (const activity of activities) {
    const duration = calculateActivityDuration(activity, now)
    totalDuration += duration

    if (activity.isIdle) {
      idleDuration += duration
    }

    // Category breakdown
    if (activity.categoryId) {
      categoryMap.set(
        activity.categoryId,
        (categoryMap.get(activity.categoryId) ?? 0) + duration
      )
    }

    // App breakdown
    appMap.set(activity.appName, (appMap.get(activity.appName) ?? 0) + duration)
  }

  // Build category breakdown
  const categoryBreakdown: CategoryDuration[] = []
  for (const [categoryId, duration] of categoryMap) {
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      categoryBreakdown.push({
        categoryId,
        categoryName: category.name,
        color: category.color,
        duration,
        percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
      })
    }
  }

  // Sort by duration descending
  categoryBreakdown.sort((a, b) => b.duration - a.duration)

  // Build app breakdown
  const appBreakdown: AppDuration[] = []
  for (const [appName, duration] of appMap) {
    const activity = activities.find((a) => a.appName === appName)
    appBreakdown.push({
      appName,
      duration,
      percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
      categoryId: activity?.categoryId ?? null,
    })
  }

  // Sort by duration descending
  appBreakdown.sort((a, b) => b.duration - a.duration)

  return {
    date,
    totalDuration,
    productiveDuration: totalDuration - idleDuration,
    idleDuration,
    categoryBreakdown,
    appBreakdown,
    timeline,
  }
}

export function getWeeklySummary(weekStartDate: string): WeeklySummary {
  const weekStart = startOfWeek(parseISO(weekStartDate), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(parseISO(weekStartDate), { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const dailySummaries = days.map((day) => getDailySummary(format(day, 'yyyy-MM-dd')))

  // Aggregate totals
  let totalDuration = 0
  const categoryMap = new Map<number, { name: string; color: string; duration: number }>()
  const appMap = new Map<string, { duration: number; categoryId: number | null }>()

  for (const summary of dailySummaries) {
    totalDuration += summary.totalDuration

    for (const cat of summary.categoryBreakdown) {
      const existing = categoryMap.get(cat.categoryId)
      if (existing) {
        existing.duration += cat.duration
      } else {
        categoryMap.set(cat.categoryId, {
          name: cat.categoryName,
          color: cat.color,
          duration: cat.duration,
        })
      }
    }

    for (const app of summary.appBreakdown) {
      const existing = appMap.get(app.appName)
      if (existing) {
        existing.duration += app.duration
      } else {
        appMap.set(app.appName, {
          duration: app.duration,
          categoryId: app.categoryId,
        })
      }
    }
  }

  // Build top categories
  const topCategories: CategoryDuration[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      color: data.color,
      duration: data.duration,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)

  // Build top apps
  const topApps: AppDuration[] = Array.from(appMap.entries())
    .map(([appName, data]) => ({
      appName,
      duration: data.duration,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
      categoryId: data.categoryId,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)

  const workDays = dailySummaries.filter((s) => s.totalDuration > 0).length

  return {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    dailySummaries,
    totalDuration,
    averageDailyDuration: workDays > 0 ? totalDuration / workDays : 0,
    topApps,
    topCategories,
  }
}

export function getMonthlySummary(yearMonth: string): MonthlySummary {
  // yearMonth format: "YYYY-MM"
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const dailySummaries = days.map((day) => getDailySummary(format(day, 'yyyy-MM-dd')))

  // Aggregate totals
  let totalDuration = 0
  let idleDuration = 0
  const categoryMap = new Map<number, { name: string; color: string; duration: number }>()
  const appMap = new Map<string, { duration: number; categoryId: number | null }>()
  const dailyTotals: { date: string; duration: number }[] = []

  for (const summary of dailySummaries) {
    totalDuration += summary.totalDuration
    idleDuration += summary.idleDuration
    dailyTotals.push({ date: summary.date, duration: summary.totalDuration })

    for (const cat of summary.categoryBreakdown) {
      const existing = categoryMap.get(cat.categoryId)
      if (existing) {
        existing.duration += cat.duration
      } else {
        categoryMap.set(cat.categoryId, {
          name: cat.categoryName,
          color: cat.color,
          duration: cat.duration,
        })
      }
    }

    for (const app of summary.appBreakdown) {
      const existing = appMap.get(app.appName)
      if (existing) {
        existing.duration += app.duration
      } else {
        appMap.set(app.appName, {
          duration: app.duration,
          categoryId: app.categoryId,
        })
      }
    }
  }

  // Build top categories
  const topCategories: CategoryDuration[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      color: data.color,
      duration: data.duration,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5)

  // Build top apps
  const topApps: AppDuration[] = Array.from(appMap.entries())
    .map(([appName, data]) => ({
      appName,
      duration: data.duration,
      percentage: totalDuration > 0 ? (data.duration / totalDuration) * 100 : 0,
      categoryId: data.categoryId,
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)

  const workDays = dailySummaries.filter((s) => s.totalDuration > 0).length

  return {
    month: yearMonth,
    totalDuration,
    productiveDuration: totalDuration - idleDuration,
    idleDuration,
    workDays,
    averageDailyDuration: workDays > 0 ? totalDuration / workDays : 0,
    topApps,
    topCategories,
    dailyTotals,
  }
}

export function getAppUsageForRange(
  startDate: string,
  endDate: string
): AppDuration[] {
  const activities = getActivitiesForRange(startDate, endDate)
  const now = Date.now()

  const appMap = new Map<string, { duration: number; categoryId: number | null }>()
  let totalDuration = 0

  for (const activity of activities) {
    const duration = calculateActivityDuration(activity, now)
    totalDuration += duration
    const existing = appMap.get(activity.appName)
    if (existing) {
      existing.duration += duration
    } else {
      appMap.set(activity.appName, {
        duration: duration,
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
