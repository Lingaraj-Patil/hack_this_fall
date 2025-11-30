// ========== src/pages/ClanPage.jsx (COMPLETE) ==========
import { useState, useEffect } from 'react'
import { 
  Users, 
  Shield, 
  Crown, 
  Trophy, 
  Plus, 
  LogOut, 
  Search,
  Copy,
  Check,
  X,
  UserPlus
} from 'lucide-react'
import { clansAPI } from '../api/clans'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/Common/Modal'
import { formatDuration } from '../utils/formatTime'
import toast from 'react-hot-toast'

export default function ClanPage() {
  const { user, updateUser } = useAuth()
  const [myClan, setMyClan] = useState(null)
  const [allClans, setAllClans] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Create clan form
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 50,
  })

  // Join clan form
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (user?.clanId) {
        const clanRes = await clansAPI.getMyClan()
        setMyClan(clanRes.data.data)
      } else {
        const clansRes = await clansAPI.getAll({ page: 1, limit: 20 })
        setAllClans(clansRes.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch clan data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClan = async (e) => {
    e.preventDefault()
    try {
      const res = await clansAPI.create(createForm)
      setMyClan(res.data.data)
      updateUser({ clanId: res.data.data._id })
      setShowCreateModal(false)
      toast.success('Clan created successfully! 🎉')
      setCreateForm({ name: '', description: '', isPrivate: false, maxMembers: 50 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create clan')
    }
  }

  const handleJoinClan = async (e) => {
    e.preventDefault()
    try {
      const res = await clansAPI.join(inviteCode)
      setMyClan(res.data.data)
      updateUser({ clanId: res.data.data._id })
      setShowJoinModal(false)
      toast.success('Joined clan successfully! 🎊')
      setInviteCode('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join clan')
    }
  }

  const handleLeaveClan = async () => {
    if (!confirm('Are you sure you want to leave this clan?')) return

    try {
      await clansAPI.leave()
      setMyClan(null)
      updateUser({ clanId: null })
      toast.success('Left clan successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave clan')
    }
  }

  const copyInviteCode = () => {
    if (myClan?.inviteCode) {
      navigator.clipboard.writeText(myClan.inviteCode)
      setCopiedCode(true)
      toast.success('Invite code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const getMemberRole = (member) => {
    if (member.role === 'leader') return { icon: Crown, color: 'text-yellow-500', label: 'Leader' }
    if (member.role === 'admin') return { icon: Shield, color: 'text-blue-500', label: 'Admin' }
    return { icon: Users, color: 'text-gray-500', label: 'Member' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If user has a clan, show clan dashboard
  if (myClan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{myClan.name}</h1>
                  <p className="text-gray-600 mt-1">{myClan.description}</p>
                </div>
              </div>
              <button
                onClick={handleLeaveClan}
                className="px-6 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Leave Clan
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-gray-600 font-medium">Total Points</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{myClan.totalPoints}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-blue-500" />
                <h3 className="text-gray-600 font-medium">Members</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {myClan.members?.length || 0}/{myClan.maxMembers}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-purple-500" />
                <h3 className="text-gray-600 font-medium">Sessions</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{myClan.stats?.totalSessions || 0}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-green-500" />
                <h3 className="text-gray-600 font-medium">Study Time</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(myClan.stats?.totalStudyTime || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Members List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Members</h2>
                
                <div className="space-y-3">
                  {myClan.members?.map((member) => {
                    const roleInfo = getMemberRole(member)
                    const RoleIcon = roleInfo.icon
                    
                    return (
                      <div
                        key={member.userId._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={member.userId.profile?.avatar}
                            alt={member.userId.username}
                            className="w-12 h-12 rounded-full border-2 border-white shadow"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              {member.userId.username}
                              <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
                            </p>
                            <p className="text-sm text-gray-500">{roleInfo.label}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">
                            {member.contributionPoints || 0} pts
                          </p>
                          <p className="text-sm text-gray-500">
                            Level {member.userId.gamification?.level || 1}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Clan Info & Actions */}
            <div className="space-y-6">
              {/* Invite Code */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Invite Code</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg font-bold text-gray-900">
                    {myClan.inviteCode}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                  >
                    {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Share this code with friends to invite them
                </p>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Focus</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((myClan.stats?.avgConcentration || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Privacy</span>
                    <span className="font-semibold text-gray-900">
                      {myClan.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(myClan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // If user doesn't have a clan, show browse/create options
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Clans
              </h1>
              <p className="text-gray-600 mt-1">Join or create a clan to compete with friends</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-6 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-semibold flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Join Clan
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Clan
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allClans
            .filter(clan => 
              clan.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((clan) => (
              <div
                key={clan._id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  {clan.isPrivate && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      Private
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{clan.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {clan.description || 'No description'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Members</span>
                    <span className="font-semibold text-gray-900">
                      {clan.members?.length || 0}/{clan.maxMembers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Points</span>
                    <span className="font-semibold text-purple-600">
                      {clan.totalPoints}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowJoinModal(true)
                  }}
                  disabled={clan.members?.length >= clan.maxMembers}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clan.members?.length >= clan.maxMembers ? 'Full' : 'Join Clan'}
                </button>
              </div>
            ))}
        </div>

        {allClans.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No public clans available</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create the First Clan
            </button>
          </div>
        )}
      </main>

      {/* Create Clan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Clan"
      >
        <form onSubmit={handleCreateClan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clan Name *
            </label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter clan name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe your clan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Members
            </label>
            <input
              type="number"
              min={2}
              max={100}
              value={createForm.maxMembers}
              onChange={(e) => setCreateForm({ ...createForm, maxMembers: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={createForm.isPrivate}
              onChange={(e) => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Make clan private (invite only)
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold"
          >
            Create Clan
          </button>
        </form>
      </Modal>

      {/* Join Clan Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Clan"
        size="sm"
      >
        <form onSubmit={handleJoinClan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code *
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
              placeholder="Enter invite code"
            />
            <p className="text-sm text-gray-500 mt-2">
              Ask your friend for their clan's invite code
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Join Clan
          </button>
        </form>
      </Modal>
    </div>
  )
}