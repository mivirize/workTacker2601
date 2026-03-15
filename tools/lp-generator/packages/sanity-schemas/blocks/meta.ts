import type { TemplateTier } from '../types'

export const BLOCK_TIER_CONFIG = {
  heroBlock: { tier: 'simple' as const, label: 'Hero', icon: 'RocketIcon' },
  featureBlock: { tier: 'simple' as const, label: 'Feature', icon: 'GridIcon' },
  ctaBlock: { tier: 'simple' as const, label: 'CTA', icon: 'ArrowRightIcon' },
  benefitBlock: { tier: 'rich' as const, label: 'Benefit', icon: 'CheckCircleIcon' },
  faqBlock: { tier: 'rich' as const, label: 'FAQ', icon: 'HelpCircleIcon' },
  testimonialBlock: { tier: 'rich' as const, label: 'Testimonial', icon: 'MessageCircleIcon' },
  pricingBlock: { tier: 'premier' as const, label: 'Pricing', icon: 'DollarSignIcon' },
  formBlock: { tier: 'premier' as const, label: 'Form', icon: 'MailIcon' },
  imageGalleryBlock: { tier: 'premier' as const, label: 'Gallery', icon: 'ImageIcon' },
  videoBlock: { tier: 'premier' as const, label: 'Video', icon: 'PlayIcon' },
  textBlock: { tier: 'premier' as const, label: 'Text', icon: 'TypeIcon' },
} as const

export type BlockType = keyof typeof BLOCK_TIER_CONFIG
export type BlockTier = 'simple' | 'rich' | 'premier'

export const TIER_HIERARCHY: Record<TemplateTier, number> = {
  simple: 1,
  rich: 2,
  premier: 3,
}

export function getAvailableBlocks(tier: TemplateTier): BlockType[] {
  const currentLevel = TIER_HIERARCHY[tier]

  return Object.entries(BLOCK_TIER_CONFIG)
    .filter(([, config]) => TIER_HIERARCHY[config.tier] <= currentLevel)
    .map(([key]) => key as BlockType)
}

export function isBlockAvailable(blockType: BlockType, tier: TemplateTier): boolean {
  const blockTier = BLOCK_TIER_CONFIG[blockType]?.tier
  if (!blockTier) return false

  return TIER_HIERARCHY[blockTier] <= TIER_HIERARCHY[tier]
}

export function getBlockLabel(blockType: BlockType): string {
  return BLOCK_TIER_CONFIG[blockType]?.label ?? blockType
}

export function getBlocksByTier(tier: TemplateTier): BlockType[] {
  return Object.entries(BLOCK_TIER_CONFIG)
    .filter(([, config]) => config.tier === tier)
    .map(([key]) => key as BlockType)
}
