import type { FeatureBlock as FeatureBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'
import { OptimizedImage } from './OptimizedImage'

interface FeatureItem {
  _key: string
  icon?: string
  title: string
  description?: string
  imageUrl?: string
}

interface FeatureBlockProps extends Omit<FeatureBlockType, '_type' | '_key' | 'features'> {
  features: FeatureItem[]
  template?: TemplateTier
}

export function FeatureBlock({
  sectionTitle,
  sectionSubtitle,
  features,
  layout = 'grid-3',
  template = 'simple',
}: FeatureBlockProps) {
  const gridClasses = {
    'grid-2': 'grid-cols-1 md:grid-cols-2',
    'grid-3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    list: 'grid-cols-1 max-w-2xl mx-auto',
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12">
            {sectionTitle && (
              <h2 className={`font-bold text-gray-900 mb-4 ${template === 'premier' ? 'text-4xl' : 'text-3xl'}`}>
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

        <div className={`grid gap-8 ${gridClasses[layout]}`}>
          {features.map((feature) => (
            <div
              key={feature._key}
              className={`
                ${layout === 'list' ? 'flex gap-4' : 'text-center'}
                ${template === 'premier' ? 'p-6 rounded-xl bg-gray-50' : ''}
              `}
            >
              {feature.icon && (
                <div className={`text-4xl mb-4 ${layout === 'list' ? 'mb-0' : ''}`}>
                  {feature.icon}
                </div>
              )}

              {feature.imageUrl && (
                <div className="mb-4 relative h-48 overflow-hidden rounded-lg">
                  <OptimizedImage
                    src={feature.imageUrl}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="w-full h-full"
                  />
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                {feature.description && (
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
