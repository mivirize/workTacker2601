import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'
import { db } from '@/lib/db'

interface LpListItem {
  _id: string
  _createdAt: string
  title: string
  slug: { current: string }
  clientSlug?: string
  templateTier: string
  publishStatus: string
  publishedAt?: string
  hearing?: {
    _id: string
    clientName: string
  }
}

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

const tierLabels: Record<string, string> = {
  simple: 'シンプル',
  rich: 'リッチ',
  premier: 'プレミア',
}

export const dynamic = 'force-dynamic'

export default async function LpsPage() {
  const lps = await db.getAllLps() as LpListItem[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ランディングページ</h1>
        <p className="mt-1 text-sm text-gray-500">
          生成されたランディングページを管理
        </p>
      </div>

      {/* List */}
      {lps.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">ランディングページがありません</p>
          <p className="text-sm text-gray-400">
            まずヒアリングを作成し、そこからLPを生成してください
          </p>
          <Link href="/hearings/new" className="btn btn-primary mt-4">
            ヒアリングを作成
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LPタイトル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  クライアント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  テンプレート
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lps.map((lp) => (
                <tr key={lp._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{lp.title}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(lp._createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {lp.hearing?.clientName ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {tierLabels[lp.templateTier] ?? lp.templateTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lp.publishStatus] ?? statusColors.draft}`}>
                      {statusLabels[lp.publishStatus] ?? lp.publishStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      /{lp.clientSlug}/{lp.slug?.current}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/lps/${lp._id}`}
                        className="btn btn-secondary text-xs px-3 py-1"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        編集
                      </Link>
                      <Link
                        href={`/${lp.clientSlug}/${lp.slug?.current}`}
                        className="btn btn-secondary text-xs px-3 py-1"
                        target="_blank"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        表示
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
