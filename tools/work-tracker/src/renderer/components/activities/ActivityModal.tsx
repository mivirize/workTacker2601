import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import type {
  Activity,
  Category,
  Tag,
  Project,
  CreateActivityInput,
  UpdateActivityInput,
} from '../../../shared/types'
import TagSelector from '../tags/TagSelector'
import Modal from '../common/Modal'

interface ActivityModalProps {
  activity?: Activity // 編集モード時のアクティビティ
  defaultDate?: string // 新規作成時のデフォルト日付 (yyyy-MM-dd)
  categories: Category[]
  tags: Tag[]
  projects: Project[]
  onClose: () => void
  onSave: (input: CreateActivityInput | UpdateActivityInput) => Promise<void>
  onDelete?: (id: number) => Promise<void> // 編集モードのみ
}

export default function ActivityModal({
  activity,
  defaultDate,
  categories,
  tags,
  projects,
  onClose,
  onSave,
  onDelete,
}: ActivityModalProps) {
  const isEdit = !!activity

  // フォーム状態
  const [appName, setAppName] = useState(activity?.appName ?? '')
  const [windowTitle, setWindowTitle] = useState(activity?.windowTitle ?? '')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(activity?.categoryId ?? null)
  const [projectId, setProjectId] = useState<number | null>(activity?.projectId ?? null)
  const [tagIds, setTagIds] = useState<number[]>(activity?.tagIds ?? [])
  const [isIdle, setIsIdle] = useState(activity?.isIdle ?? false)
  const [url, setUrl] = useState(activity?.url ?? '')

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初期時刻設定
  useEffect(() => {
    if (activity) {
      // 編集モード: 既存のアクティビティの時刻を使用
      setStartTime(formatDateTimeLocal(activity.startTime))
      if (activity.endTime) {
        setEndTime(formatDateTimeLocal(activity.endTime))
      }
    } else {
      // 新規モード: デフォルト日付または現在時刻を使用
      const baseDate = defaultDate ? new Date(defaultDate) : new Date()
      const now = new Date()

      // デフォルト日付が今日の場合は現在時刻を使用、そうでなければ9:00開始
      if (defaultDate && format(baseDate, 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd')) {
        baseDate.setHours(9, 0, 0, 0)
        setStartTime(formatDateTimeLocal(baseDate.getTime()))
        baseDate.setHours(10, 0, 0, 0)
        setEndTime(formatDateTimeLocal(baseDate.getTime()))
      } else {
        // 今日の場合: 現在時刻から1時間前〜現在
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        setStartTime(formatDateTimeLocal(oneHourAgo.getTime()))
        setEndTime(formatDateTimeLocal(now.getTime()))
      }
    }
  }, [activity, defaultDate])

  // datetime-local形式に変換
  function formatDateTimeLocal(timestamp: number): string {
    const date = new Date(timestamp)
    return format(date, "yyyy-MM-dd'T'HH:mm")
  }

  // datetime-localからタイムスタンプに変換
  function parseDateTime(value: string): number {
    return new Date(value).getTime()
  }

  // 時間計算
  const duration = useMemo(() => {
    if (!startTime || !endTime) return null
    const start = parseDateTime(startTime)
    const end = parseDateTime(endTime)
    if (end <= start) return null
    const seconds = Math.floor((end - start) / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${minutes > 0 ? `${minutes}分` : ''}`
    }
    return `${minutes}分`
  }, [startTime, endTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // バリデーション
    if (!appName.trim()) {
      setError('アプリ名は必須です')
      return
    }
    if (!startTime || !endTime) {
      setError('開始時刻と終了時刻は必須です')
      return
    }

    const startTs = parseDateTime(startTime)
    const endTs = parseDateTime(endTime)

    if (endTs <= startTs) {
      setError('終了時刻は開始時刻より後にしてください')
      return
    }

    setIsSaving(true)
    try {
      if (isEdit && activity) {
        const input: UpdateActivityInput = {
          id: activity.id,
          appName: appName.trim(),
          windowTitle: windowTitle.trim() || undefined,
          startTime: startTs,
          endTime: endTs,
          categoryId,
          projectId,
          tagIds,
          isIdle,
          url: url.trim() || undefined,
        }
        await onSave(input)
      } else {
        const input: CreateActivityInput = {
          appName: appName.trim(),
          windowTitle: windowTitle.trim() || undefined,
          startTime: startTs,
          endTime: endTs,
          categoryId,
          projectId,
          tagIds,
          isIdle,
          url: url.trim() || undefined,
        }
        await onSave(input)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activity || !onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(activity.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // 1時間以上のアクティビティかどうか
  const isLongActivity = useMemo(() => {
    if (!activity) return false
    return activity.durationSeconds >= 3600
  }, [activity])

  const footerLeft = (
    <>
      {isEdit && onDelete && !showDeleteConfirm && (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-danger"
          disabled={isSaving || isDeleting}
        >
          削除
        </button>
      )}
      {showDeleteConfirm && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600">
            {isLongActivity ? '長時間のアクティビティです。' : ''}本当に削除しますか？
          </span>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除する'}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="btn btn-secondary btn-sm"
            disabled={isDeleting}
          >
            キャンセル
          </button>
        </div>
      )}
    </>
  )

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="btn btn-secondary"
        disabled={isSaving || isDeleting}
      >
        キャンセル
      </button>
      <button
        type="submit"
        form="activity-form"
        className="btn btn-primary"
        disabled={isSaving || isDeleting}
      >
        {isSaving ? '保存中...' : '保存'}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'アクティビティを編集' : 'アクティビティを追加'}
      size="lg"
      scrollable
      footer={footer}
      footerLeft={footerLeft}
    >
      <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* アプリ名 */}
        <div>
          <label className="label">
            アプリ名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="input"
            placeholder="例: Visual Studio Code"
            required
          />
        </div>

        {/* ウィンドウタイトル */}
        <div>
          <label className="label">ウィンドウタイトル</label>
          <input
            type="text"
            value={windowTitle}
            onChange={(e) => setWindowTitle(e.target.value)}
            className="input"
            placeholder="例: プロジェクト名 - ファイル名"
          />
        </div>

        {/* 開始・終了時刻 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              開始時刻 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">
              終了時刻 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        {/* 時間表示 */}
        {duration && (
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            時間: <span className="font-medium">{duration}</span>
          </div>
        )}

        {/* カテゴリ */}
        <div>
          <label className="label">カテゴリ</label>
          <select
            value={categoryId ?? ''}
            onChange={(e) =>
              setCategoryId(e.target.value ? parseInt(e.target.value) : null)
            }
            className="input"
          >
            <option value="">未分類</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* プロジェクト */}
        <div>
          <label className="label">プロジェクト</label>
          <select
            value={projectId ?? ''}
            onChange={(e) =>
              setProjectId(e.target.value ? parseInt(e.target.value) : null)
            }
            className="input"
          >
            <option value="">なし</option>
            {projects.filter(p => p.isActive).map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* タグ */}
        <div>
          <label className="label">タグ</label>
          <TagSelector
            tags={tags}
            selectedTagIds={tagIds}
            onChange={setTagIds}
            placeholder="タグを選択..."
          />
        </div>

        {/* アイドル */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isIdle}
            onChange={(e) => setIsIdle(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">アイドルとしてマーク</span>
        </label>

        {/* URL */}
        <div>
          <label className="label">URL (任意)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input"
            placeholder="https://..."
          />
        </div>
      </form>
    </Modal>
  )
}
