import { useEffect } from 'react'
import { format } from 'date-fns'
import { useAppStore } from '../stores/app-store'
import CalendarHeader from '../components/calendar/CalendarHeader'
import CalendarGrid from '../components/calendar/CalendarGrid'
import DayActivitiesPanel from '../components/calendar/DayActivitiesPanel'
import { formatDuration } from '../utils/format'

export default function Calendar() {
  const {
    calendarMonth,
    setCalendarMonth,
    calendarSelectedDay,
    setCalendarSelectedDay,
    calendarSummary,
    isLoadingCalendar,
    fetchCalendarSummary,
    categories,
    tags,
    projects,
  } = useAppStore()

  // Load calendar data when month changes
  useEffect(() => {
    fetchCalendarSummary(calendarMonth)
  }, [calendarMonth, fetchCalendarSummary])

  const handleMonthChange = (month: string) => {
    setCalendarMonth(month)
    // Clear selected day when changing month
    setCalendarSelectedDay(null)
  }

  const handleToday = () => {
    const today = new Date()
    setCalendarMonth(format(today, 'yyyy-MM'))
    setCalendarSelectedDay(format(today, 'yyyy-MM-dd'))
  }

  const handleDayClick = (date: string) => {
    setCalendarSelectedDay(date)
  }

  const handleActivityChange = () => {
    // Reload calendar summary when activities change
    fetchCalendarSummary(calendarMonth)
  }

  // Calculate monthly statistics
  const totalDuration = calendarSummary.reduce((sum, s) => sum + s.totalDuration, 0)
  const workDays = calendarSummary.filter((s) => s.totalDuration > 0).length
  const avgDuration = workDays > 0 ? Math.floor(totalDuration / workDays) : 0

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">カレンダー</h1>
        <p className="text-gray-500 mt-1">
          月間の作業状況を確認・管理
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Calendar Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Calendar Header */}
          <div className="mb-4">
            <CalendarHeader
              currentMonth={calendarMonth}
              onMonthChange={handleMonthChange}
              onToday={handleToday}
            />
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 min-h-0">
            {isLoadingCalendar ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <CalendarGrid
                currentMonth={calendarMonth}
                selectedDay={calendarSelectedDay}
                summaries={calendarSummary}
                categories={categories}
                onDayClick={handleDayClick}
              />
            )}
          </div>

          {/* Monthly Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">月間合計:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDuration(totalDuration)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">稼働日数:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {workDays}日
                </span>
              </div>
              <div>
                <span className="text-gray-500">日平均:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatDuration(avgDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Day Activities Panel */}
        <div className="w-80 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DayActivitiesPanel
            selectedDay={calendarSelectedDay}
            categories={categories}
            tags={tags}
            projects={projects}
            onActivityChange={handleActivityChange}
          />
        </div>
      </div>
    </div>
  )
}
