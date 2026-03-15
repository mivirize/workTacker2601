import type { Hearing, Lp, Template, TemplateTier, LpBlock } from '@lp-generator/sanity-schemas/types'

// Extend globalThis for type safety
declare global {
  // eslint-disable-next-line no-var
  var __mockDbHearings: Hearing[] | undefined
  // eslint-disable-next-line no-var
  var __mockDbLps: Lp[] | undefined
}

// Initialize default hearings data
const defaultHearings: Hearing[] = [
  {
    _id: 'hearing-1',
    _type: 'hearing',
    _createdAt: '2024-01-15T10:00:00Z',
    _updatedAt: '2024-01-15T10:00:00Z',
    clientName: 'Sample Company',
    clientSlug: { _type: 'slug', current: 'sample-company' },
    contactPerson: 'Taro Yamada',
    contactEmail: 'taro@example.com',
    productName: 'Cloud Service Pro',
    productDescription: 'A powerful cloud service that helps businesses scale their operations efficiently.',
    uniqueSellingPoints: [
      'Easy to use interface',
      '99.9% uptime guarantee',
      '24/7 customer support',
    ],
    priceInfo: { price: '¥9,800/month', priceNote: 'Tax excluded' },
    targetAudience: 'Small to medium businesses looking for scalable cloud solutions',
    painPoints: [
      'Current systems are too slow',
      'Difficult to scale',
      'Poor customer support from competitors',
    ],
    desiredOutcome: 'Seamless scaling and improved operational efficiency',
    templateTier: 'simple',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    status: 'completed',
  },
  {
    _id: 'hearing-2',
    _type: 'hearing',
    _createdAt: '2024-01-20T14:00:00Z',
    _updatedAt: '2024-01-20T14:00:00Z',
    clientName: 'Tech Startup Inc',
    clientSlug: { _type: 'slug', current: 'tech-startup' },
    contactPerson: 'Hanako Suzuki',
    contactEmail: 'hanako@techstartup.com',
    productName: 'AI Assistant Tool',
    productDescription: 'Revolutionary AI-powered assistant for productivity enhancement.',
    uniqueSellingPoints: [
      'Powered by cutting-edge AI',
      'Integrates with 100+ apps',
      'Saves 10+ hours per week',
    ],
    targetAudience: 'Knowledge workers and teams seeking productivity boost',
    painPoints: [
      'Too many repetitive tasks',
      'Information scattered across tools',
    ],
    templateTier: 'rich',
    primaryColor: '#8B5CF6',
    status: 'draft',
  },
]

// Initialize default LPs data
const defaultLps: Lp[] = [
  {
    _id: 'lp-1',
    _type: 'lp',
    _createdAt: '2024-01-16T10:00:00Z',
    _updatedAt: '2024-01-16T10:00:00Z',
    title: 'Sample Company - Cloud Service Pro',
    slug: { _type: 'slug', current: 'cloud-service-pro' },
    clientSlug: 'sample-company',
    hearing: { _type: 'reference', _ref: 'hearing-1' },
    templateTier: 'simple',
    pageBuilder: [
      {
        _type: 'heroBlock',
        _key: 'hero-1',
        headline: 'Cloud Service Pro',
        subheadline: 'A powerful cloud service that helps businesses scale their operations efficiently.',
        layout: 'center',
        ctaText: 'Get Started',
        ctaUrl: '#contact',
        ctaStyle: 'primary',
      },
      {
        _type: 'featureBlock',
        _key: 'feature-1',
        sectionTitle: 'Why Choose Us',
        features: [
          { _key: 'f1', icon: '✨', title: 'Easy to use interface', description: 'Intuitive design that anyone can use' },
          { _key: 'f2', icon: '🚀', title: '99.9% uptime guarantee', description: 'Reliable service you can count on' },
          { _key: 'f3', icon: '💡', title: '24/7 customer support', description: 'We are here whenever you need us' },
        ],
        layout: 'grid-3',
      },
      {
        _type: 'ctaBlock',
        _key: 'cta-1',
        headline: 'Ready to Get Started?',
        description: 'Contact us today to learn more about our services.',
        primaryButtonText: 'Contact Us',
        primaryButtonUrl: '#contact',
        secondaryButtonText: 'Learn More',
        secondaryButtonUrl: '#features',
        backgroundColor: 'primary',
      },
    ],
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    seoTitle: 'Cloud Service Pro | Sample Company',
    seoDescription: 'A powerful cloud service that helps businesses scale their operations efficiently.',
    publishStatus: 'published',
    publishedAt: '2024-01-16T12:00:00Z',
  },
]

