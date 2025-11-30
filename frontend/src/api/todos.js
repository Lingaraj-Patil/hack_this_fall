import api from './axios';

export const todosAPI = {
  getAll: (params) => api.get('/todos', { params }),
  create: (data) => api.post('/todos', data),
  update: (todoId, data) => api.put(`/todos/${todoId}`, data),
  delete: (todoId) => api.delete(`/todos/${todoId}`),
  reorder: (todoIds) => api.put('/todos/reorder', { todoIds }),
  clearCompleted: () => api.delete('/todos/completed/clear'),
};