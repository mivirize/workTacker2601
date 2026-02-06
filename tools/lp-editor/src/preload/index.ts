/**
 * LP-Editor Preload Script
 *
 * Exposes secure IPC methods to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project initialization and validation
  initProject: () => ipcRenderer.invoke('init-project'),
  getProjectPath: () => ipcRenderer.invoke('get-project-path'),
  selectProject: () => ipcRenderer.invoke('select-project'),
  openProject: (projectPath: string) => ipcRenderer.invoke('open-project', projectPath),

  // Project info
  getProjectInfo: () => ipcRenderer.invoke('get-project-info'),

  // Get src path for base href
  getSrcPath: () => ipcRenderer.invoke('get-src-path'),

  // HTML operations
  loadHtml: (path: string) => ipcRenderer.invoke('load-html', path),

  // Content operations
  loadContent: () => ipcRenderer.invoke('load-content'),
  saveContent: (content: object) => ipcRenderer.invoke('save-content', content),

  // Page-specific content operations (for multi-page support)
  loadPageContent: (pageId: string) => ipcRenderer.invoke('load-page-content', pageId),
  savePageContent: (pageId: string, content: object) =>
    ipcRenderer.invoke('save-page-content', pageId, content),
  listPageContents: () => ipcRenderer.invoke('list-page-contents'),

  // Image operations
  selectImage: () => ipcRenderer.invoke('select-image'),
  copyImage: (sourcePath: string, targetName: string) =>
    ipcRenderer.invoke('copy-image', sourcePath, targetName),
  getImageInfo: (filePath: string) => ipcRenderer.invoke('get-image-info', filePath),
  optimizeImage: (sourcePath: string, options: ImageOptimizeOptions) =>
    ipcRenderer.invoke('optimize-image', sourcePath, options),

  // Export operations
  selectExportFolder: () => ipcRenderer.invoke('select-export-folder'),
  exportHtml: (htmlContent: string, outputDir?: string) => ipcRenderer.invoke('export-html', htmlContent, outputDir),
  showOutputFolder: (outputDir?: string) => ipcRenderer.invoke('show-output-folder', outputDir),

  // Admin mode operations
  isAdminMode: () => ipcRenderer.invoke('is-admin-mode'),
  listProjects: (baseDir: string) => ipcRenderer.invoke('list-projects', baseDir),
  getProjectStats: (projectPath: string) => ipcRenderer.invoke('get-project-stats', projectPath),
  loadThumbnail: (thumbnailPath: string) => ipcRenderer.invoke('load-thumbnail', thumbnailPath),
  exportProject: (projectPath: string, options?: ExportOptions) => ipcRenderer.invoke('export-project', projectPath, options),
  validateLpContent: (projectPath: string) => ipcRenderer.invoke('validate-lp-content', projectPath),
  selectProjectsDir: () => ipcRenderer.invoke('select-projects-dir'),
  getLastProjectsDir: () => ipcRenderer.invoke('get-last-projects-dir'),
  returnToAdmin: () => ipcRenderer.invoke('return-to-admin'),
  generateScreenshot: (projectPath: string) => ipcRenderer.invoke('generate-screenshot', projectPath),
})

// Page configuration
export interface PageConfig {
  id: string
  path: string
  label: string
}

// Image optimization options
export interface ImageOptimizeOptions {
  quality?: number  // 1-100
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
}

// Image info
export interface ImageInfo {
  size: number
  width: number | undefined
  height: number | undefined
  format: string | undefined
}

// Project validation result
export interface ProjectValidation {
  valid: boolean
  path: string
  hasConfig: boolean
  hasHtml: boolean
  error?: string
  needsSelection?: boolean
  source?: 'arg' | 'env' | 'cwd' | 'last' | 'packaged' | 'none'
}

// Type declaration for window.electronAPI
export interface ElectronAPI {
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
  exportProject: (projectPath: string, options?: ExportOptions) => Promise<string | null>
  validateLpContent: (projectPath: string) => Promise<LpValidationResult>
  generateScreenshot: (projectPath: string) => Promise<string | null>
}

// Export options
export interface ExportOptions {
  includeEditor?: boolean
}

// LP Validation types
export interface LpValidationWarning {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  element?: string
}

export interface LpValidationResult {
  valid: boolean
  warnings: LpValidationWarning[]
}

// Project list item (for admin mode)
export interface ProjectListItem {
  id: string
  name: string
  client: string
  path: string
  lastModified: string
  hasHistory: boolean
  buildCount: number
  thumbnailPath?: string
}

// Project statistics
export interface ProjectStats {
  markers: number
  repeatBlocks: number
  colors: number
  images: number
  pages: number
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
