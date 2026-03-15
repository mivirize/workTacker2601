import Link from 'next/link'
import { Plus, ClipboardList, FileText, Settings, ArrowRight } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: '新規ヒアリング',
      description: 'クライアントのヒアリングを作成',
      href: '/hearings/new',
      icon: Plus,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'ヒアリング一覧',
      description: 'ヒアリングを管理',
      href: '/hearings',
      icon: ClipboardList,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'LP一覧',
      description: 'ランディングページを管理',
      href: '/lps',
      icon: FileText,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Sanity Studio',
      description: 'コンテンツを直接編集',
      href: '/studio',
      icon: Settings,
      color: 'bg-gray-100 text-gray-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="card hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  )
}
