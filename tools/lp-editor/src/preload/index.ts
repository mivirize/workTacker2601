/**
 * LP-Editor Preload Script
 *
 * Exposes secure IPC methods to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project info
  getProjectInfo: () => ipcRenderer.invoke('get-project-info'),

  // Get src path for base href
  getSrcPath: () => ipcRenderer.invoke('get-src-path'),

  // HTML operations
  loadHtml: (path: string) => ipcRenderer.invoke('load-html', path),

  // Content operations
  loadContent: () => ipcRenderer.invoke('load-content'),
  saveContent: (content: object) => ipcRenderer.invoke('save-content', content),

  // Image operations
  selectImage: () => ipcRenderer.invoke('select-image'),
  copyImage: (sourcePath: string, targetName: string) =>
    ipcRenderer.invoke('copy-image', sourcePath, targetName),

  // Export operations
  exportHtml: (htmlContent: string) => ipcRenderer.invoke('export-html', htmlContent),
  showOutputFolder: () => ipcRenderer.invoke('show-output-folder'),
})

// Page configuration
export interface PageConfig {
  id: string
  path: string
  label: string
}

// Type declaration for window.electronAPI
export interface ElectronAPI {
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
  selectImage: () => Promise<string | null>
  copyImage: (sourcePath: string, targetName: string) => Promise<string>
  exportHtml: (htmlContent: string) => Promise<string>
  showOutputFolder: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
