import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '../stores/app-store'
import { formatDuration } from '../utils/format'
import { logError } from '../utils/logger'
import { format, subDays, startOfWeek, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { WeeklySummary, MonthlySummary, Activity, TimeBlockInterval, TimeBlock } from '../../shared/types'
import { generateTimeBlocks, INTERVAL_OPTIONS } from '../utils/time-blocks'

type ViewMode = 'weekly' | 'monthly'

export default function Reports() {
  const { categories } = useAppStore()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  // Time block view state
  const [blockViewDate, setBlockViewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [blockActivities, setBlockActivities] = useState<Activity[]>([])
  const [blockInterval, setBlockInterval] = useState<TimeBlockInterval>(30)
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (viewMode === 'weekly') {
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
          const summary = await window.api.stats.getWeekly(
            format(weekStart, 'yyyy-MM-dd')
          )
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

  // Load activities for time block view
  useEffect(() => {
    const loadBlockActivities = async () => {
      try {
        const data = await window.api.activities.getForDate(blockViewDate)
        setBlockActivities(data)
        setSelectedBlock(null)
      } catch (error) {
        logError('Failed to load block activities:', error)
      }
    }
    loadBlockActivities()
  }, [blockViewDate])

  const handleExportCSV = async () => {
    try {
      const csv = await window.api.export.toCSV(dateRange.start, dateRange.end)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `work-tracker-${dateRange.start}-${dateRange.end}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      logError('Failed to export CSV:', error)
    }
  }

  const handleExportJSON = async () => {
    try {
      const json = await window.api.export.toJSON(dateRange.start, dateRange.end)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `work-tracker-${dateRange.start}-${dateRange.end}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      logError('Failed to export JSON:', error)
    }
  }

  // Generate time blocks for block view (must be before conditional return)
  const timeBlocks = useMemo(() => {
    const allBlocks = generateTimeBlocks(blockActivities, new Date(blockViewDate), blockInterval, categories)
    const startIndex = Math.floor(6 * 60 / blockInterval)
    const endIndex = Math.floor(24 * 60 / blockInterval)
    return allBlocks.slice(startIndex, endIndex)
  }, [blockActivities, blockViewDate, blockInterval, categories])

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const maxBlockDuration = useMemo(() => {
    return Math.max(...timeBlocks.map(b => b.totalDuration), blockInterval * 60)
  }, [timeBlocks, blockInterval])

  // Calculate expanded statistics
  const expandedStats = useMemo(() => {
    const summary = viewMode === 'weekly' ? weeklySummary : monthlySummary
    if (!summary) return null

    const totalDuration = summary.totalDuration
    const idleDuration = viewMode === 'weekly'
      ? weeklySummary?.dailySummaries.reduce((sum, d) => sum + d.idleDuration, 0) ?? 0
      : (summary.totalDuration - (monthlySummary?.productiveDuration ?? 0))
    const idlePercentage = totalDuration > 0 ? Math.round((idleDuration / totalDuration) * 100) : 0

    // Find peak hours (hourly distribution from daily summaries)
    const dailySummaries = viewMode === 'weekly'
      ? weeklySummary?.dailySummaries ?? []
      : monthlySummary?.dailyTotals.map(d => ({ date: d.date, totalDuration: d.duration })) ?? []

    // Find most productive day
    const mostProductiveDay = dailySummaries.reduce<{ date: string; totalDuration: number } | null>(
      (max, day) => {
        const duration = 'totalDuration' in day ? day.totalDuration : (day as { duration: number }).duration
        const maxDuration = max ? ('totalDuration' in max ? max.totalDuration : 0) : 0
        return duration > maxDuration ? { date: day.date, totalDuration: duration } : max
      },
      null
    )

    return {
      idleDuration,
      idlePercentage,
      activeDuration: totalDuration - idleDuration,
      mostProductiveDay,
    }
  }, [viewMode, weeklySummary, monthlySummary])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Weekly chart data (daily breakdown)
  const weeklyChartData = weeklySummary?.dailySummaries.map((day) => ({
    date: format(new Date(day.date), 'E', { locale: ja }),
    fullDate: format(new Date(day.date), 'M/d'),
    total: Math.round(day.totalDuration / 60), // Convert to minutes
    productive: Math.round(day.productiveDuration / 60),
    idle: Math.round(day.idleDuration / 60),
  })) ?? []

  // Monthly chart data (daily totals)
  const monthlyChartData = monthlySummary?.dailyTotals.map((day) => ({
    date: format(new Date(day.date), 'd'),
    fullDate: format(new Date(day.date), 'M/d'),
    total: Math.round(day.duration / 60),
    productive: Math.round(day.duration / 60), // Simplified for monthly view
    idle: 0,
  })) ?? []

  const chartData = viewMode === 'weekly' ? weeklyChartData : monthlyChartData

  const formatYAxis = (value: number) => {
    if (value >= 60) {
      return `${Math.floor(value / 60)}h`
    }
    return `${value}m`
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name === 'total'
                ? '合計'
                : item.name === 'productive'
                  ? 'アクティブ'
                  : 'アイドル'}
              : {formatDuration(item.value * 60)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'yyyy年M月', { locale: ja }),
    }
  })

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
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
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="stat-label">稼働日数</p>
              <p className="stat-value">
                {viewMode === 'weekly'
                  ? weeklySummary?.dailySummaries.filter((d) => d.totalDuration > 0).length ?? 0
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
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="stat-label">最も生産的な日</p>
              {expandedStats?.mostProductiveDay ? (
                <p className="stat-value">
                  {format(new Date(expandedStats.mostProductiveDay.date), 'M/d (E)', { locale: ja })}
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
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
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

      {/* Trend Chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{viewMode === 'weekly' ? '週間' : '月間'}トレンド</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="productive"
              name="productive"
              fill="#10b981"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="idle"
              name="idle"
              fill="#d1d5db"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-sm text-gray-600">アクティブ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300" />
            <span className="text-sm text-gray-600">アイドル</span>
          </div>
        </div>
      </div>

      {/* Top Apps & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Apps */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">よく使ったアプリ</h2>
          </div>
          <div className="space-y-3">
            {(viewMode === 'weekly' ? weeklySummary?.topApps : monthlySummary?.topApps)
              ?.slice(0, 5)
              .map((app, index) => {
                const category = app.categoryId
                  ? categoryMap.get(app.categoryId)
                  : null
                return (
                  <div
                    key={app.appName}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {app.appName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {category?.name ?? 'その他'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatDuration(app.duration)}
                      </p>
                    </div>
                  </div>
                )
              })}
            {((viewMode === 'weekly'
              ? weeklySummary?.topApps.length
              : monthlySummary?.topApps.length) ?? 0) === 0 && (
              <p className="text-center text-gray-400 py-4">
                データがありません
              </p>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">カテゴリ別時間</h2>
          </div>
          <div className="space-y-3">
            {(viewMode === 'weekly'
              ? weeklySummary?.topCategories
              : monthlySummary?.topCategories
            )?.map((cat) => (
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
            {((viewMode === 'weekly'
              ? weeklySummary?.topCategories.length
              : monthlySummary?.topCategories.length) ?? 0) === 0 && (
              <p className="text-center text-gray-400 py-4">
                データがありません
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Time Block View */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="card-title">時間帯別アクティビティ</h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={blockViewDate}
              onChange={(e) => setBlockViewDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="input py-1 px-2 text-sm"
            />
            <select
              value={blockInterval}
              onChange={(e) => {
                setBlockInterval(Number(e.target.value) as TimeBlockInterval)
                setSelectedBlock(null)
              }}
              className="input py-1 px-2 text-sm w-20"
            >
              {INTERVAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hour Labels */}
        <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
          {[6, 9, 12, 15, 18, 21, 24].map((hour) => (
            <span key={hour} className="w-8 text-center">
              {hour}:00
            </span>
          ))}
        </div>

        {/* Blocks Container */}
        <div className="flex gap-0.5 h-12 items-end">
          {timeBlocks.map((block) => {
            const hasActivity = block.totalDuration > 0
            const isIdle = block.totalDuration === block.idleDuration && block.totalDuration > 0
            const barHeight = hasActivity
              ? Math.max(8, Math.round((block.totalDuration / maxBlockDuration) * 48))
              : 4
            const isSelected = selectedBlock?.startTime === block.startTime

            return (
              <div
                key={block.startTime}
                onClick={() => {
                  if (hasActivity) {
                    setSelectedBlock(selectedBlock?.startTime === block.startTime ? null : block)
                  }
                }}
                className={`
                  flex-1 min-w-[4px] max-w-[16px] rounded-t-sm transition-all cursor-pointer
                  ${hasActivity ? 'hover:opacity-80' : 'opacity-30'}
                  ${isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                `}
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: isIdle
                    ? '#d1d5db'
                    : block.dominantCategory?.color ?? (hasActivity ? '#6b7280' : '#e5e7eb'),
                }}
                title={`${format(new Date(block.startTime), 'HH:mm')}-${format(new Date(block.endTime), 'HH:mm')}: ${hasActivity ? formatDuration(block.totalDuration) : '記録なし'}`}
              />
            )
          })}
        </div>

        {/* Selected Block Detail */}
        {selectedBlock && selectedBlock.totalDuration > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">
                  {format(new Date(selectedBlock.startTime), 'HH:mm')} - {format(new Date(selectedBlock.endTime), 'HH:mm')}
                </h4>
                <p className="text-xs text-gray-500">
                  合計: {formatDuration(selectedBlock.totalDuration)}
                  {selectedBlock.idleDuration > 0 && ` (アイドル: ${formatDuration(selectedBlock.idleDuration)})`}
                </p>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {selectedBlock.appBreakdown.slice(0, 5).map((app, idx) => {
                const category = app.categoryId ? categoryMap.get(app.categoryId) : null
                const isIdle = app.activities.some(a => a.isIdle)
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isIdle ? '#d1d5db' : category?.color ?? '#6b7280' }}
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {isIdle ? 'アイドル' : app.appName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(app.duration)} ({app.percentage}%)
                    </span>
                  </div>
                )
              })}
              {selectedBlock.appBreakdown.length > 5 && (
                <p className="text-xs text-gray-400">他 {selectedBlock.appBreakdown.length - 5} 件</p>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs mt-4">
          {categories.slice(0, 5).map((category) => (
            <div key={category.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-gray-600">{category.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-300" />
            <span className="text-gray-600">アイドル</span>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">データエクスポート</h2>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">開始日</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="input"
              max={dateRange.end}
            />
          </div>
          <div>
            <label className="label">終了日</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="input"
              min={dateRange.start}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="btn btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              CSV
            </button>
            <button onClick={handleExportJSON} className="btn btn-secondary">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
