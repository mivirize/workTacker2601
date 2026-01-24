import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import { formatDuration, formatPercentage } from '../utils/format'
import { logError } from '../utils/logger'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import AppBarChart from '../components/charts/AppBarChart'
import TimelineChart from '../components/charts/TimelineChart'
import TimeBlockSummary from '../components/timeline/TimeBlockSummary'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { GoalProgress, Activity } from '../../shared/types'

export default function Dashboard() {
  const { dailySummary, categories, isLoadingSummary, selectedDate, setSelectedDate, fetchDailySummary } = useAppStore()
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  // Fetch activities for time block summary
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await window.api.activities.getForDate(selectedDate)
        setActivities(data)
      } catch (error) {
        logError('Failed to load activities:', error)
      }
    }
    loadActivities()
  }, [selectedDate])

  // Fetch goal progress
  useEffect(() => {
    const loadGoalProgress = async () => {
      try {
        const data = await window.api.goals.getProgress()
        setGoalProgress(data)
      } catch (error) {
        logError('Failed to load goal progress:', error)
      }
    }
    loadGoalProgress()
    // Refresh every minute
    const interval = setInterval(loadGoalProgress, 60000)
    return () => clearInterval(interval)
  }, [dailySummary]) // Refresh when daily summary changes

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    fetchDailySummary(newDate)
  }

  if (isLoadingSummary && !dailySummary) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const topApps = dailySummary?.appBreakdown.slice(0, 3) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with date picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">
            {format(new Date(selectedDate), 'yyyy年M月d日 (EEEE)', { locale: ja })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="input w-auto"
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
      </div>

      {/* Summary Cards */}
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
              <p className="stat-label">総作業時間</p>
              <p className="stat-value text-2xl">
                {formatDuration(dailySummary?.totalDuration ?? 0)}
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
              <p className="stat-value text-2xl">
                {formatDuration(dailySummary?.productiveDuration ?? 0)}
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
              <p className="stat-value text-2xl">
                {formatDuration(dailySummary?.idleDuration ?? 0)}
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <div>
              <p className="stat-label">使用アプリ数</p>
              <p className="stat-value text-2xl">
                {dailySummary?.appBreakdown.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      {goalProgress.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">目標進捗</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalProgress.map((progress) => {
              const category = progress.goal.categoryId
                ? categories.find(c => c.id === progress.goal.categoryId)
                : null
              const isComplete = progress.percentage >= 100
              return (
                <div
                  key={progress.goal.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isComplete
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {progress.goal.type === 'daily' && '1日の目標'}
                      {progress.goal.type === 'weekly' && '週間目標'}
                      {progress.goal.type === 'category' && `${progress.categoryName ?? 'カテゴリ'}目標`}
                    </p>
                    {isComplete && (
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(progress.percentage)}%
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.floor(progress.currentMinutes / 60)}h{progress.currentMinutes % 60}m
                      {' / '}
                      {Math.floor(progress.goal.targetMinutes / 60)}h{progress.goal.targetMinutes % 60}m
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-primary-500'
                      }`}
                      style={{
                        width: `${Math.min(100, progress.percentage)}%`,
                        backgroundColor: category?.color ?? undefined,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Time Block Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">時間帯別アクティビティ</h2>
        </div>
        <TimeBlockSummary
          activities={activities}
          categories={categories}
          date={new Date(selectedDate)}
        />
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">今日のタイムライン</h2>
        </div>
        <TimelineChart
          data={dailySummary?.timeline ?? []}
          categories={categories}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">カテゴリ別時間</h2>
          </div>
          <CategoryPieChart data={dailySummary?.categoryBreakdown ?? []} />
        </div>

        {/* App Usage */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">アプリ別使用時間</h2>
          </div>
          <AppBarChart
            data={dailySummary?.appBreakdown ?? []}
            categories={categories}
          />
        </div>
      </div>

      {/* Top Apps */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">よく使ったアプリ Top 3</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topApps.map((app, index) => {
            const category = categories.find((c) => c.id === app.categoryId)
            return (
              <div
                key={app.appName}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    backgroundColor: category?.color ?? '#6b7280',
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {app.appName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDuration(app.duration)} ({formatPercentage(app.percentage)})
                  </p>
                </div>
              </div>
            )
          })}
          {topApps.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-8">
              まだデータがありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
