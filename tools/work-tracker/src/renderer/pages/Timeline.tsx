import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app-store'
import { formatDuration, truncate } from '../utils/format'
import { log, logError } from '../utils/logger'
import { format, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Activity, SearchFilters, CreateActivityInput, UpdateActivityInput } from '../../shared/types'
import ActivityModal from '../components/activities/ActivityModal'
import TimeBlockView from '../components/timeline/TimeBlockView'
import TagList from '../components/tags/TagList'

type ViewMode = 'list' | 'block'

/**
 * Calculate duration for an activity.
 * For ongoing activities (no endTime), calculate dynamically from startTime.
 * For completed activities, use durationSeconds or calculate from endTime - startTime.
 */
function getActivityDuration(activity: Activity): number {
  if (activity.endTime) {
    // If durationSeconds is 0 but we have endTime, calculate it
    if (activity.durationSeconds === 0) {
      return Math.floor((activity.endTime - activity.startTime) / 1000)
    }
    return activity.durationSeconds
  }
  // Ongoing activity - calculate from start time
  return Math.floor((Date.now() - activity.startTime) / 1000)
}

export default function Timeline() {
  const { selectedDate, setSelectedDate, categories, tags, projects, fetchDailySummary } = useAppStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setTick] = useState(0)
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Activity Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [showIdle, setShowIdle] = useState(true)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchDateRange, setSearchDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const tagMap = new Map(tags.map((t) => [t.id, t]))

  const loadActivities = useCallback(async () => {
    log('[Timeline] loadActivities called', { isSearchMode, showIdle, selectedDate })
    setIsLoading(true)
    try {
      if (isSearchMode) {
        const filters: SearchFilters = {
          dateRange: searchDateRange,
          showIdle,
        }
        if (searchQuery.trim()) {
          filters.query = searchQuery.trim()
        }
        if (selectedCategoryIds.length > 0) {
          filters.categoryIds = selectedCategoryIds
        }
        if (selectedTagIds.length > 0) {
          filters.tagIds = selectedTagIds
        }
        log('[Timeline] Search mode - filters:', filters)
        const data = await window.api.activities.search(filters)
        log('[Timeline] Search results:', { count: data.length, idleCount: data.filter(a => a.isIdle).length })
        setActivities(data)
      } else {
        const data = await window.api.activities.getForDate(selectedDate)
        const idleCount = data.filter(a => a.isIdle).length
        log('[Timeline] Normal mode - data loaded:', { total: data.length, idleCount })
        // Apply local filters (idle and tags)
        let filteredData = showIdle ? data : data.filter(a => !a.isIdle)
        if (selectedTagIds.length > 0) {
          filteredData = filteredData.filter(a =>
            a.tagIds && selectedTagIds.some(tagId => a.tagIds.includes(tagId))
          )
        }
        log('[Timeline] After filter:', { before: data.length, after: filteredData.length, showIdle })
        setActivities(filteredData)
      }
    } catch (error) {
      logError('Failed to load activities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, isSearchMode, searchQuery, selectedCategoryIds, selectedTagIds, showIdle, searchDateRange])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Update every second to show real-time duration for ongoing activities
  useEffect(() => {
    const hasOngoingActivity = activities.some((a) => !a.endTime)
    if (!hasOngoingActivity) return

    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [activities])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    fetchDailySummary(newDate)
  }

  const handleCategoryChange = async (activityId: number, categoryId: number | null) => {
    try {
      await window.api.activities.updateCategory(activityId, categoryId)
      const data = await window.api.activities.getForDate(selectedDate)
      setActivities(data)
      setEditingActivityId(null)
    } catch (error) {
      logError('Failed to update activity category:', error)
    }
  }

  // Activity CRUD handlers
  const handleOpenAddModal = () => {
    setEditingActivity(null)
    setIsActivityModalOpen(true)
  }

  const handleOpenEditModal = (activity: Activity) => {
    setEditingActivity(activity)
    setIsActivityModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsActivityModalOpen(false)
    setEditingActivity(null)
  }

  const handleSaveActivity = async (input: CreateActivityInput | UpdateActivityInput) => {
    if ('id' in input) {
      // Update existing activity
      await window.api.activities.update(input)
    } else {
      // Create new activity
      await window.api.activities.create(input)
    }
    // Reload activities
    await loadActivities()
    await fetchDailySummary(selectedDate)
  }

  const handleDeleteActivity = async (activityId: number) => {
    await window.api.activities.delete(activityId)
    // Reload activities
    await loadActivities()
    await fetchDailySummary(selectedDate)
  }

  const groupedActivities = activities.reduce((groups, activity) => {
    const hour = format(new Date(activity.startTime), 'HH:00')
    if (!groups[hour]) {
      groups[hour] = []
    }
    groups[hour].push(activity)
    return groups
  }, {} as Record<string, Activity[]>)

  const sortedHours = Object.keys(groupedActivities).sort()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const handleSearch = () => {
    if (searchQuery.trim() || selectedCategoryIds.length > 0 || selectedTagIds.length > 0) {
      setIsSearchMode(true)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategoryIds([])
    setSelectedTagIds([])
    setIsSearchMode(false)
  }

  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleTagFilter = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タイムライン</h1>
          <p className="text-gray-500 mt-1">
            {isSearchMode
              ? `検索結果: ${activities.length}件`
              : format(new Date(selectedDate), 'yyyy年M月d日 (EEEE)', { locale: ja })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          {!isSearchMode && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                リスト
              </button>
              <button
                onClick={() => setViewMode('block')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'block'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ブロック
              </button>
            </div>
          )}
          {!isSearchMode && (
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="input w-auto"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          )}
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            追加
          </button>
        </div>
      </div>

      {/* Search/Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="アプリ名やウィンドウタイトルで検索..."
              className="input pl-10 w-full"
            />
          </div>

          {/* Date Range (when in search mode or preparing to search) */}
          {(isSearchMode || searchQuery.trim()) && (
            <>
              <input
                type="date"
                value={searchDateRange.start}
                onChange={(e) => setSearchDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="input w-auto"
              />
              <span className="text-gray-500">〜</span>
              <input
                type="date"
                value={searchDateRange.end}
                onChange={(e) => setSearchDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="input w-auto"
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </>
          )}

          {/* Search/Clear Button */}
          {isSearchMode ? (
            <button onClick={clearSearch} className="btn btn-secondary">
              クリア
            </button>
          ) : (
            <button onClick={handleSearch} className="btn btn-primary">
              検索
            </button>
          )}

          {/* Idle Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showIdle}
              onChange={(e) => {
                log('[Timeline] Idle toggle changed:', e.target.checked)
                setShowIdle(e.target.checked)
              }}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            アイドル表示
          </label>
        </div>

        {/* Category Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 mr-1">カテゴリ:</span>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategoryFilter(category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategoryIds.includes(category.id)
                  ? 'ring-2 ring-offset-1'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: category.color + '20',
                color: category.color,
                ringColor: category.color,
              }}
            >
              {category.name}
            </button>
          ))}
          {selectedCategoryIds.length > 0 && (
            <button
              onClick={() => setSelectedCategoryIds([])}
              className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100"
            >
              解除
            </button>
          )}
        </div>

        {/* Tag Filters */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 mr-1">タグ:</span>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? 'ring-2 ring-offset-1'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  ringColor: tag.color,
                }}
              >
                {tag.name}
              </button>
            ))}
            {selectedTagIds.length > 0 && (
              <button
                onClick={() => setSelectedTagIds([])}
                className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100"
              >
                解除
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {viewMode === 'block' && !isSearchMode ? (
        /* Block View */
        <div className="card p-4">
          <TimeBlockView
            activities={activities}
            categories={categories}
            date={new Date(selectedDate)}
            onActivityClick={(activityId) => {
              const activity = activities.find(a => a.id === activityId)
              if (activity) {
                handleOpenEditModal(activity)
              }
            }}
          />
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {sortedHours.length === 0 ? (
            <div className="card text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
              <p className="text-gray-500">この日のアクティビティはありません</p>
            </div>
          ) : (
            sortedHours.map((hour) => (
            <div key={hour} className="relative">
              {/* Hour Label */}
              <div className="sticky top-0 z-10 bg-gray-50 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-gray-500">
                    {hour}
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </div>

              {/* Activities */}
              <div className="ml-16 space-y-2">
                {groupedActivities[hour].map((activity) => {
                  const category = activity.categoryId
                    ? categoryMap.get(activity.categoryId)
                    : null

                  return (
                    <div
                      key={activity.id}
                      className={`card p-4 flex items-start gap-4 ${
                        activity.isIdle ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Category Color */}
                      <div
                        className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: activity.isIdle
                            ? '#d1d5db'
                            : category?.color ?? '#6b7280',
                        }}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900">
                              {activity.appName}
                              {activity.isIdle && (
                                <span className="ml-2 badge badge-warning">
                                  アイドル
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {truncate(activity.windowTitle, 80)}
                            </p>
                            {activity.url && (
                              <p className="text-xs text-blue-500 truncate mt-1">
                                {truncate(activity.url, 60)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDuration(getActivityDuration(activity))}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(activity.startTime), 'HH:mm')} -{' '}
                                {activity.endTime
                                  ? format(new Date(activity.endTime), 'HH:mm')
                                  : '進行中'}
                              </p>
                            </div>
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(activity)}
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                              title="編集"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Category Selector */}
                        <div className="mt-2 relative flex items-center gap-2 flex-wrap">
                          {editingActivityId === activity.id ? (
                            <select
                              value={activity.categoryId ?? ''}
                              onChange={(e) => {
                                const value = e.target.value
                                handleCategoryChange(
                                  activity.id,
                                  value ? parseInt(value) : null
                                )
                              }}
                              onBlur={() => setEditingActivityId(null)}
                              autoFocus
                              className="input text-xs py-1 px-2 w-32"
                            >
                              <option value="">未分類</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingActivityId(activity.id)}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: category?.color ?? '#6b7280',
                              }}
                              title="クリックしてカテゴリを変更"
                            >
                              {category?.name ?? '未分類'}
                              <svg
                                className="w-3 h-3 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Tags Display */}
                          {activity.tagIds && activity.tagIds.length > 0 && (
                            <TagList
                              tags={activity.tagIds
                                .map(id => tagMap.get(id))
                                .filter((t): t is NonNullable<typeof t> => t !== undefined)}
                              maxDisplay={3}
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* Activity Modal */}
      {isActivityModalOpen && (
        <ActivityModal
          activity={editingActivity ?? undefined}
          defaultDate={selectedDate}
          categories={categories}
          tags={tags}
          projects={projects}
          onClose={handleCloseModal}
          onSave={handleSaveActivity}
          onDelete={editingActivity ? handleDeleteActivity : undefined}
        />
      )}
    </div>
  )
}
