/**
 * Tracking Editor Component
 *
 * UI for configuring analytics tracking tags (GA4, GTM, Facebook Pixel, Google Ads).
 */

import React from 'react'
import { useTrackingStore } from '../stores/tracking-store'
import {
  validateGA4Id,
  validateGTMId,
  validateFBPixelId,
  validateGoogleAdsId,
  checkDualTracking,
  type ValidationResult,
} from '../services/tracking-service'

export function TrackingEditor() {
  const {
    config,
    isDirty,
    isLoading,
    error,
    updateGA4,
    updateGTM,
    updateFacebookPixel,
    updateGoogleAds,
    setConfig,
    setLoading,
    setError,
    setDirty,
  } = useTrackingStore()

  // Load config on mount
  React.useEffect(() => {
    loadTrackingConfig()
  }, [])

  const loadTrackingConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const saved = await window.electronAPI.loadTrackingConfig()
      if (saved) {
        setConfig(saved)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tracking config'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      await window.electronAPI.saveTrackingConfig(config)
      setDirty(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save tracking config'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Check for dual tracking warnings
  const warnings = React.useMemo(() => checkDualTracking(config), [config])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          計測タグ設定
        </h3>
        {isDirty && (
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        エクスポート時にHTMLに計測タグが自動挿入されます
      </p>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Warnings */}
      {warnings.map((warning, i) => (
        <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-start gap-2">
          <span className="text-yellow-500 mt-0.5">!</span>
          <span>{warning}</span>
        </div>
      ))}

      {/* GA4 */}
      <TrackingCard
        title="Google Analytics 4"
        description="GA4計測タグ"
        enabled={config.ga4.enabled}
        onToggle={(enabled) => updateGA4({ enabled })}
      >
        <TrackingInput
          label="Measurement ID"
          placeholder="G-XXXXXXXXXX"
          value={config.ga4.measurementId}
          onChange={(measurementId) => updateGA4({ measurementId })}
          validate={validateGA4Id}
        />
      </TrackingCard>

      {/* GTM */}
      <TrackingCard
        title="Google Tag Manager"
        description="GTMコンテナ"
        enabled={config.gtm.enabled}
        onToggle={(enabled) => updateGTM({ enabled })}
      >
        <TrackingInput
          label="Container ID"
          placeholder="GTM-XXXXXXX"
          value={config.gtm.containerId}
          onChange={(containerId) => updateGTM({ containerId })}
          validate={validateGTMId}
        />
      </TrackingCard>

      {/* Facebook Pixel */}
      <TrackingCard
        title="Facebook Pixel"
        description="Meta広告計測"
        enabled={config.facebookPixel.enabled}
        onToggle={(enabled) => updateFacebookPixel({ enabled })}
      >
        <TrackingInput
          label="Pixel ID"
          placeholder="1234567890123456"
          value={config.facebookPixel.pixelId}
          onChange={(pixelId) => updateFacebookPixel({ pixelId })}
          validate={validateFBPixelId}
        />
      </TrackingCard>

      {/* Google Ads */}
      <TrackingCard
        title="Google Ads"
        description="Google広告コンバージョン"
        enabled={config.googleAds.enabled}
        onToggle={(enabled) => updateGoogleAds({ enabled })}
      >
        <TrackingInput
          label="Conversion ID"
          placeholder="AW-XXXXXXXXXX"
          value={config.googleAds.conversionId}
          onChange={(conversionId) => updateGoogleAds({ conversionId })}
          validate={validateGoogleAdsId}
        />
        <div className="mt-2">
          <label className="block text-xs text-gray-500 mb-1">Conversion Label (optional)</label>
          <input
            type="text"
            value={config.googleAds.conversionLabel}
            onChange={(e) => updateGoogleAds({ conversionLabel: e.target.value })}
            placeholder="xxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </TrackingCard>
    </div>
  )
}

// Tracking Card with toggle
interface TrackingCardProps {
  title: string
  description: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  children: React.ReactNode
}

function TrackingCard({ title, description, enabled, onToggle, children }: TrackingCardProps) {
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      enabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-gray-800">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && <div>{children}</div>}
    </div>
  )
}

// Tracking Input with validation
interface TrackingInputProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  validate: (value: string) => ValidationResult
}

function TrackingInput({ label, placeholder, value, onChange, validate }: TrackingInputProps) {
  const validation = React.useMemo(() => validate(value), [value, validate])
  const showValidation = value.length > 0

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            showValidation
              ? validation.valid
                ? 'border-green-300 bg-green-50'
                : 'border-red-300 bg-red-50'
              : 'border-gray-300'
          }`}
        />
        {showValidation && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
            validation.valid ? 'text-green-500' : 'text-red-500'
          }`}>
            {validation.valid ? '\u2713' : '\u2717'}
          </span>
        )}
      </div>
      {showValidation && !validation.valid && validation.message && (
        <p className="text-xs text-red-500 mt-1">{validation.message}</p>
      )}
    </div>
  )
}
