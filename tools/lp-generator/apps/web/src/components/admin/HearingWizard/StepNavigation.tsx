'use client'

import { ArrowLeft, ArrowRight, Save } from 'lucide-react'

interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  isLoading?: boolean
  isNextDisabled?: boolean
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isLoading,
  isNextDisabled,
}: StepNavigationProps) {
  const isLastStep = currentStep === totalSteps

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`
          btn btn-secondary flex items-center gap-2
          ${currentStep === 1 ? 'invisible' : ''}
        `}
      >
        <ArrowLeft className="w-4 h-4" />
        戻る
      </button>

      <div className="text-sm text-gray-500">
        ステップ {currentStep} / {totalSteps}
      </div>

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || isNextDisabled}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? '保存中...' : 'ヒアリングを保存'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="btn btn-primary flex items-center gap-2"
        >
          次へ
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
