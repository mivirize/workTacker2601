import { useState, useEffect } from 'react'
import { useAppStore, useCategoryMap } from '../stores/app-store'
import { formatDuration } from '../utils/format'
import { logError } from '../utils/logger'
import { format, startOfWeek, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { WeeklySummary, MonthlySummary } from '../../shared/types'
import {
  StatCards,
  TrendChart,
  TimeBlockView,
  ExportSection,
} from '../components/reports'

type ViewMode = 'weekly' | 'monthly'

export default function Reports() {
  const { categories } = useAppStore()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [isLoading, setIsLoading] = useState(true)

  const categoryMap = useCategoryMap()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (viewMode === 'weekly') {
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
          const summary = await window.api.stats.getWeekly(format(weekStart, 'yyyy-MM-dd'))
          setWeeklySummary(summary)
        } else {
          const summary = await window.api.stats.getMonthly(selectedMonth)
          setMonthlySummary(summary)
        }
      } catch (error) {
        logError(`Failed to load ${viewMode} summary:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [viewMode, selectedMonth])

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'yyyy年M月', { locale: ja }),
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const topApps =
    viewMode === 'weekly' ? weeklySummary?.topApps : monthlySummary?.topApps
  const topCategories =
    viewMode === 'weekly' ? weeklySummary?.topCategories : monthlySummary?.topCategories

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">レポート</h1>
          <p className="text-gray-500 mt-1">
            {viewMode === 'weekly' ? '週間' : '月間'}サマリーとエクスポート
          </p>
        </div>
        {/* Period Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              週間
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              月間
            </button>
          </div>
          {viewMode === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input py-2"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <StatCards
        viewMode={viewMode}
        weeklySummary={weeklySummary}
        monthlySummary={monthlySummary}
      />

      {/* Trend Chart */}
      <TrendChart
        viewMode={viewMode}
        weeklySummary={weeklySummary}
        monthlySummary={monthlySummary}
      />

      {/* Top Apps & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Apps */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">よく使ったアプリ</h2>
          </div>
          <div className="space-y-3">
            {topApps?.slice(0, 5).map((app, index) => {
              const category = app.categoryId ? categoryMap.get(app.categoryId) : null
              return (
                <div
                  key={app.appName}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{app.appName}</p>
                    <p className="text-sm text-gray-500">{category?.name ?? 'その他'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatDuration(app.duration)}
                    </p>
                  </div>
                </div>
              )
            })}
            {(topApps?.length ?? 0) === 0 && (
              <p className="text-center text-gray-400 py-4">データがありません</p>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">カテゴリ別時間</h2>
          </div>
          <div className="space-y-3">
            {topCategories?.map((cat) => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {cat.categoryName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDuration(cat.duration)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {(topCategories?.length ?? 0) === 0 && (
              <p className="text-center text-gray-400 py-4">データがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* Time Block View */}
      <TimeBlockView categories={categories} />

      {/* Export Section */}
      <ExportSection />
    </div>
  )
}
