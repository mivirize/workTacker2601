/**
 * LP-Editor Main Process
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { join, dirname } from 'path'
import { readFile, writeFile, mkdir, copyFile, readdir, rm, stat } from 'fs/promises'
import { existsSync } from 'fs'
import sharp from 'sharp'

// Image optimization options type
interface ImageOptimizeOptions {
  quality?: number  // 1-100
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
}

// Image info type
interface ImageInfo {
  size: number
  width: number | undefined
  height: number | undefined
  format: string | undefined
}

// Project validation result
interface ProjectValidation {
  valid: boolean
  path: string
  hasConfig: boolean
  hasHtml: boolean
  error?: string
  needsSelection?: boolean
  source?: 'arg' | 'env' | 'cwd' | 'last' | 'packaged' | 'none'
}

// Settings file path
const SETTINGS_DIR = join(app.getPath('userData'), 'lp-editor')
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json')

let mainWindow: typeof BrowserWindow.prototype | null = null
let currentProjectPath: string | null = null

// Load settings from file
async function loadSettings(): Promise<{ lastProjectPath?: string }> {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const content = await readFile(SETTINGS_FILE, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return {}
}

// Save settings to file
async function saveSettings(settings: { lastProjectPath?: string }): Promise<void> {
  try {
    if (!existsSync(SETTINGS_DIR)) {
      await mkdir(SETTINGS_DIR, { recursive: true })
    }
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// Validate a project path
function validateProject(projectPath: string): ProjectValidation {
  const result: ProjectValidation = {
    valid: false,
    path: projectPath,
    hasConfig: false,
    hasHtml: false,
  }

  if (!existsSync(projectPath)) {
    result.error = `Project path does not exist: ${projectPath}`
    return result
  }

  // Check for lp-config.json
  const configPath = join(projectPath, 'lp-config.json')
  result.hasConfig = existsSync(configPath)

  // Check for src/index.html
  const htmlPath = join(projectPath, 'src', 'index.html')
  result.hasHtml = existsSync(htmlPath)

  if (!result.hasHtml) {
    result.error = `HTML file not found: src/index.html`
    return result
  }

  result.valid = true
  return result
}

// Get the app's base directory (where the exe is located or LP project path)
function getAppBasePath(): string {
  // Use current project path if set
  if (currentProjectPath) {
    return currentProjectPath
  }
  // Check for LP_PROJECT_PATH environment variable (for development)
  if (process.env.LP_PROJECT_PATH) {
    return process.env.LP_PROJECT_PATH
  }
  if (app.isPackaged) {
    return dirname(app.getPath('exe'))
  }
  return process.cwd()
}

// Get project path from command line arguments
function getArgProjectPath(): string | null {
  // Look for --project=path or -p path
  const args = process.argv
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--project=')) {
      return arg.substring('--project='.length)
    }
    if ((arg === '--project' || arg === '-p') && args[i + 1]) {
      return args[i + 1]
    }
  }
  return null
}

// Check if current working directory contains a valid LP project
function getCwdProjectPath(): string | null {
  const cwd = process.cwd()
  const configPath = join(cwd, 'lp-config.json')
  if (existsSync(configPath)) {
    return cwd
  }
  return null
}

// Get packaged app directory
function getPackagedAppPath(): string | null {
  if (app.isPackaged) {
    return dirname(app.getPath('exe'))
  }
  return null
}

// Initialize project path with validation
// Priority: 1. CLI args, 2. Env var, 3. CWD, 4. Last opened, 5. Packaged app path
async function initializeProject(): Promise<ProjectValidation> {
  type ProjectSource = 'arg' | 'env' | 'cwd' | 'last' | 'packaged'

  // Build candidates list with sources
  const candidates: Array<{ path: string; source: ProjectSource }> = []

  // 1. Command line arguments (--project=path)
  const argPath = getArgProjectPath()
  if (argPath) {
    candidates.push({ path: argPath, source: 'arg' })
  }

  // 2. Environment variable
  if (process.env.LP_PROJECT_PATH) {
    candidates.push({ path: process.env.LP_PROJECT_PATH, source: 'env' })
  }

  // 3. Current working directory
  const cwdPath = getCwdProjectPath()
  if (cwdPath) {
    candidates.push({ path: cwdPath, source: 'cwd' })
  }

  // 4. Last opened project from settings
  const settings = await loadSettings()
  if (settings.lastProjectPath && existsSync(settings.lastProjectPath)) {
    candidates.push({ path: settings.lastProjectPath, source: 'last' })
  }

  // 5. Packaged app directory
  const packagedPath = getPackagedAppPath()
  if (packagedPath) {
    candidates.push({ path: packagedPath, source: 'packaged' })
  }

  // Try each candidate in priority order
  for (const { path, source } of candidates) {
    const validation = validateProject(path)
    if (validation.valid) {
      currentProjectPath = path
      await saveSettings({ lastProjectPath: path })
      console.log(`Project loaded from ${source}: ${path}`)
      return { ...validation, source }
    }
    console.log(`Project candidate (${source}) failed: ${path} - ${validation.error}`)
  }

  // No valid project found - signal that selection is needed
  return {
    valid: false,
    path: '',
    hasConfig: false,
    hasHtml: false,
    error: 'No valid project found. Please select a project folder.',
    needsSelection: true,
    source: 'none'
  }
}

// Create the main window
function createWindow(): void {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local files and external resources in preview iframe
    },
    title: 'LP-Editor',
  })

  mainWindow = window

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open devtools in development
  if (!app.isPackaged) {
    window.webContents.openDevTools()
  }

  window.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers

// Initialize project and validate
ipcMain.handle('init-project', async () => {
  return await initializeProject()
})

// Get current project path
ipcMain.handle('get-project-path', async () => {
  return currentProjectPath || getAppBasePath()
})

// Select and open project folder
ipcMain.handle('select-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select LP Project Folder',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const projectPath = result.filePaths[0]
  const validation = validateProject(projectPath)

  if (validation.valid) {
    currentProjectPath = projectPath
    await saveSettings({ lastProjectPath: projectPath })
    console.log(`Project selected: ${projectPath}`)
  }

  return validation
})

// Open specific project path
ipcMain.handle('open-project', async (_event: IpcMainInvokeEvent, projectPath: string) => {
  const validation = validateProject(projectPath)

  if (validation.valid) {
    currentProjectPath = projectPath
    await saveSettings({ lastProjectPath: projectPath })
    console.log(`Project opened: ${projectPath}`)
  }

  return validation
})

// Get project info
ipcMain.handle('get-project-info', async () => {
  const basePath = getAppBasePath()
  const configPath = join(basePath, 'lp-config.json')

  if (!existsSync(configPath)) {
    // Try src directory
    const srcConfigPath = join(basePath, 'src', 'lp-config.json')
    if (existsSync(srcConfigPath)) {
      const content = await readFile(srcConfigPath, 'utf-8')
      return JSON.parse(content)
    }
    return null
  }

  const content = await readFile(configPath, 'utf-8')
  return JSON.parse(content)
})

// Get src directory path for base href
ipcMain.handle('get-src-path', async () => {
  const basePath = getAppBasePath()
  const srcPath = join(basePath, 'src')
  // Convert to file:// URL format for iframe base href
  // On Windows, paths like C:\foo need to become file:///C:/foo/
  const fileUrl = 'file:///' + srcPath.replace(/\\/g, '/') + '/'
  return fileUrl
})

// Load HTML content
ipcMain.handle('load-html', async (_event: IpcMainInvokeEvent, relativePath: string) => {
  const basePath = getAppBasePath()
  const fullPath = join(basePath, relativePath)

  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`)
  }

  return await readFile(fullPath, 'utf-8')
})

// Load content.json
ipcMain.handle('load-content', async () => {
  const basePath = getAppBasePath()
  const contentPath = join(basePath, 'data', 'content.json')

  if (!existsSync(contentPath)) {
    return null
  }

  const content = await readFile(contentPath, 'utf-8')
  return JSON.parse(content)
})

// Save content.json
ipcMain.handle('save-content', async (_event: IpcMainInvokeEvent, content: object) => {
  const basePath = getAppBasePath()
  const dataDir = join(basePath, 'data')
  const contentPath = join(dataDir, 'content.json')

  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true })
  }

  await writeFile(contentPath, JSON.stringify(content, null, 2), 'utf-8')
  return true
})

// Load page-specific content (for multi-page support)
ipcMain.handle('load-page-content', async (_event: IpcMainInvokeEvent, pageId: string) => {
  const basePath = getAppBasePath()
  const pageContentPath = join(basePath, 'data', 'pages', `${pageId}.json`)

  if (!existsSync(pageContentPath)) {
    return null
  }

  const content = await readFile(pageContentPath, 'utf-8')
  return JSON.parse(content)
})

// Save page-specific content (for multi-page support)
ipcMain.handle('save-page-content', async (_event: IpcMainInvokeEvent, pageId: string, content: object) => {
  const basePath = getAppBasePath()
  const pagesDir = join(basePath, 'data', 'pages')
  const pageContentPath = join(pagesDir, `${pageId}.json`)

  if (!existsSync(pagesDir)) {
    await mkdir(pagesDir, { recursive: true })
  }

  await writeFile(pageContentPath, JSON.stringify(content, null, 2), 'utf-8')
  return true
})

// List all page content files
ipcMain.handle('list-page-contents', async () => {
  const basePath = getAppBasePath()
  const pagesDir = join(basePath, 'data', 'pages')

  if (!existsSync(pagesDir)) {
    return []
  }

  const files = await readdir(pagesDir)
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
})

// Select image file
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// Copy image to project
ipcMain.handle('copy-image', async (_event: IpcMainInvokeEvent, sourcePath: string, targetName: string) => {
  const basePath = getAppBasePath()
  const imagesDir = join(basePath, 'src', 'images')

  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true })
  }

  const targetPath = join(imagesDir, targetName)
  await copyFile(sourcePath, targetPath)

  return `images/${targetName}`
})

// Get image info
ipcMain.handle('get-image-info', async (_event: IpcMainInvokeEvent, filePath: string): Promise<ImageInfo> => {
  const stats = await stat(filePath)
  const metadata = await sharp(filePath).metadata()
  return {
    size: stats.size,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format
  }
})

// Optimize image
ipcMain.handle('optimize-image', async (_event: IpcMainInvokeEvent, sourcePath: string, options: ImageOptimizeOptions) => {
  const basePath = getAppBasePath()
  const outputDir = join(basePath, 'src', 'images')
  const outputFormat = options.format || 'webp'
  const fileName = `optimized-${Date.now()}.${outputFormat}`
  const outputPath = join(outputDir, fileName)

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  let pipeline = sharp(sourcePath)

  // Resize if dimensions specified
  if (options.maxWidth || options.maxHeight) {
    pipeline = pipeline.resize(options.maxWidth, options.maxHeight, { fit: 'inside' })
  }

  // Apply format-specific options
  const quality = options.quality || 80
  if (outputFormat === 'webp') {
    pipeline = pipeline.webp({ quality })
  } else if (outputFormat === 'jpeg') {
    pipeline = pipeline.jpeg({ quality })
  } else if (outputFormat === 'png') {
    pipeline = pipeline.png({ quality })
  }

  await pipeline.toFile(outputPath)
  return `images/${fileName}`
})

// Select export folder
ipcMain.handle('select-export-folder', async () => {
  const basePath = getAppBasePath()
  const defaultPath = join(basePath, 'output')

  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: '出力先フォルダを選択',
    defaultPath: defaultPath,
    buttonLabel: 'このフォルダに出力',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// Export HTML
ipcMain.handle('export-html', async (_event: IpcMainInvokeEvent, htmlContent: string, outputDir?: string) => {
  const basePath = getAppBasePath()

  // If no output directory specified, prompt user to select one
  if (!outputDir) {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: '出力先フォルダを選択',
      defaultPath: join(basePath, 'output'),
      buttonLabel: 'このフォルダに出力',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null // User cancelled
    }

    outputDir = result.filePaths[0]
  }

  // Clean output directory
  if (existsSync(outputDir)) {
    await rm(outputDir, { recursive: true, force: true })
  }
  await mkdir(outputDir, { recursive: true })

  // Remove data-editable attributes from HTML
  const cleanHtml = removeMarkers(htmlContent)

  // Write HTML
  await writeFile(join(outputDir, 'index.html'), cleanHtml, 'utf-8')

  // Copy CSS
  const srcCssDir = join(basePath, 'src', 'css')
  if (existsSync(srcCssDir)) {
    const outCssDir = join(outputDir, 'css')
    await mkdir(outCssDir, { recursive: true })
    await copyDirectory(srcCssDir, outCssDir)
  }

  // Copy JS
  const srcJsDir = join(basePath, 'src', 'js')
  if (existsSync(srcJsDir)) {
    const outJsDir = join(outputDir, 'js')
    await mkdir(outJsDir, { recursive: true })
    await copyDirectory(srcJsDir, outJsDir)
  }

  // Copy images
  const srcImagesDir = join(basePath, 'src', 'images')
  if (existsSync(srcImagesDir)) {
    const outImagesDir = join(outputDir, 'images')
    await mkdir(outImagesDir, { recursive: true })
    await copyDirectory(srcImagesDir, outImagesDir)
  }

  return outputDir
})

// Show output folder
ipcMain.handle('show-output-folder', async (_event: IpcMainInvokeEvent, outputDir?: string) => {
  if (!outputDir) {
    const basePath = getAppBasePath()
    outputDir = join(basePath, 'output')
  }

  shell.openPath(outputDir)
})

// Helper: Remove markers from HTML
function removeMarkers(html: string): string {
  const markerAttributes = [
    'data-editable',
    'data-type',
    'data-label',
    'data-group',
    'data-placeholder',
    'data-recommended-size',
    'data-max-size',
    'data-accept',
    'data-text-editable',
    'data-allow-external',
    'data-css-var',
    'data-repeat',
    'data-repeat-item',
    'data-repeat-min',
    'data-repeat-max',
  ]

  let result = html
  for (const attr of markerAttributes) {
    // Remove attribute with quoted value
    result = result.replace(new RegExp(`\\s*${attr}="[^"]*"`, 'g'), '')
    // Remove attribute with single quoted value
    result = result.replace(new RegExp(`\\s*${attr}='[^']*'`, 'g'), '')
    // Remove attribute without value
    result = result.replace(new RegExp(`\\s*${attr}(?=\\s|>)`, 'g'), '')
  }

  return result
}

// Helper: Copy directory recursively
async function copyDirectory(src: string, dest: string): Promise<void> {
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await mkdir(destPath, { recursive: true })
      await copyDirectory(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

// ===========================================
// Admin Mode IPC Handlers
// ===========================================

// Project info for admin list
interface ProjectListItem {
  id: string
  name: string
  client: string
  path: string
  lastModified: string
  hasHistory: boolean
  buildCount: number
}

// Scan directory for LP projects
async function scanForProjects(baseDir: string): Promise<ProjectListItem[]> {
  const projects: ProjectListItem[] = []

  if (!existsSync(baseDir)) {
    return projects
  }

  const entries = await readdir(baseDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const projectPath = join(baseDir, entry.name)
    const configPath = join(projectPath, 'lp-config.json')

    if (existsSync(configPath)) {
      try {
        const configContent = await readFile(configPath, 'utf-8')
        const config = JSON.parse(configContent)
        const stats = await stat(configPath)

        // Check for build history
        const historyPath = join(projectPath, '.lp-history', 'manifest.json')
        let buildCount = 0
        if (existsSync(historyPath)) {
          try {
            const historyContent = await readFile(historyPath, 'utf-8')
            const history = JSON.parse(historyContent)
            buildCount = history.builds?.length || 0
          } catch {
            // Ignore history parse errors
          }
        }

        projects.push({
          id: entry.name,
          name: config.name || entry.name,
          client: config.client || 'Unknown',
          path: projectPath,
          lastModified: stats.mtime.toISOString(),
          hasHistory: buildCount > 0,
          buildCount,
        })
      } catch {
        // Skip invalid config files
      }
    }
  }

  return projects.sort((a, b) =>
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  )
}

// List projects in a directory
ipcMain.handle('list-projects', async (_event: IpcMainInvokeEvent, baseDir: string) => {
  return await scanForProjects(baseDir)
})

// Get project statistics
ipcMain.handle('get-project-stats', async (_event: IpcMainInvokeEvent, projectPath: string) => {
  const stats = {
    markers: 0,
    repeatBlocks: 0,
    colors: 0,
    images: 0,
    pages: 1,
  }

  // Count from lp-config.json if available
  const configPath = join(projectPath, 'lp-config.json')
  if (existsSync(configPath)) {
    try {
      const configContent = await readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent)
      if (config.pages) {
        stats.pages = config.pages.length
      }
    } catch {
      // Ignore errors
    }
  }

  // Count images in src/images
  const imagesPath = join(projectPath, 'src', 'images')
  if (existsSync(imagesPath)) {
    try {
      const images = await readdir(imagesPath)
      stats.images = images.filter(f =>
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)
      ).length
    } catch {
      // Ignore errors
    }
  }

  return stats
})

// Check if admin mode is requested
ipcMain.handle('is-admin-mode', async () => {
  return process.argv.includes('--admin')
})

// Select projects directory
ipcMain.handle('select-projects-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'プロジェクトフォルダを選択',
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})
