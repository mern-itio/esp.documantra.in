import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'
import { copyFileSync, existsSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to ensure the correct PDF.js worker file exists in public folder
    // The worker file (version 5.3.93) should be in public folder to match react-pdf for production
    {
      name: 'copy-pdf-worker',
      buildStart() {
        try {
          const workerSrc = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
          const workerDest = join(process.cwd(), 'public', 'pdf.worker.min.mjs')

          if (existsSync(workerSrc)) {
            copyFileSync(workerSrc, workerDest)
            console.log('✓ PDF.js worker copied to public/pdf.worker.min.mjs')
          } else {
            console.warn('⚠ pdfjs-dist worker not found at', workerSrc)
          }
        } catch (error) {
          console.warn('Failed to copy PDF.js worker file:', error)
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('pdfjs-dist') || id.includes('react-pdf')) return 'vendor-pdf';
          if (id.includes('@ckeditor')) return 'vendor-ckeditor';
          if (id.includes('@mui')) return 'vendor-mui';
          if (id.includes('lottie')) return 'vendor-lottie';
          if (id.includes('fabric')) return 'vendor-fabric';
          if (id.includes('socket.io')) return 'vendor-socket';
        },
      },
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:2101',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, ''),
      },
      '/document': {
        target: 'http://127.0.0.1:2102',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/document/, ''),
      },
      '/esign': {
        target: 'http://127.0.0.1:2103',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esign/, ''),
      },
      '/api/e-sign': {
        target: 'http://127.0.0.1:2103',
        changeOrigin: true,
      },
      '/pdf': {
        target: 'http://127.0.0.1:2104',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pdf/, ''),
      },
      '/subscription': {
        target: 'http://127.0.0.1:2110',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/subscription/, ''),
      },
      '/organization': {
        target: 'http://127.0.0.1:2111',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/organization/, ''),
      },
      '/api/pdf-service': {
        target: 'http://127.0.0.1:2104',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pdf-service/, ''),
      },
      '/admin': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true,
        bypass(req) {
          // SPA route — do not proxy to admin-service (would return 401 JSON)
          const path = req.url?.split('?')[0] || '';
          if (path === '/admin/login' || path.startsWith('/admin/login/')) {
            return '/index.html';
          }
        },
      },
      '/api/api-service': {
        target: 'http://127.0.0.1:2105',
        changeOrigin: true,
      },
    },
  },
})