import { useState, useMemo } from 'react'
import { format, isValid } from 'date-fns'
import type { Activity, Category, TimeBlockInterval, TimeBlock } from '../../../shared/types'
import { generateTimeBlocks, INTERVAL_OPTIONS } from '../../utils/time-blocks'
import { formatDuration } from '../../utils/format'
import { COLORS, getActivityColor } from '../../utils/colors'

function formatTimeBlock(timestamp: number): string {
  const date = new Date(timestamp)
  return isValid(date) ? format(date, 'HH:mm') : '--:--'
}

interface TimeBlockSummaryProps {
  activities: Activity[]
  categories: Category[]
  date: Date
  onBlockClick?: (startTime: number, endTime: number) => void
}

export default function TimeBlockSummary({
  activities,
  categories,
  date,
}: TimeBlockSummaryProps) {
  const [intervalMinutes, setIntervalMinutes] = useState<TimeBlockInterval>(30)
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null)

  const categoryMap = useMemo(() => new Map((categories ?? []).map(c => [c.id, c])), [categories])

  // Generate and filter time blocks (only show active hours: 6:00-24:00)
  const blocks = useMemo(() => {
    const safeDate = date && isValid(date) ? date : new Date()
    const allBlocks = generateTimeBlocks(activities, safeDate, intervalMinutes, categories ?? [])
    const startIndex = Math.floor(6 * 60 / intervalMinutes)
    const endIndex = Math.floor(24 * 60 / intervalMinutes)
    return allBlocks.slice(startIndex, endIndex)
  }, [activities, date, intervalMinutes, categories])

  // Get max duration for scaling
  const maxDuration = useMemo(() => {
    return Math.max(...blocks.map(b => b.totalDuration), intervalMinutes * 60)
  }, [blocks, intervalMinutes])

  // Generate hour markers
  const hourMarkers = useMemo(() => {
    const markers: number[] = []
    for (let h = 6; h <= 24; h += 3) {
      markers.push(h)
    }
    return markers
  }, [])

  const handleBlockClick = (block: TimeBlock) => {
    if (block.totalDuration > 0) {
      setSelectedBlock(selectedBlock?.startTime === block.startTime ? null : block)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">間隔:</label>
          <select
            value={intervalMinutes}
            onChange={(e) => {
              setIntervalMinutes(Number(e.target.value) as TimeBlockInterval)
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

      {/* Time Block Chart */}
      <div className="border border-gray-200 rounded-lg p-4 overflow-hidden">
        {/* Hour Labels */}
        <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
          {hourMarkers.map((hour) => (
            <span key={hour} className="w-8 text-center">
              {hour}:00
            </span>
          ))}
        </div>

        {/* Blocks Container */}
        <div className="flex gap-0.5 h-12 items-end">
          {blocks.map((block) => {
            const hasActivity = block.totalDuration > 0
            const isIdle = block.totalDuration === block.idleDuration && block.totalDuration > 0
            const barHeight = hasActivity
              ? Math.max(8, Math.round((block.totalDuration / maxDuration) * 48))
              : 4
            const isSelected = selectedBlock?.startTime === block.startTime

            const blockLabel = `${formatTimeBlock(block.startTime)}-${formatTimeBlock(block.endTime)}: ${hasActivity ? formatDuration(block.totalDuration) : '記録なし'}`

            return (
              <div
                key={block.startTime}
                role="button"
                tabIndex={hasActivity ? 0 : -1}
                onClick={() => handleBlockClick(block)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleBlockClick(block)
                  }
                }}
                aria-label={blockLabel}
                aria-pressed={isSelected}
                className={`
                  flex-1 min-w-[4px] max-w-[16px] rounded-t-sm transition-all cursor-pointer
                  ${hasActivity ? 'hover:opacity-80' : 'opacity-30'}
                  ${isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                `}
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: isIdle
                    ? COLORS.idle
                    : block.dominantCategory?.color ?? (hasActivity ? COLORS.uncategorized : COLORS.empty),
                }}
                title={blockLabel}
              />
            )
          })}
        </div>
      </div>

      {/* Selected Block Detail */}
      {selectedBlock && selectedBlock.totalDuration > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">
                {formatTimeBlock(selectedBlock.startTime)} - {formatTimeBlock(selectedBlock.endTime)}
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

          {/* App Breakdown */}
          <div className="space-y-2">
            {selectedBlock.appBreakdown.slice(0, 5).map((app, idx) => {
              const category = app.categoryId ? categoryMap.get(app.categoryId) : null
              const isIdle = app.activities.some(a => a.isIdle)

              return (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getActivityColor(isIdle, category?.color) }}
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
      <div className="flex flex-wrap gap-3 text-xs">
        {(categories ?? []).slice(0, 5).map((category) => (
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
  )
}
