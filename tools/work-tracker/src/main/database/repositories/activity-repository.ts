import { queryAll, queryOne, run, runInsert } from '../schema'
import type {
  Activity,
  TimelineEntry,
  SearchFilters,
  CreateActivityInput,
  UpdateActivityInput,
  CalendarDaySummary,
} from '../../../shared/types'
import {
  getTagsForActivities,
  setActivityTags,
  getTagIdsForActivity,
  getActivityIdsByTagIds,
  getTagIdsForCategory,
} from './tag-repository'
import { findMatchingCategoryWithTags } from './category-repository'

interface ActivityRow {
  id: number
  app_name: string
  window_title: string | null
  url: string | null
  start_time: number
  end_time: number | null
  duration_seconds: number
  category_id: number | null
  project_id: number | null
  is_idle: number
}

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    appName: row.app_name,
    windowTitle: row.window_title ?? '',
    url: row.url ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    durationSeconds: row.duration_seconds,
    categoryId: row.category_id,
    projectId: row.project_id,
    isIdle: row.is_idle === 1,
    tagIds: [], // Will be populated separately
  }
}

/**
 * Populate tagIds for a list of activities
 */
function populateActivityTags(activities: Activity[]): Activity[] {
  if (activities.length === 0) return activities

  const activityIds = activities.map(a => a.id)
  const tagsMap = getTagsForActivities(activityIds)

  return activities.map(activity => ({
    ...activity,
    tagIds: tagsMap.get(activity.id)?.map(t => t.id) ?? [],
  }))
}

