'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { StepIndicator } from './StepIndicator'
import { StepNavigation } from './StepNavigation'
import { ClientInfoStep } from './steps/ClientInfoStep'
import { ProductInfoStep } from './steps/ProductInfoStep'
import { TargetInfoStep } from './steps/TargetInfoStep'
import { DesignStep } from './steps/DesignStep'
import { ConfirmStep } from './steps/ConfirmStep'
import {
  hearingWizardSchema,
  stepSchemas,
  WIZARD_STEPS,
  type HearingWizardData,
} from './types'

interface HearingWizardProps {
  onSubmit: (data: HearingWizardData) => Promise<void>
  isLoading?: boolean
}

export function HearingWizard({ onSubmit, isLoading }: HearingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<HearingWizardData>({
    resolver: zodResolver(hearingWizardSchema),
    defaultValues: {
      templateTier: 'simple',
      uniqueSellingPoints: [{ value: '' }],
      painPoints: [{ value: '' }],
      colorPreset: 'blue',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
    },
    mode: 'onTouched',
  })

  const validateCurrentStep = async () => {
    const schema = stepSchemas[currentStep as keyof typeof stepSchemas]
    if (!schema) return true

    const fieldsToValidate = Object.keys(schema.shape) as (keyof HearingWizardData)[]

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < WIZARD_STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleStepClick = async (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    } else if (step === currentStep + 1) {
      const isValid = await validateCurrentStep()
      if (isValid) {
        setCurrentStep(step)
      }
    }
  }

  const handleSubmit = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      const data = form.getValues()
      await onSubmit(data)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ClientInfoStep form={form} />
      case 2:
        return <ProductInfoStep form={form} />
      case 3:
        return <TargetInfoStep form={form} />
      case 4:
        return <DesignStep form={form} />
      case 5:
        return <ConfirmStep form={form} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div className="card">
        <form onSubmit={(e) => e.preventDefault()}>
          {renderStep()}

          <StepNavigation
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </form>
      </div>
    </div>
  )
}

export type { HearingWizardData }
