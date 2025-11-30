// ========== src/pages/SettingsPage.jsx (COMPLETE) ==========
import { useState, useEffect } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save,
  Trash2,
  Plus,
  X,
  LogOut
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { authAPI } from '../api/auth'
import DarkThemeLayout from '../components/Layout/DarkThemeLayout'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    bio: '',
  })

  // Blocked sites
  const [blockedSites, setBlockedSites] = useState([])
  const [newSite, setNewSite] = useState('')

  // Notification settings
  const [notifications, setNotifications] = useState({
    voice: true,
    push: true,
    email: false,
  })

  // Session goals
  const [sessionGoals, setSessionGoals] = useState({
    dailyMinutes: 120,
    breakInterval: 25,
  })

  // Initialize state from user when available
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        bio: user.profile?.bio || '',
      })
      setBlockedSites(user.settings?.blockedSites || [])
      setNotifications({
        voice: user.settings?.notifications?.voice ?? true,
        push: user.settings?.notifications?.push ?? true,
        email: user.settings?.notifications?.email ?? false,
      })
      setSessionGoals({
        dailyMinutes: user.settings?.sessionGoals?.dailyMinutes || 120,
        breakInterval: user.settings?.sessionGoals?.breakInterval || 25,
      })
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'blocked-sites', label: 'Blocked Sites', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ]

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const response = await authAPI.updateProfile({
        bio: profileForm.bio,
      })
      updateUser(response.data.data)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBlockedSite = () => {
    if (!newSite.trim()) return
    
    const site = newSite.trim().toLowerCase()
    if (blockedSites.some(s => s.url === site)) {
      toast.error('Site already blocked')
      return
    }

    const updated = [...blockedSites, { url: site, isActive: true }]
    setBlockedSites(updated)
    setNewSite('')
    saveSettings({ blockedSites: updated })
  }

  const handleRemoveBlockedSite = (url) => {
    const updated = blockedSites.filter(s => s.url !== url)
    setBlockedSites(updated)
    saveSettings({ blockedSites: updated })
  }

  const handleToggleBlockedSite = (url) => {
    const updated = blockedSites.map(s => 
      s.url === url ? { ...s, isActive: !s.isActive } : s
    )
    setBlockedSites(updated)
    saveSettings({ blockedSites: updated })
  }

  const saveSettings = async (settings) => {
    try {
      const response = await authAPI.updateProfile({ settings })
      updateUser(response.data.data)
      toast.success('Settings saved!')
    } catch (error) {
      toast.error('Failed to save settings')
    }
  }

  const handleSaveNotifications = () => {
    saveSettings({ notifications })
  }

  const handleSaveGoals = () => {
    saveSettings({ sessionGoals })
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout()
      navigate('/login')
    }
  }

  return (
    <DarkThemeLayout 
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-4 sticky top-8">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      activeTab === tab.id
                        ? 'bg-green-600 text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-8">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Profile Information</h2>

                  <div className="flex items-center gap-6">
                    <img
                      src={user?.profile?.avatar}
                      alt={user?.username}
                      className="w-24 h-24 rounded-full border-4 border-white/30"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-white">{user?.username}</h3>
                      <p className="text-white/80">{user?.email}</p>
                      <p className="text-sm text-green-300 mt-1">
                        Level {user?.gamification?.level} • {user?.gamification?.totalPoints} points
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      disabled
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/60"
                    />
                    <p className="text-sm text-white/60 mt-1">Username cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/60"
                    />
                    <p className="text-sm text-white/60 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      maxLength={200}
                    />
                    <p className="text-sm text-white/60 mt-1">
                      {profileForm.bio.length}/200 characters
                    </p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              )}

              {/* Blocked Sites Tab */}
              {activeTab === 'blocked-sites' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Blocked Sites</h2>
                    <p className="text-white/80">
                      These sites will be blocked during your study sessions
                    </p>
                  </div>

                  {/* Add Site */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSite}
                      onChange={(e) => setNewSite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddBlockedSite()}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., youtube.com, facebook.com"
                    />
                    <button
                      onClick={handleAddBlockedSite}
                      className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add
                    </button>
                  </div>

                  {/* Blocked Sites List */}
                  <div className="space-y-3">
                    {blockedSites.length > 0 ? (
                      blockedSites.map((site, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-white/60" />
                            <span className={`font-medium ${site.isActive ? 'text-white' : 'text-white/40 line-through'}`}>
                              {site.url}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBlockedSite(site.url)}
                              className={`px-4 py-2 rounded-lg font-medium transition ${
                                site.isActive
                                  ? 'bg-green-500/30 text-green-300 hover:bg-green-500/40'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {site.isActive ? 'Active' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => handleRemoveBlockedSite(site.url)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-white/40 mx-auto mb-3" />
                        <p className="text-white/60">No blocked sites yet</p>
                        <p className="text-sm text-white/40 mt-1">
                          Add sites you want to block during study sessions
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-sm text-blue-300">
                      <strong>💡 Tip:</strong> Install our browser extension to automatically block these sites during active sessions!
                    </p>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
                    <p className="text-white/80">
                      Choose how you want to be notified
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-white">Voice Notifications</h3>
                        <p className="text-sm text-white/60">
                          Hear alerts when you're distracted
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.voice}
                          onChange={(e) => setNotifications({ ...notifications, voice: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-white">Push Notifications</h3>
                        <p className="text-sm text-white/60">
                          Get browser notifications for important events
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-white">Email Notifications</h3>
                        <p className="text-sm text-white/60">
                          Receive weekly summary emails
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
                    <p className="text-white/80">
                      Customize your study experience
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Daily Goal (minutes)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={720}
                      value={sessionGoals.dailyMinutes}
                      onChange={(e) => setSessionGoals({ ...sessionGoals, dailyMinutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-white/60 mt-1">
                      Your target study time per day
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Focus Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={sessionGoals.breakInterval}
                      onChange={(e) => setSessionGoals({ ...sessionGoals, breakInterval: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-white/60 mt-1">
                      Pomodoro-style focus duration (25 min recommended)
                    </p>
                  </div>

                  <button
                    onClick={handleSaveGoals}
                    className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>

                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mt-8">
                    <h3 className="font-semibold text-yellow-300 mb-2">Danger Zone</h3>
                    <p className="text-sm text-yellow-200/80 mb-3">
                      These actions cannot be undone
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure? This will delete all your data!')) {
                          toast.error('Account deletion coming soon')
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </DarkThemeLayout>
  )
}