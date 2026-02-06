/**
 * Global Type Definitions for Renderer Process
 */

interface PageConfig {
  id: string
  path: string
  label: string
}

interface ImageOptimizeOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
}

interface ImageInfo {
  size: number
  width: number | undefined
  height: number | undefined
  format: string | undefined
}

interface ProjectValidation {
  valid: boolean
  path: string
  hasConfig: boolean
  hasHtml: boolean
  error?: string
  needsSelection?: boolean
  source?: 'arg' | 'env' | 'cwd' | 'last' | 'packaged' | 'none'
}

interface ProjectListItem {
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

interface ElectronAPI {
  // Project management
  initProject: () => Promise<ProjectValidation>
  getProjectPath: () => Promise<string>
  selectProject: () => Promise<ProjectValidation | null>
  openProject: (projectPath: string) => Promise<ProjectValidation>

  getProjectInfo: () => Promise<{
    name: string
    client: string
    version: string
    entry: string
    pages?: PageConfig[]
    output: { appName: string; fileName: string }
    editables?: Record<string, { type: string; label?: string; group?: string }>
    colors?: Record<string, { value: string; label?: string; description?: string }>
    groups?: Record<string, { label: string; order?: number }>
  } | null>
  getSrcPath: () => Promise<string>
  loadHtml: (path: string) => Promise<string>
  loadContent: () => Promise<{
    _meta: { name: string; client: string; version: string; generatedAt: string }
    editables: Record<string, { type: string; value: string | null; label?: string; group?: string; href?: string; src?: string }>
    repeatBlocks: Record<string, { min: number; max: number; items: Array<Record<string, { type: string; value: string | null }>> }>
    colors: Record<string, string>
  } | null>
  saveContent: (content: object) => Promise<boolean>

  // Page-specific content (for multi-page support)
  loadPageContent: (pageId: string) => Promise<{
    editables: Record<string, { type: string; value: string | null; label?: string; group?: string; href?: string; src?: string }>
    repeatBlocks: Record<string, { min: number; max: number; items: Array<Record<string, { type: string; value: string | null }>> }>
  } | null>
  savePageContent: (pageId: string, content: object) => Promise<boolean>
  listPageContents: () => Promise<string[]>

  selectImage: () => Promise<string | null>
  copyImage: (sourcePath: string, targetName: string) => Promise<string>
  getImageInfo: (filePath: string) => Promise<ImageInfo>
  optimizeImage: (sourcePath: string, options: ImageOptimizeOptions) => Promise<string>
  selectExportFolder: () => Promise<string | null>
  exportHtml: (htmlContent: string, outputDir?: string) => Promise<string | null>
  showOutputFolder: (outputDir?: string) => Promise<void>

  // Admin mode operations
  isAdminMode: () => Promise<boolean>
  listProjects: (baseDir: string) => Promise<ProjectListItem[]>
  getProjectStats: (projectPath: string) => Promise<ProjectStats>
  loadThumbnail: (thumbnailPath: string) => Promise<string | null>
  selectProjectsDir: () => Promise<string | null>
  getLastProjectsDir: () => Promise<string | null>
  returnToAdmin: () => Promise<boolean>
  exportProject: (projectPath: string) => Promise<string | null>
  generateScreenshot: (projectPath: string) => Promise<string | null>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
