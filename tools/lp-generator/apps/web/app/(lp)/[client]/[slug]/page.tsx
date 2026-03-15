import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { BlockRenderer, generateColorStyle } from '@lp-generator/lp-blocks'
import type { LpBlock, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface LpPageProps {
  params: Promise<{ client: string; slug: string }>
}

interface LpData {
  _id: string
  title: string
  slug: { current: string }
  clientSlug?: string
  templateTier: TemplateTier
  pageBuilder: LpBlock[]
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  seoTitle?: string
  seoDescription?: string
  publishStatus: string
}

export async function generateMetadata({ params }: LpPageProps): Promise<Metadata> {
  const { client: clientSlug, slug } = await params
  const lp = await db.getLpBySlug(clientSlug, slug) as LpData | null

  if (!lp) {
    return { title: 'Not Found' }
  }

  return {
    title: lp.seoTitle ?? lp.title,
    description: lp.seoDescription ?? '',
  }
}

export const dynamic = 'force-dynamic'

export default async function LpPage({ params }: LpPageProps) {
  const { client: clientSlug, slug } = await params
  const lp = await db.getLpBySlug(clientSlug, slug) as LpData | null

  if (!lp) {
    notFound()
  }

  // Allow draft and preview for demo
  if (lp.publishStatus === 'unpublished') {
    notFound()
  }

  const getImageUrl = (image: { asset: { _id?: string; url?: string; _ref?: string } }) => {
    if (image.asset?.url) {
      return image.asset.url
    }
    return ''
  }

  const colorStyle = generateColorStyle({
    primary: lp.primaryColor ?? '#3B82F6',
    secondary: lp.secondaryColor ?? '#1E40AF',
    accent: lp.accentColor ?? '#F59E0B',
  })

  return (
    <main className="min-h-screen" style={colorStyle}>
      <BlockRenderer
        blocks={lp.pageBuilder}
        template={lp.templateTier}
        getImageUrl={getImageUrl}
      />
    </main>
  )
}
