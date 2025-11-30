import { create } from 'zustand'
import { sessionAPI } from '../api/session'

export const useSessionStore = create((set, get) => ({
  session: null,
  isActive: false,
  isPaused: false,
  elapsedTime: 0,
  loading: false,
  timerInterval: null,

  startSession: async (data) => {
    set({ loading: true })
    try {
      const response = await sessionAPI.start(data)
      const session = response.data.data

      set({
        session,
        isActive: true,
        isPaused: false,
        elapsedTime: 0,
        loading: false,
      })

      get().startTimer()
      return session
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  pauseSession: async (sessionId) => {
    try {
      await sessionAPI.pause(sessionId)
      set({ isPaused: true })
      get().stopTimer()
    } catch (error) {
      throw error
    }
  },

  resumeSession: async (sessionId) => {
    try {
      await sessionAPI.resume(sessionId)
      set({ isPaused: false })
      get().startTimer()
    } catch (error) {
      throw error
    }
  },

  endSession: async (sessionId, data = {}) => {
    try {
      const response = await sessionAPI.end(sessionId, data)
      get().stopTimer()
      set({
        session: null,
        isActive: false,
        isPaused: false,
        elapsedTime: 0,
      })
      return response.data.data
    } catch (error) {
      throw error
    }
  },

  fetchActiveSession: async () => {
    try {
      const response = await sessionAPI.getActive()
      const session = response.data.data

      if (session) {
        const elapsed = Math.floor((Date.now() - new Date(session.startTime)) / 1000)
        set({
          session,
          isActive: true,
          isPaused: session.status === 'paused',
          elapsedTime: elapsed,
        })

        if (session.status === 'active') {
          get().startTimer()
        }
      }
    } catch (error) {
      console.error('Failed to fetch active session:', error)
    }
  },

  startTimer: () => {
    const interval = setInterval(() => {
      set((state) => ({ elapsedTime: state.elapsedTime + 1 }))
    }, 1000)
    set({ timerInterval: interval })
  },

  stopTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) {
      clearInterval(timerInterval)
      set({ timerInterval: null })
    }
  },
}))
