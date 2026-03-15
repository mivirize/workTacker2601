import type { ImageGalleryBlock as ImageGalleryBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'
import { SanityImage } from './OptimizedImage'

interface ImageGalleryBlockProps extends Omit<ImageGalleryBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

const layoutClasses: Record<ImageGalleryBlockType['layout'], string> = {
  'grid-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  'grid-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  masonry: 'columns-1 sm:columns-2 lg:columns-3 gap-4',
}

export function ImageGalleryBlock({
  sectionTitle,
  sectionSubtitle,
  images,
  layout,
  template,
}: ImageGalleryBlockProps) {
  const isMasonry = layout === 'masonry'

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

        {isMasonry ? (
          <div className={layoutClasses[layout]}>
            {images.map((item, index) => (
              <div
                key={item._key ?? index}
                className="break-inside-avoid mb-4"
              >
                <div className="relative group overflow-hidden rounded-lg aspect-[4/3]">
                  <SanityImage
                    image={item.image}
                    alt={item.alt ?? item.caption ?? ''}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.caption && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm">{item.caption}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${layoutClasses[layout]}`}>
            {images.map((item, index) => (
              <div
                key={item._key ?? index}
                className="relative group overflow-hidden rounded-lg aspect-[4/3]"
              >
                <SanityImage
                  image={item.image}
                  alt={item.alt ?? item.caption ?? ''}
                  fill
                  sizes={layout === 'grid-4'
                    ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
                    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                  }
                  className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
                {item.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-sm">{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
