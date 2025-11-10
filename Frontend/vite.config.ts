import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to copy the correct PDF.js worker file during build
    {
      name: 'copy-pdf-worker',
      buildStart() {
        try {
          const workerSource = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
          const workerDest = join(process.cwd(), 'public', 'pdf.worker.min.mjs')
          copyFileSync(workerSource, workerDest)
          console.log('✓ Copied PDF.js worker file to public folder')
        } catch (error) {
          console.warn('Failed to copy PDF.js worker file:', error)
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api/pdf-service': {
        target: 'http://localhost:2104',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pdf-service/, '')
      }
    }
  }
})
