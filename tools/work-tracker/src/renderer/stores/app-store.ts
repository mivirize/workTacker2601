import { create } from 'zustand'
import { useMemo } from 'react'
import type {
  TrackingState,
  DailySummary,
  Category,
  Tag,
  Project,
  AppSettings,
  CalendarDaySummary,
} from '../../shared/types'
import { format } from 'date-fns'
import { log, logError } from '../utils/logger'

interface AppStore {
  // Tracking state
  trackingState: TrackingState
  setTrackingState: (state: TrackingState) => void

  // Selected date for viewing
  selectedDate: string
  setSelectedDate: (date: string) => void

  // Daily summary
  dailySummary: DailySummary | null
  setDailySummary: (summary: DailySummary | null) => void
  isLoadingSummary: boolean
  setIsLoadingSummary: (loading: boolean) => void

  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void

  // Tags
  tags: Tag[]
  setTags: (tags: Tag[]) => void

  // Projects
  projects: Project[]
  setProjects: (projects: Project[]) => void

  // Settings
  settings: AppSettings | null
  setSettings: (settings: AppSettings | null) => void

  // Calendar
  calendarMonth: string // yyyy-MM
  setCalendarMonth: (month: string) => void
  calendarSelectedDay: string | null // yyyy-MM-dd
  setCalendarSelectedDay: (day: string | null) => void
  calendarSummary: CalendarDaySummary[]
  setCalendarSummary: (summary: CalendarDaySummary[]) => void
  isLoadingCalendar: boolean
  fetchCalendarSummary: (yearMonth?: string) => Promise<void>

  // Actions
  fetchTrackingState: () => Promise<void>
  fetchDailySummary: (date?: string) => Promise<void>
  fetchCategories: () => Promise<void>
  fetchTags: () => Promise<void>
  fetchProjects: () => Promise<void>
  fetchSettings: () => Promise<void>
  startTracking: () => Promise<void>
  stopTracking: () => Promise<void>
  pauseTracking: () => Promise<void>
  resumeTracking: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  trackingState: {
    isTracking: false,
    isPaused: false,
    lastActivity: Date.now(),
    isIdle: false,
  },
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  dailySummary: null,
  isLoadingSummary: false,
  categories: [],
  tags: [],
  projects: [],
  settings: null,
  calendarMonth: format(new Date(), 'yyyy-MM'),
  calendarSelectedDay: null,
  calendarSummary: [],
  isLoadingCalendar: false,