export function createActivity(
  appName: string,
  windowTitle: string,
  startTime: number,
  categoryId: number | null = null,
  url?: string,
  categoryTagIds: number[] = [],
  ruleTagIds: number[] = []
): Activity {
  // Use runInsert to get the ID reliably before saving
  const id = runInsert(
    `INSERT INTO activities (app_name, window_title, url, start_time, category_id, is_idle)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [appName, windowTitle, url ?? null, startTime, categoryId]
  )

  // Merge category tags and rule tags (rule tags take priority but both are included)
  // Remove duplicates using Set
  const tagIds = [...new Set([...categoryTagIds, ...ruleTagIds])]
  if (tagIds.length > 0) {
    setActivityTags(id, tagIds)
  }

  return {
    id,
    appName,
    windowTitle,
    url,
    startTime,
    endTime: null,
    durationSeconds: 0,
    categoryId,
    projectId: null,
    isIdle: false,
    tagIds,
  }
}

export function updateActivityEnd(
  activityId: number,
  endTime: number
): Activity | null {
  const activity = queryOne<ActivityRow>(
    'SELECT * FROM activities WHERE id = ?',
    [activityId]
  )

  if (!activity) return null

  const durationSeconds = Math.floor((endTime - activity.start_time) / 1000)

  run(
    `UPDATE activities SET end_time = ?, duration_seconds = ? WHERE id = ?`,
    [endTime, durationSeconds, activityId]
  )

  return {
    ...rowToActivity(activity),
    endTime,
    durationSeconds,
    tagIds: getTagIdsForActivity(activityId),
  }
}

export function markActivityAsIdle(activityId: number): void {
  run('UPDATE activities SET is_idle = 1 WHERE id = ?', [activityId])
}

export function updateActivityCategory(
  activityId: number,
  categoryId: number | null
): void {
  run('UPDATE activities SET category_id = ? WHERE id = ?', [
    categoryId,
    activityId,
  ])

  // Auto-apply category's default tags (merge with existing tags)
  if (categoryId !== null) {
    const existingTagIds = getTagIdsForActivity(activityId)
    const categoryTagIds = getTagIdsForCategory(categoryId)
    // Merge tags, keeping existing and adding new category tags
    const mergedTagIds = [...new Set([...existingTagIds, ...categoryTagIds])]
    if (mergedTagIds.length !== existingTagIds.length) {
      setActivityTags(activityId, mergedTagIds)
    }
  }
}

export function updateActivityProject(
  activityId: number,
  projectId: number | null
): void {
  run('UPDATE activities SET project_id = ? WHERE id = ?', [
    projectId,
    activityId,
  ])
}

export function getActivitiesForDate(date: string): Activity[] {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0)
  const endOfDay = new Date(date).setHours(23, 59, 59, 999)

  const rows = queryAll<ActivityRow>(
    `SELECT * FROM activities
     WHERE start_time >= ? AND start_time <= ?
     ORDER BY start_time ASC`,
    [startOfDay, endOfDay]
  )

  const activities = rows.map(rowToActivity)
  return populateActivityTags(activities)
}

export function getActivitiesForRange(
  startDate: string,
  endDate: string
): Activity[] {
  const start = new Date(startDate).setHours(0, 0, 0, 0)
  const end = new Date(endDate).setHours(23, 59, 59, 999)

  const rows = queryAll<ActivityRow>(
    `SELECT * FROM activities
     WHERE start_time >= ? AND start_time <= ?
     ORDER BY start_time ASC`,
    [start, end]
  )

  const activities = rows.map(rowToActivity)
  return populateActivityTags(activities)
}

export function getTimelineForDate(date: string): TimelineEntry[] {
  const activities = getActivitiesForDate(date)

  return activities.map((activity) => ({
    startTime: activity.startTime,
    endTime: activity.endTime ?? Date.now(),
    appName: activity.appName,
    windowTitle: activity.windowTitle,
    categoryId: activity.categoryId,
    isIdle: activity.isIdle,
  }))
}

export function getLatestActivity(): Activity | null {
  const row = queryOne<ActivityRow>(
    `SELECT * FROM activities ORDER BY start_time DESC LIMIT 1`
  )

  if (!row) return null

  const activity = rowToActivity(row)
  activity.tagIds = getTagIdsForActivity(activity.id)
  return activity
}

export function searchActivities(filters: SearchFilters): Activity[] {
  const conditions: string[] = []
  const params: (string | number)[] = []

  // Date range filter
  if (filters.dateRange) {
    const start = new Date(filters.dateRange.start).setHours(0, 0, 0, 0)
    const end = new Date(filters.dateRange.end).setHours(23, 59, 59, 999)
    conditions.push('start_time >= ? AND start_time <= ?')
    params.push(start, end)
  }

  // Text query filter (searches app_name and window_title)
  if (filters.query && filters.query.trim()) {
    const query = `%${filters.query.trim()}%`
    conditions.push('(app_name LIKE ? OR window_title LIKE ?)')
    params.push(query, query)
  }

  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    const placeholders = filters.categoryIds.map(() => '?').join(', ')
    conditions.push(`category_id IN (${placeholders})`)
    params.push(...filters.categoryIds)
  }

  // Project filter
  if (filters.projectIds && filters.projectIds.length > 0) {
    const placeholders = filters.projectIds.map(() => '?').join(', ')
    conditions.push(`project_id IN (${placeholders})`)
    params.push(...filters.projectIds)
  }

  // App name filter
  if (filters.appNames && filters.appNames.length > 0) {
    const placeholders = filters.appNames.map(() => '?').join(', ')
    conditions.push(`app_name IN (${placeholders})`)
    params.push(...filters.appNames)
  }

  // Tag filter - get activity IDs that have the specified tags
  if (filters.tagIds && filters.tagIds.length > 0) {
    const activityIdsWithTags = getActivityIdsByTagIds(filters.tagIds)
    if (activityIdsWithTags.length === 0) {
      return [] // No activities have these tags
    }
    const placeholders = activityIdsWithTags.map(() => '?').join(', ')
    conditions.push(`id IN (${placeholders})`)
    params.push(...activityIdsWithTags)
  }

  // Idle filter
  if (filters.showIdle === false) {
    conditions.push('is_idle = 0')
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = queryAll<ActivityRow>(
    `SELECT * FROM activities ${whereClause} ORDER BY start_time DESC LIMIT 500`,
    params
  )

  const activities = rows.map(rowToActivity)
  return populateActivityTags(activities)
}

export function deleteOldActivities(retentionDays: number): number {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000

  run('DELETE FROM activities WHERE start_time < ?', [cutoffTime])

  // Note: sql.js doesn't easily return changes count, so we return 0
  return 0
}

/**
 * Close all activities that don't have an end_time set.
 * This is called on app startup to handle activities from previous sessions
 * that weren't properly closed.
 */
export function closeUnclosedActivities(): number {
  // Get all unclosed activities
  const unclosed = queryAll<ActivityRow>(
    'SELECT * FROM activities WHERE end_time IS NULL'
  )

  // Close each one by setting end_time to start_time + a small buffer
  // (we don't know when they actually ended, so we use start_time as end_time)
  for (const activity of unclosed) {
    // Set end_time to start_time (0 duration) since we don't know when it actually ended
    const durationSeconds = 0
    run(
      'UPDATE activities SET end_time = ?, duration_seconds = ? WHERE id = ?',
      [activity.start_time, durationSeconds, activity.id]
    )
  }

  return unclosed.length
}

// ============================================
// Manual Activity CRUD Operations
// ============================================

/**
 * Create a manual activity with automatic duration calculation.
 */
export function createManualActivity(input: CreateActivityInput): Activity {
  const durationSeconds = Math.floor((input.endTime - input.startTime) / 1000)

  const id = runInsert(
    `INSERT INTO activities (app_name, window_title, url, start_time, end_time, duration_seconds, category_id, project_id, is_idle)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.appName,
      input.windowTitle ?? null,
      input.url ?? null,
      input.startTime,
      input.endTime,
      durationSeconds,
      input.categoryId,
      input.projectId ?? null,
      input.isIdle ? 1 : 0,
    ]
  )

  // Determine tags: use provided tags, or auto-apply category tags
  let tagIds = input.tagIds ?? []
  if (tagIds.length === 0 && input.categoryId !== null) {
    // Auto-apply category's default tags if no tags provided
    tagIds = getTagIdsForCategory(input.categoryId)
  }
  if (tagIds.length > 0) {
    setActivityTags(id, tagIds)
  }

  return {
    id,
    appName: input.appName,
    windowTitle: input.windowTitle ?? '',
    url: input.url,
    startTime: input.startTime,
    endTime: input.endTime,
    durationSeconds,
    categoryId: input.categoryId,
    projectId: input.projectId ?? null,
    isIdle: input.isIdle ?? false,
    tagIds,
  }
}

