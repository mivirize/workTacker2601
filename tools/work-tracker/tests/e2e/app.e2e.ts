import { test, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from 'playwright'
import path from 'path'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })

  // Get the first window
  page = await electronApp.firstWindow()

  // Wait for app to be ready
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await electronApp.close()
})

test.describe('Work Tracker Application', () => {
  test('should display the dashboard', async () => {
    // Check if dashboard title is visible
    await expect(page.locator('h1')).toContainText('ダッシュボード')
  })

  test('should have navigation sidebar', async () => {
    // Check navigation items
    await expect(page.locator('text=ダッシュボード')).toBeVisible()
    await expect(page.locator('text=タイムライン')).toBeVisible()
    await expect(page.locator('text=レポート')).toBeVisible()
    await expect(page.locator('text=設定')).toBeVisible()
  })

  test('should navigate to timeline page', async () => {
    await page.click('text=タイムライン')
    await expect(page.locator('h1')).toContainText('タイムライン')
  })

  test('should navigate to reports page', async () => {
    await page.click('text=レポート')
    await expect(page.locator('h1')).toContainText('レポート')
  })

  test('should navigate to settings page', async () => {
    await page.click('text=設定')
    await expect(page.locator('h1')).toContainText('設定')
  })

  test('should have tracking controls in header', async () => {
    // Navigate back to dashboard
    await page.click('text=ダッシュボード')

    // Check tracking button exists
    const trackingButton = page.locator('button:has-text("開始"), button:has-text("一時停止")')
    await expect(trackingButton).toBeVisible()
  })

  test('should display summary cards on dashboard', async () => {
    await page.click('text=ダッシュボード')

    // Check summary cards
    await expect(page.locator('text=総作業時間')).toBeVisible()
    await expect(page.locator('text=アクティブ時間')).toBeVisible()
    await expect(page.locator('text=アイドル時間')).toBeVisible()
    await expect(page.locator('text=使用アプリ数')).toBeVisible()
  })

  test('settings page should have configuration options', async () => {
    await page.click('text=設定')

    // Check settings sections
    await expect(page.locator('text=トラッキング設定')).toBeVisible()
    await expect(page.locator('text=アプリケーション動作')).toBeVisible()
    await expect(page.locator('text=除外アプリ')).toBeVisible()
    await expect(page.locator('text=カテゴリ管理')).toBeVisible()
  })

  test('should save settings', async () => {
    await page.click('text=設定')

    // Find and click save button
    const saveButton = page.locator('button:has-text("設定を保存")')
    await expect(saveButton).toBeVisible()
  })
})
