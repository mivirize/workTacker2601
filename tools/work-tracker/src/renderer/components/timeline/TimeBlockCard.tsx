import { format } from 'date-fns'
import type { TimeBlock, TimeBlockInterval } from '../../../shared/types'
import { formatDuration } from '../../utils/format'
import { calculateActivityPercentage } from '../../utils/time-blocks'

interface TimeBlockCardProps {
  block: TimeBlock
  intervalMinutes: TimeBlockInterval
  isExpanded: boolean
  onClick: () => void
}

export default function TimeBlockCard({
  block,
  intervalMinutes,
  isExpanded,
  onClick,
}: TimeBlockCardProps) {
  const startTime = format(new Date(block.startTime), 'HH:mm')
  const endTime = format(new Date(block.endTime), 'HH:mm')
  const activityPercentage = calculateActivityPercentage(block, intervalMinutes)
  const hasActivity = block.totalDuration > 0
  const isIdle = block.totalDuration === block.idleDuration && block.totalDuration > 0

  // Calculate bar width based on actual tracked time vs interval
  const maxSeconds = intervalMinutes * 60
  const barWidth = Math.min(100, Math.round((block.totalDuration / maxSeconds) * 100))

  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 rounded-lg border cursor-pointer transition-all
        ${isExpanded ? 'ring-2 ring-primary-500 border-primary-300' : 'border-gray-200'}
        ${hasActivity ? 'hover:border-primary-300 hover:bg-primary-50/30' : 'hover:bg-gray-50'}
        ${!hasActivity ? 'opacity-40' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Time Label */}
        <div className="flex-shrink-0 w-24">
          <span className="text-sm font-medium text-gray-700">
            {startTime}
          </span>
          <span className="text-xs text-gray-400 mx-1">-</span>
          <span className="text-sm text-gray-500">
            {endTime}
          </span>
        </div>

        {/* Activity Bar */}
        <div className="flex-1 min-w-0">
          <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden">
            {hasActivity && (
              <div
                className="absolute inset-y-0 left-0 rounded-md transition-all"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: isIdle
                    ? '#d1d5db'
                    : block.dominantCategory?.color ?? '#6b7280',
                }}
              />
            )}
            {/* Content overlay */}
            <div className="absolute inset-0 flex items-center px-3">
              {hasActivity ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-medium truncate ${barWidth > 40 ? 'text-white' : 'text-gray-700'}`}>
                    {isIdle ? 'アイドル' : block.dominantApp}
                  </span>
                  {!isIdle && block.dominantCategory && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded text-white flex-shrink-0"
                      style={{ backgroundColor: block.dominantCategory.color }}
                    >
                      {block.dominantCategory.name}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">記録なし</span>
              )}
            </div>
          </div>
        </div>

        {/* Duration & Stats */}
        <div className="flex-shrink-0 text-right w-24">
          {hasActivity ? (
            <>
              <p className="text-sm font-medium text-gray-900">
                {formatDuration(block.totalDuration - block.idleDuration)}
              </p>
              <p className="text-xs text-gray-500">
                {activityPercentage}% 稼働
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400">-</p>
          )}
        </div>

        {/* Expand Icon */}
        {hasActivity && (
          <div className="flex-shrink-0">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
