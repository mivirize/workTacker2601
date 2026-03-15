import type { CtaBlock as CtaBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface CtaBlockProps extends Omit<CtaBlockType, '_type' | '_key'> {
  template?: TemplateTier
}

export function CtaBlock({
  headline,
  description,
  primaryButtonText,
  primaryButtonUrl,
  secondaryButtonText,
  secondaryButtonUrl,
  backgroundColor = 'primary',
  template = 'simple',
}: CtaBlockProps) {
  const bgClasses = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-gray-800 text-white',
    white: 'bg-white text-gray-900',
    gray: 'bg-gray-100 text-gray-900',
  }

  const primaryBtnClasses = {
    primary: 'bg-white text-blue-600 hover:bg-gray-100',
    secondary: 'bg-white text-gray-800 hover:bg-gray-100',
    white: 'bg-blue-600 text-white hover:bg-blue-700',
    gray: 'bg-blue-600 text-white hover:bg-blue-700',
  }

  const secondaryBtnClasses = {
    primary: 'border-2 border-white text-white hover:bg-white hover:text-blue-600',
    secondary: 'border-2 border-white text-white hover:bg-white hover:text-gray-800',
    white: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    gray: 'border-2 border-gray-300 text-gray-700 hover:bg-white',
  }

  return (
    <section className={`py-16 px-4 ${bgClasses[backgroundColor]}`}>
      <div className="max-w-3xl mx-auto text-center">
        {headline && (
          <h2 className={`font-bold mb-4 ${template === 'premier' ? 'text-4xl' : 'text-3xl'}`}>
            {headline}
          </h2>
        )}

        {description && (
          <p className={`mb-8 opacity-90 ${template === 'premier' ? 'text-xl' : 'text-lg'}`}>
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryButtonText && primaryButtonUrl && (
            <a
              href={primaryButtonUrl}
              className={`
                inline-block px-8 py-3 rounded-lg font-medium transition-colors
                ${primaryBtnClasses[backgroundColor]}
              `}
            >
              {primaryButtonText}
            </a>
          )}

          {secondaryButtonText && secondaryButtonUrl && (
            <a
              href={secondaryButtonUrl}
              className={`
                inline-block px-8 py-3 rounded-lg font-medium transition-colors
                ${secondaryBtnClasses[backgroundColor]}
              `}
            >
              {secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
