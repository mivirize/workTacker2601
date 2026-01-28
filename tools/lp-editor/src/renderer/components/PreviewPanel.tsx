/**
 * Preview Panel Component
 *
 * Displays a live preview of the LP with applied edits.
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { useEditorStore } from '../stores/editor-store'

type ViewportSize = 'mobile' | 'tablet' | 'desktop'

const viewportWidths: Record<ViewportSize, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
}

export function PreviewPanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { modifiedHtml, selectedField, basePath } = useEditorStore()
  const [viewport, setViewport] = useState<ViewportSize>('desktop')

  // Memoize the HTML with base href to avoid unnecessary re-renders
  const htmlWithBase = useMemo(() => {
    if (!modifiedHtml) return ''

    let result = modifiedHtml
    const cspMeta = '<meta http-equiv="Content-Security-Policy" content="default-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:; img-src * data: blob:; font-src * data:;">'

    // Script to handle link clicks in preview
    // - Allow anchor links (#xxx) for smooth scrolling
    // - Prevent external navigation (would cause white screen)
    const preventNavScript = `<script>
      document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        if (target && target.tagName === 'A') {
          var href = target.getAttribute('href');

          // Allow anchor links (page scroll)
          if (href && href.startsWith('#')) {
            var targetId = href.substring(1);
            var targetElement = document.getElementById(targetId);
            if (targetElement) {
              e.preventDefault();
              targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            return;
          }

          // Block external navigation
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    </script>`

    if (basePath) {
      if (result.includes('<head>')) {
        result = result.replace('<head>', `<head><base href="${basePath}">${cspMeta}`)
      } else if (result.includes('<html>')) {
        result = result.replace('<html>', `<html><head><base href="${basePath}">${cspMeta}</head>`)
      }
    } else {
      if (result.includes('<head>')) {
        result = result.replace('<head>', `<head>${cspMeta}`)
      }
    }

    // Inject navigation prevention script before </body>
    if (result.includes('</body>')) {
      result = result.replace('</body>', `${preventNavScript}</body>`)
    } else {
      result += preventNavScript
    }

    return result
  }, [modifiedHtml, basePath])

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && htmlWithBase) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(htmlWithBase)
        doc.close()
      }
    }
  }, [htmlWithBase])

  // Highlight selected field in preview
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const doc = iframeRef.current.contentDocument

      // Remove previous highlights
      doc.querySelectorAll('[data-lp-editor-highlight]').forEach((el) => {
        el.removeAttribute('data-lp-editor-highlight')
        ;(el as HTMLElement).style.outline = ''
      })

      // Add highlight to selected field
      if (selectedField) {
        const element = doc.querySelector(`[data-editable="${selectedField}"]`)
        if (element) {
          element.setAttribute('data-lp-editor-highlight', 'true')
          ;(element as HTMLElement).style.outline = '2px solid #3B82F6'
        }
      }
    }
  }, [selectedField, htmlWithBase])

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">プレビュー</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewport === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="モバイル表示"
          >
            Mobile
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewport === 'tablet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="タブレット表示"
          >
            Tablet
          </button>
          <button
            onClick={() => setViewport('desktop')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewport === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="デスクトップ表示"
          >
            Desktop
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <iframe
          ref={iframeRef}
          className="bg-white shadow-lg transition-all duration-300"
          style={{
            width: viewportWidths[viewport],
            height: '100%',
            border: 'none',
            maxWidth: viewport === 'desktop' ? '1200px' : undefined,
          }}
          title="LP Preview"
        />
      </div>
    </div>
  )
}
