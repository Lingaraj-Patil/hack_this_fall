import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from '../Common/ThemeToggle'
import { useAuthStore } from '../../store/authStore'
import { Menu, X } from 'lucide-react'

	export default function Navbar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
	  const navigate = useNavigate()
	  const { user, logout } = useAuthStore()

	  const handleLogout = async () => {
	    try {
	      await logout()
	      navigate('/login')
	    } catch (err) {
	      console.error('logout error', err)
	    }
	  }

	  const linkClass = ({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'}`

	  return (
	    <nav className="w-full z-20">
	      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
	        <div className="flex items-center gap-6">
	          {/* Mobile hamburger */}
	          <button
	            onClick={() => setMobileOpen(!mobileOpen)}
	            className="md:hidden p-2 rounded-md text-white/90 hover:bg-white/5"
	            aria-label="Toggle menu"
	          >
	            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
	          </button>

	          <div className="text-white font-bold text-lg cursor-pointer" onClick={() => navigate('/')}>DeepDive</div>

	          {/* Desktop links */}
	          <div className="hidden md:flex items-center gap-2">
	            <NavLink to="/" className={linkClass}>Session</NavLink>
	            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
	            <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
	            <NavLink to="/clans" className={linkClass}>Clans</NavLink>
	            <NavLink to="/settings" className={linkClass}>Settings</NavLink>
	          </div>
	        </div>

	        <div className="flex items-center gap-3">
	          <ThemeToggle inline />
	          {/* Sidebar collapse on large screens */}
	          <button
	            className="hidden md:inline-flex items-center px-3 py-2 rounded-md text-sm bg-white/5 text-white"
	            onClick={() => setCollapsed?.(c => !c)}
	            title="Collapse sidebar"
	          >
	            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
	          </button>

	          {user ? (
	            <div className="flex items-center gap-3">
	              <div className="text-white text-sm">{user.name || user.email}</div>
	              <button onClick={handleLogout} className="px-3 py-2 rounded-md bg-red-600 text-white text-sm">Logout</button>
	            </div>
	          ) : (
	            <div className="flex items-center gap-2">
	              <NavLink to="/login" className="px-3 py-2 rounded-md text-sm text-white/80 hover:bg-white/5">Login</NavLink>
	              <NavLink to="/register" className="px-3 py-2 rounded-md text-sm bg-white/10 text-white">Sign up</NavLink>
	            </div>
	          )}
	        </div>
	      </div>
			</nav>
		)
	}
