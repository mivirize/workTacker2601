import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app-store'
import { logError } from '../utils/logger'
import { useModalState, useCRUDL } from '../hooks'
import type { AppSettings, Category, Goal, Tag, Project } from '../../shared/types'

// Extracted modal components
import GoalModal from '../components/goals/GoalModal'
import CategoryModal from '../components/categories/CategoryModal'
import ProjectModal from '../components/projects/ProjectModal'
import TagModal from '../components/tags/TagModal'
import TagList from '../components/tags/TagList'

export default function Settings() {
  const { settings, categories, tags, projects, fetchSettings, fetchCategories, fetchTags, fetchProjects } = useAppStore()
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newExcludedApp, setNewExcludedApp] = useState('')

  // Goals state (local because not in global store)
  const [goals, setGoals] = useState<Goal[]>([])
  const goalModal = useModalState<Goal>()

  // Modal states using hook
  const categoryModal = useModalState<Category>()
  const tagModal = useModalState<Tag>()
  const projectModal = useModalState<Project>()

  // Tag reapply state
  const [isReapplyingTags, setIsReapplyingTags] = useState(false)
  const [reapplyResult, setReapplyResult] = useState<{ processedCount: number; updatedCount: number } | null>(null)

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    try {
      const data = await window.api.goals.getAll()
      setGoals(data)
    } catch (error) {
      logError('Failed to load goals:', error)
    }
  }, [])

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // CRUDL handlers
  const categoryHandlers = useCRUDL<Category>(
    window.api.categories,
    fetchCategories,
    { entityName: 'カテゴリ', onSuccess: categoryModal.close }
  )

  const tagHandlers = useCRUDL<Tag>(
    window.api.tags,
    fetchTags,
    { entityName: 'タグ', onSuccess: tagModal.close }
  )

  const projectHandlers = useCRUDL<Project>(
    window.api.projects,
    fetchProjects,
    { entityName: 'プロジェクト', onSuccess: projectModal.close }
  )

  const goalHandlers = useCRUDL<Goal>(
    window.api.goals,
    fetchGoals,
    { entityName: '目標', onSuccess: goalModal.close }
  )

  // Settings handlers
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

  const handleToggleGoal = async (goal: Goal) => {
    try {
      await window.api.goals.update({ ...goal, isEnabled: !goal.isEnabled })
      await fetchGoals()
    } catch (error) {
      logError('Failed to toggle goal:', error)
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
      <TrackingSettingsPanel
        settings={localSettings}
        onChange={setLocalSettings}
      />

      {/* App Behavior */}
      <AppBehaviorPanel
        settings={localSettings}
        onChange={setLocalSettings}
      />

      {/* Excluded Apps */}
      <ExcludedAppsPanel
        excludedApps={localSettings.excludedApps}
        newApp={newExcludedApp}
        onNewAppChange={setNewExcludedApp}
        onAdd={handleAddExcludedApp}
        onRemove={handleRemoveExcludedApp}
      />

      {/* Goals */}
      <GoalsPanel
        goals={goals}
        categories={categories}
        onAdd={goalModal.openAdd}
        onEdit={goalModal.openEdit}
        onDelete={(id) => goalHandlers.handleDelete(id, 'この目標を削除しますか？')}
        onToggle={handleToggleGoal}
      />

      {/* Tags */}
      <TagsPanel
        tags={tags}
        onAdd={tagModal.openAdd}
        onEdit={tagModal.openEdit}
        onDelete={(id) => tagHandlers.handleDelete(id, 'このタグを削除しますか？')}
        isReapplying={isReapplyingTags}
        reapplyResult={reapplyResult}
        onReapply={handleReapplyTags}
      />

      {/* Projects */}
      <ProjectsPanel
        projects={projects}
        onAdd={projectModal.openAdd}
        onEdit={projectModal.openEdit}
        onDelete={(id) => projectHandlers.handleDelete(id, 'このプロジェクトを削除しますか？\n関連するアクティビティからプロジェクトの紐付けが解除されます。')}
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? (
            <>
              <LoadingSpinner />
              保存中...
            </>
          ) : (
            '設定を保存'
          )}
        </button>
      </div>

      {/* Categories */}
      <CategoriesPanel
        categories={categories}
        tags={tags}
        onAdd={categoryModal.openAdd}
        onEdit={categoryModal.openEdit}
        onDelete={(id) => categoryHandlers.handleDelete(id, 'このカテゴリを削除しますか？')}
      />

      {/* Modals */}
      {goalModal.isAdding && (
        <GoalModal
          categories={categories}
          onClose={goalModal.close}
          onSave={goalHandlers.handleCreate}
        />
      )}
      {goalModal.editingItem && (
        <GoalModal
          goal={goalModal.editingItem}
          categories={categories}
          onClose={goalModal.close}
          onSave={goalHandlers.handleUpdate}
        />
      )}

      {tagModal.isAdding && (
        <TagModal
          onClose={tagModal.close}
          onSave={tagHandlers.handleCreate}
        />
      )}
      {tagModal.editingItem && (
        <TagModal
          tag={tagModal.editingItem}
          onClose={tagModal.close}
          onSave={tagHandlers.handleUpdate}
        />
      )}

      {projectModal.isAdding && (
        <ProjectModal
          onClose={projectModal.close}
          onSave={projectHandlers.handleCreate}
        />
      )}
      {projectModal.editingItem && (
        <ProjectModal
          project={projectModal.editingItem}
          onClose={projectModal.close}
          onSave={projectHandlers.handleUpdate}
        />
      )}

      {categoryModal.isAdding && (
        <CategoryModal
          tags={tags}
          onClose={categoryModal.close}
          onSave={categoryHandlers.handleCreate}
        />
      )}
      {categoryModal.editingItem && (
        <CategoryModal
          category={categoryModal.editingItem}
          tags={tags}
          onClose={categoryModal.close}
          onSave={categoryHandlers.handleUpdate}
        />
      )}
    </div>
  )
}

