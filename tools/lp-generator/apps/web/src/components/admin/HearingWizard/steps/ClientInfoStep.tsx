'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { HearingWizardData } from '../types'

interface ClientInfoStepProps {
  form: UseFormReturn<HearingWizardData>
}

export function ClientInfoStep({ form }: ClientInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">クライアント情報</h2>
        <p className="text-gray-500 mt-2">クライアントの基本情報を入力してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="label">クライアント名/会社名 *</label>
          <input
            {...form.register('clientName')}
            className="input"
            placeholder="例: 株式会社テックソリューション"
          />
          {form.formState.errors.clientName && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.clientName.message}</p>
          )}
        </div>

        <div>
          <label className="label">担当者名</label>
          <input
            {...form.register('contactPerson')}
            className="input"
            placeholder="例: 山田 太郎"
          />
        </div>

        <div>
          <label className="label">メールアドレス</label>
          <input
            {...form.register('contactEmail')}
            type="email"
            className="input"
            placeholder="例: taro@example.com"
          />
          {form.formState.errors.contactEmail && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.contactEmail.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