// Use globalThis to persist data across module reloads in development
// This is necessary because Next.js App Router may reload modules independently
function getHearings(): Hearing[] {
  if (!globalThis.__mockDbHearings) {
    globalThis.__mockDbHearings = [...defaultHearings]
  }
  return globalThis.__mockDbHearings
}

function setHearings(data: Hearing[]): void {
  globalThis.__mockDbHearings = data
}

function getLps(): Lp[] {
  if (!globalThis.__mockDbLps) {
    globalThis.__mockDbLps = [...defaultLps]
  }
  return globalThis.__mockDbLps
}

function setLps(data: Lp[]): void {
  globalThis.__mockDbLps = data
}

const templates: Template[] = [
  {
    _id: 'template-simple',
    _type: 'template',
    name: 'Simple',
    tier: 'simple',
    description: 'Basic layout with essential sections',
    availableBlocks: ['heroBlock', 'featureBlock', 'ctaBlock'],
    defaultBlockTypes: ['heroBlock', 'featureBlock', 'ctaBlock'],
  },
  {
    _id: 'template-rich',
    _type: 'template',
    name: 'Rich',
    tier: 'rich',
    description: 'Detailed layout with more sections',
    availableBlocks: ['heroBlock', 'featureBlock', 'benefitBlock', 'testimonialBlock', 'faqBlock', 'ctaBlock'],
    defaultBlockTypes: ['heroBlock', 'featureBlock', 'ctaBlock'],
  },
  {
    _id: 'template-premier',
    _type: 'template',
    name: 'Premier',
    tier: 'premier',
    description: 'Premium layout with all features',
    availableBlocks: ['heroBlock', 'featureBlock', 'benefitBlock', 'testimonialBlock', 'pricingBlock', 'faqBlock', 'formBlock', 'imageGalleryBlock', 'videoBlock', 'textBlock', 'ctaBlock'],
    defaultBlockTypes: ['heroBlock', 'featureBlock', 'ctaBlock'],
  },
]

// Mock API functions
export const mockDb = {
  // Hearings
  getAllHearings: () => {
    const hearings = getHearings()
    const lps = getLps()
    return hearings.map(h => ({
      ...h,
      linkedLp: lps.find(lp => lp.hearing?._ref === h._id) ? {
        _id: lps.find(lp => lp.hearing?._ref === h._id)?._id,
        title: lps.find(lp => lp.hearing?._ref === h._id)?.title,
        slug: lps.find(lp => lp.hearing?._ref === h._id)?.slug,
        publishStatus: lps.find(lp => lp.hearing?._ref === h._id)?.publishStatus,
      } : undefined,
    }))
  },

  getHearingById: (id: string) => {
    const hearings = getHearings()
    const lps = getLps()
    const hearing = hearings.find(h => h._id === id)
    if (!hearing) return null

    const linkedLp = lps.find(lp => lp.hearing?._ref === id)
    return {
      ...hearing,
      linkedLp: linkedLp ? {
        _id: linkedLp._id,
        title: linkedLp.title,
        slug: linkedLp.slug,
        publishStatus: linkedLp.publishStatus,
      } : undefined,
    }
  },

  createHearing: (data: Partial<Hearing>) => {
    const id = `hearing-${Date.now()}`
    const now = new Date().toISOString()
    const newHearing: Hearing = {
      _id: id,
      _type: 'hearing',
      _createdAt: now,
      _updatedAt: now,
      clientName: data.clientName ?? '',
      clientSlug: data.clientSlug ?? { _type: 'slug', current: '' },
      productName: data.productName ?? '',
      uniqueSellingPoints: data.uniqueSellingPoints ?? [],
      templateTier: data.templateTier ?? 'simple',
      status: 'draft',
      ...data,
    } as Hearing
    setHearings([...getHearings(), newHearing])
    return newHearing
  },

  updateHearing: (id: string, data: Partial<Hearing>) => {
    const hearings = getHearings()
    const updated = hearings.map(h =>
      h._id === id
        ? { ...h, ...data, _updatedAt: new Date().toISOString() }
        : h
    )
    setHearings(updated)
    return updated.find(h => h._id === id)
  },

  // LPs
  getAllLps: () => {
    const lps = getLps()
    const hearings = getHearings()
    return lps.map(lp => ({
      ...lp,
      hearing: lp.hearing ? {
        _id: hearings.find(h => h._id === lp.hearing?._ref)?._id,
        clientName: hearings.find(h => h._id === lp.hearing?._ref)?.clientName,
      } : undefined,
    }))
  },

  getLpById: (id: string) => {
    const lps = getLps()
    const hearings = getHearings()
    const lp = lps.find(l => l._id === id)
    if (!lp) return null

    const hearing = lp.hearing ? hearings.find(h => h._id === lp.hearing?._ref) : undefined
    return {
      ...lp,
      hearing: hearing ? {
        _id: hearing._id,
        clientName: hearing.clientName,
        productName: hearing.productName,
      } : undefined,
    }
  },

  getLpBySlug: (clientSlug: string, slug: string) => {
    const lps = getLps()
    return lps.find(l => l.clientSlug === clientSlug && l.slug.current === slug) ?? null
  },

  createLp: (data: Partial<Lp>) => {
    const id = `lp-${Date.now()}`
    const now = new Date().toISOString()
    const newLp: Lp = {
      _id: id,
      _type: 'lp',
      _createdAt: now,
      _updatedAt: now,
      title: data.title ?? '',
      slug: data.slug ?? { _type: 'slug', current: '' },
      templateTier: data.templateTier ?? 'simple',
      pageBuilder: data.pageBuilder ?? [],
      publishStatus: 'draft',
      ...data,
    } as Lp
    setLps([...getLps(), newLp])
    return newLp
  },

  updateLp: (id: string, data: Partial<Lp>) => {
    const lps = getLps()
    const updated = lps.map(lp =>
      lp._id === id
        ? { ...lp, ...data, _updatedAt: new Date().toISOString() }
        : lp
    )
    setLps(updated)
    return updated.find(lp => lp._id === id)
  },

  // Templates
  getAllTemplates: () => templates,

  getTemplateByTier: (tier: TemplateTier) => {
    return templates.find(t => t.tier === tier) ?? null
  },
}

