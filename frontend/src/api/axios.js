import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refreshToken }
        )

        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle 429 Too Many Requests: respect Retry-After header and retry with backoff
    if (error.response?.status === 429) {
      originalRequest._retry429 = originalRequest._retry429 || 0
      const maxRetries = 3
      if (originalRequest._retry429 < maxRetries) {
        originalRequest._retry429 += 1

        // Prefer server-provided Retry-After (seconds) if present
        const retryAfterHeader = error.response.headers['retry-after']
        let waitMs = 0
        if (retryAfterHeader) {
          const seconds = parseInt(retryAfterHeader, 10)
          if (!isNaN(seconds)) waitMs = seconds * 1000
        }

        // Fallback exponential backoff (ms) with jitter
        if (waitMs === 0) {
          const base = 250 * Math.pow(2, originalRequest._retry429) // 500, 1000, ...
          const jitter = Math.floor(Math.random() * 300)
          waitMs = Math.min(60000, base + jitter)
        }

        await new Promise(r => setTimeout(r, waitMs))
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)

export default api
