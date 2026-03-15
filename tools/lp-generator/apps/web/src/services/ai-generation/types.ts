import type { LpBlock, TemplateTier } from '@lp-generator/sanity-schemas/types'

export interface TargetPersona {
  ageRange: string
  occupation: string
  primaryConcern: string
}

export interface Analysis {
  industry: string
  targetPersona: TargetPersona
  recommendedTone: string
  toneRationale: string
}

export interface DesignRecommendations {
  layout: 'center' | 'left' | 'right'
  colorUsage: string
  iconStyle: string
}

export interface AIGenerationResponse {
  analysis: Analysis
  designRecommendations: DesignRecommendations
  blocks: LpBlock[]
}

export interface GenerationResult {
  blocks: LpBlock[]
  source: 'ai' | 'fallback'
  analysis?: Analysis
  designRecommendations?: DesignRecommendations
  error?: string
}

export interface HearingInput {
  clientName: string
  productName: string
  productDescription?: string | null
  uniqueSellingPoints: string[]
  priceInfo?: {
    price?: string | null
    priceNote?: string | null
  } | null
  targetAudience?: string | null
  painPoints?: string[]
  desiredOutcome?: string | null
  templateTier: TemplateTier
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  referenceUrls?: string[]
}

export const TIER_ALLOWED_BLOCKS: Record<TemplateTier, string[]> = {
  simple: ['heroBlock', 'featureBlock', 'ctaBlock'],
  rich: ['heroBlock', 'featureBlock', 'ctaBlock', 'benefitBlock', 'testimonialBlock', 'faqBlock'],
  premier: [
    'heroBlock',
    'featureBlock',
    'ctaBlock',
    'benefitBlock',
    'testimonialBlock',
    'faqBlock',
    'pricingBlock',
    'formBlock',
    'imageGalleryBlock',
    'videoBlock',
    'textBlock',
  ],
}
