'use client'

import type { UseFormReturn } from 'react-hook-form'
import { COLOR_PRESETS } from '@lp-generator/sanity-schemas'
import type { HearingWizardData } from '../types'

interface DesignStepProps {
  form: UseFormReturn<HearingWizardData>
}

export function DesignStep({ form }: DesignStepProps) {
  const selectedTier = form.watch('templateTier')
  const selectedPreset = form.watch('colorPreset')

  const handlePresetChange = (presetValue: string) => {
    form.setValue('colorPreset', presetValue)
    const preset = COLOR_PRESETS.find(p => p.value === presetValue)
    if (preset) {
      form.setValue('primaryColor', preset.primary)
      form.setValue('secondaryColor', preset.secondary)
      form.setValue('accentColor', preset.accent)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">デザイン設定</h2>
        <p className="text-gray-500 mt-2">テンプレートとカラースキームを選択してください</p>
      </div>

      {/* Template Tier Selection */}
      <div>
        <label className="label mb-4">テンプレートティア *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: 'simple',
              label: 'シンプル',
              desc: 'Hero, 特徴, CTAブロック',
              features: ['ヒーローセクション', '特徴リスト', '行動喚起ボタン'],
            },
            {
              value: 'rich',
              label: 'リッチ',
              desc: '+ メリット, FAQ, お客様の声',
              features: ['シンプルの全機能', 'メリットセクション', 'お客様の声', 'FAQ'],
            },
            {
              value: 'premier',
              label: 'プレミア',
              desc: '全ブロック利用可能',
              features: ['リッチの全機能', '料金表', 'お問い合わせフォーム', '動画・ギャラリー'],
            },
          ].map((tier) => (
            <label
              key={tier.value}
              className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all
                ${selectedTier === tier.value
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <input
                type="radio"
                {...form.register('templateTier')}
                value={tier.value}
                className="sr-only"
              />
              <div className="text-lg font-bold text-gray-900 mb-1">{tier.label}</div>
              <div className="text-sm text-gray-500 mb-3">{tier.desc}</div>
              <ul className="text-xs text-gray-600 space-y-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {selectedTier === tier.value && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Color Preset Selection */}
      <div>
        <label className="label mb-4">カラースキーム</label>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-4">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetChange(preset.value)}
              className={`
                relative p-2 rounded-lg border-2 transition-all
                ${selectedPreset === preset.value
                  ? 'border-gray-900 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              title={preset.name}
            >
              <div className="flex gap-1">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: preset.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: preset.secondary }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center truncate">
                {preset.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div>
        <label className="label mb-4">カスタムカラー（任意）</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">メインカラー</label>
            <div className="flex gap-2">
              <input
                type="color"
                {...form.register('primaryColor')}
                className="w-12 h-10 rounded cursor-pointer border-0"
              />
              <input
                {...form.register('primaryColor')}
                className="input flex-1"
                placeholder="#3B82F6"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">セカンダリカラー</label>
            <div className="flex gap-2">
              <input
                type="color"
                {...form.register('secondaryColor')}
                className="w-12 h-10 rounded cursor-pointer border-0"
              />
              <input
                {...form.register('secondaryColor')}
                className="input flex-1"
                placeholder="#1E40AF"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">アクセントカラー</label>
            <div className="flex gap-2">
              <input
                type="color"
                {...form.register('accentColor')}
                className="w-12 h-10 rounded cursor-pointer border-0"
              />
              <input
                {...form.register('accentColor')}
                className="input flex-1"
                placeholder="#F59E0B"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
