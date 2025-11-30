import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'forest',
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}))