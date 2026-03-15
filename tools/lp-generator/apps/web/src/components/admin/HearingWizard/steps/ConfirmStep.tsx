'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { HearingWizardData } from '../types'

interface ConfirmStepProps {
  form: UseFormReturn<HearingWizardData>
}

export function ConfirmStep({ form }: ConfirmStepProps) {
  const data = form.getValues()

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">内容確認</h2>
        <p className="text-gray-500 mt-2">保存前に入力内容をご確認ください</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">クライアント情報</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">会社名</dt>
              <dd className="text-gray-900 font-medium">{data.clientName || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">担当者</dt>
              <dd className="text-gray-900">{data.contactPerson || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">メール</dt>
              <dd className="text-gray-900">{data.contactEmail || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">商品/サービス</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">名称</dt>
              <dd className="text-gray-900 font-medium">{data.productName || '-'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">価格</dt>
              <dd className="text-gray-900">
                {data.priceInfo?.price || '-'}
                {data.priceInfo?.priceNote && ` (${data.priceInfo.priceNote})`}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">強み・特徴</dt>
              <dd className="text-gray-900">
                {data.uniqueSellingPoints?.filter(u => u.value).length || 0} 件
              </dd>
            </div>
          </dl>
        </div>

        {/* Target Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">ターゲット</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">対象顧客</dt>
              <dd className="text-gray-900 line-clamp-2">
                {data.targetAudience || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">課題・悩み</dt>
              <dd className="text-gray-900">
                {data.painPoints?.filter(p => p.value).length || 0} 件
              </dd>
            </div>
          </dl>
        </div>

        {/* Design */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">デザイン</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">テンプレート</dt>
              <dd className="text-gray-900 capitalize font-medium">{data.templateTier}</dd>
            </div>
            <div>
              <dt className="text-gray-500">カラー</dt>
              <dd className="flex items-center gap-2 mt-1">
                <span
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: data.primaryColor || '#3B82F6' }}
                />
                <span
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: data.secondaryColor || '#1E40AF' }}
                />
                <span
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: data.accentColor || '#F59E0B' }}
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">備考</label>
        <textarea
          {...form.register('notes')}
          className="input min-h-[100px]"
          placeholder="追加の要望や特記事項があれば入力してください..."
        />
      </div>
    </div>
  )
}
