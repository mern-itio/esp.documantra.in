import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'
import { existsSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to ensure the correct PDF.js worker file exists in public folder
    // The worker file (version 5.3.93) should already be in public folder to match react-pdf
    {
      name: 'verify-pdf-worker',
      buildStart() {
        try {
          const workerDest = join(process.cwd(), 'public', 'pdf.worker.min.mjs')
          
          // Verify the worker file exists
          if (existsSync(workerDest)) {
            console.log('✓ PDF.js worker file verified in public folder')
          } else {
            console.warn('⚠ PDF.js worker file not found in public folder')
          }
        } catch (error) {
          console.warn('Failed to verify PDF.js worker file:', error)
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
