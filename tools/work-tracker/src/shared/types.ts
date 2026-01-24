// ============================================
// Core Domain Types
// ============================================

export interface Activity {
  id: number
  appName: string
  windowTitle: string
  startTime: number
  endTime: number | null
  durationSeconds: number
  categoryId: number | null
  projectId: number | null
  isIdle: boolean
  url?: string
  tagIds: number[]
}

export interface Project {
  id: number
  name: string
  color: string
  description?: string
  isActive: boolean
}

export interface Tag {
  id: number
  name: string
  color: string
}

export interface Category {
  id: number
  name: string
  color: string
  rules: CategoryRule[]
  isDefault: boolean
  tagIds: number[]  // Default tags to auto-apply to activities in this category
}

export interface CategoryRule {
  type: 'app' | 'title' | 'url'
  pattern: string
  isRegex: boolean
  tagIds?: number[]  // Tags to apply when this specific rule matches
}

export interface Application {
  id: number
  name: string
  executablePath?: string
  icon?: string
  totalDuration: number
  categoryId: number | null
}

// ============================================
// Window Tracking Types
// ============================================

export interface ActiveWindowInfo {
  title: string
  owner: {
    name: string
    path?: string
  }
  url?: string
  timestamp: number
}

export interface TrackingState {
  isTracking: boolean
  isPaused: boolean
  lastActivity: number
  isIdle: boolean
}

// ============================================
// Statistics Types
// ============================================

export interface DailySummary {
  date: string
  totalDuration: number
  productiveDuration: number
  idleDuration: number
  categoryBreakdown: CategoryDuration[]
  appBreakdown: AppDuration[]
  timeline: TimelineEntry[]
}

export interface CategoryDuration {
  categoryId: number
  categoryName: string
  color: string
  duration: number
  percentage: number
}

export interface AppDuration {
  appName: string
  duration: number
  percentage: number
  categoryId: number | null
}

export interface TimelineEntry {
  startTime: number
  endTime: number
  appName: string
  windowTitle: string
  categoryId: number | null
  isIdle: boolean
}

export interface WeeklySummary {
  weekStart: string
  weekEnd: string
  dailySummaries: DailySummary[]
  totalDuration: number
  averageDailyDuration: number
  topApps: AppDuration[]
  topCategories: CategoryDuration[]
}

export interface MonthlySummary {
  month: string // YYYY-MM format
  totalDuration: number
  productiveDuration: number
  idleDuration: number
  workDays: number
  averageDailyDuration: number
  topApps: AppDuration[]
  topCategories: CategoryDuration[]
  dailyTotals: { date: string; duration: number }[]
}

// ============================================
// Activity Input Types (for Manual Entry)
// ============================================

export interface CreateActivityInput {
  appName: string
  windowTitle?: string
  startTime: number
  endTime: number
  categoryId: number | null
  projectId?: number | null
  isIdle?: boolean
  url?: string
  tagIds?: number[]
}

export interface UpdateActivityInput {
  id: number
  appName?: string
  windowTitle?: string
  startTime?: number
  endTime?: number
  categoryId?: number | null
  projectId?: number | null
  isIdle?: boolean
  url?: string
  tagIds?: number[]
}

// ============================================
// Calendar Types
// ============================================

export interface CalendarDaySummary {
  date: string // yyyy-MM-dd
  totalDuration: number // seconds
  activityCount: number
  categoryBreakdown: { categoryId: number; duration: number }[]
}

// ============================================
// Time Block Types (for interval grouping)
// ============================================

export type TimeBlockInterval = 5 | 10 | 15 | 30 | 60

export interface AppBreakdownEntry {
  appName: string
  duration: number
  percentage: number
  categoryId: number | null
  activities: Activity[]
}

