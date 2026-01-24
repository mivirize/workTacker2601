import {
  app,
  BrowserWindow,
  shell,
  systemPreferences,
  dialog,
} from 'electron'
import path from 'path'
import { initializeDatabase, closeDatabase } from './database/schema'
import { registerIpcHandlers } from './ipc/handlers'
import { initTracker, getTracker } from './tracker/window-tracker'
import { createTray, destroyTray, updateTrayMenu } from './tray/tray-manager'
import { getSettings } from './settings/settings-manager'
import { deleteOldActivities, closeUnclosedActivities } from './database/repositories/activity-repository'
import { log } from './utils/logger'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const isDev = process.env.NODE_ENV === 'development'

async function createWindow(): Promise<void> {
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  }

  // macOS-specific: use custom title bar
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset'
    windowOptions.frame = false
  }

  const win = new BrowserWindow(windowOptions)
  mainWindow = win

  // Load the app
  if (isDev) {
    await win.loadURL('http://localhost:5173')
  } else {
    await win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools only in development
  if (isDev) {
    win.webContents.openDevTools()
  }

  // Show window when ready
  win.once('ready-to-show', () => {
    win.show()
  })

  // Handle external links
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Minimize to tray on close
  win.on('close', (event) => {
    const settings = getSettings()
    if (settings.minimizeToTray && !isQuitting) {
      event.preventDefault()
      win.hide()
    }
  })

  // Create system tray
  createTray(win)

  // Update tray periodically
  setInterval(() => {
    if (mainWindow) {
      updateTrayMenu(mainWindow)
    }
  }, 5000)
}

async function checkPermissions(): Promise<boolean> {
  if (process.platform === 'darwin') {
    // Check screen recording permission on macOS
    const hasPermission = systemPreferences.getMediaAccessStatus('screen')

    if (hasPermission !== 'granted') {
      const result = await dialog.showMessageBox({
        type: 'warning',
        title: '権限が必要です',
        message: 'Work Tracker は画面情報を取得するために「画面収録」の権限が必要です。',
        detail: 'システム環境設定 > プライバシーとセキュリティ > 画面収録 で、このアプリを許可してください。',
        buttons: ['設定を開く', 'キャンセル'],
        defaultId: 0,
      })

      if (result.response === 0) {
        shell.openExternal(
          'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
        )
      }

      return false
    }
  }

  return true
}

async function initialize(): Promise<void> {
  log('[Main] ========================================')
  log('[Main] Starting initialization...')
  log(`[Main] Platform: ${process.platform}`)
  log(`[Main] Node version: ${process.version}`)
  log(`[Main] Electron version: ${process.versions.electron}`)
  log('[Main] ========================================')

  try {
    // Initialize database
    log('[Main] Step 1: Initializing database...')
    await initializeDatabase()
    log('[Main] Step 1: Database initialized successfully')

    // Close any unclosed activities from previous sessions
    log('[Main] Step 1.5: Closing unclosed activities...')
    const closedCount = closeUnclosedActivities()
    log(`[Main] Step 1.5: Closed ${closedCount} unclosed activities`)

    // Clean up old data
    log('[Main] Step 2: Getting settings...')
    const settings = getSettings()
    log(`[Main] Step 2: Settings: ${JSON.stringify(settings)}`)
    deleteOldActivities(settings.dataRetentionDays)

    // Initialize tracker
    log('[Main] Step 3: Initializing tracker...')
    initTracker(
      settings.trackingIntervalMs,
      settings.idleThresholdMs,
      settings.excludedApps
    )
    log('[Main] Step 3: Tracker initialized')

    // Register IPC handlers
    log('[Main] Step 4: Registering IPC handlers...')
    registerIpcHandlers()
    log('[Main] Step 4: IPC handlers registered')

    // Check permissions
    log('[Main] Step 5: Checking permissions...')
    await checkPermissions()
    log('[Main] Step 5: Permissions checked')

    // Auto-start tracking if enabled
    if (settings.launchOnStartup) {
      log('[Main] Step 6: Auto-starting tracking...')
      const tracker = getTracker()
      await tracker.startTracking()
      log('[Main] Step 6: Tracking started')
    }

    log('[Main] ========================================')
    log('[Main] Initialization complete!')
    log('[Main] ========================================')
  } catch (error) {
    log('[Main] ========================================')
    log('[Main] INITIALIZATION FAILED!')
    log(`[Main] Error: ${error}`)
    log('[Main] ========================================')
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    await initialize()
    await createWindow()

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow()
      } else {
        mainWindow?.show()
      }
    })
  })
}

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  const tracker = getTracker()
  tracker.stopTracking()
  destroyTray()
  closeDatabase()
})
