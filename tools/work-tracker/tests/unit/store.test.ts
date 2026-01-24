import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock window.api before importing store
const mockApi = {
  tracking: {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getState: vi.fn(),
  },
  stats: {
    getDaily: vi.fn(),
    getWeekly: vi.fn(),
    getMonthly: vi.fn(),
  },
  categories: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setAppCategory: vi.fn(),
  },
  settings: {
    get: vi.fn(),
    update: vi.fn(),
  },
}

// Set up window.api mock
Object.defineProperty(globalThis, 'window', {
  value: { api: mockApi },
  writable: true,
})

// Import store after mocking
import { useAppStore } from '../../src/renderer/stores/app-store'

describe('AppStore', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    // Reset store state
    useAppStore.setState({
      trackingState: {
        isTracking: false,
        isPaused: false,
        isIdle: false,
        lastActivity: Date.now(),
      },
      dailySummary: null,
      categories: [],
      settings: null,
      selectedDate: new Date().toISOString().split('T')[0],
      isLoadingSummary: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Tracking Actions', () => {
    it('should start tracking', async () => {
      const mockState = {
        isTracking: true,
        isPaused: false,
        isIdle: false,
        currentApp: 'Test App',
        currentTitle: 'Test Window',
        lastActivity: Date.now(),
      }
      mockApi.tracking.start.mockResolvedValue(mockState)

      const store = useAppStore.getState()
      await store.startTracking()

      expect(mockApi.tracking.start).toHaveBeenCalled()
      expect(useAppStore.getState().trackingState.isTracking).toBe(true)
    })

    it('should stop tracking', async () => {
      const mockState = {
        isTracking: false,
        isPaused: false,
        isIdle: false,
        lastActivity: Date.now(),
      }
      mockApi.tracking.stop.mockResolvedValue(mockState)

      const store = useAppStore.getState()
      await store.stopTracking()

      expect(mockApi.tracking.stop).toHaveBeenCalled()
      expect(useAppStore.getState().trackingState.isTracking).toBe(false)
    })

    it('should pause tracking', async () => {
      const mockState = {
        isTracking: true,
        isPaused: true,
        isIdle: false,
        lastActivity: Date.now(),
      }
      mockApi.tracking.pause.mockResolvedValue(mockState)

      const store = useAppStore.getState()
      await store.pauseTracking()

      expect(mockApi.tracking.pause).toHaveBeenCalled()
      expect(useAppStore.getState().trackingState.isPaused).toBe(true)
    })

    it('should resume tracking', async () => {
      const mockState = {
        isTracking: true,
        isPaused: false,
        isIdle: false,
        currentApp: 'Test App',
        currentTitle: 'Test Window',
        lastActivity: Date.now(),
      }
      mockApi.tracking.resume.mockResolvedValue(mockState)

      const store = useAppStore.getState()
      await store.resumeTracking()

      expect(mockApi.tracking.resume).toHaveBeenCalled()
      expect(useAppStore.getState().trackingState.isPaused).toBe(false)
    })

    it('should fetch tracking state', async () => {
      const mockState = {
        isTracking: true,
        isPaused: false,
        isIdle: false,
        currentApp: 'Chrome',
        currentTitle: 'Google',
        lastActivity: Date.now(),
      }
      mockApi.tracking.getState.mockResolvedValue(mockState)

      const store = useAppStore.getState()
      await store.fetchTrackingState()

      expect(mockApi.tracking.getState).toHaveBeenCalled()
      expect(useAppStore.getState().trackingState).toEqual(mockState)
    })

    it('should handle tracking start error gracefully', async () => {
      mockApi.tracking.start.mockRejectedValue(new Error('Failed to start'))

      const store = useAppStore.getState()
      await store.startTracking()

      // Should not throw, just log error
      expect(mockApi.tracking.start).toHaveBeenCalled()
    })
  })

  describe('Data Actions', () => {
    it('should fetch daily summary', async () => {
      const mockSummary = {
        date: '2025-01-23',
        totalDuration: 3600,
        productiveDuration: 2400,
        idleDuration: 1200,
        appBreakdown: [
          { appName: 'VSCode', duration: 2000, percentage: 55.5, categoryId: 1 },
          { appName: 'Chrome', duration: 1600, percentage: 44.5, categoryId: 2 },
        ],
        categoryBreakdown: [
          { categoryId: 1, name: 'Work', duration: 2000, percentage: 55.5, color: '#4f46e5' },
        ],
        timeline: [],
      }
      mockApi.stats.getDaily.mockResolvedValue(mockSummary)

      const store = useAppStore.getState()
      await store.fetchDailySummary('2025-01-23')

      expect(mockApi.stats.getDaily).toHaveBeenCalledWith('2025-01-23')
      expect(useAppStore.getState().dailySummary).toEqual(mockSummary)
      expect(useAppStore.getState().isLoadingSummary).toBe(false)
    })

    it('should fetch daily summary with default date', async () => {
      const mockSummary = {
        date: '2025-01-23',
        totalDuration: 1000,
        productiveDuration: 800,
        idleDuration: 200,
        appBreakdown: [],
        categoryBreakdown: [],
        timeline: [],
      }
      mockApi.stats.getDaily.mockResolvedValue(mockSummary)

      // Set specific selectedDate
      useAppStore.setState({ selectedDate: '2025-01-23' })

      const store = useAppStore.getState()
      await store.fetchDailySummary()

      expect(mockApi.stats.getDaily).toHaveBeenCalledWith('2025-01-23')
    })

    it('should handle fetch daily summary error gracefully', async () => {
      mockApi.stats.getDaily.mockRejectedValue(new Error('Network error'))

      const store = useAppStore.getState()
      await store.fetchDailySummary('2025-01-23')

      // Should not throw, just log error and clear loading state
      expect(useAppStore.getState().isLoadingSummary).toBe(false)
    })
  })

  describe('Category Actions', () => {
    it('should fetch categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Work', color: '#4f46e5', isDefault: true },
        { id: 2, name: 'Personal', color: '#10b981', isDefault: false },
      ]
      mockApi.categories.getAll.mockResolvedValue(mockCategories)

      const store = useAppStore.getState()
      await store.fetchCategories()

      expect(mockApi.categories.getAll).toHaveBeenCalled()
      expect(useAppStore.getState().categories).toEqual(mockCategories)
    })

    it('should handle fetch categories error gracefully', async () => {
      mockApi.categories.getAll.mockRejectedValue(new Error('Failed to fetch'))

      const store = useAppStore.getState()
      await store.fetchCategories()

      // Should not throw
      expect(mockApi.categories.getAll).toHaveBeenCalled()
    })
  })

  describe('Settings Actions', () => {
    it('should fetch settings', async () => {
      const mockSettings = {
        trackingIntervalMs: 5000,
        idleThresholdMs: 300000,
        launchOnStartup: false,
        minimizeToTray: true,
        excludedApps: [],
        dataRetentionDays: 90,
      }
      mockApi.settings.get.mockResolvedValue(mockSettings)

      const store = useAppStore.getState()
      await store.fetchSettings()

      expect(mockApi.settings.get).toHaveBeenCalled()
      expect(useAppStore.getState().settings).toEqual(mockSettings)
    })

    it('should handle fetch settings error gracefully', async () => {
      mockApi.settings.get.mockRejectedValue(new Error('Failed to fetch'))

      const store = useAppStore.getState()
      await store.fetchSettings()

      // Should not throw
      expect(mockApi.settings.get).toHaveBeenCalled()
    })
  })

  describe('Date Selection', () => {
    it('should set selected date', () => {
      const store = useAppStore.getState()
      store.setSelectedDate('2025-01-20')

      expect(useAppStore.getState().selectedDate).toBe('2025-01-20')
    })
  })

  describe('Direct State Setters', () => {
    it('should set tracking state directly', () => {
      const newState = {
        isTracking: true,
        isPaused: false,
        isIdle: false,
        lastActivity: Date.now(),
      }

      const store = useAppStore.getState()
      store.setTrackingState(newState)

      expect(useAppStore.getState().trackingState).toEqual(newState)
    })

    it('should set daily summary directly', () => {
      const summary = {
        date: '2025-01-23',
        totalDuration: 1000,
        productiveDuration: 800,
        idleDuration: 200,
        appBreakdown: [],
        categoryBreakdown: [],
        timeline: [],
      }

      const store = useAppStore.getState()
      store.setDailySummary(summary)

      expect(useAppStore.getState().dailySummary).toEqual(summary)
    })

    it('should set categories directly', () => {
      const categories = [
        { id: 1, name: 'Test', color: '#000', isDefault: false },
      ]

      const store = useAppStore.getState()
      store.setCategories(categories)

      expect(useAppStore.getState().categories).toEqual(categories)
    })

    it('should set settings directly', () => {
      const settings = {
        trackingIntervalMs: 3000,
        idleThresholdMs: 180000,
        launchOnStartup: true,
        minimizeToTray: false,
        excludedApps: ['Notepad'],
        dataRetentionDays: 60,
      }

      const store = useAppStore.getState()
      store.setSettings(settings)

      expect(useAppStore.getState().settings).toEqual(settings)
    })

    it('should set loading state', () => {
      const store = useAppStore.getState()
      store.setIsLoadingSummary(true)

      expect(useAppStore.getState().isLoadingSummary).toBe(true)

      store.setIsLoadingSummary(false)
      expect(useAppStore.getState().isLoadingSummary).toBe(false)
    })
  })
})