/**
 * Update an existing activity. Recalculates duration if times change.
 */
export function updateActivity(input: UpdateActivityInput): Activity | null {
  const existing = getActivityById(input.id)
  if (!existing) return null

  const startTime = input.startTime ?? existing.startTime
  const endTime = input.endTime ?? existing.endTime
  const durationSeconds =
    endTime !== null ? Math.floor((endTime - startTime) / 1000) : existing.durationSeconds

  run(
    `UPDATE activities
     SET app_name = ?, window_title = ?, url = ?, start_time = ?, end_time = ?,
         duration_seconds = ?, category_id = ?, project_id = ?, is_idle = ?
     WHERE id = ?`,
    [
      input.appName ?? existing.appName,
      input.windowTitle !== undefined ? input.windowTitle : existing.windowTitle,
      input.url !== undefined ? input.url : existing.url ?? null,
      startTime,
      endTime,
      durationSeconds,
      input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      input.projectId !== undefined ? input.projectId : existing.projectId,
      input.isIdle !== undefined ? (input.isIdle ? 1 : 0) : existing.isIdle ? 1 : 0,
      input.id,
    ]
  )

  // Update tags if provided
  if (input.tagIds !== undefined) {
    setActivityTags(input.id, input.tagIds)
  }

  return getActivityById(input.id)
}

