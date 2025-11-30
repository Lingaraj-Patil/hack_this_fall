import api from './axios'

export const visionAPI = {
  analyze: (data) => api.post('/vision/analyze', data),
}
