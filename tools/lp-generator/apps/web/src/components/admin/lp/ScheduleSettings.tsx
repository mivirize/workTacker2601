'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Clock, Save, RefreshCw, Trash2 } from 'lucide-react'

const scheduleSchema = z.object({
  publishAt: z.string().optional(),
  unpublishAt: z.string().optional(),
}).refine(
  (data) => {
    if (data.publishAt && data.unpublishAt) {
      return new Date(data.unpublishAt) > new Date(data.publishAt)
    }
    return true
  },
  {
    message: '非公開日時は公開日時より後に設定してください',
    path: ['unpublishAt'],
  }
)

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface ScheduleSettingsProps {
  initialData: {
    publishAt?: string
    unpublishAt?: string
    publishStatus: string
  }
  onSave: (data: ScheduleFormData) => Promise<void>
  isLoading?: boolean
}

function formatDateForInput(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().slice(0, 16)
}

function formatDateForDisplay(dateString?: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ScheduleSettings({ initialData, onSave, isLoading }: ScheduleSettingsProps) {
  const [scheduleType, setScheduleType] = useState<'none' | 'publish' | 'unpublish' | 'both'>(
    initialData.publishAt && initialData.unpublishAt
      ? 'both'
      : initialData.publishAt
        ? 'publish'
        : initialData.unpublishAt
          ? 'unpublish'
          : 'none'
  )

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      publishAt: formatDateForInput(initialData.publishAt),
      unpublishAt: formatDateForInput(initialData.unpublishAt),
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    const submitData: ScheduleFormData = {}

    if (scheduleType === 'publish' || scheduleType === 'both') {
      submitData.publishAt = data.publishAt || undefined
    }
    if (scheduleType === 'unpublish' || scheduleType === 'both') {
      submitData.unpublishAt = data.unpublishAt || undefined
    }

    await onSave(submitData)
  })

  const handleClearSchedule = async () => {
    await onSave({ publishAt: undefined, unpublishAt: undefined })
    form.reset({ publishAt: '', unpublishAt: '' })
    setScheduleType('none')
  }

  const now = new Date().toISOString().slice(0, 16)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">スケジュール設定</h3>
          <p className="text-sm text-gray-500 mt-1">
            このランディングページの公開・非公開スケジュールを設定します。
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(initialData.publishAt || initialData.unpublishAt) && (
            <button
              type="button"
              onClick={handleClearSchedule}
              className="btn btn-secondary flex items-center gap-2"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
              スケジュールを解除
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary flex items-center gap-2"
            disabled={isLoading || scheduleType === 'none'}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            スケジュールを保存
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">現在のステータス</h4>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-gray-500">ステータス</span>
            <p className="font-medium capitalize">{initialData.publishStatus}</p>
          </div>
          {initialData.publishAt && (
            <div>
              <span className="text-xs text-gray-500">公開予定</span>
              <p className="font-medium">{formatDateForDisplay(initialData.publishAt)}</p>
            </div>
          )}
          {initialData.unpublishAt && (
            <div>
              <span className="text-xs text-gray-500">非公開予定</span>
              <p className="font-medium">{formatDateForDisplay(initialData.unpublishAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Type Selection */}
      <div>
        <label className="label">スケジュールタイプ</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {[
            { value: 'none' as const, label: 'スケジュールなし', desc: '手動で公開' },
            { value: 'publish' as const, label: '公開予約', desc: '指定日時に自動公開' },
            { value: 'unpublish' as const, label: '非公開予約', desc: '指定日時に自動非公開' },
            { value: 'both' as const, label: '両方', desc: '公開・非公開を予約' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setScheduleType(option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                scheduleType === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Inputs */}
      {scheduleType !== 'none' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(scheduleType === 'publish' || scheduleType === 'both') && (
            <div>
              <label className="label flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                公開日時
              </label>
              <input
                type="datetime-local"
                {...form.register('publishAt')}
                min={now}
                className="input"
              />
              {form.formState.errors.publishAt && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.publishAt.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                この日時にLPが自動的に公開されます。
              </p>
            </div>
          )}

          {(scheduleType === 'unpublish' || scheduleType === 'both') && (
            <div>
              <label className="label flex items-center gap-2">
                <Clock className="w-4 h-4" />
                非公開日時
              </label>
              <input
                type="datetime-local"
                {...form.register('unpublishAt')}
                min={now}
                className="input"
              />
              {form.formState.errors.unpublishAt && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.unpublishAt.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                この日時にLPが自動的に非公開になります。
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800">スケジュール機能について</h4>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>スケジュールされたアクションはシステムが自動的に処理します。</li>
          <li>指定した日時にLPのステータスが変更されます。</li>
          <li>公開ステータスを手動で変更することでスケジュールを上書きできます。</li>
          <li>すべての時刻はお使いのタイムゾーンで表示されます。</li>
        </ul>
      </div>
    </div>
  )
}
