import type { LpBlock, TemplateTier } from '@lp-generator/sanity-schemas/types'
import { HeroBlock } from './HeroBlock'
import { FeatureBlock } from './FeatureBlock'
import { CtaBlock } from './CtaBlock'
import { BenefitBlock } from './BenefitBlock'
import { TestimonialBlock } from './TestimonialBlock'
import { FaqBlock } from './FaqBlock'
import { PricingBlock } from './PricingBlock'
import { FormBlock } from './FormBlock'
import { ImageGalleryBlock } from './ImageGalleryBlock'
import { VideoBlock } from './VideoBlock'
import { TextBlock } from './TextBlock'

interface BlockRendererProps {
  blocks: LpBlock[]
  template?: TemplateTier
  getImageUrl?: (image: { asset: { _ref: string } }) => string
}

export function BlockRenderer({
  blocks,
  template = 'simple',
  getImageUrl,
}: BlockRendererProps) {
  return (
    <div className={`lp-container lp-template-${template}`}>
      {blocks.map((block, index) => {
        switch (block._type) {
          case 'heroBlock':
            return (
              <HeroBlock
                key={block._key ?? index}
                headline={block.headline}
                subheadline={block.subheadline}
                ctaText={block.ctaText}
                ctaUrl={block.ctaUrl}
                ctaStyle={block.ctaStyle}
                layout={block.layout}
                template={template}
                imageUrl={block.backgroundImage && getImageUrl
                  ? getImageUrl(block.backgroundImage)
                  : undefined
                }
              />
            )

          case 'featureBlock':
            return (
              <FeatureBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                features={block.features.map((f) => ({
                  ...f,
                  imageUrl: f.image && getImageUrl ? getImageUrl(f.image) : undefined,
                }))}
                layout={block.layout}
                template={template}
              />
            )

          case 'ctaBlock':
            return (
              <CtaBlock
                key={block._key ?? index}
                headline={block.headline}
                description={block.description}
                primaryButtonText={block.primaryButtonText}
                primaryButtonUrl={block.primaryButtonUrl}
                secondaryButtonText={block.secondaryButtonText}
                secondaryButtonUrl={block.secondaryButtonUrl}
                backgroundColor={block.backgroundColor}
                template={template}
              />
            )

          case 'benefitBlock':
            return (
              <BenefitBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                benefits={block.benefits}
                layout={block.layout}
                template={template}
              />
            )

          case 'testimonialBlock':
            return (
              <TestimonialBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                testimonials={block.testimonials.map((t) => ({
                  ...t,
                  authorImageUrl: t.authorImage && getImageUrl
                    ? getImageUrl(t.authorImage)
                    : undefined,
                }))}
                layout={block.layout}
                showRating={block.showRating}
                template={template}
              />
            )

          case 'faqBlock':
            return (
              <FaqBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                faqs={block.faqs}
                layout={block.layout}
                template={template}
              />
            )

          case 'pricingBlock':
            return (
              <PricingBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                plans={block.plans}
                template={template}
              />
            )

          case 'formBlock':
            return (
              <FormBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                formFields={block.formFields}
                submitButtonText={block.submitButtonText}
                successMessage={block.successMessage}
                template={template}
              />
            )

          case 'imageGalleryBlock':
            return (
              <ImageGalleryBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                images={block.images}
                layout={block.layout}
                template={template}
              />
            )

          case 'videoBlock':
            return (
              <VideoBlock
                key={block._key ?? index}
                sectionTitle={block.sectionTitle}
                sectionSubtitle={block.sectionSubtitle}
                videoUrl={block.videoUrl}
                thumbnail={block.thumbnail}
                layout={block.layout}
                sideContent={block.sideContent}
                template={template}
              />
            )

          case 'textBlock':
            return (
              <TextBlock
                key={block._key ?? index}
                heading={block.heading}
                content={block.content}
                maxWidth={block.maxWidth}
                alignment={block.alignment}
                template={template}
              />
            )

          default:
            console.warn(`Unknown block type: ${(block as LpBlock)._type}`)
            return null
        }
      })}
    </div>
  )
}
