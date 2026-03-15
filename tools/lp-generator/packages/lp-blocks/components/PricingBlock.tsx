import type { PricingBlock as PricingBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface PricingBlockProps extends Omit<PricingBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

export function PricingBlock({
  sectionTitle,
  sectionSubtitle,
  plans,
  template,
}: PricingBlockProps) {
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

        <div className={`grid gap-6 ${
          plans.length === 1 ? 'max-w-md mx-auto' :
          plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' :
          plans.length === 3 ? 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {plans.map((plan, index) => (
            <div
              key={plan._key ?? index}
              className={`bg-white rounded-2xl p-6 ${
                plan.isPopular
                  ? 'ring-2 ring-[var(--lp-primary)] shadow-lg relative'
                  : 'border border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[var(--lp-primary)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                )}
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.pricePeriod && (
                  <span className="text-gray-500">{plan.pricePeriod}</span>
                )}
                {plan.priceNote && (
                  <p className="text-xs text-gray-400 mt-1">{plan.priceNote}</p>
                )}
              </div>

              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {plan.ctaText && (
                <a
                  href={plan.ctaUrl ?? '#'}
                  className={`block w-full py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                    plan.isPopular
                      ? 'bg-[var(--lp-primary)] text-white hover:opacity-90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.ctaText}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
