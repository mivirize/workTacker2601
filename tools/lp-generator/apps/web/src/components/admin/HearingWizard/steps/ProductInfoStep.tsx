'use client'

import type { UseFormReturn } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type { HearingWizardData } from '../types'

interface ProductInfoStepProps {
  form: UseFormReturn<HearingWizardData>
}

export function ProductInfoStep({ form }: ProductInfoStepProps) {
  const {
    fields: uspFields,
    append: appendUsp,
    remove: removeUsp,
  } = useFieldArray({
    control: form.control,
    name: 'uniqueSellingPoints',
  })

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">商品/サービス情報</h2>
        <p className="text-gray-500 mt-2">商品やサービスの詳細を入力してください</p>
      </div>

      <div>
        <label className="label">商品/サービス名 *</label>
        <input
          {...form.register('productName')}
          className="input"
          placeholder="例: クラウドCRM Pro"
        />
        {form.formState.errors.productName && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.productName.message}</p>
        )}
      </div>

      <div>
        <label className="label">説明</label>
        <textarea
          {...form.register('productDescription')}
          className="input min-h-[120px]"
          placeholder="商品やサービスの詳細を入力してください..."
        />
      </div>

      <div>
        <label className="label">強み・特徴 (USP) *</label>
        <p className="text-sm text-gray-500 mb-3">この商品/サービスの差別化ポイントは何ですか？</p>
        <div className="space-y-3">
          {uspFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                {...form.register(`uniqueSellingPoints.${index}.value`)}
                className="input flex-1"
                placeholder={`強み ${index + 1}（例: 「24時間サポート」「AI搭載」）`}
              />
              {uspFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUsp(index)}
                  className="btn btn-outline px-3 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {uspFields.length < 5 && (
            <button
              type="button"
              onClick={() => appendUsp({ value: '' })}
              className="btn btn-secondary w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              強みを追加
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">価格</label>
          <input
            {...form.register('priceInfo.price')}
            className="input"
            placeholder="例: ¥9,800/月"
          />
        </div>
        <div>
          <label className="label">価格備考</label>
          <input
            {...form.register('priceInfo.priceNote')}
            className="input"
            placeholder="例: 税別"
          />
        </div>
      </div>
    </div>
  )
}
