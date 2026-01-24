import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
} from '../../src/shared/types'

describe('DEFAULT_SETTINGS', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SETTINGS.trackingIntervalMs).toBe(5000)
    expect(DEFAULT_SETTINGS.idleThresholdMs).toBe(180000)
    expect(DEFAULT_SETTINGS.excludedApps).toEqual([])
    expect(DEFAULT_SETTINGS.dataRetentionDays).toBe(90)
    expect(DEFAULT_SETTINGS.launchOnStartup).toBe(true)
    expect(DEFAULT_SETTINGS.minimizeToTray).toBe(true)
    expect(DEFAULT_SETTINGS.showNotifications).toBe(true)
  })

  it('idle threshold is 3 minutes', () => {
    expect(DEFAULT_SETTINGS.idleThresholdMs).toBe(3 * 60 * 1000)
  })
})

describe('DEFAULT_CATEGORIES', () => {
  it('has expected categories', () => {
    const categoryNames = DEFAULT_CATEGORIES.map((c) => c.name)
    expect(categoryNames).toContain('開発')
    expect(categoryNames).toContain('コミュニケーション')
    expect(categoryNames).toContain('ドキュメント')
    expect(categoryNames).toContain('ミーティング')
    expect(categoryNames).toContain('ブラウジング')
    expect(categoryNames).toContain('その他')
  })

  it('all categories are marked as default', () => {
    DEFAULT_CATEGORIES.forEach((category) => {
      expect(category.isDefault).toBe(true)
    })
  })

  it('all categories have colors', () => {
    DEFAULT_CATEGORIES.forEach((category) => {
      expect(category.color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('development category has IDE rules', () => {
    const devCategory = DEFAULT_CATEGORIES.find((c) => c.name === '開発')
    expect(devCategory).toBeDefined()

    const appRules = devCategory!.rules.filter((r) => r.type === 'app')
    const appPatterns = appRules.map((r) => r.pattern.toLowerCase())

    expect(appPatterns).toContain('code')
    expect(appPatterns).toContain('terminal')
  })

  it('communication category has chat app rules', () => {
    const commCategory = DEFAULT_CATEGORIES.find(
      (c) => c.name === 'コミュニケーション'
    )
    expect(commCategory).toBeDefined()

    const appRules = commCategory!.rules.filter((r) => r.type === 'app')
    const appPatterns = appRules.map((r) => r.pattern.toLowerCase())

    expect(appPatterns).toContain('slack')
    expect(appPatterns).toContain('teams')
  })
})
