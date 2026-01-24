import { useMemo } from 'react'
import type { TimelineEntry, Category } from '../../../shared/types'
import { format } from 'date-fns'
import { formatDuration, truncate } from '../../utils/format'

interface TimelineChartProps {
  data: TimelineEntry[]
  categories: Category[]
}

export default function TimelineChart({ data, categories }: TimelineChartProps) {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  )

  const hours = useMemo(() => {
    const hrs: number[] = []
    for (let i = 0; i <= 23; i++) {
      hrs.push(i)
    }
    return hrs
  }, [])

  const getPositionForTime = (timestamp: number): number => {
    const date = new Date(timestamp)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    return ((hours * 60 + minutes) / (24 * 60)) * 100
  }

  const getWidthForDuration = (start: number, end: number): number => {
    const startDate = new Date(start)

    // Clamp to current day
    const dayStart = new Date(startDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const clampedStart = Math.max(start, dayStart.getTime())
    const clampedEnd = Math.min(end, dayEnd.getTime())

    const duration = clampedEnd - clampedStart
    return (duration / (24 * 60 * 60 * 1000)) * 100
  }

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400">
        データがありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Hour markers */}
      <div className="relative h-6 flex">
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex-1 text-xs text-gray-400 text-center"
            style={{ minWidth: `${100 / 24}%` }}
          >
            {hour % 3 === 0 ? `${hour}:00` : ''}
          </div>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
        {/* Hour grid lines */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-gray-200"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}

        {/* Activity blocks */}
        {data.map((entry, index) => {
          const category = entry.categoryId
            ? categoryMap.get(entry.categoryId)
            : null
          const color = entry.isIdle
            ? '#d1d5db'
            : category?.color ?? '#6b7280'
          const left = getPositionForTime(entry.startTime)
          const width = getWidthForDuration(entry.startTime, entry.endTime)

          if (width < 0.1) return null // Skip very small entries

          return (
            <div
              key={index}
              className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity group"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.2)}%`,
                backgroundColor: color,
              }}
              title={`${entry.appName}\n${truncate(entry.windowTitle, 50)}\n${format(new Date(entry.startTime), 'HH:mm')} - ${format(new Date(entry.endTime), 'HH:mm')}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <div className="font-medium">{entry.appName}</div>
                  <div className="text-gray-300">
                    {format(new Date(entry.startTime), 'HH:mm')} -{' '}
                    {format(new Date(entry.endTime), 'HH:mm')}
                  </div>
                  <div className="text-gray-300">
                    {formatDuration(
                      Math.floor((entry.endTime - entry.startTime) / 1000)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2">
        {categories.slice(0, 6).map((category) => (
          <div key={category.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-xs text-gray-600">{category.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-xs text-gray-600">アイドル</span>
        </div>
      </div>
    </div>
  )
}
