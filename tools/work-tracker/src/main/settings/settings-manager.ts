import Store from 'electron-store'
import { getTracker } from '../tracker/window-tracker'
import type { AppSettings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'

interface StoreSchema {
  settings: AppSettings
}

const store = new Store<StoreSchema>({
  name: 'settings',
  defaults: {
    settings: DEFAULT_SETTINGS,
  },
})

export function getSettings(): AppSettings {
  return store.get('settings')
}

export function updateSettings(
  partialSettings: Partial<AppSettings>
): AppSettings {
  const currentSettings = getSettings()
  const newSettings: AppSettings = {
    ...currentSettings,
    ...partialSettings,
  }

  store.set('settings', newSettings)

  // Update tracker with new settings
  const tracker = getTracker()
  tracker.updateSettings(
    newSettings.trackingIntervalMs,
    newSettings.idleThresholdMs,
    newSettings.excludedApps
  )

  return newSettings
}

export function resetSettings(): AppSettings {
  store.set('settings', DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}
