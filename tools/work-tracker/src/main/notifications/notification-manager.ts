import { Notification, nativeImage } from 'electron'
import { getSettings } from '../settings/settings-manager'
import { log } from '../utils/logger'

interface NotificationOptions {
  title: string
  body: string
  silent?: boolean
}

export function showNotification(options: NotificationOptions): void {
  const settings = getSettings()
  if (!settings.showNotifications) {
    log('[Notification] Notifications disabled in settings')
    return
  }

  log(`[Notification] Showing: ${options.title} - ${options.body}`)

  const notification = new Notification({
    title: options.title,
    body: options.body,
    silent: options.silent ?? false,
    icon: nativeImage.createEmpty(), // Use default icon
  })

  notification.show()
}

export function notifyIdleStart(): void {
  showNotification({
    title: 'アイドル状態',
    body: '操作が検出されませんでした。記録を一時停止します。',
    silent: true,
  })
}

export function notifyIdleEnd(): void {
  showNotification({
    title: '作業再開',
    body: 'アクティビティの記録を再開しました。',
    silent: false,
  })
}

export function notifyTrackingStarted(): void {
  showNotification({
    title: 'トラッキング開始',
    body: 'アクティビティの記録を開始しました。',
    silent: true,
  })
}

export function notifyTrackingStopped(): void {
  showNotification({
    title: 'トラッキング停止',
    body: 'アクティビティの記録を停止しました。',
    silent: true,
  })
}
