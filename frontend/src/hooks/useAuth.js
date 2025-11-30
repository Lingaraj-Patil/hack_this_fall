import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchProfile,
  } = useAuthStore()

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchProfile,
  }
}