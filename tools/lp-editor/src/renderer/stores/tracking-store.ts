/**
 * Tracking Store
 *
 * Zustand store for managing tracking/analytics configuration.
 * Supports GA4, GTM, Facebook Pixel, and Google Ads.
 */

import { create } from 'zustand'

export interface TrackingProvider {
  readonly enabled: boolean
  readonly id: string
}

export interface GA4Config extends TrackingProvider {
  readonly measurementId: string
}

export interface GTMConfig extends TrackingProvider {
  readonly containerId: string
}

export interface FacebookPixelConfig extends TrackingProvider {
  readonly pixelId: string
}

export interface GoogleAdsConfig extends TrackingProvider {
  readonly conversionId: string
  readonly conversionLabel: string
}

export interface TrackingConfig {
  readonly ga4: GA4Config
  readonly gtm: GTMConfig
  readonly facebookPixel: FacebookPixelConfig
  readonly googleAds: GoogleAdsConfig
}

interface TrackingState {
  readonly config: TrackingConfig
  readonly isDirty: boolean
  readonly isLoading: boolean
  readonly error: string | null

  // Actions
  setConfig: (config: TrackingConfig) => void
  updateGA4: (updates: Partial<GA4Config>) => void
  updateGTM: (updates: Partial<GTMConfig>) => void
  updateFacebookPixel: (updates: Partial<FacebookPixelConfig>) => void
  updateGoogleAds: (updates: Partial<GoogleAdsConfig>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDirty: (dirty: boolean) => void
  reset: () => void
}

const defaultConfig: TrackingConfig = {
  ga4: { enabled: false, id: 'ga4', measurementId: '' },
  gtm: { enabled: false, id: 'gtm', containerId: '' },
  facebookPixel: { enabled: false, id: 'facebookPixel', pixelId: '' },
  googleAds: { enabled: false, id: 'googleAds', conversionId: '', conversionLabel: '' },
}

export const useTrackingStore = create<TrackingState>((set) => ({
  config: defaultConfig,
  isDirty: false,
  isLoading: false,
  error: null,

  setConfig: (config) => set({ config, isDirty: false }),

  updateGA4: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        ga4: { ...state.config.ga4, ...updates },
      },
      isDirty: true,
    })),

  updateGTM: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        gtm: { ...state.config.gtm, ...updates },
      },
      isDirty: true,
    })),

  updateFacebookPixel: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        facebookPixel: { ...state.config.facebookPixel, ...updates },
      },
      isDirty: true,
    })),

  updateGoogleAds: (updates) =>
    set((state) => ({
      config: {
        ...state.config,
        googleAds: { ...state.config.googleAds, ...updates },
      },
      isDirty: true,
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  reset: () => set({ config: defaultConfig, isDirty: false, isLoading: false, error: null }),
}))
