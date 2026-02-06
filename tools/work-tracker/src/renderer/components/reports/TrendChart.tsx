import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatDuration } from '../../utils/format'
import { COLORS } from '../../utils/colors'
import type { WeeklySummary, MonthlySummary } from '../../../shared/types'

type ViewMode = 'weekly' | 'monthly'

interface TrendChartProps {
  viewMode: ViewMode
  weeklySummary: WeeklySummary | null
  monthlySummary: MonthlySummary | null
}

interface ChartDataPoint {
  date: string
  fullDate: string
  total: number
  productive: number
  idle: number
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name === 'total'
              ? '合計'
              : item.name === 'productive'
                ? 'アクティブ'
                : 'アイドル'}
            : {formatDuration(item.value * 60)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function TrendChart({
  viewMode,
  weeklySummary,
  monthlySummary,
}: TrendChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (viewMode === 'weekly') {
      return (
        weeklySummary?.dailySummaries.map((day) => ({
          date: format(new Date(day.date), 'E', { locale: ja }),
          fullDate: format(new Date(day.date), 'M/d'),
          total: Math.round(day.totalDuration / 60),
          productive: Math.round(day.productiveDuration / 60),
          idle: Math.round(day.idleDuration / 60),
        })) ?? []
      )
    }
    return (
      monthlySummary?.dailyTotals.map((day) => ({
        date: format(new Date(day.date), 'd'),
        fullDate: format(new Date(day.date), 'M/d'),
        total: Math.round(day.duration / 60),
        productive: Math.round(day.duration / 60),
        idle: 0,
      })) ?? []
    )
  }, [viewMode, weeklySummary, monthlySummary])

  const formatYAxis = (value: number) => {
    if (value >= 60) {
      return `${Math.floor(value / 60)}h`
    }
    return `${value}m`
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">{viewMode === 'weekly' ? '週間' : '月間'}トレンド</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="productive"
            name="productive"
            fill={COLORS.productive}
            stackId="a"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="idle"
            name="idle"
            fill={COLORS.idle}
            stackId="a"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-gray-600">アクティブ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span className="text-sm text-gray-600">アイドル</span>
        </div>
      </div>
    </div>
  )
}
