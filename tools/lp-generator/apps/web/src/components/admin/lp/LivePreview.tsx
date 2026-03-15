'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

interface LivePreviewProps {
  lpUrl: string
  title: string
}

const viewportSizes: Record<ViewportSize, { width: number; height: number; label: string }> = {
  mobile: { width: 375, height: 667, label: 'モバイル' },
  tablet: { width: 768, height: 1024, label: 'タブレット' },
  desktop: { width: 1280, height: 800, label: 'デスクトップ' },
}

export function LivePreview({ lpUrl, title }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [scale, setScale] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentViewport = viewportSizes[viewport]

  const calculateScale = useCallback(() => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth - 48
    const containerHeight = containerRef.current.clientHeight - 48

    const scaleX = containerWidth / currentViewport.width
    const scaleY = containerHeight / currentViewport.height

    setScale(Math.min(scaleX, scaleY, 1))
  }, [currentViewport])

  useEffect(() => {
    calculateScale()
    window.addEventListener('resize', calculateScale)
    return () => window.removeEventListener('resize', calculateScale)
  }, [calculateScale])

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const handleOpenExternal = () => {
    window.open(lpUrl, '_blank')
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 mr-4">プレビュー: {title}</h3>

          {/* Viewport Buttons */}
          <div className="flex items-center bg-white rounded-lg border shadow-sm">
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewport === 'mobile'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="モバイル表示"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`p-2 border-x transition-colors ${
                viewport === 'tablet'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="タブレット表示"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewport === 'desktop'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="デスクトップ表示"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-gray-400 ml-2">
            {currentViewport.width} x {currentViewport.height}
            {scale < 1 && ` (${Math.round(scale * 100)}%)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="プレビューを更新"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? 'フルスクリーンを終了' : 'フルスクリーン表示'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleOpenExternal}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="新しいタブで開く"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-100 flex items-center justify-center p-6 overflow-hidden"
      >
        <div
          className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: currentViewport.width,
            height: currentViewport.height,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500">プレビューを読み込み中...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={lpUrl}
            title={`Preview: ${title}`}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* Info Bar */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          訪問者に表示されるランディングページのプレビューです。
          <a href={lpUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline ml-1">
            フルページを表示
          </a>
        </p>
      </div>
    </div>
  )
}
