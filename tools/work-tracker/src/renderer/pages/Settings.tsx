import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import { logError } from '../utils/logger'
import type { AppSettings, Category, CategoryRule, Goal, GoalType, Tag, Project } from '../../shared/types'
import TagModal from '../components/tags/TagModal'
import TagSelector from '../components/tags/TagSelector'
import TagList from '../components/tags/TagList'

export default function Settings() {
  const { settings, categories, tags, projects, fetchSettings, fetchCategories, fetchTags, fetchProjects } = useAppStore()
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newExcludedApp, setNewExcludedApp] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Goal states
  const [goals, setGoals] = useState<Goal[]>([])
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  // Tag states
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isReapplyingTags, setIsReapplyingTags] = useState(false)
  const [reapplyResult, setReapplyResult] = useState<{ processedCount: number; updatedCount: number } | null>(null)

  // Project states
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  // Fetch goals on mount
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const data = await window.api.goals.getAll()
        setGoals(data)
      } catch (error) {
        logError('Failed to load goals:', error)
      }
    }
    loadGoals()
  }, [])

  const handleSaveSettings = async () => {
    if (!localSettings) return
    setIsSaving(true)
    try {
      await window.api.settings.update(localSettings)
      await fetchSettings()
    } catch (error) {
      logError('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddExcludedApp = () => {
    if (!newExcludedApp.trim() || !localSettings) return
    setLocalSettings({
      ...localSettings,
      excludedApps: [...localSettings.excludedApps, newExcludedApp.trim()],
    })
    setNewExcludedApp('')
  }

  const handleRemoveExcludedApp = (app: string) => {
    if (!localSettings) return
    setLocalSettings({
      ...localSettings,
      excludedApps: localSettings.excludedApps.filter((a) => a !== app),
    })
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('このカテゴリを削除しますか？')) return
    try {
      await window.api.categories.delete(categoryId)
      await fetchCategories()
    } catch (error) {
      logError('Failed to delete category:', error)
    }
  }

  const handleCreateCategory = async (category: Omit<Category, 'id'>) => {
    try {
      await window.api.categories.create(category)
      await fetchCategories()
      setIsAddingCategory(false)
    } catch (error) {
      logError('Failed to create category:', error)
    }
  }

  const handleSaveCategory = async (category: Category) => {
    try {
      await window.api.categories.update(category)
      await fetchCategories()
      setEditingCategory(null)
    } catch (error) {
      logError('Failed to save category:', error)
    }
  }

  // Goal handlers
  const handleCreateGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      await window.api.goals.create(goal)
      const data = await window.api.goals.getAll()
      setGoals(data)
      setIsAddingGoal(false)
    } catch (error) {
      logError('Failed to create goal:', error)
    }
  }

  const handleUpdateGoal = async (goal: Goal) => {
    try {
      await window.api.goals.update(goal)
      const data = await window.api.goals.getAll()
      setGoals(data)
      setEditingGoal(null)
    } catch (error) {
      logError('Failed to update goal:', error)
    }
  }

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('この目標を削除しますか？')) return
    try {
      await window.api.goals.delete(goalId)
      const data = await window.api.goals.getAll()
      setGoals(data)
    } catch (error) {
      logError('Failed to delete goal:', error)
    }
  }

  const handleToggleGoal = async (goal: Goal) => {
    try {
      await window.api.goals.update({ ...goal, isEnabled: !goal.isEnabled })
      const data = await window.api.goals.getAll()
      setGoals(data)
    } catch (error) {
      logError('Failed to toggle goal:', error)
    }
  }

  // Tag handlers
  const handleCreateTag = async (tag: Omit<Tag, 'id'>) => {
    try {
      await window.api.tags.create(tag)
      await fetchTags()
      setIsAddingTag(false)
    } catch (error) {
      logError('Failed to create tag:', error)
      throw error
    }
  }

  const handleUpdateTag = async (tag: Tag) => {
    try {
      await window.api.tags.update(tag)
      await fetchTags()
      setEditingTag(null)
    } catch (error) {
      logError('Failed to update tag:', error)
      throw error
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('このタグを削除しますか？')) return
    try {
      await window.api.tags.delete(tagId)
      await fetchTags()
    } catch (error) {
      logError('Failed to delete tag:', error)
    }
  }

  const handleReapplyTags = async () => {
    if (!confirm('過去のすべてのアクティビティにタグルールを再適用しますか？\nこの処理には時間がかかる場合があります。')) return
    setIsReapplyingTags(true)
    setReapplyResult(null)
    try {
      const result = await window.api.tags.reapplyToAll()
      setReapplyResult(result)
    } catch (error) {
      logError('Failed to reapply tags:', error)
    } finally {
      setIsReapplyingTags(false)
    }
  }

  // Project handlers
  const handleCreateProject = async (project: Omit<Project, 'id'>) => {
    try {
      await window.api.projects.create(project)
      await fetchProjects()
      setIsAddingProject(false)
    } catch (error) {
      logError('Failed to create project:', error)
      throw error
    }
  }

  const handleUpdateProject = async (project: Project) => {
    try {
      await window.api.projects.update(project)
      await fetchProjects()
      setEditingProject(null)
    } catch (error) {
      logError('Failed to update project:', error)
      throw error
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('このプロジェクトを削除しますか？\n関連するアクティビティからプロジェクトの紐付けが解除されます。')) return
    try {
      await window.api.projects.delete(projectId)
      await fetchProjects()
    } catch (error) {
      logError('Failed to delete project:', error)
    }
  }

  if (!localSettings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-500 mt-1">アプリケーションの動作を設定</p>
      </div>

      {/* Tracking Settings */}
      <div className="card">
        <h2 className="card-title mb-4">トラッキング設定</h2>
        <div className="space-y-4">
          <div>
            <label className="label">トラッキング間隔</label>
            <select
              value={localSettings.trackingIntervalMs}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  trackingIntervalMs: parseInt(e.target.value),
                })
              }
              className="input"
            >
              <option value={1000}>1秒</option>
              <option value={3000}>3秒</option>
              <option value={5000}>5秒</option>
              <option value={10000}>10秒</option>
              <option value={30000}>30秒</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              アクティブウィンドウをチェックする間隔
            </p>
          </div>

          <div>
            <label className="label">アイドル判定時間</label>
            <select
              value={localSettings.idleThresholdMs}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  idleThresholdMs: parseInt(e.target.value),
                })
              }
              className="input"
            >
              <option value={60000}>1分</option>
              <option value={120000}>2分</option>
              <option value={180000}>3分</option>
              <option value={300000}>5分</option>
              <option value={600000}>10分</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              この時間操作がないとアイドルと判定
            </p>
          </div>

          <div>
            <label className="label">データ保持期間</label>
            <select
              value={localSettings.dataRetentionDays}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  dataRetentionDays: parseInt(e.target.value),
                })
              }
              className="input"
            >
              <option value={30}>30日</option>
              <option value={60}>60日</option>
              <option value={90}>90日</option>
              <option value={180}>180日</option>
              <option value={365}>1年</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              これより古いデータは自動削除されます
            </p>
          </div>
        </div>
      </div>

      {/* App Behavior */}
      <div className="card">
        <h2 className="card-title mb-4">アプリケーション動作</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localSettings.launchOnStartup}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  launchOnStartup: e.target.checked,
                })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">システム起動時に自動開始</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localSettings.minimizeToTray}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  minimizeToTray: e.target.checked,
                })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">閉じるとトレイに最小化</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localSettings.showNotifications}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  showNotifications: e.target.checked,
                })
              }
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">通知を表示</span>
          </label>
        </div>
      </div>

      {/* Excluded Apps */}
      <div className="card">
        <h2 className="card-title mb-4">除外アプリ</h2>
        <p className="text-sm text-gray-500 mb-4">
          これらのアプリはトラッキングから除外されます
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newExcludedApp}
            onChange={(e) => setNewExcludedApp(e.target.value)}
            placeholder="アプリ名を入力"
            className="input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleAddExcludedApp()}
          />
          <button onClick={handleAddExcludedApp} className="btn btn-secondary">
            追加
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {localSettings.excludedApps.map((app) => (
            <span
              key={app}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              {app}
              <button
                onClick={() => handleRemoveExcludedApp(app)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          {localSettings.excludedApps.length === 0 && (
            <span className="text-gray-400">除外アプリはありません</span>
          )}
        </div>
      </div>

      {/* Goals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title">目標設定</h2>
            <p className="text-sm text-gray-500 mt-1">
              日々の作業目標を設定して進捗を追跡
            </p>
          </div>
          <button
            onClick={() => setIsAddingGoal(true)}
            className="btn btn-sm btn-secondary"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規目標
          </button>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => {
            const category = goal.categoryId
              ? categories.find(c => c.id === goal.categoryId)
              : null
            return (
              <div
                key={goal.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  goal.isEnabled ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={goal.isEnabled}
                  onChange={() => handleToggleGoal(goal)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {goal.type === 'daily' && '1日の目標'}
                    {goal.type === 'weekly' && '週間目標'}
                    {goal.type === 'category' && `${category?.name ?? 'カテゴリ'}の目標`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {Math.floor(goal.targetMinutes / 60)}時間{goal.targetMinutes % 60 > 0 ? `${goal.targetMinutes % 60}分` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="text-gray-400 hover:text-primary-600"
                  title="編集"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="削除"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            )
          })}
          {goals.length === 0 && (
            <p className="text-gray-400 text-center py-4">
              目標が設定されていません
            </p>
          )}
        </div>
      </div>

      {/* Goal Modals */}
      {isAddingGoal && (
        <GoalModal
          categories={categories}
          onClose={() => setIsAddingGoal(false)}
          onSave={handleCreateGoal}
        />
      )}
      {editingGoal && (
        <GoalModal
          goal={editingGoal}
          categories={categories}
          onClose={() => setEditingGoal(null)}
          onSave={handleUpdateGoal}
        />
      )}

      {/* Tags */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title">タグ管理</h2>
            <p className="text-sm text-gray-500 mt-1">
              アクティビティに複数付けられるタグを管理
            </p>
          </div>
          <button
            onClick={() => setIsAddingTag(true)}
            className="btn btn-sm btn-secondary"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規タグ
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium text-gray-900">{tag.name}</span>
              <button
                onClick={() => setEditingTag(tag)}
                className="text-gray-400 hover:text-primary-600 ml-1"
                title="編集"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="text-gray-400 hover:text-red-500"
                title="削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-gray-400 py-4">
              タグが設定されていません
            </p>
          )}
        </div>

        {/* Reapply Tags Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">過去のアクティビティにタグを再適用</h3>
              <p className="text-sm text-gray-500 mt-1">
                カテゴリやルールのタグ設定を変更した後、過去のアクティビティに新しいタグルールを適用します
              </p>
            </div>
            <button
              onClick={handleReapplyTags}
              disabled={isReapplyingTags}
              className="btn btn-sm btn-secondary whitespace-nowrap"
            >
              {isReapplyingTags ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  処理中...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  再適用
                </>
              )}
            </button>
          </div>
          {reapplyResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                完了: {reapplyResult.processedCount}件のアクティビティを処理し、{reapplyResult.updatedCount}件を更新しました
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tag Modals */}
      {isAddingTag && (
        <TagModal
          onClose={() => setIsAddingTag(false)}
          onSave={handleCreateTag}
        />
      )}
      {editingTag && (
        <TagModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSave={handleUpdateTag}
        />
      )}

      {/* Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title">プロジェクト管理</h2>
            <p className="text-sm text-gray-500 mt-1">
              アクティビティをプロジェクト単位でグルーピング
            </p>
          </div>
          <button
            onClick={() => setIsAddingProject(true)}
            className="btn btn-sm btn-secondary"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規プロジェクト
          </button>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                project.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: project.color }}
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{project.name}</span>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
                )}
              </div>
              {!project.isActive && (
                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                  非アクティブ
                </span>
              )}
              <button
                onClick={() => setEditingProject(project)}
                className="text-gray-400 hover:text-primary-600"
                title="編集"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="text-gray-400 hover:text-red-500"
                title="削除"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-gray-400 text-center py-4">
              プロジェクトが設定されていません
            </p>
          )}
        </div>
      </div>

      {/* Project Modals */}
      {isAddingProject && (
        <ProjectModal
          onClose={() => setIsAddingProject(false)}
          onSave={handleCreateProject}
        />
      )}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleUpdateProject}
        />
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              保存中...
            </>
          ) : (
            '設定を保存'
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">カテゴリ管理</h2>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="btn btn-sm btn-secondary"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規カテゴリ
          </button>
        </div>

        <div className="space-y-3">
          {categories.map((category) => {
            const categoryTags = tags.filter(t => category.tagIds?.includes(t.id))
            return (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">
                  {category.name}
                </span>
                {categoryTags.length > 0 && (
                  <div className="mt-1">
                    <TagList tags={categoryTags} maxDisplay={3} size="sm" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {category.rules.length} ルール
              </span>
              <button
                onClick={() => setEditingCategory(category)}
                className="text-gray-400 hover:text-primary-600"
                title="編集"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              {!category.isDefault && (
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="削除"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          )})}
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddingCategory && (
        <CategoryModal
          tags={tags}
          onClose={() => setIsAddingCategory(false)}
          onSave={handleCreateCategory}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          tags={tags}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  )
}

interface CategoryModalProps {
  category?: Category
  tags: Tag[]
  onClose: () => void
  onSave: (category: Omit<Category, 'id'> | Category) => void
}

// Goal Modal Component
interface GoalModalProps {
  goal?: Goal
  categories: Category[]
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id'> | Goal) => void
}

function GoalModal({ goal, categories, onClose, onSave }: GoalModalProps) {
  const [type, setType] = useState<GoalType>(goal?.type ?? 'daily')
  const [hours, setHours] = useState(Math.floor((goal?.targetMinutes ?? 480) / 60))
  const [minutes, setMinutes] = useState((goal?.targetMinutes ?? 0) % 60)
  const [categoryId, setCategoryId] = useState<number | null>(goal?.categoryId ?? null)
  const [isEnabled, setIsEnabled] = useState(goal?.isEnabled ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetMinutes = hours * 60 + minutes
    if (targetMinutes <= 0) return

    const goalData = {
      type,
      targetMinutes,
      categoryId: type === 'category' ? categoryId : null,
      isEnabled,
    }

    if (goal) {
      onSave({ ...goalData, id: goal.id })
    } else {
      onSave(goalData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {goal ? '目標を編集' : '新規目標'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="label">目標タイプ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GoalType)}
                className="input"
              >
                <option value="daily">1日の作業目標</option>
                <option value="weekly">週間の作業目標</option>
                <option value="category">カテゴリ別目標</option>
              </select>
            </div>

            {type === 'category' && (
              <div>
                <label className="label">対象カテゴリ</label>
                <select
                  value={categoryId ?? ''}
                  onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  className="input"
                  required
                >
                  <option value="">選択してください</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">目標時間</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input w-20 text-center"
                  min="0"
                  max="24"
                />
                <span className="text-gray-600">時間</span>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="input w-20 text-center"
                  min="0"
                  max="59"
                />
                <span className="text-gray-600">分</span>
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700">この目標を有効にする</span>
            </label>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CategoryModal({ category, tags, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? '#3b82f6')
  const [rules, setRules] = useState<CategoryRule[]>(category?.rules ?? [])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(category?.tagIds ?? [])

  const handleAddRule = () => {
    setRules([...rules, { type: 'app', pattern: '', isRegex: false }])
  }

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleRuleChange = (
    index: number,
    field: keyof CategoryRule,
    value: string | boolean | number[]
  ) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], [field]: value }
    setRules(newRules)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const categoryData = {
      name: name.trim(),
      color,
      rules: rules.filter((r) => r.pattern.trim()),
      isDefault: category?.isDefault ?? false,
      tagIds: selectedTagIds,
    }

    if (category) {
      onSave({ ...categoryData, id: category.id })
    } else {
      onSave(categoryData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {category ? 'カテゴリを編集' : '新規カテゴリ'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="label">カテゴリ名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="例: 開発"
                required
              />
            </div>

            <div>
              <label className="label">色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="input flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <label className="label">デフォルトタグ</label>
              <p className="text-sm text-gray-500 mb-2">
                このカテゴリのアクティビティに自動で付与されるタグ
              </p>
              <TagSelector
                tags={tags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
                placeholder="タグを選択..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">マッチングルール</label>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  + ルールを追加
                </button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={rule.type}
                        onChange={(e) =>
                          handleRuleChange(
                            index,
                            'type',
                            e.target.value as CategoryRule['type']
                          )
                        }
                        className="input w-24"
                      >
                        <option value="app">アプリ</option>
                        <option value="title">タイトル</option>
                        <option value="url">URL</option>
                      </select>
                      <input
                        type="text"
                        value={rule.pattern}
                        onChange={(e) =>
                          handleRuleChange(index, 'pattern', e.target.value)
                        }
                        className="input flex-1"
                        placeholder="パターン"
                      />
                      <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={rule.isRegex}
                          onChange={(e) =>
                            handleRuleChange(index, 'isRegex', e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        正規表現
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">ルール専用タグ（任意）</label>
                      <TagSelector
                        tags={tags}
                        selectedTagIds={rule.tagIds ?? []}
                        onChange={(tagIds) => handleRuleChange(index, 'tagIds', tagIds)}
                        placeholder="このルール専用のタグ..."
                      />
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">
                    ルールがありません
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Project Modal Component
interface ProjectModalProps {
  project?: Project
  onClose: () => void
  onSave: (project: Omit<Project, 'id'> | Project) => void
}

function ProjectModal({ project, onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? '#6366f1')
  const [description, setDescription] = useState(project?.description ?? '')
  const [isActive, setIsActive] = useState(project?.isActive ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const projectData = {
      name: name.trim(),
      color,
      description: description.trim() || undefined,
      isActive,
    }

    if (project) {
      onSave({ ...projectData, id: project.id })
    } else {
      onSave(projectData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {project ? 'プロジェクトを編集' : '新規プロジェクト'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="label">プロジェクト名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="例: Webアプリ開発"
                required
              />
            </div>

            <div>
              <label className="label">色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="input flex-1"
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div>
              <label className="label">説明（任意）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder="プロジェクトの説明..."
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700">アクティブなプロジェクト</span>
            </label>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
