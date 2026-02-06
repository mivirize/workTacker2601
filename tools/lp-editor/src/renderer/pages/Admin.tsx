/**
 * Admin Page
 *
 * The main admin dashboard for managing LP projects.
 */

import { useEffect, useMemo } from 'react'
import { useAdminStore } from '../stores/admin-store'
import { ProjectList } from '../components/admin/ProjectList'
import { ProjectStats } from '../components/admin/ProjectStats'

export function AdminPage() {
  const {
    projects,
    selectedProjectId,
    selectedProjectStats,
    openInEditor,
    initializeAdmin,
  } = useAdminStore()

  // Load saved projects directory on mount
  useEffect(() => {
    initializeAdmin()
  }, [initializeAdmin])

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const handleOpenProject = () => {
    if (selectedProjectId) {
      openInEditor(selectedProjectId)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">LP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">LP-Editor Admin</h1>
              <p className="text-sm text-gray-500">プロジェクト管理ダッシュボード</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">{projects.length}</p>
              <p className="text-xs text-gray-500">プロジェクト</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Project List */}
        <div className="flex-1 overflow-hidden">
          <ProjectList />
        </div>

        {/* Project Details Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-hidden">
          <ProjectStats
            stats={selectedProjectStats}
            projectName={selectedProject?.name}
            projectPath={selectedProject?.path}
            onOpenProject={handleOpenProject}
          />
        </div>
      </main>
    </div>
  )
}
