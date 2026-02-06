/**
 * Project Card Component
 *
 * Displays a single project in the admin project list with thumbnail.
 */

import { useMemo, useState, useEffect } from 'react'

interface ProjectCardProps {
  id: string
  name: string
  client: string
  path: string
  lastModified: string
  hasHistory: boolean
  buildCount: number
  thumbnailPath?: string
  isSelected: boolean
  onSelect: () => void
  onOpen: () => void
}

export function ProjectCard({
  name,
  client,
  path,
  lastModified,
  hasHistory,
  buildCount,
  thumbnailPath,
  isSelected,
  onSelect,
  onOpen,
}: ProjectCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [thumbnailLoading, setThumbnailLoading] = useState(false)

  // Load thumbnail when thumbnailPath changes
  useEffect(() => {
    if (!thumbnailPath) {
      setThumbnailUrl(null)
      return
    }

    setThumbnailLoading(true)
    window.electronAPI.loadThumbnail(thumbnailPath)
      .then((dataUrl) => {
        setThumbnailUrl(dataUrl)
      })
      .catch(() => {
        setThumbnailUrl(null)
      })
      .finally(() => {
        setThumbnailLoading(false)
      })
  }, [thumbnailPath])

  // Format date
  const formattedDate = useMemo(() => {
    const date = new Date(lastModified)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [lastModified])

  // Calculate time ago
  const timeAgo = useMemo(() => {
    const date = new Date(lastModified)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今日'
    if (days === 1) return '昨日'
    if (days < 7) return `${days}日前`
    if (days < 30) return `${Math.floor(days / 7)}週間前`
    if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
    return `${Math.floor(days / 365)}年前`
  }, [lastModified])

  return (
    <div
      className={`group relative rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg overflow-hidden ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="h-32 bg-gray-100 relative overflow-hidden">
        {thumbnailLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        ) : thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Build badge overlay */}
        {hasHistory && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full shadow">
            {buildCount} ビルド
          </span>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-base font-semibold text-gray-800 truncate" title={name}>
            {name}
          </h3>
          <p className="text-sm text-gray-500 truncate" title={client}>
            {client}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span title={formattedDate}>{timeAgo}</span>
          </div>

          {/* Open Button (visible on hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700"
          >
            開く
          </button>
        </div>
      </div>
    </div>
  )
}
