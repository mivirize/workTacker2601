import { contextBridge, ipcRenderer } from 'electron'
import type {
  Activity,
  Category,
  Tag,
  Project,
  AppSettings,
  TrackingState,
  DailySummary,
  WeeklySummary,
  MonthlySummary,
  AppDuration,
  SearchFilters,
  Goal,
  GoalProgress,
  CreateActivityInput,
  UpdateActivityInput,
  CalendarDaySummary,
} from '../shared/types'

const api = {
  // Diagnostics - for debugging IPC issues
  diag: {
    ping: (): Promise<{
      message: string
      timestamp: number
      platform: string
      nodeVersion: string
      electronVersion: string
    }> => ipcRenderer.invoke('diag:ping'),
    getLogs: (): Promise<string[]> => ipcRenderer.invoke('diag:logs'),
    testEncoding: (): Promise<{
      success: boolean
      tempFile?: string
      rawJson?: string
      hasBOM?: boolean
      firstBytesHex?: string
      parsed?: { title: string; appName: string; path: string }
      error?: string
    }> => ipcRenderer.invoke('diag:testEncoding'),
  },

  // Test
  test: {
    ping: (): Promise<{ message: string; timestamp: number }> =>
      ipcRenderer.invoke('test:ping'),
  },

  // Tracking
  tracking: {
    start: (): Promise<TrackingState> => ipcRenderer.invoke('tracking:start'),
    stop: (): Promise<TrackingState> => ipcRenderer.invoke('tracking:stop'),
    pause: (): Promise<TrackingState> => ipcRenderer.invoke('tracking:pause'),
    resume: (): Promise<TrackingState> => ipcRenderer.invoke('tracking:resume'),
    getState: (): Promise<TrackingState> => ipcRenderer.invoke('tracking:state'),
  },

  // Activities
  activities: {
    getToday: (): Promise<Activity[]> => ipcRenderer.invoke('activities:today'),
    getForDate: (date: string): Promise<Activity[]> =>
      ipcRenderer.invoke('activities:date', date),
    getForRange: (startDate: string, endDate: string): Promise<Activity[]> =>
      ipcRenderer.invoke('activities:range', startDate, endDate),
    search: (filters: SearchFilters): Promise<Activity[]> =>
      ipcRenderer.invoke('activities:search', filters),
    updateCategory: (activityId: number, categoryId: number | null): Promise<void> =>
      ipcRenderer.invoke('activities:updateCategory', activityId, categoryId),
    create: (input: CreateActivityInput): Promise<Activity> =>
      ipcRenderer.invoke('activities:create', input),
    update: (input: UpdateActivityInput): Promise<Activity> =>
      ipcRenderer.invoke('activities:update', input),
    delete: (activityId: number): Promise<void> =>
      ipcRenderer.invoke('activities:delete', activityId),
    getById: (activityId: number): Promise<Activity | null> =>
      ipcRenderer.invoke('activities:getById', activityId),
  },

  // Calendar
  calendar: {
    getMonthSummary: (yearMonth: string): Promise<CalendarDaySummary[]> =>
      ipcRenderer.invoke('calendar:monthSummary', yearMonth),
  },

  // Statistics
  stats: {
    getDaily: (date: string): Promise<DailySummary> =>
      ipcRenderer.invoke('stats:daily', date),
    getWeekly: (weekStart: string): Promise<WeeklySummary> =>
      ipcRenderer.invoke('stats:weekly', weekStart),
    getMonthly: (yearMonth: string): Promise<MonthlySummary> =>
      ipcRenderer.invoke('stats:monthly', yearMonth),
    getAppUsage: (
      startDate: string,
      endDate: string
    ): Promise<AppDuration[]> =>
      ipcRenderer.invoke('stats:appUsage', startDate, endDate),
  },

  // Categories
  categories: {
    getAll: (): Promise<Category[]> => ipcRenderer.invoke('categories:list'),
    create: (category: Omit<Category, 'id'>): Promise<Category> =>
      ipcRenderer.invoke('categories:create', category),
    update: (category: Category): Promise<Category> =>
      ipcRenderer.invoke('categories:update', category),
    delete: (categoryId: number): Promise<void> =>
      ipcRenderer.invoke('categories:delete', categoryId),
  },

  // Settings
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    update: (settings: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:update', settings),
  },

  // Goals
  goals: {
    getAll: (): Promise<Goal[]> => ipcRenderer.invoke('goals:list'),
    create: (goal: Omit<Goal, 'id'>): Promise<Goal> =>
      ipcRenderer.invoke('goals:create', goal),
    update: (goal: Goal): Promise<Goal> =>
      ipcRenderer.invoke('goals:update', goal),
    delete: (goalId: number): Promise<void> =>
      ipcRenderer.invoke('goals:delete', goalId),
    getProgress: (): Promise<GoalProgress[]> =>
      ipcRenderer.invoke('goals:progress'),
  },

  // Tags
  tags: {
    getAll: (): Promise<Tag[]> => ipcRenderer.invoke('tags:list'),
    create: (tag: Omit<Tag, 'id'>): Promise<Tag> =>
      ipcRenderer.invoke('tags:create', tag),
    update: (tag: Tag): Promise<Tag> =>
      ipcRenderer.invoke('tags:update', tag),
    delete: (tagId: number): Promise<void> =>
      ipcRenderer.invoke('tags:delete', tagId),
    setForActivity: (activityId: number, tagIds: number[]): Promise<void> =>
      ipcRenderer.invoke('tags:setForActivity', activityId, tagIds),
    reapplyToAll: (): Promise<{ processedCount: number; updatedCount: number }> =>
      ipcRenderer.invoke('tags:reapplyToAll'),
  },

  // Projects
  projects: {
    getAll: (): Promise<Project[]> => ipcRenderer.invoke('projects:list'),
    create: (project: Omit<Project, 'id'>): Promise<Project> =>
      ipcRenderer.invoke('projects:create', project),
    update: (project: Project): Promise<Project> =>
      ipcRenderer.invoke('projects:update', project),
    delete: (projectId: number): Promise<void> =>
      ipcRenderer.invoke('projects:delete', projectId),
  },

  // Export
  export: {
    toCSV: (startDate: string, endDate: string): Promise<string> =>
      ipcRenderer.invoke('export:csv', startDate, endDate),
    toJSON: (startDate: string, endDate: string): Promise<string> =>
      ipcRenderer.invoke('export:json', startDate, endDate),
  },
}

contextBridge.exposeInMainWorld('api', api)

// Type declaration for renderer
declare global {
  interface Window {
    api: typeof api
  }
}
