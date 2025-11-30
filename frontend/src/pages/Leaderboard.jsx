// ========== src/pages/LeaderboardPage.jsx (COMPLETE) ==========
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Users, Clock } from 'lucide-react'
import { gamificationAPI } from '../api/gamification'
import { useAuth } from '../hooks/useAuth'
import { formatDuration } from '../utils/formatTime'
import toast from 'react-hot-toast'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('weekly')
  const [leaderboard, setLeaderboard] = useState(null)
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'daily', label: 'Today', icon: '📅' },
    { id: 'weekly', label: 'This Week', icon: '📊' },
    { id: 'monthly', label: 'This Month', icon: '📈' },
    { id: 'alltime', label: 'All Time', icon: '🏆' },
  ]

  useEffect(() => {
    fetchLeaderboard()
  }, [activeTab])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const [leaderboardRes, rankRes] = await Promise.all([
        gamificationAPI.getLeaderboard({ type: activeTab }),
        gamificationAPI.getRank({ type: activeTab }),
      ])

      setLeaderboard(leaderboardRes.data.data)
      setUserRank(rankRes.data.data)
    } catch (error) {
      toast.error('Failed to load leaderboard')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>
  }

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
    return 'bg-white'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                Leaderboard
              </h1>
              <p className="text-gray-600 mt-1">Compete with the best students worldwide</p>
            </div>

            {/* User Rank Card */}
            {userRank && userRank.rank && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">#{userRank.rank}</div>
                    <div className="text-xs opacity-90">Your Rank</div>
                  </div>
                  <div className="border-l border-white/30 pl-4">
                    <div className="text-lg font-semibold">{userRank.entry?.points || 0} pts</div>
                    <div className="text-xs opacity-90">
                      Top {userRank.percentile}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard?.entries && leaderboard.entries.length >= 3 && (
              <div className="mb-12">
                <div className="flex items-end justify-center gap-8">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center mb-3 shadow-xl">
                      <img
                        src={leaderboard.entries[1].avatar}
                        alt={leaderboard.entries[1].username}
                        className="w-20 h-20 rounded-full border-4 border-white"
                      />
                    </div>
                    <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-white px-8 py-6 rounded-2xl text-center shadow-xl transform translate-y-4">
                      <Medal className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-lg">{leaderboard.entries[1].username}</p>
                      <p className="text-2xl font-bold mt-2">{leaderboard.entries[1].points}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center">
                    <Crown className="w-12 h-12 text-yellow-500 mb-2 animate-bounce" />
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center mb-3 shadow-2xl">
                      <img
                        src={leaderboard.entries[0].avatar}
                        alt={leaderboard.entries[0].username}
                        className="w-28 h-28 rounded-full border-4 border-white"
                      />
                    </div>
                    <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-10 py-8 rounded-2xl text-center shadow-2xl">
                      <Trophy className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-bold text-xl">{leaderboard.entries[0].username}</p>
                      <p className="text-3xl font-bold mt-2">{leaderboard.entries[0].points}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center mb-3 shadow-xl">
                      <img
                        src={leaderboard.entries[2].avatar}
                        alt={leaderboard.entries[2].username}
                        className="w-20 h-20 rounded-full border-4 border-white"
                      />
                    </div>
                    <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-8 py-6 rounded-2xl text-center shadow-xl transform translate-y-4">
                      <Medal className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-bold text-lg">{leaderboard.entries[2].username}</p>
                      <p className="text-2xl font-bold mt-2">{leaderboard.entries[2].points}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Clan</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Points</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Sessions</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Study Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboard?.entries?.map((entry, index) => (
                      <tr
                        key={entry.userId}
                        className={`hover:bg-gray-50 transition ${
                          entry.userId === user?._id ? 'bg-green-50' : ''
                        } ${getRankColor(entry.rank)}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={entry.avatar}
                              alt={entry.username}
                              className="w-10 h-10 rounded-full border-2 border-gray-200"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {entry.username}
                                {entry.userId === user?._id && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {entry.clanName ? (
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {entry.clanName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No clan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-lg text-purple-600">
                            {entry.points}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-gray-700">{entry.sessions}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-gray-700 flex items-center justify-end gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDuration(entry.studyTime)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No rankings yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Complete sessions to appear on the leaderboard
                  </p>
                </div>
              )}
            </div>

            {/* Stats Footer */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">
                  {leaderboard?.entries?.length || 0}
                </p>
                <p className="text-gray-600 text-sm mt-1">Active Competitors</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">
                  {formatDuration(
                    leaderboard?.entries?.reduce((sum, e) => sum + e.studyTime, 0) || 0
                  )}
                </p>
                <p className="text-gray-600 text-sm mt-1">Total Study Time</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">
                  {leaderboard?.entries?.reduce((sum, e) => sum + e.points, 0) || 0}
                </p>
                <p className="text-gray-600 text-sm mt-1">Total Points Earned</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}