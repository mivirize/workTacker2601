import { sanityClient, sanityWriteClient, generateId } from './sanity-client'
import type { Hearing, Lp, Template, TemplateTier } from '@lp-generator/sanity-schemas/types'

// GROQ Queries
const hearingFields = `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  clientName,
  clientSlug,
  contactPerson,
  contactEmail,
  productName,
  productDescription,
  uniqueSellingPoints,
  priceInfo,
  targetAudience,
  painPoints,
  desiredOutcome,
  templateTier,
  primaryColor,
  secondaryColor,
  accentColor,
  status,
  linkedLp,
  notes
`

const lpFields = `
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  slug,
  clientSlug,
  hearing,
  templateTier,
  pageBuilder,
  primaryColor,
  secondaryColor,
  accentColor,
  seoTitle,
  seoDescription,
  publishStatus,
  publishedAt,
  publishAt,
  unpublishAt
`

// Extended types with joined/populated data
interface HearingWithLp extends Omit<Hearing, 'linkedLp'> {
  linkedLp?: {
    _id: string
    title: string
    slug: { current: string }
    publishStatus: string
  }
}

interface LpWithHearing extends Omit<Lp, 'hearing'> {
  hearing?: {
    _id: string
    clientName: string
    productName: string
  }
}

// Sanity Database Operations
export const sanityDb = {
  // === Hearings ===
  getAllHearings: async (): Promise<HearingWithLp[]> => {
    const query = `*[_type == "hearing"] | order(_createdAt desc) {
      ${hearingFields},
      "linkedLp": linkedLp-> {
        _id,
        title,
        slug,
        publishStatus
      }
    }`
    return sanityClient.fetch(query)
  },

  getHearingById: async (id: string): Promise<HearingWithLp | null> => {
    const query = `*[_type == "hearing" && _id == $id][0] {
      ${hearingFields},
      "linkedLp": linkedLp-> {
        _id,
        title,
        slug,
        publishStatus
      }
    }`
    return sanityClient.fetch(query, { id })
  },

  createHearing: async (data: Partial<Hearing>): Promise<Hearing> => {
    const id = `hearing-${generateId()}`
    const doc = {
      _id: id,
      _type: 'hearing' as const,
      clientName: data.clientName ?? '',
      clientSlug: data.clientSlug ?? { _type: 'slug', current: '' },
      productName: data.productName ?? '',
      uniqueSellingPoints: data.uniqueSellingPoints ?? [],
      templateTier: data.templateTier ?? 'simple',
      status: data.status ?? 'draft',
      ...data,
    }
    const result = await sanityWriteClient.create(doc)
    return result as unknown as Hearing
  },

  updateHearing: async (id: string, data: Partial<Hearing>): Promise<Hearing | null> => {
    const result = await sanityWriteClient
      .patch(id)
      .set(data)
      .commit()
    return result as unknown as Hearing
  },

  deleteHearing: async (id: string): Promise<void> => {
    await sanityWriteClient.delete(id)
  },

  // === LPs ===
  getAllLps: async (): Promise<LpWithHearing[]> => {
    const query = `*[_type == "lp"] | order(_createdAt desc) {
      ${lpFields},
      "hearing": hearing-> {
        _id,
        clientName,
        productName
      }
    }`
    return sanityClient.fetch(query)
  },

  getLpById: async (id: string): Promise<LpWithHearing | null> => {
    const query = `*[_type == "lp" && _id == $id][0] {
      ${lpFields},
      "hearing": hearing-> {
        _id,
        clientName,
        productName
      }
    }`
    return sanityClient.fetch(query, { id })
  },

  getLpBySlug: async (clientSlug: string, slug: string): Promise<Lp | null> => {
    const query = `*[_type == "lp" && clientSlug == $clientSlug && slug.current == $slug][0] {
      ${lpFields}
    }`
    return sanityClient.fetch(query, { clientSlug, slug })
  },

  createLp: async (data: Partial<Lp>): Promise<Lp> => {
    const id = `lp-${generateId()}`
    const doc = {
      _id: id,
      _type: 'lp' as const,
      title: data.title ?? '',
      slug: data.slug ?? { _type: 'slug', current: '' },
      templateTier: data.templateTier ?? 'simple',
      pageBuilder: data.pageBuilder ?? [],
      publishStatus: data.publishStatus ?? 'draft',
      ...data,
    }
    const result = await sanityWriteClient.create(doc)
    return result as unknown as Lp
  },

  updateLp: async (id: string, data: Partial<Lp>): Promise<Lp | null> => {
    const result = await sanityWriteClient
      .patch(id)
      .set(data)
      .commit()
    return result as unknown as Lp
  },

  // === Templates ===
  getAllTemplates: async (): Promise<Template[]> => {
    const query = `*[_type == "template"] | order(tier asc) {
      _id,
      _type,
      name,
      tier,
      description,
      availableBlocks,
      defaultBlockTypes
    }`
    return sanityClient.fetch(query)
  },

  getTemplateByTier: async (tier: TemplateTier): Promise<Template | null> => {
    const query = `*[_type == "template" && tier == $tier][0]`
    return sanityClient.fetch(query, { tier })
  },
}

// Re-export helper functions from mock-data for block generation
export { generateSlug, generateBlocksFromHearing } from './mock-data'
