import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatDuration, truncate } from '../../utils/format'
import { logError } from '../../utils/logger'
import ActivityModal from '../activities/ActivityModal'
import TagList from '../tags/TagList'
import type { Activity, Category, Tag, Project, CreateActivityInput, UpdateActivityInput } from '../../../shared/types'

interface DayActivitiesPanelProps {
  selectedDay: string | null // yyyy-MM-dd
  categories: Category[]
  tags: Tag[]
  projects: Project[]
  onActivityChange: () => void
}

export default function DayActivitiesPanel({
  selectedDay,
  categories,
  tags,
  projects,
  onActivityChange,
}: DayActivitiesPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const tagMap = new Map(tags.map((t) => [t.id, t]))

  useEffect(() => {
    if (!selectedDay) {
      setActivities([])
      return
    }

    const loadActivities = async () => {
      setIsLoading(true)
      try {
        const data = await window.api.activities.getForDate(selectedDay)
        setActivities(data)
      } catch (error) {
        logError('Failed to load activities for day:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [selectedDay])

  const handleOpenAddModal = () => {
    setEditingActivity(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (activity: Activity) => {
    setEditingActivity(activity)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingActivity(null)
  }

  const handleSaveActivity = async (input: CreateActivityInput | UpdateActivityInput) => {
    if ('id' in input) {
      await window.api.activities.update(input)
    } else {
      await window.api.activities.create(input)
    }
    // Reload activities
    if (selectedDay) {
      const data = await window.api.activities.getForDate(selectedDay)
      setActivities(data)
    }
    onActivityChange()
  }

  const handleDeleteActivity = async (activityId: number) => {
    await window.api.activities.delete(activityId)
    // Reload activities
    if (selectedDay) {
      const data = await window.api.activities.getForDate(selectedDay)
      setActivities(data)
    }
    onActivityChange()
  }

  if (!selectedDay) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2"
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
          <p>日付を選択してください</p>
        </div>
      </div>
    )
  }

  const totalDuration = activities.reduce((sum, a) => sum + a.durationSeconds, 0)

  // Group activities by hour
  const groupedActivities = activities.reduce((groups, activity) => {
    const hour = format(new Date(activity.startTime), 'HH:00')
    if (!groups[hour]) {
      groups[hour] = []
    }
    groups[hour].push(activity)
    return groups
  }, {} as Record<string, Activity[]>)

  const sortedHours = Object.keys(groupedActivities).sort()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {format(new Date(selectedDay), 'M月d日 (EEEE)', { locale: ja })}
            </h3>
            <p className="text-sm text-gray-500">
              {activities.length}件 / {formatDuration(totalDuration)}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="btn btn-sm btn-primary"
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

      {/* Activities List - Grouped by Hour */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>アクティビティがありません</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
            >
              + アクティビティを追加
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHours.map((hour) => {
              const hourActivities = groupedActivities[hour]
              const hourDuration = hourActivities.reduce((sum, a) => sum + a.durationSeconds, 0)

              return (
                <div key={hour}>
                  {/* Hour Header */}
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-1">
                    <span className="text-xs font-semibold text-gray-500 w-10">
                      {hour}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400">
                      {formatDuration(hourDuration)}
                    </span>
                  </div>

                  {/* Activities in this hour */}
                  <div className="space-y-1.5 ml-2">
                    {hourActivities.map((activity) => {
                      const category = activity.categoryId
                        ? categoryMap.get(activity.categoryId)
                        : null

                      return (
                        <div
                          key={activity.id}
                          onClick={() => handleOpenEditModal(activity)}
                          className={`
                            p-2 rounded-lg border border-gray-200 cursor-pointer
                            hover:border-primary-300 hover:bg-primary-50/50 transition-colors
                            ${activity.isIdle ? 'opacity-60' : ''}
                          `}
                        >
                          <div className="flex items-start gap-2">
                            {/* Category Color */}
                            <div
                              className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: activity.isIdle
                                  ? '#d1d5db'
                                  : category?.color ?? '#6b7280',
                              }}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-gray-900 text-xs leading-tight">
                                    {activity.appName}
                                    {activity.isIdle && (
                                      <span className="ml-1 text-[10px] text-yellow-600">
                                        (アイドル)
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {truncate(activity.windowTitle, 30)}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-[10px] font-medium text-gray-700">
                                    {formatDuration(activity.durationSeconds)}
                                  </p>
                                  <p className="text-[9px] text-gray-400">
                                    {format(new Date(activity.startTime), 'HH:mm')}
                                    {activity.endTime && (
                                      <>-{format(new Date(activity.endTime), 'HH:mm')}</>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Category Badge and Tags */}
                              <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                                <span
                                  className="inline-block px-1 py-0.5 rounded text-[9px] text-white"
                                  style={{ backgroundColor: category?.color ?? '#6b7280' }}
                                >
                                  {category?.name ?? '未分類'}
                                </span>
                                {activity.tagIds && activity.tagIds.length > 0 && (
                                  <TagList
                                    tags={activity.tagIds
                                      .map(id => tagMap.get(id))
                                      .filter((t): t is NonNullable<typeof t> => t !== undefined)}
                                    maxDisplay={2}
                                    size="sm"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity Modal */}
      {isModalOpen && (
        <ActivityModal
          activity={editingActivity ?? undefined}
          defaultDate={selectedDay}
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
