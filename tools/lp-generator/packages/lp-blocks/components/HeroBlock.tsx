import type { HeroBlock as HeroBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'
import { OptimizedImage } from './OptimizedImage'

interface HeroBlockProps extends Omit<HeroBlockType, '_type' | '_key'> {
  template?: TemplateTier
  imageUrl?: string
}

export function HeroBlock({
  headline,
  subheadline,
  ctaText,
  ctaUrl,
  ctaStyle = 'primary',
  layout = 'center',
  template = 'simple',
  imageUrl,
}: HeroBlockProps) {
  const layoutClasses = {
    center: 'text-center items-center',
    left: 'text-left items-start',
    right: 'text-right items-end',
  }

  const buttonStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-white text-white hover:bg-white hover:text-gray-900',
  }

  const templateHeadlineSize = {
    simple: 'text-3xl md:text-5xl',
    rich: 'text-4xl md:text-6xl',
    premier: 'text-5xl md:text-7xl',
  }

  return (
    <div
      className={`
        relative min-h-[60vh] flex flex-col justify-center overflow-hidden
        ${layoutClasses[layout]}
        ${imageUrl ? 'text-white' : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}
      `}
    >
      {imageUrl && (
        <>
          <div className="absolute inset-0 z-0">
            <OptimizedImage
              src={imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="w-full h-full"
            />
          </div>
          <div className="absolute inset-0 z-10 bg-black/50" />
        </>
      )}

      <div className="relative z-20 max-w-4xl mx-auto px-4 py-16">
        <h1 className={`font-bold mb-4 ${templateHeadlineSize[template]}`}>
          {headline}
        </h1>

        {subheadline && (
          <p className={`mb-8 opacity-90 ${template === 'premier' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
            {subheadline}
          </p>
        )}

        {ctaText && ctaUrl && (
          <a
            href={ctaUrl}
            className={`
              inline-block px-8 py-3 rounded-lg font-medium transition-colors
              ${buttonStyles[ctaStyle]}
            `}
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  )
}
