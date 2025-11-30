import { useEffect } from 'react'
import { useSessionStore } from '../store/sessionStore'

export function useSession() {
  const {
    session,
    isActive,
    isPaused,
    elapsedTime,
    loading,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    fetchActiveSession,
  } = useSessionStore()

  useEffect(() => {
    fetchActiveSession()
  }, [fetchActiveSession])

  return {
    session,
    isActive,
    isPaused,
    elapsedTime,
    loading,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
  }
}
