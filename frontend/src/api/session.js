import api from './axios'

export const sessionAPI = {
  start: (data) => api.post('/sessions', data),
  pause: (sessionId) => api.post(`/sessions/${sessionId}/pause`),
  resume: (sessionId) => api.post(`/sessions/${sessionId}/resume`),
  end: (sessionId, data) => api.post(`/sessions/${sessionId}/end`, data),
  getActive: () => api.get('/sessions/active'),
  getHistory: (params) => api.get('/sessions/history', { params }),
  getStats: (params) => api.get('/sessions/stats', { params }),
  getById: (sessionId) => api.get(`/sessions/${sessionId}`),
  delete: (sessionId) => api.delete(`/sessions/${sessionId}`),
}
