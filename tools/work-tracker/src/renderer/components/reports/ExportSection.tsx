import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { logError } from '../../utils/logger'

export default function ExportSection() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  const handleExportCSV = async () => {
    try {
      const csv = await window.api.export.toCSV(dateRange.start, dateRange.end)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `work-tracker-${dateRange.start}-${dateRange.end}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      logError('Failed to export CSV:', error)
    }
  }

  const handleExportJSON = async () => {
    try {
      const json = await window.api.export.toJSON(dateRange.start, dateRange.end)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `work-tracker-${dateRange.start}-${dateRange.end}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      logError('Failed to export JSON:', error)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">データエクスポート</h2>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label">開始日</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="input"
            max={dateRange.end}
          />
        </div>
        <div>
          <label className="label">終了日</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="input"
            min={dateRange.start}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            CSV
          </button>
          <button onClick={handleExportJSON} className="btn btn-secondary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            JSON
          </button>
        </div>
      </div>
    </div>
  )
}
