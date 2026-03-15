import type { TestimonialBlock as TestimonialBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface TestimonialBlockProps extends Omit<TestimonialBlockType, '_type' | '_key'> {
  template: TemplateTier
  getImageUrl?: (image: { asset: { url?: string } }) => string
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialBlock({
  sectionTitle,
  sectionSubtitle,
  testimonials,
  layout,
  showRating,
  template,
}: TestimonialBlockProps) {
  return (
    <section className={`${templatePadding[template]} bg-white`}>
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

        {layout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial._key ?? index} className="bg-gray-50 rounded-xl p-6">
                {showRating && testimonial.rating && (
                  <div className="mb-4">
                    <StarRating rating={testimonial.rating} />
                  </div>
                )}
                <blockquote className="text-gray-700 mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                    {testimonial.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.authorName}</p>
                    {(testimonial.authorTitle || testimonial.authorCompany) && (
                      <p className="text-sm text-gray-500">
                        {testimonial.authorTitle}
                        {testimonial.authorTitle && testimonial.authorCompany && ', '}
                        {testimonial.authorCompany}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {layout === 'featured' && testimonials.length > 0 && (
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
              {showRating && testimonials[0].rating && (
                <div className="flex justify-center mb-6">
                  <StarRating rating={testimonials[0].rating} />
                </div>
              )}
              <blockquote className="text-2xl md:text-3xl text-gray-800 font-medium mb-8">
                &ldquo;{testimonials[0].quote}&rdquo;
              </blockquote>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xl mb-4">
                  {testimonials[0].authorName.charAt(0)}
                </div>
                <p className="font-semibold text-gray-900 text-lg">{testimonials[0].authorName}</p>
                {(testimonials[0].authorTitle || testimonials[0].authorCompany) && (
                  <p className="text-gray-500">
                    {testimonials[0].authorTitle}
                    {testimonials[0].authorTitle && testimonials[0].authorCompany && ', '}
                    {testimonials[0].authorCompany}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {layout === 'carousel' && (
          <div className="overflow-x-auto">
            <div className="flex gap-6 pb-4">
              {testimonials.map((testimonial, index) => (
                <div key={testimonial._key ?? index} className="flex-shrink-0 w-80 bg-gray-50 rounded-xl p-6">
                  {showRating && testimonial.rating && (
                    <div className="mb-4">
                      <StarRating rating={testimonial.rating} />
                    </div>
                  )}
                  <blockquote className="text-gray-700 mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
                      {testimonial.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.authorName}</p>
                      {testimonial.authorCompany && (
                        <p className="text-xs text-gray-500">{testimonial.authorCompany}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
