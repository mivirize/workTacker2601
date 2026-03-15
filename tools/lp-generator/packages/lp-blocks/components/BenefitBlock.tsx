import type { BenefitBlock as BenefitBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface BenefitBlockProps extends Omit<BenefitBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

export function BenefitBlock({
  sectionTitle,
  sectionSubtitle,
  benefits,
  layout,
  template,
}: BenefitBlockProps) {
  return (
    <section className={`${templatePadding[template]} bg-gray-50`}>
      <div className="container mx-auto px-4">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12">
            {sectionTitle && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        {layout === 'before-after' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={benefit._key ?? index} className="bg-white rounded-xl p-6 shadow-sm">
                {benefit.icon && (
                  <span className="text-3xl mb-4 block">{benefit.icon}</span>
                )}
                {benefit.problem && (
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Before</span>
                    <p className="text-gray-600 mt-1">{benefit.problem}</p>
                  </div>
                )}
                {benefit.solution && (
                  <div>
                    <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">After</span>
                    <p className="text-gray-900 font-medium mt-1">{benefit.solution}</p>
                  </div>
                )}
                {benefit.description && (
                  <p className="text-gray-500 text-sm mt-4">{benefit.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {layout === 'numbered' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {benefits.map((benefit, index) => (
              <div key={benefit._key ?? index} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--lp-primary)] text-white flex items-center justify-center font-bold text-xl">
                  {index + 1}
                </div>
                <div>
                  {benefit.solution && (
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {benefit.solution}
                    </h3>
                  )}
                  {benefit.description && (
                    <p className="text-gray-600">{benefit.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {layout === 'icon-grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={benefit._key ?? index} className="text-center">
                {benefit.icon && (
                  <span className="text-4xl mb-4 block">{benefit.icon}</span>
                )}
                {benefit.solution && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.solution}
                  </h3>
                )}
                {benefit.description && (
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
