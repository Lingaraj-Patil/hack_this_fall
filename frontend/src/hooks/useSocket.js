import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useSessionStore } from '../store/sessionStore'
import toast from 'react-hot-toast'

export function useSocket() {
  const socketRef = useRef(null)
  const { accessToken, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5001', {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    })

    socket.on('connect', () => {
      console.log('Socket connected')
    })

    socket.on('connected', (data) => {
      console.log('Socket connected:', data)
    })

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message)
      // Don't show toast for connection errors - they're expected during development
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('session:started', (data) => {
      console.log('Session started:', data)
      toast.success('Session started!')
      // forward full data
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_STARTED', ...data } }, '*')
      } catch (err) {}
    })

    socket.on('session:paused', (data) => {
      console.log('Session paused:', data)
      // Handle auto-pause from backend
      if (data.reason === 'auto' || data.reason === 'distraction' || data.sessionStatus === 'auto_paused') {
        const store = useSessionStore.getState()
        store.handleAutoPause(data.sessionId)
        // Ensure timer is stopped
        store.stopTimer()
        // Update session state
        if (store.session && store.session._id === data.sessionId) {
          useSessionStore.setState({
            session: { ...store.session, status: 'auto_paused' },
            isPaused: true
          })
        }
        const reason = data.reason === 'distraction' ? 'you were distracted' : 'you were away from camera'
        toast(`Session auto-paused - ${reason}`, { icon: '⏸️', duration: 4000 })
      }
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_ENDED', ...data } }, '*')
      } catch (err) {}
    })

    socket.on('session:resumed', (data) => {
      console.log('Session resumed:', data)
      // Socket is informational only; the REST resume in sessionStore handles state sync and timer
      // Just update local store state if needed, but don't start timer (REST call will do that)
      try {
        const store = useSessionStore.getState()
        if (store.session && store.session._id === data.sessionId) {
          useSessionStore.setState({
            session: { ...store.session, status: 'active' },
            isPaused: false
          })
          // Don't start timer here - it's started by resumeSession after fetching active session
        }
      } catch (err) {
        console.warn('Failed to update session store on resume:', err)
      }

      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_STARTED', ...data } }, '*')
      } catch (err) {}
    })

    socket.on('session:ended', (data) => {
      console.log('Session ended:', data)
      toast.success(`Session complete! +${data.points} points!`)
      try {
        window.postMessage({ __study_monitor: true, payload: { type: 'SESSION_ENDED', ...data } }, '*')
      } catch (err) {}
    })

    socket.on('todo:updated', (data) => {
      console.log('Todo updated:', data)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [accessToken, isAuthenticated])

  return socketRef.current
}
