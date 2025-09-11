import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // The "external" option is used to prevent certain dependencies 
      // from being bundled into your main application code.
      // This is necessary because 'framer-motion' and 'react-router'
      // use "use client" directives that can cause errors when Vite 
      // tries to bundle them. By marking them as external, you tell
      // Vite to leave them as separate imports, which resolves the error.
      external: [
        /^node_modules\/framer-motion\//,
        /^node_modules\/react-router\//,
        /^node_modules\/react-router-dom\//,
      ],
    },
  },
})
