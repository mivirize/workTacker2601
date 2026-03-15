import type { LpBlock, TemplateTier } from '@lp-generator/sanity-schemas/types'
import { TIER_ALLOWED_BLOCKS } from '../types'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function sanitizeHeroBlock(block: Record<string, unknown>): Record<string, unknown> {
  return {
    _type: 'heroBlock',
    _key: block._key || generateUUID(),
    headline: block.headline || '見出しが必要です',
    subheadline: block.subheadline || undefined,
    ctaText: block.ctaText || 'お問い合わせ',
    ctaUrl: block.ctaUrl || '#contact',
    ctaStyle: ['primary', 'secondary', 'outline'].includes(block.ctaStyle as string)
      ? block.ctaStyle
      : 'primary',
    layout: ['center', 'left', 'right'].includes(block.layout as string) ? block.layout : 'center',
  }
}

function sanitizeFeatureBlock(block: Record<string, unknown>): Record<string, unknown> {
  const features = Array.isArray(block.features) ? block.features : []

  return {
    _type: 'featureBlock',
    _key: block._key || generateUUID(),
    sectionTitle: block.sectionTitle || '特徴',
    sectionSubtitle: block.sectionSubtitle || undefined,
    features: features.map((f: Record<string, unknown>) => ({
      _key: f._key || generateUUID(),
      icon: f.icon || '✨',
      title: f.title || '特徴',
      description: f.description || '',
    })),
    layout: ['grid-2', 'grid-3', 'list'].includes(block.layout as string) ? block.layout : 'grid-3',
  }
}

function sanitizeCtaBlock(block: Record<string, unknown>): Record<string, unknown> {
  return {
    _type: 'ctaBlock',
    _key: block._key || generateUUID(),
    headline: block.headline || 'お問い合わせ',
    description: block.description || '',
    primaryButtonText: block.primaryButtonText || 'お問い合わせ',
    primaryButtonUrl: block.primaryButtonUrl || '#contact',
    secondaryButtonText: block.secondaryButtonText || undefined,
    secondaryButtonUrl: block.secondaryButtonUrl || undefined,
    layout: ['center', 'split'].includes(block.layout as string) ? block.layout : 'center',
  }
}

function sanitizeBenefitBlock(block: Record<string, unknown>): Record<string, unknown> {
  const benefits = Array.isArray(block.benefits) ? block.benefits : []

  return {
    _type: 'benefitBlock',
    _key: block._key || generateUUID(),
    sectionTitle: block.sectionTitle || 'メリット',
    benefits: benefits.map((b: Record<string, unknown>) => ({
      _key: b._key || generateUUID(),
      problem: b.problem || '',
      solution: b.solution || '',
      icon: b.icon || '✅',
    })),
    layout: ['before-after', 'list', 'grid'].includes(block.layout as string)
      ? block.layout
      : 'before-after',
  }
}

function sanitizeTestimonialBlock(block: Record<string, unknown>): Record<string, unknown> {
  const testimonials = Array.isArray(block.testimonials) ? block.testimonials : []

  return {
    _type: 'testimonialBlock',
    _key: block._key || generateUUID(),
    sectionTitle: block.sectionTitle || 'お客様の声',
    testimonials: testimonials.map((t: Record<string, unknown>) => ({
      _key: t._key || generateUUID(),
      quote: t.quote || '',
      authorName: t.authorName || '匿名',
      authorTitle: t.authorTitle || undefined,
      authorCompany: t.authorCompany || undefined,
      rating: typeof t.rating === 'number' ? t.rating : 5,
    })),
    layout: ['grid', 'carousel', 'list'].includes(block.layout as string) ? block.layout : 'grid',
    showRating: block.showRating !== false,
  }
}

function sanitizeFaqBlock(block: Record<string, unknown>): Record<string, unknown> {
  const faqs = Array.isArray(block.faqs) ? block.faqs : []

  return {
    _type: 'faqBlock',
    _key: block._key || generateUUID(),
    sectionTitle: block.sectionTitle || 'よくある質問',
    faqs: faqs.map((f: Record<string, unknown>) => ({
      _key: f._key || generateUUID(),
      question: f.question || '',
      answer: f.answer || '',
    })),
    layout: ['accordion', 'list'].includes(block.layout as string) ? block.layout : 'accordion',
  }
}

function sanitizePricingBlock(block: Record<string, unknown>): Record<string, unknown> {
  const plans = Array.isArray(block.plans) ? block.plans : []

  return {
    _type: 'pricingBlock',
    _key: block._key || generateUUID(),
    sectionTitle: block.sectionTitle || '料金プラン',
    sectionSubtitle: block.sectionSubtitle || undefined,
    plans: plans.map((p: Record<string, unknown>) => ({
      _key: p._key || generateUUID(),
      name: p.name || 'プラン',
      price: p.price || '要問い合わせ',
      pricePeriod: p.pricePeriod || '',
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features : [],
      isPopular: p.isPopular === true,
      ctaText: p.ctaText || '選択',
      ctaUrl: p.ctaUrl || '#contact',
    })),
    layout: ['cards', 'comparison'].includes(block.layout as string) ? block.layout : 'cards',
  }
}

function sanitizeFormBlock(block: Record<string, unknown>): Record<string, unknown> {
  const formFields = Array.isArray(block.formFields) ? block.formFields : []

  return {
    _type: 'formBlock',
    _key: block._key || generateUUID(),
    sectionTitle: block.sectionTitle || 'お問い合わせ',
    sectionSubtitle: block.sectionSubtitle || undefined,
    formFields: formFields.map((f: Record<string, unknown>) => ({
      _key: f._key || generateUUID(),
      fieldName: f.fieldName || 'field',
      fieldLabel: f.fieldLabel || 'フィールド',
      fieldType: ['text', 'email', 'tel', 'textarea', 'select'].includes(f.fieldType as string)
        ? f.fieldType
        : 'text',
      placeholder: f.placeholder || '',
      required: f.required !== false,
    })),
    submitButtonText: block.submitButtonText || '送信',
    successMessage: block.successMessage || 'ありがとうございます。送信が完了しました。',
  }
}

function sanitizeBlock(block: Record<string, unknown>): Record<string, unknown> | null {
  const blockType = block._type as string

  switch (blockType) {
    case 'heroBlock':
      return sanitizeHeroBlock(block)
    case 'featureBlock':
      return sanitizeFeatureBlock(block)
    case 'ctaBlock':
      return sanitizeCtaBlock(block)
    case 'benefitBlock':
      return sanitizeBenefitBlock(block)
    case 'testimonialBlock':
      return sanitizeTestimonialBlock(block)
    case 'faqBlock':
      return sanitizeFaqBlock(block)
    case 'pricingBlock':
      return sanitizePricingBlock(block)
    case 'formBlock':
      return sanitizeFormBlock(block)
    case 'imageGalleryBlock':
    case 'videoBlock':
    case 'textBlock':
      // Pass through with basic sanitization
      return {
        ...block,
        _key: block._key || generateUUID(),
      }
    default:
      return null
  }
}

export function validateAndSanitizeBlocks(blocks: LpBlock[], tier: TemplateTier): LpBlock[] {
  const allowedTypes = TIER_ALLOWED_BLOCKS[tier]

  return blocks
    .filter((block) => {
      const blockType = (block as unknown as Record<string, unknown>)._type as string
      return allowedTypes.includes(blockType)
    })
    .map((block) => {
      const sanitized = sanitizeBlock(block as unknown as Record<string, unknown>)
      return sanitized as unknown as LpBlock
    })
    .filter((block): block is LpBlock => block !== null)
}
