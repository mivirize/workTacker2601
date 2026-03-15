import { db } from '@/lib/db'
import { StatsCards, RecentActivity, QuickActions } from '@/components/admin/dashboard'

async function getStats() {
  const hearings = await db.getAllHearings()
  const lps = await db.getAllLps()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentHearings = hearings.filter(
    (h) => new Date(h._createdAt) >= sevenDaysAgo
  )

  const publishedLps = lps.filter((lp) => lp.publishStatus === 'published')

  return {
    totalHearings: hearings.length,
    totalLps: lps.length,
    publishedLps: publishedLps.length,
    recentHearings: recentHearings.length,
  }
}

async function getRecentActivities() {
  const hearings = await db.getAllHearings()
  const lps = await db.getAllLps()

  type Activity = {
    id: string
    type: 'hearing' | 'lp'
    title: string
    description: string
    date: string
    href: string
    timestamp: Date
  }

  const activities: Activity[] = []

  // Add hearings as activities
  hearings.forEach((hearing) => {
    const statusMap: Record<string, string> = {
      draft: '下書き',
      completed: '完了',
      generating: '生成中',
    }
    activities.push({
      id: `hearing-${hearing._id}`,
      type: 'hearing',
      title: hearing.clientName,
      description: `${hearing.productName} - ${statusMap[hearing.status] || hearing.status}`,
      date: new Date(hearing._createdAt).toLocaleDateString('ja-JP'),
      href: `/hearings/${hearing._id}`,
      timestamp: new Date(hearing._createdAt),
    })
  })

  // Add LPs as activities
  lps.forEach((lp) => {
    const statusMap: Record<string, string> = {
      draft: '下書き',
      published: '公開中',
      archived: 'アーカイブ',
    }
    activities.push({
      id: `lp-${lp._id}`,
      type: 'lp',
      title: lp.title,
      description: `ステータス: ${statusMap[lp.publishStatus] || lp.publishStatus}`,
      date: new Date(lp._createdAt).toLocaleDateString('ja-JP'),
      href: `/lps`,
      timestamp: new Date(lp._createdAt),
    })
  })

  // Sort by timestamp and take the most recent 5
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5)
    .map(({ timestamp: _, ...activity }) => activity)
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const stats = await getStats()
  const activities = await getRecentActivities()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">
          LP Generator 概要
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <QuickActions />
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={activities} />
    </div>
  )
}
