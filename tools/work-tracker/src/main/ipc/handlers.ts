import { ipcMain, app } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { getTracker } from '../tracker/window-tracker'

const execAsync = promisify(exec)
import {
  getActivitiesForDate,
  getActivitiesForRange,
  updateActivityCategory,
  searchActivities,
  createManualActivity,
  updateActivity,
  deleteActivity,
  getActivityById,
  getMonthCalendarSummary,
  reapplyTagsToAllActivities,
} from '../database/repositories/activity-repository'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../database/repositories/category-repository'
import {
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary,
  getAppUsageForRange,
} from '../database/repositories/statistics-repository'
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalProgress,
} from '../database/repositories/goal-repository'
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  setActivityTags,
} from '../database/repositories/tag-repository'
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../database/repositories/project-repository'
import { exportToCSV, exportToJSON } from '../export/exporter'
import { getSettings, updateSettings } from '../settings/settings-manager'
import { log, getLogs } from '../utils/logger'
import type {
  Category,
  AppSettings,
  SearchFilters,
  Goal,
  Tag,
  Project,
  CreateActivityInput,
  UpdateActivityInput,
} from '../../shared/types'
import { format } from 'date-fns'

export function registerIpcHandlers(): void {
  log('[IPC] Registering handlers...')

  // Diagnostic handler - returns immediately without dependencies
  ipcMain.handle('diag:ping', () => {
    return {
      message: 'pong',
      timestamp: Date.now(),
      platform: process.platform,
      nodeVersion: process.version,
      electronVersion: process.versions.electron
    }
  })

  // Test encoding - captures current window and returns raw data
  ipcMain.handle('diag:testEncoding', async () => {
    try {
      const tempDir = app.getPath('temp')
      const tempFile = path.join(tempDir, 'work-tracker-diag.json')
      log(`[Diag] tempDir: ${tempDir}`)
      log(`[Diag] tempFile: ${tempFile}`)

      const script = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32Api {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
$hwnd = [Win32Api]::GetForegroundWindow()
$title = New-Object System.Text.StringBuilder 512
[Win32Api]::GetWindowText($hwnd, $title, 512) | Out-Null
$processId = 0
[Win32Api]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
$result = @{
  title = $title.ToString()
  appName = if($process) { $process.ProcessName } else { 'Unknown' }
  path = if($process) { $process.Path } else { '' }
}
$jsonString = $result | ConvertTo-Json -Compress
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText('${tempFile.replace(/\\/g, '\\\\')}', $jsonString, $utf8NoBom)
`
      const encodedScript = Buffer.from(script, 'utf16le').toString('base64')
      log(`[Diag] Executing PowerShell...`)
      await execAsync(`powershell -NoProfile -EncodedCommand ${encodedScript}`, {
        timeout: 5000,
      })

      log(`[Diag] Reading temp file...`)
      const jsonString = fs.readFileSync(tempFile, 'utf8')
      log(`[Diag] Raw JSON: ${jsonString}`)

      // Check for BOM
      const rawBuffer = fs.readFileSync(tempFile)
      const hasBOM = rawBuffer[0] === 0xEF && rawBuffer[1] === 0xBB && rawBuffer[2] === 0xBF
      log(`[Diag] Has BOM: ${hasBOM}`)
      log(`[Diag] First bytes: ${rawBuffer.slice(0, 10).toString('hex')}`)

      // Clean up
      try { fs.unlinkSync(tempFile) } catch { /* ignore */ }

      const result = JSON.parse(jsonString)
      return {
        success: true,
        tempFile,
        rawJson: jsonString,
        hasBOM,
        firstBytesHex: rawBuffer.slice(0, 10).toString('hex'),
        parsed: result,
      }
    } catch (error) {
      log(`[Diag] ERROR: ${error}`)
      return {
        success: false,
        error: String(error),
      }
    }
  })

  // Get main process logs
  ipcMain.handle('diag:logs', () => {
    return getLogs()
  })

  // Test handler - returns a simple value
  ipcMain.handle('test:ping', () => {
    log('[IPC] test:ping called')
    return { message: 'pong', timestamp: Date.now() }
  })

  // Tracking handlers
  ipcMain.handle('tracking:start', async () => {
    try {
      log('tracking:start called')
      const tracker = getTracker()
      await tracker.startTracking()
      const state = tracker.getState()
      log(`tracking:start returning: ${JSON.stringify(state)}`)
      return state
    } catch (error) {
      log(`tracking:start ERROR: ${error}`)
      throw error
    }
  })

  ipcMain.handle('tracking:stop', () => {
    try {
      log('tracking:stop called')
      const tracker = getTracker()
      tracker.stopTracking()
      const state = tracker.getState()
      log(`tracking:stop returning: ${JSON.stringify(state)}`)
      return state
    } catch (error) {
      log(`tracking:stop ERROR: ${error}`)
      throw error
    }
  })

  ipcMain.handle('tracking:pause', () => {
    try {
      log('tracking:pause called')
      const tracker = getTracker()
      tracker.pauseTracking()
      const state = tracker.getState()
      log(`tracking:pause returning: ${JSON.stringify(state)}`)
      return state
    } catch (error) {
      log(`tracking:pause ERROR: ${error}`)
      throw error
    }
  })

  ipcMain.handle('tracking:resume', async () => {
    try {
      log('tracking:resume called')
      const tracker = getTracker()
      await tracker.resumeTracking()
      const state = tracker.getState()
      log(`tracking:resume returning: ${JSON.stringify(state)}`)
      return state
    } catch (error) {
      log(`tracking:resume ERROR: ${error}`)
      throw error
    }
  })

  ipcMain.handle('tracking:state', () => {
    try {
      log('tracking:state called')
      const tracker = getTracker()
      const state = tracker.getState()
      log(`tracking:state returning: ${JSON.stringify(state)}`)
      return state
    } catch (error) {
      log(`tracking:state ERROR: ${error}`)
      throw error
    }
  })

  // Activity handlers
  ipcMain.handle('activities:today', () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return getActivitiesForDate(today)
  })

  ipcMain.handle('activities:date', (_event, date: string) => {
    return getActivitiesForDate(date)
  })

  ipcMain.handle(
    'activities:range',
    (_event, startDate: string, endDate: string) => {
      return getActivitiesForRange(startDate, endDate)
    }
  )

  ipcMain.handle(
    'activities:updateCategory',
    (_event, activityId: number, categoryId: number | null) => {
      updateActivityCategory(activityId, categoryId)
    }
  )

  ipcMain.handle('activities:search', (_event, filters: SearchFilters) => {
    return searchActivities(filters)
  })

  // Activity CRUD handlers (for manual entry)
  ipcMain.handle('activities:create', (_event, input: CreateActivityInput) => {
    if (!input.appName || !input.startTime || !input.endTime) {
      throw new Error('appName, startTime, and endTime are required')
    }
    if (input.endTime <= input.startTime) {
      throw new Error('endTime must be greater than startTime')
    }
    return createManualActivity(input)
  })

  ipcMain.handle('activities:update', (_event, input: UpdateActivityInput) => {
    if (!input.id) {
      throw new Error('Activity ID is required')
    }
    if (input.startTime && input.endTime && input.endTime <= input.startTime) {
      throw new Error('endTime must be greater than startTime')
    }
    const result = updateActivity(input)
    if (!result) {
      throw new Error('Activity not found')
    }
    return result
  })

  ipcMain.handle('activities:delete', (_event, activityId: number) => {
    deleteActivity(activityId)
  })

  ipcMain.handle('activities:getById', (_event, activityId: number) => {
    return getActivityById(activityId)
  })

  // Calendar handlers
  ipcMain.handle('calendar:monthSummary', (_event, yearMonth: string) => {
    return getMonthCalendarSummary(yearMonth)
  })

  // Statistics handlers
  ipcMain.handle('stats:daily', (_event, date: string) => {
    return getDailySummary(date)
  })

  ipcMain.handle('stats:weekly', (_event, weekStart: string) => {
    return getWeeklySummary(weekStart)
  })

  ipcMain.handle('stats:monthly', (_event, yearMonth: string) => {
    return getMonthlySummary(yearMonth)
  })

  ipcMain.handle(
    'stats:appUsage',
    (_event, startDate: string, endDate: string) => {
      return getAppUsageForRange(startDate, endDate)
    }
  )

  // Category handlers
  ipcMain.handle('categories:list', () => {
    return getAllCategories()
  })

  ipcMain.handle(
    'categories:create',
    (_event, category: Omit<Category, 'id'>) => {
      return createCategory(category)
    }
  )

  ipcMain.handle('categories:update', (_event, category: Category) => {
    return updateCategory(category)
  })

  ipcMain.handle('categories:delete', (_event, categoryId: number) => {
    deleteCategory(categoryId)
  })

  // Settings handlers
  ipcMain.handle('settings:get', () => {
    try {
      log('settings:get called')
      const settings = getSettings()
      log(`settings:get returning: ${JSON.stringify(settings)}`)
      return settings
    } catch (error) {
      log(`settings:get ERROR: ${error}`)
      throw error
    }
  })

  ipcMain.handle(
    'settings:update',
    (_event, settings: Partial<AppSettings>) => {
      return updateSettings(settings)
    }
  )

  // Goal handlers
  ipcMain.handle('goals:list', () => {
    return getAllGoals()
  })

  ipcMain.handle('goals:create', (_event, goal: Omit<Goal, 'id'>) => {
    return createGoal(goal)
  })

  ipcMain.handle('goals:update', (_event, goal: Goal) => {
    return updateGoal(goal)
  })

  ipcMain.handle('goals:delete', (_event, goalId: number) => {
    deleteGoal(goalId)
  })

  ipcMain.handle('goals:progress', () => {
    return getGoalProgress()
  })

  // Tag handlers
  ipcMain.handle('tags:list', () => {
    return getAllTags()
  })

  ipcMain.handle('tags:create', (_event, tag: Omit<Tag, 'id'>) => {
    if (!tag.name || !tag.color) {
      throw new Error('Tag name and color are required')
    }
    return createTag(tag)
  })

  ipcMain.handle('tags:update', (_event, tag: Tag) => {
    if (!tag.id || !tag.name || !tag.color) {
      throw new Error('Tag id, name and color are required')
    }
    return updateTag(tag)
  })

  ipcMain.handle('tags:delete', (_event, tagId: number) => {
    deleteTag(tagId)
  })

  ipcMain.handle('tags:setForActivity', (_event, activityId: number, tagIds: number[]) => {
    setActivityTags(activityId, tagIds)
  })

  ipcMain.handle('tags:reapplyToAll', () => {
    log('[IPC] tags:reapplyToAll called')
    const result = reapplyTagsToAllActivities()
    log(`[IPC] tags:reapplyToAll result: ${JSON.stringify(result)}`)
    return result
  })

  // Project handlers
  ipcMain.handle('projects:list', () => {
    return getAllProjects()
  })

  ipcMain.handle('projects:create', (_event, project: Omit<Project, 'id'>) => {
    if (!project.name || !project.color) {
      throw new Error('Project name and color are required')
    }
    return createProject(project)
  })

  ipcMain.handle('projects:update', (_event, project: Project) => {
    if (!project.id || !project.name || !project.color) {
      throw new Error('Project id, name and color are required')
    }
    return updateProject(project)
  })

  ipcMain.handle('projects:delete', (_event, projectId: number) => {
    deleteProject(projectId)
  })

  // Export handlers
  ipcMain.handle(
    'export:csv',
    (_event, startDate: string, endDate: string) => {
      return exportToCSV(startDate, endDate)
    }
  )

  ipcMain.handle(
    'export:json',
    (_event, startDate: string, endDate: string) => {
      return exportToJSON(startDate, endDate)
    }
  )
}
