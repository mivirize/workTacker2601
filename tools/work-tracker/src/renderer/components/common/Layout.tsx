import { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '../../stores/app-store'
import { useInterval } from '../../hooks/useInterval'
import { log } from '../../utils/logger'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const {
    fetchTrackingState,
    fetchDailySummary,
    fetchCategories,
    fetchTags,
    fetchProjects,
    fetchSettings,
  } = useAppStore()

  // Initial data fetch
  useEffect(() => {
    log('[Layout] Initial data fetch')
    fetchTrackingState()
    fetchDailySummary()
    fetchCategories()
    fetchTags()
    fetchProjects()
    fetchSettings()
  }, [fetchTrackingState, fetchDailySummary, fetchCategories, fetchTags, fetchProjects, fetchSettings])

  // Periodic refresh
  useInterval(() => {
    log('[Layout] Periodic refresh')
    fetchTrackingState()
    fetchDailySummary()
  }, 10000) // Every 10 seconds

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
