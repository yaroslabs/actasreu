import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import NewMeetingPage from './pages/NewMeetingPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import HistoryPage from './pages/HistoryPage'
import Loading from './components/ui/Loading'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading fullScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="meetings/new" element={<NewMeetingPage />} />
        <Route path="meetings/:id" element={<MeetingDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>
    </Routes>
  )
}
