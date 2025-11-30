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
import DarkThemeLayout from '../components/Layout/DarkThemeLayout'
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
  const [createForm, setCreateForm] = useState({ name: '', description: '', isPrivate: false })
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    fetchClanData()
  }, [])

  const fetchClanData = async () => {
    try {
      setLoading(true)
      const [myClanRes, allClansRes] = await Promise.all([
        clansAPI.getMyClan().catch(() => ({ data: { data: null } })),
        clansAPI.getAll({ search: searchQuery })
      ])
      setMyClan(myClanRes.data.data)
      setAllClans(allClansRes.data.data || [])
    } catch (error) {
      toast.error('Failed to load clan data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClan = async () => {
    try {
      const response = await clansAPI.create(createForm)
      setMyClan(response.data.data)
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '', isPrivate: false })
      toast.success('Clan created successfully!')
      updateUser({ clan: response.data.data._id })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create clan')
    }
  }

  const handleJoinClan = async () => {
    try {
      const response = await clansAPI.join(joinCode)
      setMyClan(response.data.data)
      setShowJoinModal(false)
      setJoinCode('')
      toast.success('Joined clan successfully!')
      updateUser({ clan: response.data.data._id })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join clan')
    }
  }

  const handleLeaveClan = async () => {
    if (!confirm('Are you sure you want to leave this clan?')) return
    try {
      await clansAPI.leave()
      setMyClan(null)
      toast.success('Left clan successfully')
      updateUser({ clan: null })
    } catch (error) {
      toast.error('Failed to leave clan')
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(myClan.inviteCode)
    setCopiedCode(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const getMemberRole = (member) => {
    if (member.role === 'leader') return { icon: Crown, color: 'text-yellow-500', label: 'Leader' }
    if (member.role === 'admin') return { icon: Shield, color: 'text-blue-500', label: 'Admin' }
    return { icon: Users, color: 'text-gray-400', label: 'Member' }
  }

  if (loading) {
    return (
      <DarkThemeLayout title="Clans">
        <div className="flex items-center justify-center min-h-[240px]">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DarkThemeLayout>
    )
  }

  // If user has a clan, show clan dashboard
  if (myClan) {
    return (
      <DarkThemeLayout 
        title={myClan.name}
        subtitle={myClan.description}
      >
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleLeaveClan}
            className="glass px-6 py-3 rounded-full text-red-300 font-semibold hover:bg-red-500/20 transition flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Leave Clan
          </button>
        </div>

        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h3 className="text-white/80 font-medium">Total Points</h3>
              </div>
              <p className="text-3xl font-bold text-white">{myClan.totalPoints}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-white/80 font-medium">Members</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {myClan.members?.length || 0}/{myClan.maxMembers}
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-purple-400" />
                <h3 className="text-white/80 font-medium">Sessions</h3>
              </div>
              <p className="text-3xl font-bold text-white">{myClan.stats?.totalSessions || 0}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-6 h-6 text-green-400" />
                <h3 className="text-white/80 font-medium">Study Time</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatDuration(myClan.stats?.totalStudyTime || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Members List */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Members</h2>
                
                <div className="space-y-3">
                  {myClan.members?.map((member) => {
                    const roleInfo = getMemberRole(member)
                    const RoleIcon = roleInfo.icon
                    
                    return (
                      <div
                        key={member.userId._id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={member.userId.profile?.avatar}
                            alt={member.userId.username}
                            className="w-12 h-12 rounded-full border-2 border-white/30 shadow"
                          />
                          <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                              {member.userId.username}
                              <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
                            </p>
                            <p className="text-sm text-white/60">{roleInfo.label}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-300">
                            {member.contributionPoints || 0} pts
                          </p>
                          <p className="text-sm text-white/60">
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
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Invite Code</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-white/10 rounded-lg font-mono text-lg font-bold text-white">
                    {myClan.inviteCode}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="p-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                  >
                    {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-sm text-white/60 mt-2">
                  Share this code with friends to invite them
                </p>
              </div>

              {/* Quick Stats */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">Quick Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Avg Focus</span>
                    <span className="font-semibold text-white">
                      {Math.round((myClan.stats?.avgConcentration || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Privacy</span>
                    <span className="font-semibold text-white">
                      {myClan.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Created</span>
                    <span className="font-semibold text-white">
                      {new Date(myClan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DarkThemeLayout>
    )
  }

  // If user doesn't have a clan, show browse/create options
  return (
    <DarkThemeLayout 
      title="Clans"
      subtitle="Join or create a clan to compete with friends"
    >
      <div className="mb-6 flex justify-end gap-3">
        <button
          onClick={() => setShowJoinModal(true)}
          className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Join Clan
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <Plus className="w-5 h-5" />
          Create Clan
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-white/60" />
          <input
            type="text"
            placeholder="Search clans..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              fetchClanData()
            }}
            className="flex-1 bg-transparent text-white placeholder-white/60 outline-none"
          />
        </div>
      </div>

      {/* Clan List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allClans.map((clan) => (
          <div
            key={clan._id}
            className="glass rounded-2xl p-6 hover:bg-white/5 transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{clan.name}</h3>
            <p className="text-white/70 text-sm mb-4">{clan.description}</p>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="w-4 h-4" />
                <span>{clan.members?.length || 0}/{clan.maxMembers}</span>
              </div>
              <div className="text-purple-300 font-semibold">
                {clan.totalPoints} pts
              </div>
            </div>
            <button
              onClick={() => {
                setJoinCode(clan.inviteCode)
                setShowJoinModal(true)
              }}
              className="w-full glass px-4 py-2 rounded-lg text-white font-medium hover:bg-white/20 transition"
            >
              Join Clan
            </button>
          </div>
        ))}
      </div>

      {allClans.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No clans found</p>
          <p className="text-white/40 text-sm mt-2">
            Create your own clan to get started!
          </p>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Clan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Clan Name</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 outline-none focus:border-white/40"
              placeholder="Enter clan name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 outline-none focus:border-white/40"
              placeholder="Describe your clan"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private"
              checked={createForm.isPrivate}
              onChange={(e) => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="private" className="text-sm text-white/80">Private Clan</label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreateClan}
              className="flex-1 glass px-6 py-3 rounded-lg text-white font-semibold hover:bg-white/20 transition"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Join Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Clan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Invite Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 outline-none focus:border-white/40 font-mono text-center text-lg"
              placeholder="Enter invite code"
              maxLength={8}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleJoinClan}
              className="flex-1 glass px-6 py-3 rounded-lg text-white font-semibold hover:bg-white/20 transition"
            >
              Join
            </button>
            <button
              onClick={() => setShowJoinModal(false)}
              className="px-6 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DarkThemeLayout>
  )
}
