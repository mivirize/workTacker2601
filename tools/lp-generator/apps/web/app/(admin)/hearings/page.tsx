import Link from 'next/link'
import { Plus, Eye, Edit, FileText } from 'lucide-react'
import { db } from '@/lib/db'

interface HearingListItem {
  _id: string
  _createdAt: string
  clientName: string
  clientSlug: { current: string }
  productName: string
  status: string
  templateTier: string
  linkedLp?: {
    _id: string
    title: string
    slug: { current: string }
    publishStatus: string
  }
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

export default async function HearingsPage() {
  const hearings = await db.getAllHearings() as HearingListItem[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ヒアリング</h1>
          <p className="mt-1 text-sm text-gray-500">
            クライアントのヒアリングシートを管理
          </p>
        </div>
        <Link href="/hearings/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          新規ヒアリング
        </Link>
      </div>

      {/* List */}
      {hearings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">ヒアリングがありません</p>
          <Link href="/hearings/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            最初のヒアリングを作成
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  クライアント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品/サービス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  テンプレート
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LP
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hearings.map((hearing) => (
                <tr key={hearing._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{hearing.clientName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(hearing._createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {hearing.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {tierLabels[hearing.templateTier] ?? hearing.templateTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[hearing.status] ?? statusColors.draft}`}>
                      {statusLabels[hearing.status] ?? hearing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hearing.linkedLp ? (
                      <Link
                        href={`/${hearing.clientSlug?.current}/${hearing.linkedLp.slug?.current}`}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        LPを見る
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/hearings/${hearing._id}`}
                        className="text-gray-400 hover:text-gray-600"
                        title="詳細"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/hearings/${hearing._id}`}
                        className="text-gray-400 hover:text-gray-600"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
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
