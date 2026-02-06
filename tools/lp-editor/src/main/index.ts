/**
 * LP-Editor Main Process
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { join, dirname, basename } from 'path'
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
  source?: 'current' | 'arg' | 'env' | 'cwd' | 'last' | 'packaged' | 'none'
}

// Settings file path
const SETTINGS_DIR = join(app.getPath('userData'), 'lp-editor')
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json')

let mainWindow: typeof BrowserWindow.prototype | null = null
let currentProjectPath: string | null = null

// Settings interface
interface AppSettings {
  lastProjectPath?: string
  lastProjectsDir?: string
}

// Load settings from file
async function loadSettings(): Promise<AppSettings> {
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

// Save settings to file (merges with existing settings)
async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    if (!existsSync(SETTINGS_DIR)) {
      await mkdir(SETTINGS_DIR, { recursive: true })
    }
    const existing = await loadSettings()
    const merged = { ...existing, ...settings }
    await writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8')
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
// Priority: 0. Current (already opened), 1. CLI args, 2. Env var, 3. CWD, 4. Last opened, 5. Packaged app path
async function initializeProject(): Promise<ProjectValidation> {
  type ProjectSource = 'current' | 'arg' | 'env' | 'cwd' | 'last' | 'packaged'

  // If currentProjectPath is already set (e.g., from openProject), validate and use it
  if (currentProjectPath) {
    const validation = validateProject(currentProjectPath)
    if (validation.valid) {
      console.log(`Using current project: ${currentProjectPath}`)
      return { ...validation, source: 'current' as ProjectSource }
    }
  }

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
  thumbnailPath?: string
}

// Find a suitable thumbnail for a project
async function findProjectThumbnail(projectPath: string): Promise<string | null> {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp']

  // Priority 1: Page screenshot in .lp-editor folder (generated by LP-Editor)
  const lpEditorDir = join(projectPath, '.lp-editor')
  for (const ext of imageExtensions) {
    const screenshotPath = join(lpEditorDir, `screenshot${ext}`)
    if (existsSync(screenshotPath)) return screenshotPath
  }

  // Priority 2: screenshot.* in project root
  for (const ext of imageExtensions) {
    const screenshotPath = join(projectPath, `screenshot${ext}`)
    if (existsSync(screenshotPath)) return screenshotPath
  }

  // Priority 3: thumbnail.* in project root
  for (const ext of imageExtensions) {
    const thumbPath = join(projectPath, `thumbnail${ext}`)
    if (existsSync(thumbPath)) return thumbPath
  }

  // Priority 4: og-image.* in project root
  for (const ext of imageExtensions) {
    const ogPath = join(projectPath, `og-image${ext}`)
    if (existsSync(ogPath)) return ogPath
  }

  // Priority 5: Look for FV/hero images in src/images (fallback)
  const imagesDir = join(projectPath, 'src', 'images')
  if (existsSync(imagesDir)) {
    try {
      const images = await readdir(imagesDir)
      const imageFiles = images.filter(f =>
        /\.(png|jpg|jpeg|webp)$/i.test(f)
      )

      // Look for hero/FV images first
      const heroPatterns = ['hero', 'fv', 'main', 'key', 'top', 'visual', 'banner']
      for (const pattern of heroPatterns) {
        const match = imageFiles.find(f => f.toLowerCase().includes(pattern))
        if (match) return join(imagesDir, match)
      }

      // Fallback to first image
      if (imageFiles.length > 0) {
        return join(imagesDir, imageFiles[0])
      }
    } catch {
      // Ignore errors
    }
  }

  return null
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

        // Find thumbnail
        const thumbnailPath = await findProjectThumbnail(projectPath)

        projects.push({
          id: entry.name,
          name: config.name || entry.name,
          client: config.client || 'Unknown',
          path: projectPath,
          lastModified: stats.mtime.toISOString(),
          hasHistory: buildCount > 0,
          buildCount,
          thumbnailPath: thumbnailPath || undefined,
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
  let htmlFiles: string[] = []

  if (existsSync(configPath)) {
    try {
      const configContent = await readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent)

      // Count pages
      if (config.pages && Array.isArray(config.pages)) {
        stats.pages = config.pages.length
        htmlFiles = config.pages.map((p: { path: string }) => join(projectPath, p.path))
      } else if (config.entry) {
        htmlFiles = [join(projectPath, config.entry)]
      }

      // Count colors from config
      if (config.colors && typeof config.colors === 'object') {
        stats.colors = Object.keys(config.colors).length
      }
    } catch {
      // Ignore errors
    }
  }

  // If no HTML files from config, look in src directory
  if (htmlFiles.length === 0) {
    const srcPath = join(projectPath, 'src')
    if (existsSync(srcPath)) {
      try {
        const srcFiles = await readdir(srcPath)
        htmlFiles = srcFiles
          .filter(f => f.endsWith('.html'))
          .map(f => join(srcPath, f))
      } catch {
        // Ignore errors
      }
    }
  }

  // Parse HTML files to count markers and repeat blocks
  const repeatBlockNames = new Set<string>()

  for (const htmlFile of htmlFiles) {
    if (!existsSync(htmlFile)) continue

    try {
      const htmlContent = await readFile(htmlFile, 'utf-8')

      // Count data-editable attributes (markers)
      const editableMatches = htmlContent.match(/data-editable=/g)
      if (editableMatches) {
        stats.markers += editableMatches.length
      }

      // Count unique data-repeat blocks
      const repeatMatches = htmlContent.matchAll(/data-repeat="([^"]+)"/g)
      for (const match of repeatMatches) {
        repeatBlockNames.add(match[1])
      }
    } catch {
      // Ignore errors
    }
  }

  stats.repeatBlocks = repeatBlockNames.size

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

// Load thumbnail as base64 data URL
ipcMain.handle('load-thumbnail', async (_event: IpcMainInvokeEvent, thumbnailPath: string) => {
  if (!thumbnailPath || !existsSync(thumbnailPath)) {
    return null
  }

  try {
    const buffer = await readFile(thumbnailPath)
    const ext = thumbnailPath.toLowerCase().split('.').pop()
    const mimeType = ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg'
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
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

  const dir = result.filePaths[0]
  // Save for next time
  await saveSettings({ lastProjectsDir: dir })
  return dir
})

// Get last projects directory
ipcMain.handle('get-last-projects-dir', async () => {
  const settings = await loadSettings()
  return settings.lastProjectsDir || null
})

// Generate screenshot for a project
ipcMain.handle('generate-screenshot', async (_event: IpcMainInvokeEvent, projectPath: string): Promise<string | null> => {
  const configPath = join(projectPath, 'lp-config.json')
  if (!existsSync(configPath)) {
    return null
  }

  try {
    const configContent = await readFile(configPath, 'utf-8')
    const config = JSON.parse(configContent)

    // Get entry HTML path
    let htmlPath: string
    if (config.pages && config.pages.length > 0) {
      htmlPath = join(projectPath, config.pages[0].path)
    } else if (config.entry) {
      htmlPath = join(projectPath, config.entry)
    } else {
      htmlPath = join(projectPath, 'src', 'index.html')
    }

    if (!existsSync(htmlPath)) {
      return null
    }

    // Create hidden browser window for screenshot
    const screenshotWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Allow loading local files
      },
    })

    // Load the HTML file
    await screenshotWindow.loadFile(htmlPath)

    // Wait for page to fully render
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Capture the page
    const image = await screenshotWindow.webContents.capturePage()
    const pngBuffer = image.toPNG()

    // Close the window
    screenshotWindow.close()

    // Resize to thumbnail size using sharp
    const resizedBuffer = await sharp(pngBuffer)
      .resize(400, 250, { fit: 'cover', position: 'top' })
      .png({ quality: 80 })
      .toBuffer()

    // Save to .lp-editor folder
    const lpEditorDir = join(projectPath, '.lp-editor')
    await mkdir(lpEditorDir, { recursive: true })

    const screenshotPath = join(lpEditorDir, 'screenshot.png')
    await writeFile(screenshotPath, resizedBuffer)

    return screenshotPath
  } catch (error) {
    console.error('Failed to generate screenshot:', error)
    return null
  }
})

// Return to admin mode (clear current project)
ipcMain.handle('return-to-admin', async () => {
  currentProjectPath = null
  return true
})

// LP Content Validation
interface LpValidationWarning {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  element?: string
}

interface LpValidationResult {
  valid: boolean
  warnings: LpValidationWarning[]
}

function validateLpContent(html: string): LpValidationResult {
  const warnings: LpValidationWarning[] = []

  // Check 1: Counter elements should have data-count attribute
  const counterRegex = /data-type=["']counter["'][^>]*>/g
  const counterMatches = html.match(counterRegex) || []
  for (const match of counterMatches) {
    if (!match.includes('data-count=')) {
      const idMatch = match.match(/data-editable=["']([^"']+)["']/)
      warnings.push({
        type: 'warning',
        code: 'COUNTER_NO_DATA_COUNT',
        message: 'カウンター要素にdata-count属性がありません',
        element: idMatch ? idMatch[1] : undefined,
      })
    }
  }

  // Check 2: Nested repeat blocks should have proper structure
  const repeatBlocks = html.match(/data-repeat=["'][^"']+["']/g) || []
  const repeatItems = html.match(/data-repeat-item/g) || []
  if (repeatBlocks.length > 0 && repeatItems.length === 0) {
    warnings.push({
      type: 'error',
      code: 'REPEAT_NO_ITEMS',
      message: 'リピートブロックにdata-repeat-itemが見つかりません',
    })
  }

  // Check 3: Images should have src attribute
  const imgRegex = /<img[^>]*>/g
  const imgMatches = html.match(imgRegex) || []
  for (const match of imgMatches) {
    if (!match.includes('src=') || match.includes('src=""') || match.includes("src=''")) {
      const idMatch = match.match(/data-editable=["']([^"']+)["']/)
      warnings.push({
        type: 'warning',
        code: 'IMAGE_NO_SRC',
        message: '画像にsrc属性が設定されていません',
        element: idMatch ? idMatch[1] : undefined,
      })
    }
  }

  // Check 4: Links with href="#" should have click handlers or be intentional
  const linkRegex = /href=["']#["'][^>]*>/g
  const linkMatches = html.match(linkRegex) || []
  if (linkMatches.length > 0) {
    warnings.push({
      type: 'info',
      code: 'LINK_HASH_HREF',
      message: `${linkMatches.length}個のリンクがhref="#"になっています。意図的でない場合は修正してください`,
    })
  }

  // Check 5: Editable elements should have data-type
  const editableRegex = /data-editable=["'][^"']+["'][^>]*>/g
  const editableMatches = html.match(editableRegex) || []
  for (const match of editableMatches) {
    if (!match.includes('data-type=')) {
      const idMatch = match.match(/data-editable=["']([^"']+)["']/)
      warnings.push({
        type: 'warning',
        code: 'EDITABLE_NO_TYPE',
        message: '編集可能要素にdata-type属性がありません',
        element: idMatch ? idMatch[1] : undefined,
      })
    }
  }

  return {
    valid: warnings.filter((w) => w.type === 'error').length === 0,
    warnings,
  }
}

// Validate LP content handler
ipcMain.handle('validate-lp-content', async (_event: IpcMainInvokeEvent, projectPath: string): Promise<LpValidationResult> => {
  const validation = validateProject(projectPath)
  if (!validation.valid) {
    return {
      valid: false,
      warnings: [{
        type: 'error',
        code: 'PROJECT_INVALID',
        message: validation.error || 'プロジェクトの検証に失敗しました',
      }],
    }
  }

  // Load HTML
  const configPath = join(projectPath, 'lp-config.json')
  let entryPath = 'src/index.html'
  if (existsSync(configPath)) {
    try {
      const configContent = await readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent)
      entryPath = config.entry || entryPath
    } catch {
      // Use default
    }
  }

  const htmlPath = join(projectPath, entryPath)
  if (!existsSync(htmlPath)) {
    return {
      valid: false,
      warnings: [{
        type: 'error',
        code: 'HTML_NOT_FOUND',
        message: `HTMLファイルが見つかりません: ${entryPath}`,
      }],
    }
  }

  const html = await readFile(htmlPath, 'utf-8')
  return validateLpContent(html)
})

// Export project directly from admin (without opening in editor)
ipcMain.handle('export-project', async (_event: IpcMainInvokeEvent, projectPath: string, options?: { includeEditor?: boolean }): Promise<string | null> => {
  const includeEditor = options?.includeEditor ?? false
  // Validate project
  const validation = validateProject(projectPath)
  if (!validation.valid) {
    throw new Error(validation.error || 'プロジェクトの検証に失敗しました')
  }

  // Load lp-config.json
  const configPath = join(projectPath, 'lp-config.json')
  let config: { name?: string; version?: string; entry?: string; output?: { fileName?: string } } = {}
  if (existsSync(configPath)) {
    try {
      const configContent = await readFile(configPath, 'utf-8')
      config = JSON.parse(configContent)
    } catch {
      // Use defaults
    }
  }

  // Get project name and version for output folder name
  const projectName = config.name || basename(projectPath)
  const projectVersion = config.version || '1.0.0'
  // Sanitize folder name (remove invalid characters)
  const sanitizedName = projectName.replace(/[<>:"/\\|?*]/g, '_')
  const outputFolderName = `${sanitizedName}_v${projectVersion}`

  // Determine entry point
  const entryPath = config.entry || 'src/index.html'
  const htmlPath = join(projectPath, entryPath)

  if (!existsSync(htmlPath)) {
    throw new Error('HTMLファイルが見つかりません')
  }

  // Load HTML
  let html = await readFile(htmlPath, 'utf-8')

  // Load and apply saved content if exists
  const contentPath = join(projectPath, 'data', 'content.json')
  if (existsSync(contentPath)) {
    try {
      const contentStr = await readFile(contentPath, 'utf-8')
      const content = JSON.parse(contentStr)

      // Apply editables
      if (content.editables) {
        for (const [id, data] of Object.entries(content.editables)) {
          const fieldData = data as { value?: string; href?: string; src?: string; type?: string }
          if (fieldData.value !== undefined && fieldData.value !== null) {
            // Replace content by ID
            const idRegex = new RegExp(`data-editable=["']${id}["'][^>]*>([\\s\\S]*?)<`, 'g')
            html = html.replace(idRegex, (match, _content) => {
              return match.replace(_content + '<', fieldData.value + '<')
            })
          }
          // Handle href for links
          if (fieldData.href) {
            const hrefRegex = new RegExp(`(data-editable=["']${id}["'][^>]*href=["'])([^"']*)`, 'g')
            html = html.replace(hrefRegex, `$1${fieldData.href}`)
          }
          // Handle src for images
          if (fieldData.src) {
            const srcRegex = new RegExp(`(data-editable=["']${id}["'][^>]*src=["'])([^"']*)`, 'g')
            html = html.replace(srcRegex, `$1${fieldData.src}`)
          }
        }
      }

      // Apply colors
      if (content.colors) {
        for (const [key, value] of Object.entries(content.colors)) {
          const colorValue = typeof value === 'string' ? value : (value as { value?: string })?.value
          if (colorValue) {
            const varName = key.startsWith('--color-') ? key : `--color-${key}`
            const colorRegex = new RegExp(`(${varName}\\s*:\\s*)([^;]+)`, 'g')
            html = html.replace(colorRegex, `$1${colorValue}`)
          }
        }
      }
    } catch (err) {
      console.warn('Failed to apply content:', err)
    }
  }

  // Output to project directory with name_vVersion format
  const outputDir = join(projectPath, outputFolderName)

  // Clean output directory
  if (existsSync(outputDir)) {
    await rm(outputDir, { recursive: true, force: true })
  }
  await mkdir(outputDir, { recursive: true })

  // Remove markers from HTML
  const cleanHtml = removeMarkers(html)

  // Write HTML
  // Use index.html as default output filename (ignore config.output.fileName which is for packaged app name)
  const outputFileName = 'index.html'
  await writeFile(join(outputDir, outputFileName), cleanHtml, 'utf-8')

  // Copy CSS
  const srcCssDir = join(projectPath, 'src', 'css')
  if (existsSync(srcCssDir)) {
    const outCssDir = join(outputDir, 'css')
    await mkdir(outCssDir, { recursive: true })
    await copyDirectory(srcCssDir, outCssDir)
  }

  // Copy JS
  const srcJsDir = join(projectPath, 'src', 'js')
  if (existsSync(srcJsDir)) {
    const outJsDir = join(outputDir, 'js')
    await mkdir(outJsDir, { recursive: true })
    await copyDirectory(srcJsDir, outJsDir)
  }

  // Copy images
  const srcImagesDir = join(projectPath, 'src', 'images')
  if (existsSync(srcImagesDir)) {
    const outImagesDir = join(outputDir, 'images')
    await mkdir(outImagesDir, { recursive: true })
    await copyDirectory(srcImagesDir, outImagesDir)
  }

  // Determine LP-Editor source directory
  // When includeEditor is true, use the release directory
  // Otherwise, check if LP-Editor exists in the project directory
  const releaseDir = join(dirname(app.getAppPath()), '..', 'release', 'win-unpacked')
  const devReleaseDir = join(__dirname, '..', '..', 'release', 'win-unpacked')
  const projectLpEditorExe = join(projectPath, 'LP-Editor.exe')

  // Determine which source to use for LP-Editor files
  let lpEditorSourceDir: string | null = null

  if (includeEditor) {
    // Check release directory (production) or dev release directory
    if (existsSync(join(releaseDir, 'LP-Editor.exe'))) {
      lpEditorSourceDir = releaseDir
    } else if (existsSync(join(devReleaseDir, 'LP-Editor.exe'))) {
      lpEditorSourceDir = devReleaseDir
    }
  } else if (existsSync(projectLpEditorExe)) {
    // Legacy behavior: copy from project directory if LP-Editor exists there
    lpEditorSourceDir = projectPath
  }

  if (lpEditorSourceDir) {
    // LP-Editor files to copy
    const lpEditorFiles = [
      'LP-Editor.exe',
      'd3dcompiler_47.dll',
      'ffmpeg.dll',
      'icudtl.dat',
      'libEGL.dll',
      'libGLESv2.dll',
      'resources.pak',
      'snapshot_blob.bin',
      'v8_context_snapshot.bin',
      'vk_swiftshader.dll',
      'vk_swiftshader_icd.json',
      'vulkan-1.dll',
      'chrome_100_percent.pak',
      'chrome_200_percent.pak',
      'LICENSE.electron.txt',
      'LICENSES.chromium.html',
    ]

    // Additional helper files (may exist in project but not in release)
    const optionalFiles = [
      'start-lp-editor.bat',
      'start-hidden.vbs',
      'launch.js',
      'launch-debug.js',
      'launch-detached.js',
      'debug-lp-editor.bat',
    ]

    // Copy main LP-Editor files
    for (const file of lpEditorFiles) {
      const srcFile = join(lpEditorSourceDir, file)
      if (existsSync(srcFile)) {
        await copyFile(srcFile, join(outputDir, file))
      }
    }

    // Copy optional helper files (from project directory if available)
    for (const file of optionalFiles) {
      const srcFile = join(projectPath, file)
      if (existsSync(srcFile)) {
        await copyFile(srcFile, join(outputDir, file))
      }
    }

    // Create a simple start batch file if it doesn't exist
    const startBatPath = join(outputDir, 'start-lp-editor.bat')
    if (!existsSync(startBatPath)) {
      const startBatContent = '@echo off\nstart "" "%~dp0LP-Editor.exe" "%~dp0"\n'
      await writeFile(startBatPath, startBatContent, 'utf-8')
    }

    // Copy locales folder
    const localesDir = join(lpEditorSourceDir, 'locales')
    if (existsSync(localesDir)) {
      const outLocalesDir = join(outputDir, 'locales')
      await mkdir(outLocalesDir, { recursive: true })
      await copyDirectory(localesDir, outLocalesDir)
    }

    // Copy resources folder from LP-Editor release
    const resourcesDir = join(lpEditorSourceDir, 'resources')
    if (existsSync(resourcesDir)) {
      const outResourcesDir = join(outputDir, 'resources')
      await mkdir(outResourcesDir, { recursive: true })
      await copyDirectory(resourcesDir, outResourcesDir)
    }

    // Copy src folder (for LP-Editor to work with the LP content)
    const srcDir = join(projectPath, 'src')
    if (existsSync(srcDir)) {
      const outSrcDir = join(outputDir, 'src')
      await mkdir(outSrcDir, { recursive: true })
      await copyDirectory(srcDir, outSrcDir)
    }

    // Copy lp-config.json
    if (existsSync(configPath)) {
      await copyFile(configPath, join(outputDir, 'lp-config.json'))
    }

    // Copy data folder if exists (saved edits)
    const dataDir = join(projectPath, 'data')
    if (existsSync(dataDir)) {
      const outDataDir = join(outputDir, 'data')
      await mkdir(outDataDir, { recursive: true })
      await copyDirectory(dataDir, outDataDir)
    }

    // Copy .lp-editor folder if exists (screenshots, metadata)
    const lpEditorDataDir = join(projectPath, '.lp-editor')
    if (existsSync(lpEditorDataDir)) {
      const outLpEditorDir = join(outputDir, '.lp-editor')
      await mkdir(outLpEditorDir, { recursive: true })
      await copyDirectory(lpEditorDataDir, outLpEditorDir)
    }
  }

  // Show output folder in file explorer
  shell.showItemInFolder(join(outputDir, outputFileName))

  return outputDir
})
