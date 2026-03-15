import type { VideoBlock as VideoBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface VideoBlockProps extends Omit<VideoBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

function getVideoEmbedUrl(url: string): string {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  // Return as-is if not recognized
  return url
}

export function VideoBlock({
  sectionTitle,
  sectionSubtitle,
  videoUrl,
  thumbnail,
  layout,
  sideContent,
  template,
}: VideoBlockProps) {
  const embedUrl = getVideoEmbedUrl(videoUrl)

  const renderVideo = () => (
    <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        title={sectionTitle ?? 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )

  if (layout === 'full-width') {
    return (
      <section className={`${templatePadding[template]} bg-gray-900`}>
        <div className="container mx-auto px-4">
          {(sectionTitle || sectionSubtitle) && (
            <div className="text-center mb-10">
              {sectionTitle && (
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {sectionTitle}
                </h2>
              )}
              {sectionSubtitle && (
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  {sectionSubtitle}
                </p>
              )}
            </div>
          )}
          <div className="max-w-5xl mx-auto">
            {renderVideo()}
          </div>
        </div>
      </section>
    )
  }

  if (layout === 'side-content') {
    return (
      <section className={`${templatePadding[template]} bg-white`}>
        <div className="container mx-auto px-4">
          {(sectionTitle || sectionSubtitle) && (
            <div className="text-center mb-10">
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
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <div>
              {renderVideo()}
            </div>
            {sideContent && (
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {sideContent}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // centered layout (default)
  return (
    <section className={`${templatePadding[template]} bg-gray-50`}>
      <div className="container mx-auto px-4">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-10">
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
        <div className="max-w-3xl mx-auto">
          {renderVideo()}
        </div>
      </div>
    </section>
  )
}
