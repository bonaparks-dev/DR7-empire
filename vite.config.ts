import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This 'resolve.dedupe' section is a powerful fix for errors like 
  // "Cannot read properties of null (reading 'useRef')". It forces Vite 
  // to always use a single instance of 'react' and 'react-dom', 
  // preventing version conflicts that can cause these specific crashes.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      external: [
        /^framer-motion/,
        /^react-router/,
        /^react-router-dom/,
      ]
    }
  }
})

