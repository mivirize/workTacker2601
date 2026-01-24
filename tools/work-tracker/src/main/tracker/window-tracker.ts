import { powerMonitor, app } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import type { ActiveWindowInfo, TrackingState } from '../../shared/types'
import {
  createActivity,
  updateActivityEnd,
  markActivityAsIdle,
} from '../database/repositories/activity-repository'
import { findMatchingCategoryWithTags } from '../database/repositories/category-repository'
import { log } from '../utils/logger'
import { notifyIdleStart, notifyIdleEnd } from '../notifications/notification-manager'

const execAsync = promisify(exec)

interface WindowInfo {
  title: string
  appName: string
  path?: string
  url?: string
}

// Browser process names for URL extraction
const BROWSER_PROCESSES = ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi']

/**
 * Get URL from browser's address bar on Windows using UI Automation
 */
async function getBrowserUrlWindows(appName: string): Promise<string | undefined> {
  const lowerAppName = appName.toLowerCase()
  const isBrowser = BROWSER_PROCESSES.some(b => lowerAppName.includes(b))
  if (!isBrowser) return undefined

  try {
    const tempDir = app.getPath('temp')
    const tempFile = path.join(tempDir, 'work-tracker-url.txt')

    // PowerShell script to get URL using UI Automation
    // Works with Chrome, Edge, and other Chromium-based browsers
    const script = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$root = [System.Windows.Automation.AutomationElement]::RootElement
$condition = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
  [System.Windows.Automation.ControlType]::Window
)

$windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)
$url = ""

foreach ($window in $windows) {
  try {
    $processId = $window.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::ProcessIdProperty)
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process -and ($process.ProcessName -match 'chrome|msedge|firefox|brave|opera|vivaldi')) {
      # Try to find the address bar
      $editCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Edit
      )
      $edits = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCondition)
      foreach ($edit in $edits) {
        $name = $edit.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::NameProperty)
        if ($name -match 'address|url|アドレス|URL') {
          $pattern = $edit.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
          if ($pattern) {
            $url = $pattern.Current.Value
            break
          }
        }
      }
      if ($url) { break }
    }
  } catch {}
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText('${tempFile.replace(/\\/g, '\\\\')}', $url, $utf8NoBom)
`
    const encodedScript = Buffer.from(script, 'utf16le').toString('base64')
    await execAsync(`powershell -NoProfile -EncodedCommand ${encodedScript}`, {
      timeout: 3000,
    })

    const url = fs.readFileSync(tempFile, 'utf8').trim()

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }

    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'))) {
      log(`[Tracker] Extracted URL: ${url}`)
      return url
    }

    return undefined
  } catch (error) {
    log(`[Tracker] URL extraction failed (non-critical): ${error}`)
    return undefined
  }
}

async function getActiveWindowWindows(): Promise<WindowInfo | null> {
  try {
    log('[Tracker] Getting active window (Windows)...')

    // Use temp file to bypass stdout encoding issues completely
    const tempDir = app.getPath('temp')
    const tempFile = path.join(tempDir, 'work-tracker-window.json')

    // PowerShell script that writes UTF-8 JSON directly to a file
    const script = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32Api {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
$hwnd = [Win32Api]::GetForegroundWindow()
$title = New-Object System.Text.StringBuilder 512
[Win32Api]::GetWindowText($hwnd, $title, 512) | Out-Null
$processId = 0
[Win32Api]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
$process = Get-Process -Id $processId -ErrorAction SilentlyContinue
$result = @{
  title = $title.ToString()
  appName = if($process) { $process.ProcessName } else { 'Unknown' }
  path = if($process) { $process.Path } else { '' }
}
$jsonString = $result | ConvertTo-Json -Compress
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText('${tempFile.replace(/\\/g, '\\\\')}', $jsonString, $utf8NoBom)
`
    // Encode script as base64 to avoid escaping issues
    const encodedScript = Buffer.from(script, 'utf16le').toString('base64')
    await execAsync(`powershell -NoProfile -EncodedCommand ${encodedScript}`, {
      timeout: 5000,
    })

    // Read the JSON file with UTF-8 encoding
    const jsonString = fs.readFileSync(tempFile, 'utf8')
    log(`[Tracker] Read JSON from file: ${jsonString}`)

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }

    const result = JSON.parse(jsonString)
    log(`[Tracker] Parsed result: ${JSON.stringify(result)}`)

    // Try to get URL if it's a browser
    const url = await getBrowserUrlWindows(result.appName || '')

    return {
      title: result.title || '',
      appName: result.appName || 'Unknown',
      path: result.path,
      url,
    }
  } catch (error) {
    log(`[Tracker] ERROR: Failed to get active window (Windows): ${error}`)
    return null
  }
}

/**
 * Get URL from browser on macOS using AppleScript
 */
