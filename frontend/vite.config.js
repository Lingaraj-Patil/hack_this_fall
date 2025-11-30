// ========== vite.config.js (PERFECT VERSION) ==========
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Resolve alias for @ imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Server configuration
  server: {
    port: 3000,
    host: true, // ✅ NEW: Listen on all addresses (0.0.0.0)
    strictPort: true, // ✅ NEW: Fail if port is already in use
    
    // ✅ NEW: HMR (Hot Module Replacement) configuration
    // This fixes the WebSocket warnings
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
      clientPort: 3000,
    },
    
    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      // ✅ Optional: Proxy Socket.IO if needed
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  
  // ✅ Build optimizations
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
        }
      }
    }
  }
})