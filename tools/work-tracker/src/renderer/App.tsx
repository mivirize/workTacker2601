import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/common/Layout'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
