/**
 * LP-Editor Main Process
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { join, dirname } from 'path'
import { readFile, writeFile, mkdir, copyFile, readdir, rm } from 'fs/promises'
import { existsSync } from 'fs'

let mainWindow: typeof BrowserWindow.prototype | null = null

// Get the app's base directory (where the exe is located)
function getAppBasePath(): string {
  if (app.isPackaged) {
    return dirname(app.getPath('exe'))
  }
  return process.cwd()
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

// Export HTML
ipcMain.handle('export-html', async (_event: IpcMainInvokeEvent, htmlContent: string) => {
  const basePath = getAppBasePath()
  const outputDir = join(basePath, 'output')

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
ipcMain.handle('show-output-folder', async () => {
  const basePath = getAppBasePath()
  const outputDir = join(basePath, 'output')

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
    'data-min',
    'data-max',
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
