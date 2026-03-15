'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HearingWizard, type HearingWizardData } from '@/components/admin/HearingWizard'

export default function NewHearingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: HearingWizardData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to create hearing')
      }

      const result = await response.json()
      router.push(`/hearings/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">新規ヒアリング</h1>
        <p className="mt-2 text-gray-500">
          クライアントのヒアリングシートをステップごとに作成
        </p>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <HearingWizard onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
