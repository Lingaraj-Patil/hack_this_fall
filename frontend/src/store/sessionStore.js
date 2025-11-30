import { create } from 'zustand'
import { sessionAPI } from '../api/session'
import { useAuthStore } from './authStore'

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
      // Clear any existing timer first
      get().stopTimer()
      
      const response = await sessionAPI.start(data)
      const session = response.data.data

      if (!session || !session._id) {
        throw new Error('Invalid session response')
      }

      set({
        session,
        isActive: true,
        isPaused: false,
        elapsedTime: 0,
        loading: false,
      })

      // Start timer immediately (no wait)
      get().startTimer()
      
      // Notify extension (via content script bridge) that session started and pass blocked sites
      try {
        const { user } = useAuthStore.getState()
        const blockedSites = (user?.settings?.blockedSites || [])
          .filter(b => b.isActive !== false) // Only active blocked sites
          .map(b => b.url || b)
        
        // Post a window message that content script will forward to extension
        window.postMessage({ 
          __study_monitor: true, 
          payload: { 
            type: 'SESSION_STARTED', 
            sessionId: session._id, 
            blockedSites 
          } 
        }, '*')
      } catch (err) {
        // not critical if messaging fails
        console.warn('Failed to notify extension of session start', err)
      }
      return session
    } catch (error) {
      set({ loading: false })
      console.error('Session start error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || 'No hearts remaining. Wait for regeneration.'
        throw new Error(message)
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'You already have an active session'
        throw new Error(message)
      }
      
      throw error
    }
  },

  pauseSession: async (sessionId) => {
    try {
      const response = await sessionAPI.pause(sessionId)
      // Stop timer BEFORE updating state to freeze elapsed time
      get().stopTimer()
      
      // Get current elapsed time and preserve it
      const currentElapsed = get().elapsedTime
      
      set({ 
        isPaused: true,
        elapsedTime: currentElapsed // Keep the same elapsed time when paused
      })
      
      // Notify extension the session is paused (treat as ended for blocking behavior)
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_ENDED', sessionId } }, '*')
      } catch (err) {}
    } catch (error) {
      throw error
    }
  },

  // Handle auto-pause from backend
  handleAutoPause: (sessionId) => {
    const { session, timerInterval } = get()
    if (session && session._id === sessionId) {
      // Stop timer immediately and clear interval
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      set({ 
        isPaused: true,
        timerInterval: null,
        session: { ...session, status: 'auto_paused' }
      })
      // Notify extension
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_ENDED', sessionId, reason: 'auto_paused' } }, '*')
      } catch (err) {}
      console.log('Timer stopped due to auto-pause for session:', sessionId)
    }
  },

  resumeSession: async (sessionId) => {
    try {
      const response = await sessionAPI.resume(sessionId)
      const resumedSession = response.data?.data
      
      // If we have the updated session from resume response, use it directly to avoid timer jump
      if (resumedSession) {
        // Calculate correct elapsed time accounting for pause duration
        const elapsed = Math.floor((Date.now() - new Date(resumedSession.startTime)) / 1000)
        set({
          session: resumedSession,
          isPaused: false,
          elapsedTime: elapsed
        })
      } else {
        // Fallback: Refresh full session from server to get updated pauseLog/resumedAt timestamps
        // Retry fetching active session a few times with backoff to handle transient network failures
        const maxAttempts = 3
        let attempt = 0
        let lastErr = null
        while (attempt < maxAttempts) {
          try {
            await get().fetchActiveSession()
            lastErr = null
            break
          } catch (e) {
            lastErr = e
            attempt++
            // small exponential backoff with jitter
            if (attempt < maxAttempts) {
              const backoff = 250 * Math.pow(2, attempt) // 500ms, 1000ms, ...
              const jitter = Math.floor(Math.random() * 200) // 0-200ms
              await new Promise(r => setTimeout(r, backoff + jitter))
            }
          }
        }
        if (lastErr) throw lastErr
        set({ isPaused: false })
      }
      
      // Start timer AFTER state is updated
      get().startTimer()
      
      // Notify extension to resume blocking
      try {
        const { user } = useAuthStore.getState()
        const blockedSites = (user?.settings?.blockedSites || []).map(b => b.url || b)
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_STARTED', sessionId, blockedSites } }, '*')
      } catch (err) {}
    } catch (error) {
      // If session was already resumed/removed on server, treat as success after refreshing
      if (error?.response?.status === 404) {
        try {
          // refresh active session state from server
          await get().fetchActiveSession()
          const current = get()
          if (current.session && current.session.status === 'active') {
            set({ isPaused: false })
            get().startTimer()
            return
          }
        } catch (e) {
          // fallthrough to throw original
        }
      }
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
      // Notify extension session ended
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_ENDED', sessionId } }, '*')
      } catch (err) {}
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
        const isPaused = session.status === 'paused' || session.status === 'auto_paused'
        
        // IMPORTANT: Don't auto-start timer - only update state
        // Timer should only start when user explicitly starts/resumes session
        // If a timer is already running locally, avoid overriding elapsedTime to prevent jumps
        const { timerInterval } = get()
        set({
          session,
          isActive: true,
          isPaused,
          elapsedTime: timerInterval ? get().elapsedTime : elapsed,
        })

        // Always stop timer first to prevent auto-start
        get().stopTimer()
        
        // Only start timer if session is active AND not paused
        if (!isPaused && session.status === 'active') {
          get().startTimer()
        }
      } else {
        // No active session - ensure timer is stopped
        get().stopTimer()
        set({
          session: null,
          isActive: false,
          isPaused: false,
          elapsedTime: 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch active session:', error)
      // On error, ensure timer is stopped
      get().stopTimer()
    }
  },

  startTimer: () => {
    // Prevent duplicate timers
    const { timerInterval } = get()
    if (timerInterval) return

    const interval = setInterval(() => {
      const state = get()
      const { session, isPaused } = state
      
      // Stop if session ended or paused
      if (!session || isPaused) {
        get().stopTimer()
        return
      }

      // Calculate elapsed time from session startTime (deterministic, no jumps)
      const elapsedSeconds = Math.floor((Date.now() - new Date(session.startTime)) / 1000)
      set({ elapsedTime: Math.max(0, elapsedSeconds) })
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
