import { format, addMonths, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CalendarHeaderProps {
  currentMonth: string // yyyy-MM
  onMonthChange: (month: string) => void
  onToday: () => void
}

export default function CalendarHeader({
  currentMonth,
  onMonthChange,
  onToday,
}: CalendarHeaderProps) {
  const [year, month] = currentMonth.split('-').map(Number)
  const currentDate = new Date(year, month - 1, 1)

  const handlePrevMonth = () => {
    const prevDate = subMonths(currentDate, 1)
    onMonthChange(format(prevDate, 'yyyy-MM'))
  }

  const handleNextMonth = () => {
    const nextDate = addMonths(currentDate, 1)
    onMonthChange(format(nextDate, 'yyyy-MM'))
  }

  const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM')

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">
        {format(currentDate, 'yyyy年M月', { locale: ja })}
      </h2>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="前月"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="次月"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        <button
          onClick={onToday}
          disabled={isCurrentMonth}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isCurrentMonth
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
          }`}
        >
          今日
        </button>
      </div>
    </div>
  )
}
