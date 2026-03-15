import { ClipboardList, FileText, Globe, Clock } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalHearings: number
    totalLps: number
    publishedLps: number
    recentHearings: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'ヒアリング数',
      value: stats.totalHearings,
      icon: ClipboardList,
      color: 'bg-blue-100 text-blue-600',
      change: null,
    },
    {
      title: 'LP数',
      value: stats.totalLps,
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      change: null,
    },
    {
      title: '公開中LP',
      value: stats.publishedLps,
      icon: Globe,
      color: 'bg-green-100 text-green-600',
      change: null,
    },
    {
      title: '直近7日間',
      value: stats.recentHearings,
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
      change: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="card">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
