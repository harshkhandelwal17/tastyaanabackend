import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    theme: {
    extend: {
      animation: {
        "slow-bounce": "bounce 3s infinite",
      },
      dropShadow: {
        glow: "0 0 10px rgba(255,215,0,0.6)",
      },
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    host: true,     // exposes on 0.0.0.0
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Ensure proper chunking for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        }
      }
    }
  }
})
