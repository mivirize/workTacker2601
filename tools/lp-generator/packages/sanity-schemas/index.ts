// Documents
import { hearing } from './documents/hearing'
import { lp } from './documents/lp'
import { template } from './documents/template'

// Blocks
import { heroBlock } from './blocks/hero'
import { featureBlock } from './blocks/feature'
import { ctaBlock } from './blocks/cta'
import { benefitBlock } from './blocks/benefit'
import { testimonialBlock } from './blocks/testimonial'
import { faqBlock } from './blocks/faq'
import { pricingBlock } from './blocks/pricing'
import { formBlock } from './blocks/form'
import { imageGalleryBlock } from './blocks/imageGallery'
import { videoBlock } from './blocks/video'
import { textBlock } from './blocks/text'

// Block Metadata
export { BLOCK_TIER_CONFIG, TIER_HIERARCHY, getAvailableBlocks } from './blocks/meta'
export type { BlockType, BlockTier } from './blocks/meta'

// Color Presets
export { COLOR_PRESETS, getPresetByValue, getPresetColors } from './config/colorPresets'
export type { ColorPreset } from './config/colorPresets'

export const schemaTypes = [
  // Documents
  hearing,
  lp,
  template,
  // Blocks
  heroBlock,
  featureBlock,
  ctaBlock,
  benefitBlock,
  testimonialBlock,
  faqBlock,
  pricingBlock,
  formBlock,
  imageGalleryBlock,
  videoBlock,
  textBlock,
]

export {
  // Documents
  hearing,
  lp,
  template,
  // Blocks
  heroBlock,
  featureBlock,
  ctaBlock,
  benefitBlock,
  testimonialBlock,
  faqBlock,
  pricingBlock,
  formBlock,
  imageGalleryBlock,
  videoBlock,
  textBlock,
}
