import { format, isToday } from 'date-fns'
import type { CalendarDaySummary, Category } from '../../../shared/types'

interface CalendarDayProps {
  date: Date
  isCurrentMonth: boolean
  isSelected: boolean
  summary?: CalendarDaySummary
  categories: Category[]
  onClick: (date: string) => void
}

function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }
  if (minutes > 0) {
    return `${minutes}m`
  }
  return ''
}

export default function CalendarDay({
  date,
  isCurrentMonth,
  isSelected,
  summary,
  categories,
  onClick,
}: CalendarDayProps) {
  const dayNumber = date.getDate()
  const dateString = format(date, 'yyyy-MM-dd')
  const isCurrentDay = isToday(date)

  // Get top 3 categories by duration
  const topCategories = summary?.categoryBreakdown
    ?.sort((a, b) => b.duration - a.duration)
    ?.slice(0, 3)
    ?.map((cb) => categories.find((c) => c.id === cb.categoryId))
    ?.filter(Boolean) as Category[] | undefined

  return (
    <button
      onClick={() => onClick(dateString)}
      className={`
        relative p-2 min-h-[80px] text-left rounded-lg transition-all
        ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
        ${isSelected ? 'ring-2 ring-primary-500' : 'hover:bg-gray-50'}
        ${!isCurrentMonth ? 'opacity-50' : ''}
      `}
    >
      {/* Day Number */}
      <div
        className={`
        inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
        ${isCurrentDay ? 'bg-primary-600 text-white' : ''}
        ${isSelected && !isCurrentDay ? 'bg-primary-100 text-primary-700' : ''}
        ${!isCurrentDay && !isSelected ? 'text-gray-700' : ''}
      `}
      >
        {dayNumber}
      </div>

      {/* Duration */}
      {summary && summary.totalDuration > 0 && (
        <div className="mt-1 text-xs font-medium text-gray-600">
          {formatHours(summary.totalDuration)}
        </div>
      )}

      {/* Category Dots */}
      {topCategories && topCategories.length > 0 && (
        <div className="mt-1 flex gap-1">
          {topCategories.map((cat, idx) => (
            <div
              key={idx}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cat.color }}
              title={cat.name}
            />
          ))}
        </div>
      )}

      {/* Activity Count Badge */}
      {summary && summary.activityCount > 0 && (
        <div className="absolute bottom-1 right-1 text-[10px] text-gray-400">
          {summary.activityCount}件
        </div>
      )}
    </button>
  )
}
