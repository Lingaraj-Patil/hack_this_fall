import { NavLink } from 'react-router-dom'
import { Home, Monitor, Award, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar({ collapsed = false, onCollapseToggle, mobile = false, onClose }) {
	const linkClass = ({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'}`

	return (
		<aside className={`bg-[var(--panel-bg)] text-white ${mobile ? 'fixed inset-y-0 left-0 w-64 z-40' : 'hidden md:block'} ${collapsed ? 'md:w-20' : 'md:w-64'}`}>
			<div className="h-full flex flex-col justify-between">
				<div className="p-4 space-y-2">
					<nav className="flex flex-col gap-1">
						<NavLink to="/" className={linkClass} onClick={() => mobile && onClose?.()}>
							<Home className="w-5 h-5" />
							{!collapsed && <span>Session</span>}
						</NavLink>
						<NavLink to="/dashboard" className={linkClass} onClick={() => mobile && onClose?.()}>
							<Monitor className="w-5 h-5" />
							{!collapsed && <span>Dashboard</span>}
						</NavLink>
						<NavLink to="/leaderboard" className={linkClass} onClick={() => mobile && onClose?.()}>
							<Award className="w-5 h-5" />
							{!collapsed && <span>Leaderboard</span>}
						</NavLink>
						<NavLink to="/clans" className={linkClass} onClick={() => mobile && onClose?.()}>
							<Users className="w-5 h-5" />
							{!collapsed && <span>Clans</span>}
						</NavLink>
						<NavLink to="/settings" className={linkClass} onClick={() => mobile && onClose?.()}>
							<Settings className="w-5 h-5" />
							{!collapsed && <span>Settings</span>}
						</NavLink>
					</nav>
				</div>

				<div className="p-3 border-t border-white/6 flex items-center justify-between">
					{!mobile && (
						<button onClick={() => onCollapseToggle?.()} className="px-2 py-1 rounded-md bg-white/5 text-white flex items-center gap-2">
							{collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
							{!collapsed && <span className="text-sm">Collapse</span>}
						</button>
					)}
					{mobile && (
						<button onClick={() => onClose?.()} className="px-2 py-1 rounded-md bg-white/5 text-white">Close</button>
					)}
				</div>
			</div>
		</aside>
	)
}
