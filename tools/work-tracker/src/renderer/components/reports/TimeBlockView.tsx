import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import type { Activity, Category, TimeBlock, TimeBlockInterval } from '../../../shared/types'
import { generateTimeBlocks, INTERVAL_OPTIONS } from '../../utils/time-blocks'
import { logError } from '../../utils/logger'
import TimeBlockSummary from '../timeline/TimeBlockSummary'
import TimeBlockDetail from '../timeline/TimeBlockDetail'

interface TimeBlockViewProps {
  categories: Category[]
}

export default function TimeBlockView({ categories }: TimeBlockViewProps) {
  const [blockViewDate, setBlockViewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [blockActivities, setBlockActivities] = useState<Activity[]>([])
  const [blockInterval, setBlockInterval] = useState<TimeBlockInterval>(30)
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null)

  useEffect(() => {
    const loadBlockActivities = async () => {
      try {
        const data = await window.api.activities.getForDate(blockViewDate)
        setBlockActivities(data)
        setSelectedBlock(null)
      } catch (error) {
        logError('Failed to load block activities:', error)
      }
    }
    loadBlockActivities()
  }, [blockViewDate])

  const timeBlocks = useMemo(() => {
    const allBlocks = generateTimeBlocks(
      blockActivities,
      new Date(blockViewDate),
      blockInterval,
      categories
    )
    const startIndex = Math.floor((6 * 60) / blockInterval)
    const endIndex = Math.floor((24 * 60) / blockInterval)
    return allBlocks.slice(startIndex, endIndex)
  }, [blockActivities, blockViewDate, blockInterval, categories])

  const maxBlockDuration = useMemo(() => {
    return Math.max(...timeBlocks.map((b) => b.totalDuration), blockInterval * 60)
  }, [timeBlocks, blockInterval])

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="card-title">時間帯別アクティビティ</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={blockViewDate}
            onChange={(e) => setBlockViewDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="input py-1 px-2 text-sm"
          />
          <select
            value={blockInterval}
            onChange={(e) => {
              setBlockInterval(Number(e.target.value) as TimeBlockInterval)
              setSelectedBlock(null)
            }}
            className="input py-1 px-2 text-sm w-20"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TimeBlockSummary
        timeBlocks={timeBlocks}
        maxBlockDuration={maxBlockDuration}
        selectedBlock={selectedBlock}
        onSelectBlock={(block) => {
          if (block.totalDuration > 0) {
            setSelectedBlock(selectedBlock?.startTime === block.startTime ? null : block)
          }
        }}
      />

      {selectedBlock && selectedBlock.totalDuration > 0 && (
        <TimeBlockDetail
          block={selectedBlock}
          categories={categories}
          onClose={() => setSelectedBlock(null)}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs mt-4">
        {categories.slice(0, 5).map((category) => (
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
