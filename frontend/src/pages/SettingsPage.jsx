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
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  // Profile settings
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.profile?.bio || '',
  })

  // Blocked sites
  const [blockedSites, setBlockedSites] = useState(
    user?.settings?.blockedSites || []
  )
  const [newSite, setNewSite] = useState('')

  // Notification settings
  const [notifications, setNotifications] = useState({
    voice: user?.settings?.notifications?.voice ?? true,
    push: user?.settings?.notifications?.push ?? true,
    email: user?.settings?.notifications?.email ?? false,
  })

  // Session goals
  const [sessionGoals, setSessionGoals] = useState({
    dailyMinutes: user?.settings?.sessionGoals?.dailyMinutes || 120,
    breakInterval: user?.settings?.sessionGoals?.breakInterval || 25,
  })

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 sticky top-8">
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
                          : 'text-gray-600 hover:bg-gray-50'
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
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>

                  <div className="flex items-center gap-6">
                    <img
                      src={user?.profile?.avatar}
                      alt={user?.username}
                      className="w-24 h-24 rounded-full border-4 border-gray-200"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                      <p className="text-sm text-green-600 mt-1">
                        Level {user?.gamification?.level} • {user?.gamification?.totalPoints} points
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Username cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      maxLength={200}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {profileForm.bio.length}/200 characters
                    </p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2 disabled:opacity-50"
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Blocked Sites</h2>
                    <p className="text-gray-600">
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., youtube.com, facebook.com"
                    />
                    <button
                      onClick={handleAddBlockedSite}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
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
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <span className={`font-medium ${site.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                              {site.url}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBlockedSite(site.url)}
                              className={`px-4 py-2 rounded-lg font-medium transition ${
                                site.isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {site.isActive ? 'Active' : 'Disabled'}
                            </button>
                            <button
                              onClick={() => handleRemoveBlockedSite(site.url)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No blocked sites yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Add sites you want to block during study sessions
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Install our browser extension to automatically block these sites during active sessions!
                    </p>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
                    <p className="text-gray-600">
                      Choose how you want to be notified
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Voice Notifications</h3>
                        <p className="text-sm text-gray-600">
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
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">
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
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">
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
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferences</h2>
                    <p className="text-gray-600">
                      Customize your study experience
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Goal (minutes)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={720}
                      value={sessionGoals.dailyMinutes}
                      onChange={(e) => setSessionGoals({ ...sessionGoals, dailyMinutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Your target study time per day
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Focus Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={sessionGoals.breakInterval}
                      onChange={(e) => setSessionGoals({ ...sessionGoals, breakInterval: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Pomodoro-style focus duration (25 min recommended)
                    </p>
                  </div>

                  <button
                    onClick={handleSaveGoals}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-8">
                    <h3 className="font-semibold text-yellow-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-yellow-800 mb-3">
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
      </main>
    </div>
  )
}