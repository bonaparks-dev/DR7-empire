import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Generate a unique build version on each build
const buildVersion = Date.now().toString()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-build-version',
      writeBundle() {
        // Write build version to dist after build completes
        writeFileSync(resolve(__dirname, 'dist', 'build-version.txt'), buildVersion)
      }
    }
  ],
  define: {
    '__BUILD_VERSION__': JSON.stringify(buildVersion)
  }
})
