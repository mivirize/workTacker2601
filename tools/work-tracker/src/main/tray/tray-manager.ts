import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import path from 'path'
import { getTracker } from '../tracker/window-tracker'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray {
  // Create a simple icon (you can replace with actual icon file)
  const iconPath = path.join(__dirname, '../../assets/icon.png')
  let icon: Electron.NativeImage

  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      // Create a simple default icon
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  // Resize for tray
  const trayIcon = icon.resize({ width: 16, height: 16 })

  tray = new Tray(trayIcon)
  tray.setToolTip('Work Tracker')

  updateTrayMenu(mainWindow)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}

export function updateTrayMenu(mainWindow: BrowserWindow): void {
  if (!tray) return

  const tracker = getTracker()
  const state = tracker.getState()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Work Tracker',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: state.isTracking
        ? state.isPaused
          ? '▶️ 再開'
          : '⏸️ 一時停止'
        : '▶️ 開始',
      click: async () => {
        if (!state.isTracking) {
          await tracker.startTracking()
        } else if (state.isPaused) {
          await tracker.resumeTracking()
        } else {
          tracker.pauseTracking()
        }
        updateTrayMenu(mainWindow)
      },
    },
    {
      label: '⏹️ 停止',
      enabled: state.isTracking,
      click: () => {
        tracker.stopTracking()
        updateTrayMenu(mainWindow)
      },
    },
    { type: 'separator' },
    {
      label: state.isIdle ? '💤 アイドル中' : '✅ アクティブ',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'ダッシュボードを開く',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