// ============================================================
// Sub-components (could be extracted to separate files later)
// ============================================================

function LoadingSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

interface TrackingSettingsPanelProps {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

function TrackingSettingsPanel({ settings, onChange }: TrackingSettingsPanelProps) {
  return (
    <div className="card">
      <h2 className="card-title mb-4">トラッキング設定</h2>
      <div className="space-y-4">
        <div>
          <label className="label">トラッキング間隔</label>
          <select
            value={settings.trackingIntervalMs}
            onChange={(e) => onChange({ ...settings, trackingIntervalMs: parseInt(e.target.value) })}
            className="input"
          >
            <option value={1000}>1秒</option>
            <option value={3000}>3秒</option>
            <option value={5000}>5秒</option>
            <option value={10000}>10秒</option>
            <option value={30000}>30秒</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">アクティブウィンドウをチェックする間隔</p>
        </div>

        <div>
          <label className="label">アイドル判定時間</label>
          <select
            value={settings.idleThresholdMs}
            onChange={(e) => onChange({ ...settings, idleThresholdMs: parseInt(e.target.value) })}
            className="input"
          >
            <option value={60000}>1分</option>
            <option value={120000}>2分</option>
            <option value={180000}>3分</option>
            <option value={300000}>5分</option>
            <option value={600000}>10分</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">この時間操作がないとアイドルと判定</p>
        </div>

        <div>
          <label className="label">データ保持期間</label>
          <select
            value={settings.dataRetentionDays}
            onChange={(e) => onChange({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
            className="input"
          >
            <option value={30}>30日</option>
            <option value={60}>60日</option>
            <option value={90}>90日</option>
            <option value={180}>180日</option>
            <option value={365}>1年</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">これより古いデータは自動削除されます</p>
        </div>
      </div>
    </div>
  )
}

interface AppBehaviorPanelProps {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

function AppBehaviorPanel({ settings, onChange }: AppBehaviorPanelProps) {
  return (
    <div className="card">
      <h2 className="card-title mb-4">アプリケーション動作</h2>
      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.launchOnStartup}
            onChange={(e) => onChange({ ...settings, launchOnStartup: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">システム起動時に自動開始</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.minimizeToTray}
            onChange={(e) => onChange({ ...settings, minimizeToTray: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">閉じるとトレイに最小化</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.showNotifications}
            onChange={(e) => onChange({ ...settings, showNotifications: e.target.checked })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">通知を表示</span>
        </label>
      </div>
    </div>
  )
}

interface ExcludedAppsPanelProps {
  excludedApps: string[]
  newApp: string
  onNewAppChange: (value: string) => void
  onAdd: () => void
  onRemove: (app: string) => void
}

function ExcludedAppsPanel({ excludedApps, newApp, onNewAppChange, onAdd, onRemove }: ExcludedAppsPanelProps) {
  return (
    <div className="card">
      <h2 className="card-title mb-4">除外アプリ</h2>
      <p className="text-sm text-gray-500 mb-4">これらのアプリはトラッキングから除外されます</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newApp}
          onChange={(e) => onNewAppChange(e.target.value)}
          placeholder="アプリ名を入力"
          className="input flex-1"
          onKeyPress={(e) => e.key === 'Enter' && onAdd()}
        />
        <button onClick={onAdd} className="btn btn-secondary">追加</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {excludedApps.map((app) => (
          <span key={app} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
            {app}
            <button onClick={() => onRemove(app)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        {excludedApps.length === 0 && <span className="text-gray-400">除外アプリはありません</span>}
      </div>
    </div>
  )
}

interface GoalsPanelProps {
  goals: Goal[]
  categories: Category[]
  onAdd: () => void
  onEdit: (goal: Goal) => void
  onDelete: (id: number) => void
  onToggle: (goal: Goal) => void
}

function GoalsPanel({ goals, categories, onAdd, onEdit, onDelete, onToggle }: GoalsPanelProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="card-title">目標設定</h2>
          <p className="text-sm text-gray-500 mt-1">日々の作業目標を設定して進捗を追跡</p>
        </div>
        <button onClick={onAdd} className="btn btn-sm btn-secondary">
          <PlusIcon /> 新規目標
        </button>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const category = goal.categoryId ? categories.find(c => c.id === goal.categoryId) : null
          return (
            <div key={goal.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${goal.isEnabled ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
              <input
                type="checkbox"
                checked={goal.isEnabled}
                onChange={() => onToggle(goal)}
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
              <EditButton onClick={() => onEdit(goal)} />
              <DeleteButton onClick={() => onDelete(goal.id)} />
            </div>
          )
        })}
        {goals.length === 0 && <p className="text-gray-400 text-center py-4">目標が設定されていません</p>}
      </div>
    </div>
  )
}

interface TagsPanelProps {
  tags: Tag[]
  onAdd: () => void
  onEdit: (tag: Tag) => void
  onDelete: (id: number) => void
  isReapplying: boolean
  reapplyResult: { processedCount: number; updatedCount: number } | null
  onReapply: () => void
}

function TagsPanel({ tags, onAdd, onEdit, onDelete, isReapplying, reapplyResult, onReapply }: TagsPanelProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="card-title">タグ管理</h2>
          <p className="text-sm text-gray-500 mt-1">アクティビティに複数付けられるタグを管理</p>
        </div>
        <button onClick={onAdd} className="btn btn-sm btn-secondary">
          <PlusIcon /> 新規タグ
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="font-medium text-gray-900">{tag.name}</span>
            <button onClick={() => onEdit(tag)} className="text-gray-400 hover:text-primary-600 ml-1" title="編集">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(tag.id)} className="text-gray-400 hover:text-red-500" title="削除">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-gray-400 py-4">タグが設定されていません</p>}
      </div>

      {/* Reapply Tags Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">過去のアクティビティにタグを再適用</h3>
            <p className="text-sm text-gray-500 mt-1">カテゴリやルールのタグ設定を変更した後、過去のアクティビティに新しいタグルールを適用します</p>
          </div>
          <button onClick={onReapply} disabled={isReapplying} className="btn btn-sm btn-secondary whitespace-nowrap">
            {isReapplying ? (
              <><LoadingSpinner /> 処理中...</>
            ) : (
              <><RefreshIcon /> 再適用</>
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
  )
}

interface ProjectsPanelProps {
  projects: Project[]
  onAdd: () => void
  onEdit: (project: Project) => void
  onDelete: (id: number) => void
}

function ProjectsPanel({ projects, onAdd, onEdit, onDelete }: ProjectsPanelProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="card-title">プロジェクト管理</h2>
          <p className="text-sm text-gray-500 mt-1">アクティビティをプロジェクト単位でグルーピング</p>
        </div>
        <button onClick={onAdd} className="btn btn-sm btn-secondary">
          <PlusIcon /> 新規プロジェクト
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${project.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }} />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{project.name}</span>
              {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
            </div>
            {!project.isActive && <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">非アクティブ</span>}
            <EditButton onClick={() => onEdit(project)} />
            <DeleteButton onClick={() => onDelete(project.id)} />
          </div>
        ))}
        {projects.length === 0 && <p className="text-gray-400 text-center py-4">プロジェクトが設定されていません</p>}
      </div>
    </div>
  )
}

interface CategoriesPanelProps {
  categories: Category[]
  tags: Tag[]
  onAdd: () => void
  onEdit: (category: Category) => void
  onDelete: (id: number) => void
}

function CategoriesPanel({ categories, tags, onAdd, onEdit, onDelete }: CategoriesPanelProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title">カテゴリ管理</h2>
        <button onClick={onAdd} className="btn btn-sm btn-secondary">
          <PlusIcon /> 新規カテゴリ
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const categoryTags = tags.filter(t => category.tagIds?.includes(t.id))
          return (
            <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }} />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{category.name}</span>
                {categoryTags.length > 0 && (
                  <div className="mt-1">
                    <TagList tags={categoryTags} maxDisplay={3} size="sm" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">{category.rules.length} ルール</span>
              <EditButton onClick={() => onEdit(category)} />
              {!category.isDefault && <DeleteButton onClick={() => onDelete(category.id)} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Shared icon components
function PlusIcon() {
  return (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-400 hover:text-primary-600" title="編集">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-400 hover:text-red-500" title="削除">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
