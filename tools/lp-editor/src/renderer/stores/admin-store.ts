/**
 * Admin Store
 *
 * Zustand store for managing admin mode state.
 * Used for the LPEditorForAdmin feature.
 */

import { create } from 'zustand'

interface ProjectInfo {
  id: string
  name: string
  client: string
  path: string
  lastModified: string
  hasHistory: boolean
  buildCount: number
  thumbnailPath?: string
}

interface ProjectStats {
  markers: number
  repeatBlocks: number
  colors: number
  images: number
  pages: number
}

interface AdminState {
  // Mode
  isAdminMode: boolean

  // Projects
  projectsDir: string
  projects: ProjectInfo[]
  selectedProjectId: string | null
  selectedProjectStats: ProjectStats | null

  // UI State
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortBy: 'name' | 'client' | 'lastModified' | 'buildCount'
  sortOrder: 'asc' | 'desc'

  // Actions
  setAdminMode: (isAdmin: boolean) => void
  setProjectsDir: (dir: string) => void
  setProjects: (projects: ProjectInfo[]) => void
  setSelectedProject: (projectId: string | null) => void
  setSelectedProjectStats: (stats: ProjectStats | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: AdminState['sortBy']) => void
  setSortOrder: (sortOrder: AdminState['sortOrder']) => void
  loadProjects: (dir: string) => Promise<void>
  loadProjectStats: (projectPath: string) => Promise<void>
  generateScreenshot: (projectPath: string) => Promise<string | null>
  initializeAdmin: () => Promise<void>
  openInEditor: (projectId: string) => void
  reset: () => void
}

const initialState = {
  isAdminMode: false,
  projectsDir: '',
  projects: [] as ProjectInfo[],
  selectedProjectId: null as string | null,
  selectedProjectStats: null as ProjectStats | null,
  isLoading: false,
  error: null as string | null,
  searchQuery: '',
  sortBy: 'lastModified' as const,
  sortOrder: 'desc' as const,
}

export const useAdminStore = create<AdminState>((set, get) => ({
  ...initialState,

  setAdminMode: (isAdmin) => set({ isAdminMode: isAdmin }),
  setProjectsDir: (dir) => set({ projectsDir: dir }),
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (projectId) => set({ selectedProjectId: projectId }),
  setSelectedProjectStats: (stats) => set({ selectedProjectStats: stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),

  loadProjects: async (dir: string) => {
    set({ isLoading: true, error: null })
    try {
      const projects = await window.electronAPI.listProjects(dir)
      set({
        projectsDir: dir,
        projects,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'プロジェクト一覧の取得に失敗しました'
      set({ error: message, isLoading: false })
    }
  },

  // Initialize admin mode - load saved projects dir if exists
  initializeAdmin: async () => {
    try {
      const savedDir = await window.electronAPI.getLastProjectsDir()
      if (savedDir) {
        const projects = await window.electronAPI.listProjects(savedDir)
        set({
          projectsDir: savedDir,
          projects,
        })
      }
    } catch (err) {
      console.error('Failed to initialize admin:', err)
    }
  },

  loadProjectStats: async (projectPath: string) => {
    try {
      const stats = await window.electronAPI.getProjectStats(projectPath)
      set({ selectedProjectStats: stats })
    } catch (err) {
      console.error('Failed to load project stats:', err)
    }
  },

  generateScreenshot: async (projectPath: string) => {
    try {
      const screenshotPath = await window.electronAPI.generateScreenshot(projectPath)
      if (screenshotPath) {
        // Update the project's thumbnailPath in the store
        const { projects } = get()
        const updatedProjects = projects.map((p) =>
          p.path === projectPath ? { ...p, thumbnailPath: screenshotPath } : p
        )
        set({ projects: updatedProjects })
        return screenshotPath
      }
      return null
    } catch (err) {
      console.error('Failed to generate screenshot:', err)
      return null
    }
  },

  openInEditor: (projectId: string) => {
    const { projects } = get()
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      // Open project in editor mode
      window.electronAPI.openProject(project.path)
      // Disable admin mode
      set({ isAdminMode: false })
    }
  },

  reset: () => set(initialState),
}))

/**
 * Get filtered and sorted projects
 */
export function useFilteredProjects() {
  const { projects, searchQuery, sortBy, sortOrder } = useAdminStore()

  // Filter by search query
  const filtered = projects.filter((project) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.client.toLowerCase().includes(query) ||
      project.path.toLowerCase().includes(query)
    )
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'client':
        comparison = a.client.localeCompare(b.client)
        break
      case 'lastModified':
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
        break
      case 'buildCount':
        comparison = a.buildCount - b.buildCount
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  return sorted
}
