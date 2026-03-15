'use client'

import { useState, useMemo } from 'react'
import { SeoSettings } from '@/components/admin/lp/SeoSettings'
import { LivePreview } from '@/components/admin/lp/LivePreview'
import { BlockEditor } from '@/components/admin/lp/BlockEditor'
import { ScheduleSettings } from '@/components/admin/lp/ScheduleSettings'
import { FormEditor } from '@/components/admin/lp/form/FormEditor'
import { Settings, Palette, Globe, Eye, LayoutList, Calendar, FileText } from 'lucide-react'
import type { FormBlock } from '@lp-generator/sanity-schemas/types'

interface Block {
  _key: string
  _type: string
  [key: string]: unknown
}

interface LpEditorProps {
  lpId: string
  initialData: {
    seoTitle?: string
    seoDescription?: string
    title: string
    url: string
    publishStatus: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    blocks: Block[]
    publishAt?: string
    unpublishAt?: string
  }
}

export function LpEditor({ lpId, initialData }: LpEditorProps) {
  const [activeSection, setActiveSection] = useState<'preview' | 'blocks' | 'form' | 'seo' | 'publish' | 'schedule' | 'colors'>('preview')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // フォームブロックを検索
  const formBlock = useMemo(() => {
    return initialData.blocks.find((block) => block._type === 'formBlock') as FormBlock | undefined
  }, [initialData.blocks])

  const handleSeoSave = async (data: { seoTitle?: string; seoDescription?: string; ogImageUrl?: string }) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/lps/${lpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save SEO settings')
      }

      setMessage({ type: 'success', text: 'SEO設定を保存しました' })
    } catch {
      setMessage({ type: 'error', text: 'SEO設定の保存に失敗しました。もう一度お試しください' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishStatusChange = async (status: string) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/lps/${lpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishStatus: status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update publish status')
      }

      setMessage({ type: 'success', text: '公開ステータスを更新しました' })
      window.location.reload()
    } catch {
      setMessage({ type: 'error', text: 'ステータスの更新に失敗しました。もう一度お試しください' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlocksSave = async (blocks: Block[]) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/lps/${lpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageBuilder: blocks }),
      })

      if (!response.ok) {
        throw new Error('Failed to save blocks')
      }

      setMessage({ type: 'success', text: 'ブロックを保存しました' })
    } catch {
      setMessage({ type: 'error', text: 'ブロックの保存に失敗しました。もう一度お試しください' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSave = async (updatedFormBlock: FormBlock) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const updatedBlocks = initialData.blocks.map((block) =>
        block._type === 'formBlock' ? updatedFormBlock : block
      )

      const response = await fetch(`/api/lps/${lpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageBuilder: updatedBlocks }),
      })

      if (!response.ok) {
        throw new Error('Failed to save form')
      }

      setMessage({ type: 'success', text: 'フォームを保存しました' })
      // ページをリロードして最新のデータを反映
      window.location.reload()
    } catch {
      setMessage({ type: 'error', text: 'フォームの保存に失敗しました。もう一度お試しください' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleSave = async (data: { publishAt?: string; unpublishAt?: string }) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/lps/${lpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save schedule')
      }

      setMessage({ type: 'success', text: 'スケジュールを保存しました' })
      window.location.reload()
    } catch {
      setMessage({ type: 'error', text: 'スケジュールの保存に失敗しました。もう一度お試しください' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSection('preview')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'preview'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          プレビュー
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('blocks')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'blocks'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          ブロック
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('form')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'form'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          フォーム
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('seo')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'seo'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          SEO設定
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('publish')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'publish'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          公開設定
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('schedule')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'schedule'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          スケジュール
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('colors')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeSection === 'colors'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Palette className="w-4 h-4" />
          カラー
        </button>
      </div>

      {/* Preview Section */}
      {activeSection === 'preview' && (
        <div className="card p-0 overflow-hidden" style={{ height: '70vh' }}>
          <LivePreview lpUrl={initialData.url} title={initialData.title} />
        </div>
      )}

      {/* Blocks Section */}
      {activeSection === 'blocks' && (
        <div className="card">
          <BlockEditor
            blocks={initialData.blocks}
            onSave={handleBlocksSave}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Form Section */}
      {activeSection === 'form' && (
        <div>
          {formBlock ? (
            <FormEditor
              formBlock={formBlock}
              onSave={handleFormSave}
              isLoading={isLoading}
            />
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">フォームブロックがありません</h3>
                <p className="text-gray-500 mb-4">
                  このランディングページにはフォームブロックが含まれていません。
                </p>
                <p className="text-sm text-gray-400">
                  ヒアリングから再生成するか、Sanity Studioでフォームブロックを追加してください。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Section */}
      {activeSection === 'schedule' && (
        <div className="card">
          <ScheduleSettings
            initialData={{
              publishAt: initialData.publishAt,
              unpublishAt: initialData.unpublishAt,
              publishStatus: initialData.publishStatus,
            }}
            onSave={handleScheduleSave}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Section Content */}
      {activeSection !== 'preview' && activeSection !== 'blocks' && activeSection !== 'schedule' && (
        <div className="card">
          {activeSection === 'seo' && (
          <SeoSettings
            initialData={initialData}
            onSave={handleSeoSave}
            isLoading={isLoading}
          />
        )}

        {activeSection === 'publish' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">公開設定</h3>

            <div>
              <label className="label">公開ステータス</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {[
                  { value: 'draft', label: '下書き', desc: '非公開', activeClass: 'border-gray-500 bg-gray-50' },
                  { value: 'preview', label: 'プレビュー', desc: '共有可能なプレビューリンク', activeClass: 'border-blue-500 bg-blue-50' },
                  { value: 'published', label: '公開中', desc: '一般公開', activeClass: 'border-green-500 bg-green-50' },
                  { value: 'unpublished', label: '非公開', desc: 'オフラインに設定', activeClass: 'border-red-500 bg-red-50' },
                ].map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handlePublishStatusChange(status.value)}
                    disabled={isLoading}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      initialData.publishStatus === status.value
                        ? status.activeClass
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{status.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{status.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800">注意</h4>
              <p className="text-sm text-yellow-700 mt-1">
                公開ステータスを変更すると、このランディングページの表示状態がすぐに反映されます。
              </p>
            </div>
          </div>
        )}

        {activeSection === 'colors' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">カラー設定</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="label">メインカラー</label>
                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-12 h-12 rounded-lg border shadow-sm"
                    style={{ backgroundColor: initialData.primaryColor ?? '#3B82F6' }}
                  />
                  <span className="font-mono text-sm">{initialData.primaryColor ?? '#3B82F6'}</span>
                </div>
              </div>
              <div>
                <label className="label">セカンダリカラー</label>
                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-12 h-12 rounded-lg border shadow-sm"
                    style={{ backgroundColor: initialData.secondaryColor ?? '#1E40AF' }}
                  />
                  <span className="font-mono text-sm">{initialData.secondaryColor ?? '#1E40AF'}</span>
                </div>
              </div>
              <div>
                <label className="label">アクセントカラー</label>
                <div className="flex items-center gap-3 mt-2">
                  <div
                    className="w-12 h-12 rounded-lg border shadow-sm"
                    style={{ backgroundColor: initialData.accentColor ?? '#F59E0B' }}
                  />
                  <span className="font-mono text-sm">{initialData.accentColor ?? '#F59E0B'}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              カラーを変更するには、Sanity Studioで編集するか、ヒアリングシートから再生成してください。
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  )
}
