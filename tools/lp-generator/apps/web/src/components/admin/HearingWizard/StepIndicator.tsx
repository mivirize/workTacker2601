'use client'

import { Check } from 'lucide-react'

export interface Step {
  id: number
  title: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isClickable = onStepClick && (isCompleted || isCurrent)

          return (
            <li key={step.id} className="flex-1 relative">
              {index !== 0 && (
                <div
                  className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${
                    isCompleted || isCurrent ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                  style={{ left: '-50%' }}
                />
              )}
              {index !== steps.length - 1 && (
                <div
                  className={`absolute left-1/2 right-0 top-4 h-0.5 -translate-y-1/2 ${
                    isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                  style={{ right: '-50%' }}
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`
                  relative flex flex-col items-center group
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <span
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors z-10
                    ${isCompleted
                      ? 'bg-primary-500 text-white'
                      : isCurrent
                        ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                        : 'bg-gray-200 text-gray-500'
                    }
                    ${isClickable && !isCurrent ? 'group-hover:bg-primary-600' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </span>
                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${isCurrent ? 'text-primary-600' : 'text-gray-500'}
                  `}
                >
                  {step.title}
                </span>
                <span className="text-xs text-gray-400 hidden md:block">
                  {step.description}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