// Helper to generate slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

// Helper to generate blocks from hearing based on template tier
export function generateBlocksFromHearing(hearing: Hearing): LpBlock[] {
  const blocks: LpBlock[] = []
  const tier = hearing.templateTier

  // Hero Block (all tiers)
  blocks.push({
    _type: 'heroBlock',
    _key: crypto.randomUUID(),
    headline: hearing.productName,
    subheadline: hearing.productDescription?.slice(0, 150) ?? '',
    layout: 'center',
    ctaText: 'Get Started',
    ctaUrl: '#contact',
    ctaStyle: 'primary',
  })

  // Feature Block from USPs (all tiers)
  if (hearing.uniqueSellingPoints && hearing.uniqueSellingPoints.length > 0) {
    blocks.push({
      _type: 'featureBlock',
      _key: crypto.randomUUID(),
      sectionTitle: 'Why Choose Us',
      features: hearing.uniqueSellingPoints.map((usp, index) => ({
        _key: `feature-${index}`,
        icon: ['✨', '🚀', '💡', '🎯', '⚡'][index % 5],
        title: usp,
        description: '',
      })),
      layout: hearing.uniqueSellingPoints.length <= 2 ? 'grid-2' : 'grid-3',
    })
  }

  // Rich tier blocks
  if (tier === 'rich' || tier === 'premier') {
    // Benefit Block from pain points
    if (hearing.painPoints && hearing.painPoints.length > 0) {
      blocks.push({
        _type: 'benefitBlock',
        _key: crypto.randomUUID(),
        sectionTitle: 'Solve Your Challenges',
        sectionSubtitle: 'See how we address your key pain points',
        benefits: hearing.painPoints.map((pain, index) => ({
          _key: `benefit-${index}`,
          problem: pain,
          solution: hearing.uniqueSellingPoints?.[index] ?? 'Our solution',
          icon: ['🔧', '💪', '🎯', '✅', '🌟'][index % 5],
        })),
        layout: 'before-after',
      })
    }

    // Testimonial Block
    blocks.push({
      _type: 'testimonialBlock',
      _key: crypto.randomUUID(),
      sectionTitle: 'What Our Clients Say',
      testimonials: [
        {
          _key: 'testimonial-1',
          quote: 'This service has transformed how we work. Highly recommended!',
          authorName: 'John Doe',
          authorTitle: 'CEO',
          authorCompany: 'Tech Corp',
          rating: 5,
        },
        {
          _key: 'testimonial-2',
          quote: 'Outstanding support and excellent results. A game-changer for our business.',
          authorName: 'Jane Smith',
          authorTitle: 'CTO',
          authorCompany: 'Innovation Inc',
          rating: 5,
        },
      ],
      layout: 'grid',
      showRating: true,
    })

    // FAQ Block
    blocks.push({
      _type: 'faqBlock',
      _key: crypto.randomUUID(),
      sectionTitle: 'Frequently Asked Questions',
      faqs: [
        {
          _key: 'faq-1',
          question: 'How do I get started?',
          answer: 'Simply contact us through the form below and our team will guide you through the setup process.',
        },
        {
          _key: 'faq-2',
          question: 'What is your pricing model?',
          answer: hearing.priceInfo?.price
            ? `Our pricing starts at ${hearing.priceInfo.price}. ${hearing.priceInfo.priceNote ?? ''}`
            : 'Contact us for a custom quote tailored to your needs.',
        },
        {
          _key: 'faq-3',
          question: 'Do you offer support?',
          answer: 'Yes! We provide 24/7 customer support to ensure your success.',
        },
      ],
      layout: 'accordion',
    })
  }

  // Premier tier blocks
  if (tier === 'premier') {
    // Pricing Block
    if (hearing.priceInfo) {
      blocks.push({
        _type: 'pricingBlock',
        _key: crypto.randomUUID(),
        sectionTitle: 'Choose Your Plan',
        sectionSubtitle: 'Flexible pricing for every business size',
        plans: [
          {
            _key: 'plan-basic',
            name: 'Basic',
            description: 'Perfect for getting started',
            price: '¥4,980',
            pricePeriod: '/month',
            features: ['Core features', 'Email support', '5 users'],
            ctaText: 'Get Started',
            ctaUrl: '#contact',
          },
          {
            _key: 'plan-pro',
            name: 'Pro',
            description: 'Best for growing teams',
            price: hearing.priceInfo.price,
            pricePeriod: '/month',
            priceNote: hearing.priceInfo.priceNote,
            features: ['All Basic features', 'Priority support', 'Unlimited users', 'Advanced analytics'],
            isPopular: true,
            ctaText: 'Get Started',
            ctaUrl: '#contact',
          },
          {
            _key: 'plan-enterprise',
            name: 'Enterprise',
            description: 'For large organizations',
            price: 'Custom',
            features: ['All Pro features', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
            ctaText: 'Contact Sales',
            ctaUrl: '#contact',
          },
        ],
      })
    }

    // Form Block
    blocks.push({
      _type: 'formBlock',
      _key: crypto.randomUUID(),
      sectionTitle: 'Contact Us',
      sectionSubtitle: 'Fill out the form below and we will get back to you shortly',
      formFields: [
        { _key: 'field-name', fieldName: 'name', fieldLabel: 'Name', fieldType: 'text', placeholder: 'Your name', required: true },
        { _key: 'field-email', fieldName: 'email', fieldLabel: 'Email', fieldType: 'email', placeholder: 'your@email.com', required: true },
        { _key: 'field-company', fieldName: 'company', fieldLabel: 'Company', fieldType: 'text', placeholder: 'Your company' },
        { _key: 'field-message', fieldName: 'message', fieldLabel: 'Message', fieldType: 'textarea', placeholder: 'How can we help?', required: true },
      ],
      submitButtonText: 'Send Message',
      successMessage: 'Thank you! We will be in touch soon.',
    })

    // Video Block
    blocks.push({
      _type: 'videoBlock',
      _key: crypto.randomUUID(),
      sectionTitle: 'See It In Action',
      sectionSubtitle: 'Watch our product demo',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      layout: 'centered',
    })
  }

  // CTA Block (all tiers - at the end)
  blocks.push({
    _type: 'ctaBlock',
    _key: crypto.randomUUID(),
    headline: 'Ready to Get Started?',
    description: hearing.desiredOutcome ?? 'Contact us today to learn more about our services.',
    primaryButtonText: 'Contact Us',
    primaryButtonUrl: '#contact',
    secondaryButtonText: 'Learn More',
    secondaryButtonUrl: '#features',
    backgroundColor: 'primary',
  })

  return blocks
}
