import { useMemo } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatDuration } from '../../utils/format'
import type { WeeklySummary, MonthlySummary } from '../../../shared/types'

type ViewMode = 'weekly' | 'monthly'

interface StatCardsProps {
  viewMode: ViewMode
  weeklySummary: WeeklySummary | null
  monthlySummary: MonthlySummary | null
}

export default function StatCards({
  viewMode,
  weeklySummary,
  monthlySummary,
}: StatCardsProps) {
  const expandedStats = useMemo(() => {
    const summary = viewMode === 'weekly' ? weeklySummary : monthlySummary
    if (!summary) return null

    const totalDuration = summary.totalDuration
    const idleDuration =
      viewMode === 'weekly'
        ? weeklySummary?.dailySummaries.reduce((sum, d) => sum + d.idleDuration, 0) ?? 0
        : summary.totalDuration - (monthlySummary?.productiveDuration ?? 0)
    const idlePercentage =
      totalDuration > 0 ? Math.round((idleDuration / totalDuration) * 100) : 0

    const dailySummaries =
      viewMode === 'weekly'
        ? weeklySummary?.dailySummaries ?? []
        : monthlySummary?.dailyTotals.map((d) => ({
            date: d.date,
            totalDuration: d.duration,
          })) ?? []

    const mostProductiveDay = dailySummaries.reduce<{
      date: string
      totalDuration: number
    } | null>((max, day) => {
      const duration =
        'totalDuration' in day ? day.totalDuration : (day as { duration: number }).duration
      const maxDuration = max ? ('totalDuration' in max ? max.totalDuration : 0) : 0
      return duration > maxDuration ? { date: day.date, totalDuration: duration } : max
    }, null)

    return {
      idleDuration,
      idlePercentage,
      activeDuration: totalDuration - idleDuration,
      mostProductiveDay,
    }
  }, [viewMode, weeklySummary, monthlySummary])

  return (
    <>
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">{viewMode === 'weekly' ? '今週' : '今月'}の合計</p>
              <p className="stat-value">
                {formatDuration(
                  viewMode === 'weekly'
                    ? weeklySummary?.totalDuration ?? 0
                    : monthlySummary?.totalDuration ?? 0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">アクティブ時間</p>
              <p className="stat-value">
                {formatDuration(expandedStats?.activeDuration ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">アイドル時間</p>
              <p className="stat-value">
                {formatDuration(expandedStats?.idleDuration ?? 0)}
                <span className="text-sm text-gray-400 ml-1">
                  ({expandedStats?.idlePercentage ?? 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">1日平均</p>
              <p className="stat-value">
                {formatDuration(
                  viewMode === 'weekly'
                    ? weeklySummary?.averageDailyDuration ?? 0
                    : monthlySummary?.averageDailyDuration ?? 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">稼働日数</p>
              <p className="stat-value">
                {viewMode === 'weekly'
                  ? weeklySummary?.dailySummaries.filter((d) => d.totalDuration > 0)
                      .length ?? 0
                  : monthlySummary?.workDays ?? 0}
                <span className="text-lg text-gray-400 ml-1">
                  / {viewMode === 'weekly' ? '7' : monthlySummary?.dailyTotals.length ?? 0}日
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">最も生産的な日</p>
              {expandedStats?.mostProductiveDay ? (
                <p className="stat-value">
                  {format(new Date(expandedStats.mostProductiveDay.date), 'M/d (E)', {
                    locale: ja,
                  })}
                  <span className="text-sm text-gray-400 ml-1">
                    ({formatDuration(expandedStats.mostProductiveDay.totalDuration)})
                  </span>
                </p>
              ) : (
                <p className="stat-value text-gray-400">-</p>
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">使用アプリ数</p>
              <p className="stat-value">
                {viewMode === 'weekly'
                  ? weeklySummary?.topApps.length ?? 0
                  : monthlySummary?.topApps.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