/**
 * Delete an activity by ID.
 */
export function deleteActivity(activityId: number): void {
  run('DELETE FROM activities WHERE id = ?', [activityId])
}

/**
 * Get a single activity by ID.
 */
export function getActivityById(activityId: number): Activity | null {
  const row = queryOne<ActivityRow>('SELECT * FROM activities WHERE id = ?', [activityId])
  if (!row) return null

  const activity = rowToActivity(row)
  activity.tagIds = getTagIdsForActivity(activityId)
  return activity
}

// ============================================
// Calendar Operations
// ============================================

interface CalendarAggregateRow {
  date: string
  total_duration: number
  activity_count: number
  category_id: number | null
  category_duration: number
}

/**
 * Get calendar summary data for a month.
 * Returns daily summaries with total duration and category breakdown.
 */
export function getMonthCalendarSummary(yearMonth: string): CalendarDaySummary[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0).getTime()
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime()

  const rows = queryAll<CalendarAggregateRow>(
    `SELECT
       date(start_time / 1000, 'unixepoch', 'localtime') as date,
       SUM(duration_seconds) as total_duration,
       COUNT(*) as activity_count,
       category_id,
       SUM(duration_seconds) as category_duration
     FROM activities
     WHERE start_time >= ? AND start_time <= ?
     GROUP BY date, category_id
     ORDER BY date`,
    [monthStart, monthEnd]
  )

  // Aggregate by date
  const dateMap = new Map<string, CalendarDaySummary>()

  for (const row of rows) {
    let summary = dateMap.get(row.date)
    if (!summary) {
      summary = {
        date: row.date,
        totalDuration: 0,
        activityCount: 0,
        categoryBreakdown: [],
      }
      dateMap.set(row.date, summary)
    }
    summary.totalDuration += row.total_duration
    summary.activityCount += row.activity_count
    if (row.category_id !== null) {
      summary.categoryBreakdown.push({
        categoryId: row.category_id,
        duration: row.category_duration,
      })
    }
  }

  return Array.from(dateMap.values())
}

// ============================================
// Tag Reapplication
// ============================================

export interface ReapplyTagsResult {
  processedCount: number
  updatedCount: number
}

/**
 * Reapply category and rule tags to all existing activities.
 * This is useful when tag rules have been updated and need to be applied retroactively.
 */
export function reapplyTagsToAllActivities(): ReapplyTagsResult {
  const rows = queryAll<ActivityRow>('SELECT * FROM activities ORDER BY start_time ASC')

  let updatedCount = 0

  for (const row of rows) {
    const matchResult = findMatchingCategoryWithTags(
      row.app_name,
      row.window_title ?? '',
      row.url ?? undefined
    )

    // Merge category tags and rule tags
    const newTagIds = [...new Set([...matchResult.categoryTagIds, ...matchResult.ruleTagIds])]

    // Get existing tags
    const existingTagIds = getTagIdsForActivity(row.id)

    // Check if tags changed (compare sorted arrays)
    const existingSorted = [...existingTagIds].sort((a, b) => a - b)
    const newSorted = [...newTagIds].sort((a, b) => a - b)
    const tagsChanged =
      existingSorted.length !== newSorted.length ||
      existingSorted.some((id, i) => id !== newSorted[i])

    if (tagsChanged) {
      setActivityTags(row.id, newTagIds)
      updatedCount++
    }

    // Also update category if it changed
    if (matchResult.categoryId !== row.category_id) {
      run('UPDATE activities SET category_id = ? WHERE id = ?', [
        matchResult.categoryId,
        row.id,
      ])
    }
  }

  return {
    processedCount: rows.length,
    updatedCount,
  }
}
