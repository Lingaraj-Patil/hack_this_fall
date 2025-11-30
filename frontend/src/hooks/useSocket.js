import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
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
    })

    socket.on('connected', (data) => {
      console.log('Socket connected:', data)
    })

    socket.on('session:started', (data) => {
      console.log('Session started:', data)
      toast.success('Session started!')
    })

    socket.on('session:paused', (data) => {
      console.log('Session paused:', data)
    })

    socket.on('session:resumed', (data) => {
      console.log('Session resumed:', data)
    })

    socket.on('session:ended', (data) => {
      console.log('Session ended:', data)
      toast.success(`Session complete! +${data.points} points!`)
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
