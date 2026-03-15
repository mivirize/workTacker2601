/**
 * Database abstraction layer
 *
 * Switches between mockDb and sanityDb based on USE_SANITY environment variable.
 * - USE_SANITY=true: Uses real Sanity database
 * - USE_SANITY=false or unset: Uses in-memory mock data (default)
 */

import { mockDb, generateSlug, generateBlocksFromHearing } from './mock-data'
import { sanityDb } from './sanity-db'
import type { Hearing, Lp, Template, TemplateTier } from '@lp-generator/sanity-schemas/types'

const USE_SANITY = process.env.USE_SANITY === 'true'

// Extended types (with populated references)
interface HearingWithLp extends Omit<Hearing, 'linkedLp'> {
  linkedLp?: {
    _id: string
    title?: string
    slug?: { current: string }
    publishStatus?: string
  }
}

interface LpWithHearing extends Omit<Lp, 'hearing'> {
  hearing?: {
    _id: string
    clientName?: string
    productName?: string
  }
}

// Unified database interface
export const db = {
  // === Hearings ===
  getAllHearings: async (): Promise<HearingWithLp[]> => {
    if (USE_SANITY) {
      return sanityDb.getAllHearings()
    }
    return Promise.resolve(mockDb.getAllHearings() as HearingWithLp[])
  },

  getHearingById: async (id: string): Promise<HearingWithLp | null> => {
    if (USE_SANITY) {
      return sanityDb.getHearingById(id)
    }
    return Promise.resolve(mockDb.getHearingById(id) as HearingWithLp | null)
  },

  createHearing: async (data: Partial<Hearing>): Promise<Hearing> => {
    if (USE_SANITY) {
      return sanityDb.createHearing(data)
    }
    return Promise.resolve(mockDb.createHearing(data))
  },

  updateHearing: async (id: string, data: Partial<Hearing>): Promise<Hearing | null> => {
    if (USE_SANITY) {
      return sanityDb.updateHearing(id, data)
    }
    return Promise.resolve(mockDb.updateHearing(id, data) as Hearing | null)
  },

  deleteHearing: async (id: string): Promise<void> => {
    if (USE_SANITY) {
      return sanityDb.deleteHearing(id)
    }
    // mockDb doesn't have delete, just ignore
  },

  // === LPs ===
  getAllLps: async (): Promise<LpWithHearing[]> => {
    if (USE_SANITY) {
      return sanityDb.getAllLps()
    }
    return Promise.resolve(mockDb.getAllLps() as LpWithHearing[])
  },

  getLpById: async (id: string): Promise<LpWithHearing | null> => {
    if (USE_SANITY) {
      return sanityDb.getLpById(id)
    }
    return Promise.resolve(mockDb.getLpById(id) as LpWithHearing | null)
  },

  getLpBySlug: async (clientSlug: string, slug: string): Promise<Lp | null> => {
    if (USE_SANITY) {
      return sanityDb.getLpBySlug(clientSlug, slug)
    }
    return Promise.resolve(mockDb.getLpBySlug(clientSlug, slug))
  },

  createLp: async (data: Partial<Lp>): Promise<Lp> => {
    if (USE_SANITY) {
      return sanityDb.createLp(data)
    }
    return Promise.resolve(mockDb.createLp(data))
  },

  updateLp: async (id: string, data: Partial<Lp>): Promise<Lp | null> => {
    if (USE_SANITY) {
      return sanityDb.updateLp(id, data)
    }
    return Promise.resolve(mockDb.updateLp(id, data) as Lp | null)
  },

  // === Templates ===
  getAllTemplates: async (): Promise<Template[]> => {
    if (USE_SANITY) {
      return sanityDb.getAllTemplates()
    }
    return Promise.resolve(mockDb.getAllTemplates())
  },

  getTemplateByTier: async (tier: TemplateTier): Promise<Template | null> => {
    if (USE_SANITY) {
      return sanityDb.getTemplateByTier(tier)
    }
    return Promise.resolve(mockDb.getTemplateByTier(tier))
  },
}

// Re-export utilities
export { generateSlug, generateBlocksFromHearing }
export type { HearingWithLp, LpWithHearing }
