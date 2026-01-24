import { getActivitiesForRange } from '../database/repositories/activity-repository'
import { getAllCategories } from '../database/repositories/category-repository'
import { format } from 'date-fns'

export function exportToCSV(startDate: string, endDate: string): string {
  const activities = getActivitiesForRange(startDate, endDate)
  const categories = getAllCategories()

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const headers = [
    'ID',
    'アプリ名',
    'ウィンドウタイトル',
    'URL',
    '開始時刻',
    '終了時刻',
    '時間（秒）',
    'カテゴリ',
    'アイドル',
  ]

  const rows = activities.map((activity) => [
    activity.id.toString(),
    escapeCsvField(activity.appName),
    escapeCsvField(activity.windowTitle),
    escapeCsvField(activity.url ?? ''),
    format(new Date(activity.startTime), 'yyyy-MM-dd HH:mm:ss'),
    activity.endTime
      ? format(new Date(activity.endTime), 'yyyy-MM-dd HH:mm:ss')
      : '',
    activity.durationSeconds.toString(),
    activity.categoryId ? categoryMap.get(activity.categoryId) ?? '' : '',
    activity.isIdle ? 'はい' : 'いいえ',
  ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  )

  return csvContent
}

export function exportToJSON(startDate: string, endDate: string): string {
  const activities = getActivitiesForRange(startDate, endDate)
  const categories = getAllCategories()

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const enrichedActivities = activities.map((activity) => ({
    ...activity,
    category: activity.categoryId
      ? categoryMap.get(activity.categoryId)
      : null,
    startTimeFormatted: format(
      new Date(activity.startTime),
      'yyyy-MM-dd HH:mm:ss'
    ),
    endTimeFormatted: activity.endTime
      ? format(new Date(activity.endTime), 'yyyy-MM-dd HH:mm:ss')
      : null,
    durationFormatted: formatDuration(activity.durationSeconds),
  }))

  return JSON.stringify(
    {
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      dateRange: { startDate, endDate },
      totalActivities: enrichedActivities.length,
      activities: enrichedActivities,
    },
    null,
    2
  )
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}時間`)
  if (minutes > 0) parts.push(`${minutes}分`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

  return parts.join('')
}
