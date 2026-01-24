import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { CategoryDuration } from '../../../shared/types'
import { formatDuration, formatPercentage } from '../../utils/format'

interface CategoryPieChartProps {
  data: CategoryDuration[]
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        データがありません
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: item.duration,
    color: item.color,
    percentage: item.percentage,
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof chartData[0] }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatDuration(data.value)} ({formatPercentage(data.percentage)})
          </p>
        </div>
      )
    }
    return null
  }

  const renderLegend = ({ payload }: { payload?: { value: string; color: string }[] }) => {
    if (!payload) return null
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}
