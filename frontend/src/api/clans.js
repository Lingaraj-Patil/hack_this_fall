import api from './axios'

export const clansAPI = {
  getAll: (params) => api.get('/clans/search', { params }),
  getById: (clanId) => api.get(`/clans/${clanId}`),
  getMyClan: () => api.get('/clans/my-clan'),
  create: (data) => api.post('/clans', data),
  update: (data) => api.put('/clans', data),
  join: (inviteCode) => api.post('/clans/join', { inviteCode }),
  leave: () => api.post('/clans/leave'),
  transferLeadership: (newLeaderId) => api.post('/clans/transfer-leadership', { newLeaderId }),
  kickMember: (memberId) => api.delete(`/clans/members/${memberId}`),
  getLeaderboard: () => api.get('/clans/leaderboard'),
}
