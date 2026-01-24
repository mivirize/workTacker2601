import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
} from 'date-fns'
import CalendarDay from './CalendarDay'
import type { CalendarDaySummary, Category } from '../../../shared/types'

interface CalendarGridProps {
  currentMonth: string // yyyy-MM
  selectedDay: string | null // yyyy-MM-dd
  summaries: CalendarDaySummary[]
  categories: Category[]
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日']

export default function CalendarGrid({
  currentMonth,
  selectedDay,
  summaries,
  categories,
  onDayClick,
}: CalendarGridProps) {
  const [year, month] = currentMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)

  // Week starts on Monday (weekStartsOn: 1)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Create a map of date -> summary for quick lookup
  const summaryMap = new Map(summaries.map((s) => [s.date, s]))

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`
              py-2 text-center text-sm font-medium
              ${idx === 5 ? 'text-blue-600' : ''}
              ${idx === 6 ? 'text-red-500' : ''}
              ${idx < 5 ? 'text-gray-600' : ''}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day) => {
          const dateString = format(day, 'yyyy-MM-dd')
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isSelected = selectedDay === dateString

          return (
            <CalendarDay
              key={dateString}
              date={day}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              summary={summaryMap.get(dateString)}
              categories={categories}
              onClick={onDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}