export interface TimeBlock {
  startTime: number        // Unix timestamp (ms)
  endTime: number          // Unix timestamp (ms)
  dominantApp: string | null      // Most used app in this block
  dominantCategory: {
    id: number
    name: string
    color: string
  } | null
  totalDuration: number    // Total tracked seconds in this block
  idleDuration: number     // Idle seconds in this block
  activities: Activity[]   // All activities in this block
  appBreakdown: AppBreakdownEntry[]  // Breakdown by app
}

// ============================================
// Search/Filter Types
// ============================================

export interface SearchFilters {
  query?: string
  categoryIds?: number[]
  projectIds?: number[]
  appNames?: string[]
  tagIds?: number[]
  showIdle?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

// ============================================
// Goal Types
// ============================================

export type GoalType = 'daily' | 'weekly' | 'category'

export interface Goal {
  id: number
  type: GoalType
  targetMinutes: number
  categoryId: number | null
  isEnabled: boolean
}

export interface GoalProgress {
  goal: Goal
  currentMinutes: number
  percentage: number
  categoryName?: string
}

// ============================================
// Settings Types
// ============================================

export interface AppSettings {
  trackingIntervalMs: number
  idleThresholdMs: number
  excludedApps: string[]
  dataRetentionDays: number
  launchOnStartup: boolean
  minimizeToTray: boolean
  showNotifications: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  trackingIntervalMs: 5000,
  idleThresholdMs: 180000, // 3 minutes
  excludedApps: [],
  dataRetentionDays: 90,
  launchOnStartup: true,
  minimizeToTray: true,
  showNotifications: true,
}

// ============================================
// IPC Channel Types
// ============================================

export type IpcChannels = {
  // Tracking
  'tracking:start': () => void
  'tracking:stop': () => void
  'tracking:pause': () => void
  'tracking:resume': () => void
  'tracking:state': () => TrackingState

  // Activities
  'activities:today': () => Activity[]
  'activities:date': (date: string) => Activity[]
  'activities:range': (startDate: string, endDate: string) => Activity[]
  'activities:search': (filters: SearchFilters) => Activity[]
  'activities:updateCategory': (activityId: number, categoryId: number | null) => void
  'activities:create': (input: CreateActivityInput) => Activity
  'activities:update': (input: UpdateActivityInput) => Activity
  'activities:delete': (activityId: number) => void
  'activities:getById': (activityId: number) => Activity | null

  // Calendar
  'calendar:monthSummary': (yearMonth: string) => CalendarDaySummary[]

  // Statistics
  'stats:daily': (date: string) => DailySummary
  'stats:weekly': (weekStart: string) => WeeklySummary
  'stats:monthly': (yearMonth: string) => MonthlySummary
  'stats:appUsage': (startDate: string, endDate: string) => AppDuration[]

  // Categories
  'categories:list': () => Category[]
  'categories:create': (category: Omit<Category, 'id'>) => Category
  'categories:update': (category: Category) => Category
  'categories:delete': (categoryId: number) => void

  // Settings
  'settings:get': () => AppSettings
  'settings:update': (settings: Partial<AppSettings>) => AppSettings

  // Goals
  'goals:list': () => Goal[]
  'goals:create': (goal: Omit<Goal, 'id'>) => Goal
  'goals:update': (goal: Goal) => Goal
  'goals:delete': (goalId: number) => void
  'goals:progress': () => GoalProgress[]

  // Tags
  'tags:list': () => Tag[]
  'tags:create': (tag: Omit<Tag, 'id'>) => Tag
  'tags:update': (tag: Tag) => Tag
  'tags:delete': (tagId: number) => void
  'tags:setForActivity': (activityId: number, tagIds: number[]) => void

  // Projects
  'projects:list': () => Project[]
  'projects:create': (project: Omit<Project, 'id'>) => Project
  'projects:update': (project: Project) => Project
  'projects:delete': (projectId: number) => void

  // Export
  'export:csv': (startDate: string, endDate: string) => string
  'export:json': (startDate: string, endDate: string) => string
}

// ============================================
// Default Categories
// ============================================

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: '開発',
    color: '#10b981',
    isDefault: true,
    tagIds: [],
    rules: [
      { type: 'app', pattern: 'Code', isRegex: false },
      { type: 'app', pattern: 'Visual Studio', isRegex: false },
      { type: 'app', pattern: 'WebStorm', isRegex: false },
      { type: 'app', pattern: 'IntelliJ', isRegex: false },
      { type: 'app', pattern: 'Terminal', isRegex: false },
      { type: 'app', pattern: 'iTerm', isRegex: false },
      { type: 'app', pattern: 'Windows Terminal', isRegex: false },
      { type: 'app', pattern: 'cmd', isRegex: false },
      { type: 'app', pattern: 'PowerShell', isRegex: false },
      { type: 'title', pattern: 'GitHub', isRegex: false },
      { type: 'url', pattern: 'github.com', isRegex: false },
      { type: 'url', pattern: 'stackoverflow.com', isRegex: false },
    ],
  },
  {
    name: 'コミュニケーション',
    color: '#f59e0b',
    isDefault: true,
    tagIds: [],
    rules: [
      { type: 'app', pattern: 'Slack', isRegex: false },
      { type: 'app', pattern: 'Discord', isRegex: false },
      { type: 'app', pattern: 'Teams', isRegex: false },
      { type: 'app', pattern: 'Mail', isRegex: false },
      { type: 'app', pattern: 'Outlook', isRegex: false },
      { type: 'app', pattern: 'Gmail', isRegex: false },
      { type: 'title', pattern: 'Slack', isRegex: false },
      { type: 'url', pattern: 'slack.com', isRegex: false },
      { type: 'url', pattern: 'mail.google.com', isRegex: false },
    ],
  },
  {
    name: 'ドキュメント',
    color: '#6366f1',
    isDefault: true,
    tagIds: [],
    rules: [
      { type: 'app', pattern: 'Word', isRegex: false },
      { type: 'app', pattern: 'Excel', isRegex: false },
      { type: 'app', pattern: 'PowerPoint', isRegex: false },
      { type: 'app', pattern: 'Notion', isRegex: false },
      { type: 'app', pattern: 'Google Docs', isRegex: false },
      { type: 'app', pattern: 'Pages', isRegex: false },
      { type: 'app', pattern: 'Numbers', isRegex: false },
      { type: 'title', pattern: 'Notion', isRegex: false },
      { type: 'url', pattern: 'notion.so', isRegex: false },
      { type: 'url', pattern: 'docs.google.com', isRegex: false },
    ],
  },
  {
    name: 'ミーティング',
    color: '#8b5cf6',
    isDefault: true,
    tagIds: [],
    rules: [
      { type: 'app', pattern: 'Zoom', isRegex: false },
      { type: 'app', pattern: 'Google Meet', isRegex: false },
      { type: 'app', pattern: 'Webex', isRegex: false },
      { type: 'title', pattern: 'Zoom Meeting', isRegex: false },
      { type: 'title', pattern: 'Google Meet', isRegex: false },
      { type: 'url', pattern: 'meet.google.com', isRegex: false },
      { type: 'url', pattern: 'zoom.us', isRegex: false },
    ],
  },
  {
    name: 'ブラウジング',
    color: '#ec4899',
    isDefault: true,
    tagIds: [],
    rules: [
      { type: 'app', pattern: 'Chrome', isRegex: false },
      { type: 'app', pattern: 'Firefox', isRegex: false },
      { type: 'app', pattern: 'Safari', isRegex: false },
      { type: 'app', pattern: 'Edge', isRegex: false },
      { type: 'app', pattern: 'Brave', isRegex: false },
    ],
  },
  {
    name: 'その他',
    color: '#6b7280',
    isDefault: true,
    tagIds: [],
    rules: [],
  },
]
