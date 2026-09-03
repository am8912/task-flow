import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/task-flow/' : '/',
  plugins: [
	react(),
	tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Forward API calls to the Spring Boot backend during development.
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
}))
