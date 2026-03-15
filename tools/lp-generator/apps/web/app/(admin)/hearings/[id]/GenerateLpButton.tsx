'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, RefreshCw, Loader2 } from 'lucide-react'

interface GenerateLpButtonProps {
  hearingId: string
  existingLpId?: string
  mode?: 'generate' | 'regenerate'
}

export function GenerateLpButton({ hearingId, existingLpId, mode = 'generate' }: GenerateLpButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const isRegenerate = mode === 'regenerate' && existingLpId

  const handleGenerate = async () => {
    if (isRegenerate && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setShowConfirm(false)

    try {
      const response = await fetch('/api/lp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hearingId,
          regenerate: isRegenerate,
          existingLpId: existingLpId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to generate LP')
      }

      const result = await response.json()
      router.push(`/lps/${result.lpId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
          既存のLPを上書きして再生成しますか？<br />
          <span className="text-xs">（現在の編集内容は失われます）</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                再生成中...
              </>
            ) : (
              '再生成する'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            キャンセル
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className={isRegenerate ? 'btn btn-secondary' : 'btn btn-primary'}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isRegenerate ? '再生成中...' : '生成中...'}
          </>
        ) : isRegenerate ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            LP再生成
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 mr-2" />
            LP生成
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
