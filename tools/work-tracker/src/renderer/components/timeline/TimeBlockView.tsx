import { useState, useMemo } from 'react'
import type { Activity, Category, TimeBlockInterval } from '../../../shared/types'
import { generateTimeBlocks, filterActiveBlocks, INTERVAL_OPTIONS, getBlocksSummary } from '../../utils/time-blocks'
import { formatDuration } from '../../utils/format'
import TimeBlockCard from './TimeBlockCard'
import TimeBlockDetail from './TimeBlockDetail'

interface TimeBlockViewProps {
  activities: Activity[]
  categories: Category[]
  date: Date
  onActivityClick?: (activityId: number) => void
}

export default function TimeBlockView({
  activities,
  categories,
  date,
  onActivityClick,
}: TimeBlockViewProps) {
  const [intervalMinutes, setIntervalMinutes] = useState<TimeBlockInterval>(15)
  const [expandedBlockIndex, setExpandedBlockIndex] = useState<number | null>(null)
  const [showEmptyBlocks, setShowEmptyBlocks] = useState(false)

  // Generate time blocks
  const allBlocks = useMemo(() => {
    return generateTimeBlocks(activities, date, intervalMinutes, categories)
  }, [activities, date, intervalMinutes, categories])

  // Filter to show only active blocks or all blocks
  const displayBlocks = useMemo(() => {
    return showEmptyBlocks ? allBlocks : filterActiveBlocks(allBlocks)
  }, [allBlocks, showEmptyBlocks])

  // Summary stats
  const summary = useMemo(() => {
    return getBlocksSummary(filterActiveBlocks(allBlocks))
  }, [allBlocks])

  const handleBlockClick = (index: number) => {
    const block = displayBlocks[index]
    if (block.totalDuration > 0) {
      setExpandedBlockIndex(expandedBlockIndex === index ? null : index)
    }
  }

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIntervalMinutes(Number(e.target.value) as TimeBlockInterval)
    setExpandedBlockIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Header / Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          {/* Interval Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">間隔:</label>
            <select
              value={intervalMinutes}
              onChange={handleIntervalChange}
              className="input py-1 px-2 text-sm w-20"
            >
              {INTERVAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Show Empty Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showEmptyBlocks}
              onChange={e => setShowEmptyBlocks(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            空白も表示
          </label>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            稼働: <span className="font-medium text-gray-900">{formatDuration(summary.totalDuration - summary.totalIdle)}</span>
          </span>
          {summary.topApp && (
            <span className="text-gray-500">
              最多: <span className="font-medium text-gray-900">{summary.topApp}</span>
            </span>
          )}
          {summary.topCategory && (
            <span
              className="px-2 py-0.5 rounded text-xs text-white"
              style={{ backgroundColor: summary.topCategory.color }}
            >
              {summary.topCategory.name}
            </span>
          )}
        </div>
      </div>

      {/* Time Blocks List */}
      {displayBlocks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>この日のアクティビティがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayBlocks.map((block, index) => (
            <div key={block.startTime}>
              <TimeBlockCard
                block={block}
                intervalMinutes={intervalMinutes}
                isExpanded={expandedBlockIndex === index}
                onClick={() => handleBlockClick(index)}
              />
              {expandedBlockIndex === index && block.totalDuration > 0 && (
                <TimeBlockDetail
                  block={block}
                  categories={categories}
                  onClose={() => setExpandedBlockIndex(null)}
                  onActivityClick={onActivityClick}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
