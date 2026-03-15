import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { db } from '@/lib/db'
import { GenerateLpButton } from './GenerateLpButton'

interface HearingDetailProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  review: 'bg-purple-100 text-purple-800',
  published: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  draft: '下書き',
  completed: '完了',
  in_progress: '進行中',
  review: 'レビュー中',
  published: '公開済み',
}

const tierLabels: Record<string, string> = {
  simple: 'シンプル',
  rich: 'リッチ',
  premier: 'プレミア',
}

export const dynamic = 'force-dynamic'

export default async function HearingDetailPage({ params }: HearingDetailProps) {
  const { id } = await params
  const hearing = await db.getHearingById(id)

  if (!hearing) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/hearings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          ヒアリング一覧に戻る
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hearing.clientName}</h1>
            <p className="mt-1 text-gray-500">{hearing.productName}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[hearing.status] ?? statusColors.draft}`}>
              {statusLabels[hearing.status] ?? hearing.status}
            </span>
          </div>
        </div>
      </div>

      {/* LP Section */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ランディングページ</h2>
            {hearing.linkedLp ? (
              <p className="text-sm text-gray-500">LPが生成されました</p>
            ) : (
              <p className="text-sm text-gray-500">このヒアリングからLPを生成</p>
            )}
          </div>

          {hearing.linkedLp ? (
            <div className="flex items-center gap-3">
              <GenerateLpButton
                hearingId={hearing._id}
                existingLpId={hearing.linkedLp._id}
                mode="regenerate"
              />
              <Link
                href={`/lps/${hearing.linkedLp._id}`}
                className="btn btn-secondary"
              >
                LP編集
              </Link>
              <Link
                href={`/${hearing.clientSlug?.current}/${hearing.linkedLp.slug?.current}`}
                className="btn btn-primary"
                target="_blank"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                LPを見る
              </Link>
            </div>
          ) : (
            <GenerateLpButton hearingId={hearing._id} />
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-6">
        {/* Client Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">クライアント情報</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">クライアント名</dt>
              <dd className="mt-1 text-gray-900">{hearing.clientName}</dd>
            </div>
            {hearing.contactPerson && (
              <div>
                <dt className="text-sm font-medium text-gray-500">担当者名</dt>
                <dd className="mt-1 text-gray-900">{hearing.contactPerson}</dd>
              </div>
            )}
            {hearing.contactEmail && (
              <div>
                <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                <dd className="mt-1 text-gray-900">{hearing.contactEmail}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Product Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">商品/サービス</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">商品/サービス名</dt>
              <dd className="mt-1 text-gray-900">{hearing.productName}</dd>
            </div>
            {hearing.productDescription && (
              <div>
                <dt className="text-sm font-medium text-gray-500">説明</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{hearing.productDescription}</dd>
              </div>
            )}
            {(hearing.uniqueSellingPoints?.length ?? 0) > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">強み・特徴（USP）</dt>
                <dd className="mt-1">
                  <ul className="list-disc list-inside space-y-1 text-gray-900">
                    {hearing.uniqueSellingPoints?.map((usp: string, i: number) => (
                      <li key={i}>{usp}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Target Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ターゲット情報</h3>
          <dl className="space-y-4">
            {hearing.targetAudience && (
              <div>
                <dt className="text-sm font-medium text-gray-500">ターゲット層</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{hearing.targetAudience}</dd>
              </div>
            )}
            {(hearing.painPoints?.length ?? 0) > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">課題・悩み</dt>
                <dd className="mt-1">
                  <ul className="list-disc list-inside space-y-1 text-gray-900">
                    {hearing.painPoints?.map((pain: string, i: number) => (
                      <li key={i}>{pain}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Design Preferences */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">デザイン設定</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">テンプレートティア</dt>
              <dd className="mt-1 text-gray-900">{tierLabels[hearing.templateTier] ?? hearing.templateTier}</dd>
            </div>
            {hearing.primaryColor && (
              <div>
                <dt className="text-sm font-medium text-gray-500">メインカラー</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: hearing.primaryColor }}
                  />
                  <span className="text-gray-900">{hearing.primaryColor}</span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
