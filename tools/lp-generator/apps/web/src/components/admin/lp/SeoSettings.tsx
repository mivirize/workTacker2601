'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Globe, ImageIcon, Save, RefreshCw } from 'lucide-react'

const seoSchema = z.object({
  seoTitle: z.string().max(60, 'タイトルは60文字以内にしてください').optional(),
  seoDescription: z.string().max(160, '説明文は160文字以内にしてください').optional(),
  ogImageUrl: z.string().optional(),
})

type SeoFormData = z.infer<typeof seoSchema>

interface SeoSettingsProps {
  initialData: {
    seoTitle?: string
    seoDescription?: string
    ogImageUrl?: string
    title: string
    url: string
  }
  onSave: (data: SeoFormData) => Promise<void>
  isLoading?: boolean
}

export function SeoSettings({ initialData, onSave, isLoading }: SeoSettingsProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'social'>('google')

  const form = useForm<SeoFormData>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      seoTitle: initialData.seoTitle ?? '',
      seoDescription: initialData.seoDescription ?? '',
      ogImageUrl: initialData.ogImageUrl ?? '',
    },
  })

  const seoTitle = form.watch('seoTitle') || initialData.title
  const seoDescription = form.watch('seoDescription') || ''

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">SEO設定</h3>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="btn btn-primary flex items-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          SEO設定を保存
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('google')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'google'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Google検索プレビュー
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'social'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          SNSプレビュー
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="label flex items-center justify-between">
              <span>SEOタイトル</span>
              <span className={`text-xs ${(seoTitle?.length ?? 0) > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                {seoTitle?.length ?? 0}/60
              </span>
            </label>
            <input
              {...form.register('seoTitle')}
              className="input"
              placeholder={initialData.title}
            />
            {form.formState.errors.seoTitle && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.seoTitle.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              空欄の場合はLPタイトルが使用されます
            </p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>メタディスクリプション</span>
              <span className={`text-xs ${(seoDescription?.length ?? 0) > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                {seoDescription?.length ?? 0}/160
              </span>
            </label>
            <textarea
              {...form.register('seoDescription')}
              className="input min-h-[100px]"
              placeholder="検索エンジン向けの魅力的な説明文を入力してください..."
            />
            {form.formState.errors.seoDescription && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.seoDescription.message}</p>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              OG画像URL
            </label>
            <input
              {...form.register('ogImageUrl')}
              className="input"
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              推奨サイズ: 1200x630ピクセル
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {activeTab === 'google' ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Google検索プレビュー</h4>
              <div className="space-y-1">
                <p className="text-xs text-green-700 truncate">
                  {initialData.url}
                </p>
                <h3 className="text-lg text-blue-600 hover:underline cursor-pointer truncate">
                  {seoTitle}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {seoDescription || '説明文が設定されていません。メタディスクリプションを追加して検索表示を改善しましょう。'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <h4 className="text-sm font-medium text-gray-500 p-4 border-b">SNSプレビュー</h4>
              <div className="aspect-[1.91/1] bg-gray-100 flex items-center justify-center">
                {form.watch('ogImageUrl') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={form.watch('ogImageUrl')}
                    alt="OGプレビュー"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">OG画像が設定されていません</p>
                  </div>
                )}
              </div>
              <div className="p-3 border-t">
                <p className="text-xs text-gray-500 uppercase truncate">
                  {new URL(initialData.url).hostname}
                </p>
                <h3 className="font-semibold text-gray-900 truncate mt-1">
                  {seoTitle}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {seoDescription || '説明文が設定されていません。'}
                </p>
              </div>
            </div>
          )}

          {/* SEO Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">SEOのヒント</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>・タイトルは60文字以内に収めましょう</li>
              <li>・説明文は120〜160文字が最適です</li>
              <li>・タイトルと説明文の両方にメインキーワードを含めましょう</li>
              <li>・クリック率を上げるために魅力的な説明文を書きましょう</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
