import { memo } from 'react'
import { format } from 'date-fns'
import type { Activity, Category, Tag } from '../../../shared/types'
import { formatDuration, truncate } from '../../utils/format'
import { getActivityColor, getCategoryColor } from '../../utils/colors'
import TagList from '../tags/TagList'

interface ActivityCardProps {
  activity: Activity
  category: Category | undefined
  tags: Tag[]
  categories: Category[]
  isEditingCategory: boolean
  onCategoryEdit: () => void
  onCategoryChange: (categoryId: number | null) => void
  onCategoryBlur: () => void
  onEdit: () => void
  getDuration: (activity: Activity) => number
}

export default memo(function ActivityCard({
  activity,
  category,
  tags,
  categories,
  isEditingCategory,
  onCategoryEdit,
  onCategoryChange,
  onCategoryBlur,
  onEdit,
  getDuration,
}: ActivityCardProps) {
  return (
    <div
      className={`card p-4 flex items-start gap-4 ${
        activity.isIdle ? 'opacity-50' : ''
      }`}
    >
      {/* Category Color */}
      <div
        className="w-1 h-full min-h-[60px] rounded-full flex-shrink-0"
        style={{
          backgroundColor: getActivityColor(activity.isIdle, category?.color),
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
                {formatDuration(getDuration(activity))}
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
              onClick={onEdit}
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
          {isEditingCategory ? (
            <select
              value={activity.categoryId ?? ''}
              onChange={(e) => {
                const value = e.target.value
                onCategoryChange(value ? parseInt(value) : null)
              }}
              onBlur={onCategoryBlur}
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
              onClick={onCategoryEdit}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: getCategoryColor(category?.color),
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
          {tags.length > 0 && (
            <TagList tags={tags} maxDisplay={3} size="sm" />
          )}
        </div>
      </div>
    </div>
  )
})
