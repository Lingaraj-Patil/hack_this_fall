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
  BarChart3
} from 'lucide-react'
import { sessionAPI } from '../api/session'
import { gamificationAPI } from '../api/gamification'
import { useAuth } from '../hooks/useAuth'
import { formatDuration, formatDate } from '../utils/formatTime'
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Here's your productivity overview</p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Start Session
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Points */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Points</h3>
            <p className="text-3xl font-bold text-gray-900">
              {user?.gamification?.totalPoints || 0}
            </p>
            <p className="text-sm text-green-600 mt-2">
              Level {user?.gamification?.level || 1}
            </p>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl">🔥</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Current Streak</h3>
            <p className="text-3xl font-bold text-gray-900">
              {user?.gamification?.streak || 0} days
            </p>
            <p className="text-sm text-gray-500 mt-2">Keep it up!</p>
          </div>

          {/* Hearts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-2xl">❤️</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Hearts</h3>
            <p className="text-3xl font-bold text-gray-900">
              {hearts?.current || 0} / {hearts?.max || 5}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {hearts?.current < hearts?.max ? 'Regenerating...' : 'Full!'}
            </p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">This Week</h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatDuration(stats?.totalTime || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {stats?.totalSessions || 0} sessions
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
                <Link
                  to="/sessions"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatDuration(session.duration)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          +{session.netPoints} pts
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {session.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sessions yet</p>
                    <Link
                      to="/"
                      className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block"
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">This Week</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Time</span>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(stats?.totalTime || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((stats?.totalTime || 0) / 36000 * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Sessions</span>
                    <span className="font-semibold text-gray-900">
                      {stats?.totalSessions || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((stats?.totalSessions || 0) / 20 * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Avg Focus</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((stats?.avgConcentration || 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(stats?.avgConcentration || 0) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Efficiency</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(stats?.efficiency || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${stats?.efficiency || 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link
                  to="/"
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition group"
                >
                  <span className="font-medium text-green-700">Start Session</span>
                  <ChevronRight className="w-5 h-5 text-green-700 group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/leaderboard"
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition group"
                >
                  <span className="font-medium text-purple-700">View Leaderboard</span>
                  <ChevronRight className="w-5 h-5 text-purple-700 group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/clans"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition group"
                >
                  <span className="font-medium text-blue-700">Join a Clan</span>
                  <ChevronRight className="w-5 h-5 text-blue-700 group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                >
                  <span className="font-medium text-gray-700">Settings</span>
                  <ChevronRight className="w-5 h-5 text-gray-700 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}