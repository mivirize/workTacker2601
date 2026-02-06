import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { AppDuration, Category } from '../../../shared/types'
import { formatDuration, truncate } from '../../utils/format'
import { COLORS, getCategoryColor } from '../../utils/colors'

interface AppBarChartProps {
  data: AppDuration[]
  categories: Category[]
  maxItems?: number
}

export default function AppBarChart({
  data,
  categories,
  maxItems = 10,
}: AppBarChartProps) {
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const chartData = useMemo(() => data.slice(0, maxItems).map((item) => {
    const category = item.categoryId ? categoryMap.get(item.categoryId) : null
    return {
      name: truncate(item.appName, 15),
      fullName: item.appName,
      duration: item.duration,
      color: getCategoryColor(category?.color),
      categoryName: category?.name ?? 'その他',
    }
  }), [data, maxItems, categoryMap])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        データがありません
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof chartData[0] }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">{data.categoryName}</p>
          <p className="text-sm font-medium text-primary-600">
            {formatDuration(data.duration)}
          </p>
        </div>
      )
    }
    return null
  }

  const formatYAxis = (value: number) => {
    if (value >= 3600) {
      return `${Math.floor(value / 3600)}h`
    }
    if (value >= 60) {
      return `${Math.floor(value / 60)}m`
    }
    return `${value}s`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
        <XAxis
          type="number"
          tickFormatter={formatYAxis}
          tick={{ fontSize: 12, fill: COLORS.textMuted }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: COLORS.textDark }}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
