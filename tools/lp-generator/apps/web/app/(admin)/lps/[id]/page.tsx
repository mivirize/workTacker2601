import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Eye } from 'lucide-react'
import { db } from '@/lib/db'
import { LpEditor } from './LpEditor'

interface LpDetailProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function LpDetailPage({ params }: LpDetailProps) {
  const { id } = await params
  const lp = await db.getLpById(id)

  if (!lp) {
    notFound()
  }

  const lpUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/${lp.clientSlug}/${lp.slug.current}`

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    preview: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
    unpublished: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    preview: 'プレビュー',
    published: '公開中',
    unpublished: '非公開',
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/lps"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          LP一覧に戻る
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lp.title}</h1>
            <p className="mt-1 text-gray-500">
              テンプレート: <span className="capitalize">{lp.templateTier}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[lp.publishStatus] ?? statusColors.draft}`}>
              {statusLabels[lp.publishStatus] ?? lp.publishStatus}
            </span>
            <Link
              href={`/${lp.clientSlug}/${lp.slug.current}`}
              target="_blank"
              className="btn btn-secondary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              プレビュー
            </Link>
            <Link
              href={`/${lp.clientSlug}/${lp.slug.current}`}
              target="_blank"
              className="btn btn-primary flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              公開ページを表示
            </Link>
          </div>
        </div>
      </div>

      {/* LP Info Card */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-500">URL</label>
            <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-1 truncate">
              /{lp.clientSlug}/{lp.slug.current}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">作成日</label>
            <p className="mt-1">{new Date(lp._createdAt).toLocaleDateString('ja-JP')}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">クライアント</label>
            <p className="mt-1">{lp.hearing?.clientName ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* LP Editor */}
      <LpEditor
        lpId={lp._id}
        initialData={{
          seoTitle: lp.seoTitle,
          seoDescription: lp.seoDescription,
          title: lp.title,
          url: lpUrl,
          publishStatus: lp.publishStatus,
          primaryColor: lp.primaryColor,
          secondaryColor: lp.secondaryColor,
          accentColor: lp.accentColor,
          blocks: (lp.pageBuilder ?? []) as unknown as { _key: string; _type: string; [key: string]: unknown }[],
          publishAt: lp.publishAt,
          unpublishAt: lp.unpublishAt,
        }}
      />
    </div>
  )
}
