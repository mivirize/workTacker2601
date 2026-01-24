import { useAppStore } from '../../stores/app-store'
import { formatDurationHMS } from '../../utils/format'

export default function Header() {
  const {
    trackingState,
    dailySummary,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
  } = useAppStore()

  const handleToggleTracking = async () => {
    if (!trackingState.isTracking) {
      await startTracking()
    } else if (trackingState.isPaused) {
      await resumeTracking()
    } else {
      await pauseTracking()
    }
  }

  const getStatusColor = () => {
    if (!trackingState.isTracking) return 'bg-gray-400'
    if (trackingState.isPaused) return 'bg-yellow-400'
    if (trackingState.isIdle) return 'bg-orange-400 animate-pulse-slow'
    return 'bg-green-400 animate-pulse-slow'
  }

  const getStatusText = () => {
    if (!trackingState.isTracking) return '停止中'
    if (trackingState.isPaused) return '一時停止中'
    if (trackingState.isIdle) return 'アイドル中'
    return 'トラッキング中'
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>

        {dailySummary && (
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-gray-600">
              今日: {formatDurationHMS(dailySummary.totalDuration)}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggleTracking}
          className={`btn btn-sm ${
            trackingState.isTracking && !trackingState.isPaused
              ? 'btn-secondary'
              : 'btn-primary'
          }`}
        >
          {!trackingState.isTracking ? (
            <>
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              開始
            </>
          ) : trackingState.isPaused ? (
            <>
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              再開
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              一時停止
            </>
          )}
        </button>

        {trackingState.isTracking && (
          <button onClick={stopTracking} className="btn btn-sm btn-danger">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 6h12v12H6z" />
            </svg>
            停止
          </button>
        )}
      </div>
    </header>
  )
}
