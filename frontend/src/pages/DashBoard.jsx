// ========== src/pages/DashboardPage.jsx (COMPLETE) ==========
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Calendar,
  ChevronRight,
  Flame,
  Heart,
  Trophy,
  BarChart3,
  Play
} from 'lucide-react'
import { sessionAPI } from '../api/session'
import { gamificationAPI } from '../api/gamification'
import { useAuth } from '../hooks/useAuth'
import { formatDuration, formatDate } from '../utils/formatTime'
import DarkThemeLayout from '../components/Layout/DarkThemeLayout'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [hearts, setHearts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all dashboard data
      const [statsRes, historyRes, heartsRes] = await Promise.all([
        sessionAPI.getStats({ period: 'week' }),
        sessionAPI.getHistory({ page: 1, limit: 5 }),
        gamificationAPI.getHearts(),
      ])

      setStats(statsRes.data.data)
      setRecentSessions(historyRes.data.data)
      setHearts(heartsRes.data.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DarkThemeLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DarkThemeLayout>
    )
  }

  return (
    <DarkThemeLayout 
      title={`Welcome back, ${user?.username}! 👋`}
      subtitle="Here's your productivity overview"
    >
      <div className="mb-6 flex justify-end">
        <Link
          to="/"
          className="glass px-6 py-3 rounded-full text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Session
        </Link>
      </div>
      
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Points */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Total Points</h3>
            <p className="text-3xl font-bold text-white">
              {user?.gamification?.totalPoints || 0}
            </p>
            <p className="text-sm text-green-300 mt-2">
              Level {user?.gamification?.level || 1}
            </p>
          </div>

          {/* Current Streak */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Current Streak</h3>
            <p className="text-3xl font-bold text-white">
              {user?.gamification?.streak || 0} days
            </p>
            <p className="text-sm text-white/60 mt-2">Keep it up!</p>
          </div>

          {/* Hearts */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">Hearts</h3>
            <p className="text-3xl font-bold text-white">
              {hearts?.current || 0} / {hearts?.max || 5}
            </p>
            <p className="text-sm text-white/60 mt-2">
              {hearts?.current < hearts?.max ? 'Regenerating...' : 'Full!'}
            </p>
          </div>

          {/* This Week */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">This Week</h3>
            <p className="text-3xl font-bold text-white">
              {formatDuration(stats?.totalTime || 0)}
            </p>
            <p className="text-sm text-white/60 mt-2">
              {stats?.totalSessions || 0} sessions
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
              </div>

              <div className="space-y-4">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                          <Clock className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {formatDuration(session.duration)}
                          </p>
                          <p className="text-sm text-white/60">
                            {formatDate(session.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          +{session.netPoints} pts
                        </p>
                        <p className="text-sm text-white/60 capitalize">
                          {session.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60">No sessions yet</p>
                    <Link
                      to="/"
                      className="text-green-400 hover:text-green-300 text-sm font-medium mt-2 inline-block"
                    >
                      Start your first session
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="space-y-6">
            {/* Weekly Stats */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">This Week</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Total Time</span>
                    <span className="font-semibold text-white">
                      {formatDuration(stats?.totalTime || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((stats?.totalTime || 0) / 36000 * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Sessions</span>
                    <span className="font-semibold text-white">
                      {stats?.totalSessions || 0}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((stats?.totalSessions || 0) / 20 * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Avg Focus</span>
                    <span className="font-semibold text-white">
                      {Math.round((stats?.avgConcentration || 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(stats?.avgConcentration || 0) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Efficiency</span>
                    <span className="font-semibold text-white">
                      {Math.round(stats?.efficiency || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${stats?.efficiency || 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  to="/"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                >
                  <span className="font-medium text-white">Start Session</span>
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/leaderboard"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                >
                  <span className="font-medium text-white">View Leaderboard</span>
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/clans"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                >
                  <span className="font-medium text-white">Join a Clan</span>
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition group"
                >
                  <span className="font-medium text-white">Settings</span>
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DarkThemeLayout>
  )
}