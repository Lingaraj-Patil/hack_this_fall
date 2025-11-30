import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useSocket } from './hooks/useSocket'
import ThemeToggle from './components/Common/ThemeToggle'
import ThemeProvider from './context/ThemeContext'

// Pages
import SessionPage from './pages/SessionPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashBoard'
import LeaderboardPage from './pages/Leaderboard'
import ClanPage from './pages/ClanPage'
import SettingsPage from './pages/SettingsPage'

// Protected Route
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  // Initialize socket connection
  useSocket()

  return (
    <ThemeProvider>
      <BrowserRouter>
  <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clans"
          element={
            <ProtectedRoute>
              <ClanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
