// Template Tiers
export type TemplateTier = 'simple' | 'rich' | 'premier'

// Hearing Status
export type HearingStatus =
  | 'draft'
  | 'completed'
  | 'in_progress'
  | 'review'
  | 'published'

// LP Publish Status
export type LpPublishStatus =
  | 'draft'
  | 'preview'
  | 'published'
  | 'unpublished'

// Sanity Image
export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
}

// Slug
export interface SanitySlug {
  _type: 'slug'
  current: string
}

// Reference
export interface SanityReference {
  _type: 'reference'
  _ref: string
}

// Hearing Document
export interface Hearing {
  _id: string
  _type: 'hearing'
  _createdAt: string
  _updatedAt: string
  clientName: string
  clientSlug: SanitySlug
  contactPerson?: string
  contactEmail?: string
  productName: string
  productDescription?: string
  uniqueSellingPoints: string[]
  priceInfo?: { price: string; priceNote?: string }
  targetAudience?: string
  painPoints?: string[]
  desiredOutcome?: string
  templateTier: TemplateTier
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  referenceUrls?: string[]
  logoImage?: SanityImage
  brandAssets?: SanityImage[]
  status: HearingStatus
  linkedLp?: SanityReference
  notes?: string
}

// LP Document
export interface Lp {
  _id: string
  _type: 'lp'
  _createdAt: string
  _updatedAt: string
  title: string
  slug: SanitySlug
  clientSlug?: string
  hearing?: SanityReference
  template?: SanityReference
  templateTier: TemplateTier
  pageBuilder: LpBlock[]
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  seoTitle?: string
  seoDescription?: string
  ogImage?: SanityImage
  publishStatus: LpPublishStatus
  publishedAt?: string
  publishAt?: string
  unpublishAt?: string
  expiresAt?: string
}

// Template Document
export interface Template {
  _id: string
  _type: 'template'
  name: string
  tier: TemplateTier
  description?: string
  thumbnail?: SanityImage
  availableBlocks?: string[]
  defaultBlockTypes?: string[]
}

// Block Types
export type LpBlock =
  | HeroBlock
  | FeatureBlock
  | CtaBlock
  | BenefitBlock
  | TestimonialBlock
  | FaqBlock
  | PricingBlock
  | FormBlock
  | ImageGalleryBlock
  | VideoBlock
  | TextBlock

// Hero Block
export interface HeroBlock {
  _type: 'heroBlock'
  _key: string
  headline: string
  subheadline?: string
  backgroundImage?: SanityImage
  ctaText?: string
  ctaUrl?: string
  ctaStyle?: 'primary' | 'secondary' | 'outline'
  layout: 'center' | 'left' | 'right'
}

// Feature Block
export interface FeatureBlock {
  _type: 'featureBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  features: Array<{
    _key: string
    icon?: string
    title: string
    description?: string
    image?: SanityImage
  }>
  layout: 'grid-2' | 'grid-3' | 'list'
}

// CTA Block
export interface CtaBlock {
  _type: 'ctaBlock'
  _key: string
  headline?: string
  description?: string
  primaryButtonText?: string
  primaryButtonUrl?: string
  secondaryButtonText?: string
  secondaryButtonUrl?: string
  backgroundColor: 'primary' | 'secondary' | 'white' | 'gray'
}

// Benefit Block
export interface BenefitBlock {
  _type: 'benefitBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  benefits: Array<{
    _key: string
    problem?: string
    solution?: string
    icon?: string
    description?: string
  }>
  layout: 'before-after' | 'numbered' | 'icon-grid'
}

// Testimonial Block
export interface TestimonialBlock {
  _type: 'testimonialBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  testimonials: Array<{
    _key: string
    quote: string
    authorName: string
    authorTitle?: string
    authorCompany?: string
    authorImage?: SanityImage
    rating?: number
  }>
  layout: 'carousel' | 'grid' | 'featured'
  showRating?: boolean
}

// FAQ Block
export interface FaqBlock {
  _type: 'faqBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  faqs: Array<{
    _key: string
    question: string
    answer: string
    category?: string
  }>
  layout: 'accordion' | 'two-columns' | 'list'
}

// Pricing Block
export interface PricingBlock {
  _type: 'pricingBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  plans: Array<{
    _key: string
    name: string
    description?: string
    price: string
    pricePeriod?: string
    priceNote?: string
    features?: string[]
    isPopular?: boolean
    ctaText?: string
    ctaUrl?: string
  }>
}

// Form Field Types
export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'

// Validation Rules
export interface ValidationRules {
  pattern?: string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
}

// Form Field Option
export interface FormFieldOption {
  _key: string
  label: string
  value: string
}

// Form Field
export interface FormField {
  _key: string
  fieldName: string
  fieldLabel: string
  fieldType: FormFieldType
  placeholder?: string
  required?: boolean
  defaultValue?: string
  validation?: ValidationRules
  options?: FormFieldOption[]
}

// Backend Config
export interface BackendConfig {
  type: 'formspree' | 'custom' | 'none'
  formspreeId?: string
  customUrl?: string
  method?: 'POST' | 'GET'
}

// Form Block
export interface FormBlock {
  _type: 'formBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  formFields: FormField[]
  submitButtonText?: string
  successMessage?: string
  backendConfig?: BackendConfig
}

// Image Gallery Block
export interface ImageGalleryBlock {
  _type: 'imageGalleryBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  images: Array<{
    _key: string
    image: SanityImage
    caption?: string
    alt?: string
  }>
  layout: 'grid-3' | 'grid-4' | 'masonry'
}

// Video Block
export interface VideoBlock {
  _type: 'videoBlock'
  _key: string
  sectionTitle?: string
  sectionSubtitle?: string
  videoUrl: string
  thumbnail?: SanityImage
  layout: 'full-width' | 'centered' | 'side-content'
  sideContent?: string
}

// Text Block
export interface TextBlock {
  _type: 'textBlock'
  _key: string
  heading?: string
  content?: string
  maxWidth: 'narrow' | 'medium' | 'wide'
  alignment: 'left' | 'center'
}
