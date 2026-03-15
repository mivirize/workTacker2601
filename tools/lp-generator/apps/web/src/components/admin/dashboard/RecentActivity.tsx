import Link from 'next/link'
import { ClipboardList, FileText, ExternalLink } from 'lucide-react'

interface Activity {
  id: string
  type: 'hearing' | 'lp'
  title: string
  description: string
  date: string
  href: string
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
        <div className="text-center py-8 text-gray-500">
          <p>アクティビティがありません</p>
          <p className="text-sm mt-1">新規ヒアリングを作成して開始しましょう</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={activity.href}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${activity.type === 'hearing' ? 'bg-blue-100' : 'bg-green-100'}
            `}>
              {activity.type === 'hearing' ? (
                <ClipboardList className={`w-5 h-5 text-blue-600`} />
              ) : (
                <FileText className={`w-5 h-5 text-green-600`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500">
                {activity.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{activity.date}</span>
              <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
