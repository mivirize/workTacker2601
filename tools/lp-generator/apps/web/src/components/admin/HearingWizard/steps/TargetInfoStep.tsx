'use client'

import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type { HearingWizardData } from '../types'

interface TargetInfoStepProps {
  form: UseFormReturn<HearingWizardData>
}

export function TargetInfoStep({ form }: TargetInfoStepProps) {
  const {
    fields: painFields,
    append: appendPain,
    remove: removePain,
  } = useFieldArray({
    control: form.control,
    name: 'painPoints',
  })

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ターゲット情報</h2>
        <p className="text-gray-500 mt-2">この商品/サービスは誰のためのものですか？</p>
      </div>

      <div>
        <label className="label">ターゲット層</label>
        <p className="text-sm text-gray-500 mb-2">理想的な顧客像を記述してください</p>
        <textarea
          {...form.register('targetAudience')}
          className="input min-h-[100px]"
          placeholder="例: IT業界の中小企業、マーケティング自動化を求めるチーム..."
        />
      </div>

      <div>
        <label className="label">顧客の課題・悩み</label>
        <p className="text-sm text-gray-500 mb-3">ターゲット層が抱えている問題は何ですか？</p>
        <div className="space-y-3">
          {painFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                {...form.register(`painPoints.${index}.value`)}
                className="input flex-1"
                placeholder={`課題 ${index + 1}（例: 「手作業が多く時間がかかる」）`}
              />
              {painFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePain(index)}
                  className="btn btn-outline px-3 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendPain({ value: '' })}
            className="btn btn-secondary w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            課題を追加
          </button>
        </div>
      </div>

      <div>
        <label className="label">期待される成果</label>
        <p className="text-sm text-gray-500 mb-2">顧客が期待する結果は何ですか？</p>
        <textarea
          {...form.register('desiredOutcome')}
          className="input min-h-[100px]"
          placeholder="例: 生産性50%向上、手作業の削減、顧客満足度の改善..."
        />
      </div>
    </div>
  )
}
