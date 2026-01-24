import { format } from 'date-fns'
import type { TimeBlock, Category } from '../../../shared/types'
import { formatDuration, truncate } from '../../utils/format'

interface TimeBlockDetailProps {
  block: TimeBlock
  categories: Category[]
  onClose: () => void
  onActivityClick?: (activityId: number) => void
}

export default function TimeBlockDetail({
  block,
  categories,
  onClose,
  onActivityClick,
}: TimeBlockDetailProps) {
  const startTime = format(new Date(block.startTime), 'HH:mm')
  const endTime = format(new Date(block.endTime), 'HH:mm')

  const categoryMap = new Map(categories.map(c => [c.id, c]))

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-medium text-gray-900">
            {startTime} - {endTime} 詳細
          </h4>
          <p className="text-xs text-gray-500">
            合計: {formatDuration(block.totalDuration)} / アイドル: {formatDuration(block.idleDuration)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* App Breakdown */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          アプリ別内訳
        </h5>
        {block.appBreakdown.map((app, index) => {
          const category = app.categoryId ? categoryMap.get(app.categoryId) : null
          const isIdle = app.activities.some(a => a.isIdle)

          return (
            <div key={index} className="space-y-1">
              {/* App header with bar */}
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isIdle ? '#d1d5db' : category?.color ?? '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {isIdle ? 'アイドル' : app.appName}
                    </span>
                    <span className="text-sm text-gray-600 flex-shrink-0 ml-2">
                      {formatDuration(app.duration)} ({app.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${app.percentage}%`,
                        backgroundColor: isIdle ? '#d1d5db' : category?.color ?? '#6b7280',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Window titles breakdown */}
              {app.activities.length > 0 && (
                <div className="ml-6 space-y-1">
                  {app.activities.slice(0, 5).map((activity, actIndex) => (
                    <div
                      key={actIndex}
                      onClick={() => onActivityClick?.(activity.id)}
                      className={`
                        flex items-center justify-between text-xs py-1 px-2 rounded
                        ${onActivityClick ? 'cursor-pointer hover:bg-gray-100' : ''}
                      `}
                    >
                      <span className="text-gray-600 truncate flex-1 min-w-0">
                        {truncate(activity.windowTitle, 50)}
                      </span>
                      <span className="text-gray-400 flex-shrink-0 ml-2">
                        {format(new Date(activity.startTime), 'HH:mm')}
                        {activity.endTime && (
                          <>-{format(new Date(activity.endTime), 'HH:mm')}</>
                        )}
                      </span>
                    </div>
                  ))}
                  {app.activities.length > 5 && (
                    <p className="text-xs text-gray-400 pl-2">
                      他 {app.activities.length - 5} 件
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Category Summary */}
      {block.appBreakdown.some(a => a.categoryId) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            カテゴリ別
          </h5>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Aggregate by category
              const categoryDurations = new Map<number, { category: Category; duration: number }>()
              for (const app of block.appBreakdown) {
                if (app.categoryId) {
                  const category = categoryMap.get(app.categoryId)
                  if (category) {
                    const existing = categoryDurations.get(app.categoryId)
                    if (existing) {
                      existing.duration += app.duration
                    } else {
                      categoryDurations.set(app.categoryId, { category, duration: app.duration })
                    }
                  }
                }
              }

              return Array.from(categoryDurations.values())
                .sort((a, b) => b.duration - a.duration)
                .map(({ category, duration }) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}: {formatDuration(duration)}
                  </span>
                ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
