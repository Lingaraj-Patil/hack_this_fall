import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
	const [collapsed, setCollapsed] = useState(false)
	const [mobileOpen, setMobileOpen] = useState(false)

	return (
		<div className="min-h-screen bg-[var(--panel-bg)] relative">
			<Navbar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

			{/* Mobile overlay sidebar */}
			{mobileOpen && (
				<div className="fixed inset-0 z-30">
					<div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
					<Sidebar mobile={true} onClose={() => setMobileOpen(false)} />
				</div>
			)}

			<div className="flex">
				{/* Desktop sidebar */}
				<div className={`${collapsed ? 'w-20' : 'w-64'} hidden md:block transition-all duration-200`}> 
					<Sidebar collapsed={collapsed} onCollapseToggle={() => setCollapsed(c => !c)} />
				</div>

				{/* Page content */}
				<main className={`flex-1 pt-4 ${collapsed ? 'md:pl-20' : 'md:pl-64'}`}>
					{children}
				</main>
			</div>
		</div>
	)
}
