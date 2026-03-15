import type { TextBlock as TextBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface TextBlockProps extends Omit<TextBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

const maxWidthClasses: Record<TextBlockType['maxWidth'], string> = {
  narrow: 'max-w-2xl',
  medium: 'max-w-4xl',
  wide: 'max-w-6xl',
}

const alignmentClasses: Record<TextBlockType['alignment'], string> = {
  left: 'text-left',
  center: 'text-center mx-auto',
}

export function TextBlock({
  heading,
  content,
  maxWidth,
  alignment,
  template,
}: TextBlockProps) {
  return (
    <section className={`${templatePadding[template]} bg-white`}>
      <div className="container mx-auto px-4">
        <div className={`${maxWidthClasses[maxWidth]} ${alignmentClasses[alignment]}`}>
          {heading && (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {heading}
            </h2>
          )}
          {content && (
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
