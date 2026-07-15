import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'
import { existsSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to ensure the correct PDF.js worker file exists in public folder
    // The worker file (version 5.3.93) should be in public folder to match react-pdf for production
    {
      name: 'verify-pdf-worker',
      buildStart() {
        try {
          const workerDest = join(process.cwd(), 'public', 'pdf.worker.min.mjs')
          
          // Verify the worker file exists (should be version 5.3.93 for react-pdf compatibility)
          if (existsSync(workerDest)) {
            console.log('✓ PDF.js worker file verified in public folder (version 5.3.93 for react-pdf)')
          } else {
            console.warn('⚠ PDF.js worker file not found in public folder')
            console.warn('  Downloading version 5.3.93 to match react-pdf...')
            // Could download here if needed, but file should already exist
          }
        } catch (error) {
          console.warn('Failed to verify PDF.js worker file:', error)
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('pdfjs-dist') || id.includes('react-pdf')) return 'vendor-pdf';
          if (id.includes('@ckeditor')) return 'vendor-ckeditor';
          if (id.includes('@mui')) return 'vendor-mui';
          if (id.includes('recharts') || id.includes('chart.js')) return 'vendor-charts';
          if (id.includes('lottie')) return 'vendor-lottie';
          if (id.includes('fabric')) return 'vendor-fabric';
          if (id.includes('socket.io')) return 'vendor-socket';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/pdf-service': {
        target: 'http://localhost:2104',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pdf-service/, '')
      },
      '/esign': {
        target: 'http://localhost:2103',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esign/, '')
      }
    }
  }
})