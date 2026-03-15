/**
 * ImageField Component
 *
 * Unified image upload field with D&D support and optimization.
 * Used by both standard fields and repeat block fields.
 */

import React from 'react'

// File size threshold for warning (5MB)
const FILE_SIZE_WARNING_THRESHOLD = 5 * 1024 * 1024

interface ImageFieldProps {
  /** Current image src (relative path) */
  src?: string
  /** Base path for image preview URLs */
  basePath: string
  /** Whether to show optimization dialog for large images */
  enableOptimization?: boolean
  /** Compact layout mode (for repeat blocks) */
  compact?: boolean
  /** Called when image changes */
  onImageChange: (src: string) => void
}

export function ImageField({
  src,
  basePath,
  enableOptimization = true,
  compact = false,
  onImageChange,
}: ImageFieldProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [warning, setWarning] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [showOptimize, setShowOptimize] = React.useState(false)
  const [pendingFilePath, setPendingFilePath] = React.useState<string | null>(null)
  const [imageInfo, setImageInfo] = React.useState<{
    size: number
    width?: number
    height?: number
    format?: string
  } | null>(null)

  const [optimizeOptions, setOptimizeOptions] = React.useState({
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'webp' as 'jpeg' | 'png' | 'webp',
  })

  const processImage = async (filePath: string, shouldOptimize: boolean = false) => {
    setError(null)
    setWarning(null)
    setIsLoading(true)
    try {
      if (shouldOptimize) {
        const relativePath = await window.electronAPI.optimizeImage(filePath, optimizeOptions)
        onImageChange(relativePath)
        setShowOptimize(false)
        setPendingFilePath(null)
        setImageInfo(null)
      } else {
        const ext = filePath.split('.').pop() || 'png'
        const fileName = `img-${Date.now()}.${ext}`
        const relativePath = await window.electronAPI.copyImage(filePath, fileName)
        onImageChange(relativePath)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像の処理に失敗しました'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAndProcessImage = async (filePath: string) => {
    setError(null)
    setWarning(null)
    setIsLoading(true)

    try {
      if (enableOptimization) {
        const info = await window.electronAPI.getImageInfo(filePath)
        setImageInfo(info)

        if (info.size > FILE_SIZE_WARNING_THRESHOLD) {
          const sizeMB = (info.size / (1024 * 1024)).toFixed(2)
          setWarning(`ファイルサイズが大きいです (${sizeMB}MB)。最適化をおすすめします。`)
          setPendingFilePath(filePath)
          setShowOptimize(true)
          setIsLoading(false)
          return
        }
      }

      await processImage(filePath, false)
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像情報の取得に失敗しました'
      setError(message)
      setIsLoading(false)
    }
  }

  const handleSelectImage = async () => {
    const filePath = await window.electronAPI.selectImage()
    if (filePath) {
      await checkAndProcessImage(filePath)
    }
  }

  const handleClearImage = () => {
    onImageChange('')
  }

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルをドロップしてください')
        return
      }
      const filePath = (file as File & { path?: string }).path
      if (filePath) {
        await checkAndProcessImage(filePath)
      } else {
        setError('ファイルパスを取得できませんでした')
      }
    }
  }

  const handleOptimize = async () => {
    if (pendingFilePath) {
      await processImage(pendingFilePath, true)
    }
  }

  const handleSkipOptimize = async () => {
    if (pendingFilePath) {
      await processImage(pendingFilePath, false)
    }
  }

  const handleCancelOptimize = () => {
    setShowOptimize(false)
    setPendingFilePath(null)
    setImageInfo(null)
    setWarning(null)
  }

  // Compact layout for repeat blocks
  if (compact) {
    return (
      <div className="flex gap-3 items-start">
        {/* Image Preview / Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
            isDragOver
              ? 'ring-2 ring-blue-500 ring-offset-2'
              : 'ring-1 ring-gray-300'
          } ${src ? '' : 'bg-gray-100'}`}
        >
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : src ? (
            <>
              <img
                src={`${basePath}${src}`}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={handleSelectImage}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="変更"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={handleClearImage}
                  className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors"
                  title="削除"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={handleSelectImage}
            >
              <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-500">画像を追加</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-2">
            クリックまたはドラッグ&ドロップで画像を設定
          </p>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Standard layout
  return (
    <div className="space-y-2">
      {/* Current image preview */}
      {src && !showOptimize && (
        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={`${basePath}${src}`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Optimization panel */}
      {showOptimize && imageInfo && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-lg">!</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">{warning}</p>
              <p className="text-xs text-yellow-600 mt-1">
                サイズ: {imageInfo.width}x{imageInfo.height} / 形式: {imageInfo.format?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">最大幅</label>
                <input
                  type="number"
                  value={optimizeOptions.maxWidth}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    maxWidth: parseInt(e.target.value) || 0,
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">最大高さ</label>
                <input
                  type="number"
                  value={optimizeOptions.maxHeight}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    maxHeight: parseInt(e.target.value) || 0,
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">品質 ({optimizeOptions.quality}%)</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={optimizeOptions.quality}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    quality: parseInt(e.target.value),
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">形式</label>
                <select
                  value={optimizeOptions.format}
                  onChange={(e) => setOptimizeOptions({
                    ...optimizeOptions,
                    format: e.target.value as 'jpeg' | 'png' | 'webp',
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="webp">WebP (推奨)</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOptimize}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400"
            >
              {isLoading ? '処理中...' : '最適化して使用'}
            </button>
            <button
              onClick={handleSkipOptimize}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm disabled:bg-gray-100"
            >
              そのまま使用
            </button>
          </div>
          <button
            onClick={handleCancelOptimize}
            className="w-full px-3 py-1 text-gray-500 hover:text-gray-700 text-xs"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* Drop zone and select button */}
      {!showOptimize && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isLoading ? (
            <div className="py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">処理中...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-2">
                画像をドラッグ&ドロップ
              </p>
              <p className="text-xs text-gray-400 mb-3">または</p>
              <button
                onClick={handleSelectImage}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm"
              >
                画像を選択
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
    </div>
  )
}
