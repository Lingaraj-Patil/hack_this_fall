import api from './axios'

export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getById: (noteId) => api.get(`/notes/${noteId}`),
  create: (data) => api.post('/notes', data),
  update: (noteId, data) => api.put(`/notes/${noteId}`, data),
  delete: (noteId) => api.delete(`/notes/${noteId}`),
  getTags: () => api.get('/notes/tags'),
}