  // Setters
  setTrackingState: (state) => set({ trackingState: state }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setDailySummary: (summary) => set({ dailySummary: summary }),
  setIsLoadingSummary: (loading) => set({ isLoadingSummary: loading }),
  setCategories: (categories) => set({ categories }),
  setTags: (tags) => set({ tags }),
  setProjects: (projects) => set({ projects }),
  setSettings: (settings) => set({ settings }),
  setCalendarMonth: (calendarMonth) => set({ calendarMonth }),
  setCalendarSelectedDay: (calendarSelectedDay) => set({ calendarSelectedDay }),
  setCalendarSummary: (calendarSummary) => set({ calendarSummary }),

  // Actions
  fetchTrackingState: async () => {
    try {
      log('[Store] fetchTrackingState called')
      const state = await window.api.tracking.getState()
      log('[Store] fetchTrackingState result:', state)
      if (state) {
        set({ trackingState: state })
      }
    } catch (error) {
      logError('[Store] Failed to fetch tracking state:', error)
    }
  },

  fetchDailySummary: async (date?: string) => {
    const targetDate = date ?? get().selectedDate
    log('[Store] fetchDailySummary called for date:', targetDate)
    set({ isLoadingSummary: true })
    try {
      const summary = await window.api.stats.getDaily(targetDate)
      log('[Store] fetchDailySummary result:', summary)
      set({ dailySummary: summary, isLoadingSummary: false })
    } catch (error) {
      logError('[Store] Failed to fetch daily summary:', error)
      set({ isLoadingSummary: false })
    }
  },

  fetchCategories: async () => {
    try {
      log('[Store] fetchCategories called')
      const categories = await window.api.categories.getAll()
      log('[Store] fetchCategories result:', categories)
      set({ categories })
    } catch (error) {
      logError('[Store] Failed to fetch categories:', error)
    }
  },

  fetchTags: async () => {
    try {
      log('[Store] fetchTags called')
      const tags = await window.api.tags.getAll()
      log('[Store] fetchTags result:', tags)
      set({ tags })
    } catch (error) {
      logError('[Store] Failed to fetch tags:', error)
    }
  },

  fetchProjects: async () => {
    try {
      log('[Store] fetchProjects called')
      const projects = await window.api.projects.getAll()
      log('[Store] fetchProjects result:', projects)
      set({ projects })
    } catch (error) {
      logError('[Store] Failed to fetch projects:', error)
    }
  },

  fetchSettings: async () => {
    try {
      log('[Store] fetchSettings called')
      const settings = await window.api.settings.get()
      log('[Store] fetchSettings result:', settings)
      if (settings) {
        set({ settings })
      }
    } catch (error) {
      logError('[Store] Failed to fetch settings:', error)
    }
  },

  fetchCalendarSummary: async (yearMonth?: string) => {
    const targetMonth = yearMonth ?? get().calendarMonth
    log('[Store] fetchCalendarSummary called for month:', targetMonth)
    set({ isLoadingCalendar: true })
    try {
      const summary = await window.api.calendar.getMonthSummary(targetMonth)
      log('[Store] fetchCalendarSummary result:', { count: summary.length })
      set({ calendarSummary: summary, isLoadingCalendar: false })
    } catch (error) {
      logError('[Store] Failed to fetch calendar summary:', error)
      set({ isLoadingCalendar: false })
    }
  },

  startTracking: async () => {
    try {
      const state = await window.api.tracking.start()
      set({ trackingState: state })
    } catch (error) {
      logError('Failed to start tracking:', error)
    }
  },

  stopTracking: async () => {
    try {
      const state = await window.api.tracking.stop()
      set({ trackingState: state })
    } catch (error) {
      logError('Failed to stop tracking:', error)
    }
  },

  pauseTracking: async () => {
    try {
      const state = await window.api.tracking.pause()
      set({ trackingState: state })
    } catch (error) {
      logError('Failed to pause tracking:', error)
    }
  },

  resumeTracking: async () => {
    try {
      const state = await window.api.tracking.resume()
      set({ trackingState: state })
    } catch (error) {
      logError('Failed to resume tracking:', error)
    }
  },
}))

// ============================================================
// Memoized Selectors
// ============================================================

/**
 * Returns a Map of category ID to Category object
 * Use this instead of creating Maps in components on every render
 */
export function useCategoryMap(): Map<number, Category> {
  const categories = useAppStore((state) => state.categories)
  return useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
}

/**
 * Returns a Map of tag ID to Tag object
 */
export function useTagMap(): Map<number, Tag> {
  const tags = useAppStore((state) => state.tags)
  return useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags])
}

/**
 * Returns a Map of project ID to Project object
 */
export function useProjectMap(): Map<number, Project> {
  const projects = useAppStore((state) => state.projects)
  return useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])
}

/**
 * Returns only active projects
 */
export function useActiveProjects(): Project[] {
  const projects = useAppStore((state) => state.projects)
  return useMemo(() => projects.filter((p) => p.isActive), [projects])
}

/**
 * Get a category by ID (returns undefined if not found)
 */
export function useCategoryById(id: number | null | undefined): Category | undefined {
  const categoryMap = useCategoryMap()
  return id != null ? categoryMap.get(id) : undefined
}

/**
 * Get tags by IDs
 */
export function useTagsByIds(ids: number[]): Tag[] {
  const tagMap = useTagMap()
  return useMemo(
    () => ids.map((id) => tagMap.get(id)).filter((t): t is Tag => t !== undefined),
    [ids, tagMap]
  )
}
