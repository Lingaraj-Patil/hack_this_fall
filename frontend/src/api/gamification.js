import api from './axios'

export const gamificationAPI = {
  getLeaderboard: (params) => api.get('/gamification/leaderboard', { params }),
  getRank: (params) => api.get('/gamification/rank', { params }),
  getHearts: () => api.get('/gamification/hearts'),
  getStats: () => api.get('/gamification/stats'),
  getAchievements: () => api.get('/gamification/achievements'),
}