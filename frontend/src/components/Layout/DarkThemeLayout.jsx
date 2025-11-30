import { Link, useNavigate } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function DarkThemeLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url("/backgrounds/forest.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Navigation Bar */}
      <nav className="relative z-10 px-8 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-display font-bold text-white drop-shadow-lg">
            DeepDive
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white/80 hover:text-white transition text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/leaderboard" className="text-white/80 hover:text-white transition text-sm font-medium">
              Leaderboard
            </Link>
            <Link to="/clans" className="text-white/80 hover:text-white transition text-sm font-medium">
              Clans
            </Link>
            <Link to="/settings" className="text-white/80 hover:text-white transition text-sm font-medium">
              Settings
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-white/80 text-sm">
              {user.username}
            </div>
          )}
          <Link to="/settings" className="p-2 rounded-full hover:bg-white/10 transition text-white">
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="p-2 rounded-full hover:bg-white/10 transition text-white"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Page Header */}
      {title && (
        <header className="relative z-10 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">{title}</h1>
            {subtitle && (
              <p className="text-white/80 mt-2">{subtitle}</p>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