async function getBrowserUrlMac(appName: string): Promise<string | undefined> {
  const lowerAppName = appName.toLowerCase()

  try {
    let script = ''

    if (lowerAppName.includes('chrome') || lowerAppName.includes('google chrome')) {
      script = `tell application "Google Chrome" to return URL of active tab of front window`
    } else if (lowerAppName.includes('safari')) {
      script = `tell application "Safari" to return URL of front document`
    } else if (lowerAppName.includes('firefox')) {
      // Firefox requires accessibility features to be enabled
      // This is a simplified version
      return undefined
    } else if (lowerAppName.includes('edge') || lowerAppName.includes('microsoft edge')) {
      script = `tell application "Microsoft Edge" to return URL of active tab of front window`
    } else if (lowerAppName.includes('brave')) {
      script = `tell application "Brave Browser" to return URL of active tab of front window`
    } else {
      return undefined
    }

    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 2000,
    })

    const url = stdout.trim()
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'))) {
      log(`[Tracker] Extracted URL (Mac): ${url}`)
      return url
    }

    return undefined
  } catch (error) {
    log(`[Tracker] URL extraction failed (Mac, non-critical): ${error}`)
    return undefined
  }
}

async function getActiveWindowMac(): Promise<WindowInfo | null> {
  try {
    const script = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        set appName to name of frontApp
        set windowTitle to ""
        try
          set windowTitle to name of first window of frontApp
        end try
        return appName & "|" & windowTitle
      end tell
    `

    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 5000,
    })

    const [appName, title] = stdout.trim().split('|')

    // Try to get URL if it's a browser
    const url = await getBrowserUrlMac(appName || '')

    return {
      title: title || '',
      appName: appName || 'Unknown',
      url,
    }
  } catch (error) {
    log('[Tracker] ERROR: Failed to get active window (Mac): ' + error)
    return null
  }
}

async function getActiveWindow(): Promise<WindowInfo | null> {
  if (process.platform === 'win32') {
    return getActiveWindowWindows()
  } else if (process.platform === 'darwin') {
    return getActiveWindowMac()
  }
  return null
}

export class WindowTracker {
  private intervalId: NodeJS.Timeout | null = null
  private trackingIntervalMs: number
  private idleThresholdMs: number
  private excludedApps: string[]
  private state: TrackingState = {
    isTracking: false,
    isPaused: false,
    lastActivity: Date.now(),
    isIdle: false,
  }
  private currentActivityId: number | null = null
  private lastWindowInfo: ActiveWindowInfo | null = null

  constructor(
    trackingIntervalMs = 5000,
    idleThresholdMs = 180000,
    excludedApps: string[] = []
  ) {
    this.trackingIntervalMs = trackingIntervalMs
    this.idleThresholdMs = idleThresholdMs
    this.excludedApps = excludedApps
  }

  getState(): TrackingState {
    return { ...this.state }
  }

  updateSettings(
    trackingIntervalMs?: number,
    idleThresholdMs?: number,
    excludedApps?: string[]
  ): void {
    if (trackingIntervalMs !== undefined) {
      this.trackingIntervalMs = trackingIntervalMs
    }
    if (idleThresholdMs !== undefined) {
      this.idleThresholdMs = idleThresholdMs
    }
    if (excludedApps !== undefined) {
      this.excludedApps = excludedApps
    }

    // Restart tracking if already running
    if (this.state.isTracking && !this.state.isPaused) {
      this.stopTracking()
      this.startTracking()
    }
  }

  async startTracking(): Promise<void> {
    log(`[Tracker] startTracking() called, current state: ${this.state.isTracking}`)
    if (this.state.isTracking) {
      log('[Tracker] Already tracking, returning')
      return
    }

    this.state.isTracking = true
    this.state.isPaused = false
    this.state.lastActivity = Date.now()

    // Initial capture
    log('[Tracker] Performing initial capture...')
    await this.captureWindow()

    // Start interval
    log(`[Tracker] Starting interval with ${this.trackingIntervalMs}ms`)
    this.intervalId = setInterval(async () => {
      await this.tick()
    }, this.trackingIntervalMs)
    log(`[Tracker] Interval started, id: ${this.intervalId}`)
  }

  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Close current activity (use !== null since 0 is a valid ID)
    if (this.currentActivityId !== null) {
      updateActivityEnd(this.currentActivityId, Date.now())
      this.currentActivityId = null
    }

    this.state.isTracking = false
    this.state.isPaused = false
  }

  pauseTracking(): void {
    if (!this.state.isTracking || this.state.isPaused) return

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Close current activity (use !== null since 0 is a valid ID)
    if (this.currentActivityId !== null) {
      updateActivityEnd(this.currentActivityId, Date.now())
      this.currentActivityId = null
    }

    this.state.isPaused = true
  }

  async resumeTracking(): Promise<void> {
    if (!this.state.isTracking || !this.state.isPaused) return

    this.state.isPaused = false
    this.state.lastActivity = Date.now()

    // Initial capture
    await this.captureWindow()

    // Restart interval
    this.intervalId = setInterval(async () => {
      await this.tick()
    }, this.trackingIntervalMs)
  }

  private async tick(): Promise<void> {
    log('[Tracker] tick() called')
    // Check for idle
    const idleTime = powerMonitor.getSystemIdleTime() * 1000 // Convert to ms
    const wasIdle = this.state.isIdle
    this.state.isIdle = idleTime >= this.idleThresholdMs
    log(`[Tracker] idleTime: ${idleTime}, isIdle: ${this.state.isIdle}`)

    if (this.state.isIdle) {
      if (!wasIdle && this.currentActivityId !== null) {
        // Just became idle - mark current activity as idle
        log('[Tracker] Became idle, marking activity as idle')
        markActivityAsIdle(this.currentActivityId)
        updateActivityEnd(this.currentActivityId, Date.now())
        this.currentActivityId = null
        notifyIdleStart()
      }
      return
    }

    if (wasIdle && !this.state.isIdle) {
      // Just resumed from idle
      log('[Tracker] Resumed from idle')
      this.state.lastActivity = Date.now()
      notifyIdleEnd()
    }

    await this.captureWindow()
  }

  private async captureWindow(): Promise<void> {
    log('[Tracker] captureWindow() called')
    try {
      const windowInfo = await getActiveWindow()
      log(`[Tracker] windowInfo: ${JSON.stringify(windowInfo)}`)

      if (!windowInfo) {
        log('[Tracker] No window info, returning')
        return
      }

      const appName = windowInfo.appName
      const windowTitle = windowInfo.title
      const timestamp = Date.now()

      // Check if excluded
      if (this.isExcluded(appName)) {
        log(`[Tracker] App excluded: ${appName}`)
        return
      }

      // Use URL from platform-level extraction, fallback to title regex
      const url = windowInfo.url ?? this.extractUrl(appName, windowTitle)

      const currentInfo: ActiveWindowInfo = {
        title: windowTitle,
        owner: {
          name: appName,
          path: windowInfo.path,
        },
        url,
        timestamp,
      }

      // Check if window changed
      const windowChanged = this.hasWindowChanged(currentInfo)
      log(`[Tracker] windowChanged: ${windowChanged}`)

      if (windowChanged) {
        // Close previous activity (use !== null since 0 is a valid ID)
        if (this.currentActivityId !== null) {
          log(`[Tracker] Closing previous activity: ${this.currentActivityId}`)
          updateActivityEnd(this.currentActivityId, timestamp)
        }

        // Find category and get tags
        const matchResult = findMatchingCategoryWithTags(appName, windowTitle, url)
        log(`[Tracker] Found category: ${matchResult.categoryId}, categoryTags: ${matchResult.categoryTagIds}, ruleTags: ${matchResult.ruleTagIds}`)

        // Create new activity
        log(`[Tracker] Creating new activity for: ${appName} - ${windowTitle}`)
        const activity = createActivity(
          appName,
          windowTitle,
          timestamp,
          matchResult.categoryId,
          url,
          matchResult.categoryTagIds,
          matchResult.ruleTagIds
        )
        log(`[Tracker] Created activity: ${JSON.stringify(activity)}`)
        this.currentActivityId = activity.id
        this.lastWindowInfo = currentInfo
      }

      this.state.lastActivity = timestamp
    } catch (error) {
      log(`[Tracker] ERROR: Failed to capture window: ${error}`)
    }
  }

  private hasWindowChanged(current: ActiveWindowInfo): boolean {
    if (!this.lastWindowInfo) return true

    return (
      current.owner.name !== this.lastWindowInfo.owner.name ||
      current.title !== this.lastWindowInfo.title
    )
  }

  private isExcluded(appName: string): boolean {
    return this.excludedApps.some(
      (excluded) => appName.toLowerCase().includes(excluded.toLowerCase())
    )
  }

  private extractUrl(appName: string, windowTitle: string): string | undefined {
    // Common browser patterns
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Brave', 'Opera']
    const isBrowser = browsers.some((browser) =>
      appName.toLowerCase().includes(browser.toLowerCase())
    )

    if (!isBrowser) return undefined

    // Try to extract URL from title
    const urlPattern = /https?:\/\/[^\s]+/
    const match = windowTitle.match(urlPattern)

    return match ? match[0] : undefined
  }
}

// Singleton instance
let trackerInstance: WindowTracker | null = null

export function getTracker(): WindowTracker {
  if (!trackerInstance) {
    trackerInstance = new WindowTracker()
  }
  return trackerInstance
}

export function initTracker(
  trackingIntervalMs?: number,
  idleThresholdMs?: number,
  excludedApps?: string[]
): WindowTracker {
  trackerInstance = new WindowTracker(
    trackingIntervalMs,
    idleThresholdMs,
    excludedApps
  )
  return trackerInstance
}
