import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api/auth'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,

      login: async (credentials) => {
        set({ loading: true })
        try {
          const response = await authAPI.login(credentials)
          const { user, accessToken, refreshToken } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          })

          return response.data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ loading: true })
        try {
          const response = await authAPI.register(data)
          const { user, accessToken, refreshToken } = response.data.data

          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          })

          return response.data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        try {
          await authAPI.logout(refreshToken)
        } catch (error) {
          console.error('Logout error:', error)
        }

        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      fetchProfile: async () => {
        try {
          const response = await authAPI.getProfile()
          set({ user: response.data.data })
        } catch (error) {
          console.error('Failed to fetch profile:', error)
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
