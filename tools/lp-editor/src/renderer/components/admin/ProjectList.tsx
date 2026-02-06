/**
 * Project List Component
 *
 * Displays the list of LP projects with search and sort functionality.
 */

import { useAdminStore, useFilteredProjects } from '../../stores/admin-store'
import { ProjectCard } from './ProjectCard'

export function ProjectList() {
  const {
    projectsDir,
    selectedProjectId,
    isLoading,
    error,
    searchQuery,
    sortBy,
    sortOrder,
    setSelectedProject,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    loadProjects,
    loadProjectStats,
    openInEditor,
  } = useAdminStore()

  const filteredProjects = useFilteredProjects()

  const handleSelectProject = async (projectId: string, projectPath: string) => {
    setSelectedProject(projectId)
    await loadProjectStats(projectPath)
  }

  const handleOpenProject = (projectId: string) => {
    openInEditor(projectId)
  }

  const handleRefresh = () => {
    if (projectsDir) {
      loadProjects(projectsDir)
    }
  }

  const handleSelectFolder = async () => {
    const dir = await window.electronAPI.selectProjectsDir()
    if (dir) {
      loadProjects(dir)
    }
  }

  // Toggle sort order when clicking same column
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">プロジェクト一覧</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="更新"
            >
              <svg
                className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
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
            </button>
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              フォルダ選択
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="プロジェクト名、クライアント名で検索..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">並び替え:</span>
          <div className="flex gap-1">
            {[
              { key: 'lastModified' as const, label: '更新日' },
              { key: 'name' as const, label: '名前' },
              { key: 'client' as const, label: 'クライアント' },
              { key: 'buildCount' as const, label: 'ビルド数' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleSort(option.key)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  sortBy === option.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
                {sortBy === option.key && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Path */}
        {projectsDir && (
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 truncate font-mono" title={projectsDir}>
              📁 {projectsDir}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !projectsDir && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg
              className="w-20 h-20 mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">プロジェクトフォルダを選択</p>
            <p className="text-sm text-center mb-4">
              LPプロジェクトが格納されているフォルダを選択してください
            </p>
            <button
              onClick={handleSelectFolder}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              フォルダを選択
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && projectsDir && filteredProjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">プロジェクトが見つかりません</p>
            <p className="text-sm">
              {searchQuery
                ? '検索条件に一致するプロジェクトがありません'
                : 'このフォルダにLPプロジェクトがありません'}
            </p>
          </div>
        )}

        {/* Project Grid */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                {...project}
                isSelected={selectedProjectId === project.id}
                onSelect={() => handleSelectProject(project.id, project.path)}
                onOpen={() => handleOpenProject(project.id)}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {filteredProjects.length} 件のプロジェクト
          </div>
        )}
      </div>
    </div>
  )
}
