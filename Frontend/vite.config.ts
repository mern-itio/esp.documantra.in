import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join } from 'path'
import { existsSync, copyFileSync } from 'fs'

// ============================================
// CONFIGURATION MODE: LOCAL or PRODUCTION
// ============================================
// Switch between local and production by commenting/uncommenting the MODE line below
//
// FOR PRODUCTION (react-pdf uses 5.3.93):
//   const MODE = 'PRODUCTION'  // ← Keep this for production builds
//   // const MODE = 'LOCAL'    // ← Comment this out
//
// FOR LOCAL DEVELOPMENT (pdfjs-dist uses 5.4.296):
//   // const MODE = 'PRODUCTION'  // ← Comment this out
//   const MODE = 'LOCAL'         // ← Uncomment this for local dev
//
const MODE = 'PRODUCTION' // ← PRODUCTION: Uses worker 5.3.93 (matches react-pdf)
// const MODE = 'LOCAL'    // ← LOCAL: Uses worker 5.4.296 (matches pdfjs-dist package)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to copy the correct PDF.js worker file based on mode
    {
      name: 'setup-pdf-worker',
      buildStart() {
        try {
          const workerDest = join(process.cwd(), 'public', 'pdf.worker.min.mjs')
          
          if (MODE === 'PRODUCTION') {
            // PRODUCTION MODE: Use version 5.3.93 to match react-pdf
            console.log('🔧 PRODUCTION MODE: Verifying PDF.js worker (version 5.3.93 for react-pdf)')
            
            if (existsSync(workerDest)) {
              console.log('✓ PDF.js worker file exists in public folder')
              console.log('  Expected version: 5.3.93 (for react-pdf compatibility)')
            } else {
              console.warn('⚠ PDF.js worker file NOT FOUND in public folder!')
              console.warn('  For PRODUCTION, you need version 5.3.93')
              console.warn('  Download from: https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.mjs')
              console.warn('  Save to: public/pdf.worker.min.mjs')
            }
          } else {
            // LOCAL MODE: Use version 5.4.296 to match installed pdfjs-dist
            console.log('🔧 LOCAL MODE: Setting up PDF.js worker (version 5.4.296 for pdfjs-dist)')
            
            // Copy from node_modules (version 5.4.296)
            const workerSource = join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
            if (existsSync(workerSource)) {
              copyFileSync(workerSource, workerDest)
              console.log('✓ Copied PDF.js worker 5.4.296 from node_modules to public folder')
            } else {
              console.warn('⚠ PDF.js worker not found in node_modules')
              console.warn('  Please run: npm install')
            }
          }
        } catch (error) {
          console.warn('Failed to setup PDF.js worker file:', error)
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api/pdf-service': {
        target: 'http://165.22.215.73:2104',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pdf-service/, '')
      }
    }
  }
})





// -----------------Production backup-----------------
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import { join } from 'path'
// import { existsSync } from 'fs'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     // Plugin to ensure the correct PDF.js worker file exists in public folder
//     // The worker file (version 5.3.93) should be in public folder to match react-pdf for production
//     {
//       name: 'verify-pdf-worker',
//       buildStart() {
//         try {
//           const workerDest = join(process.cwd(), 'public', 'pdf.worker.min.mjs')
          
//           // Verify the worker file exists (should be version 5.3.93 for react-pdf compatibility)
//           if (existsSync(workerDest)) {
//             console.log('✓ PDF.js worker file verified in public folder (version 5.3.93 for react-pdf)')
//           } else {
//             console.warn('⚠ PDF.js worker file not found in public folder')
//             console.warn('  Downloading version 5.3.93 to match react-pdf...')
//             // Could download here if needed, but file should already exist
//           }
//         } catch (error) {
//           console.warn('Failed to verify PDF.js worker file:', error)
//         }
//       }
//     }
//   ],
//   server: {
//     proxy: {
//       '/api/pdf-service': {
//         target: 'http://localhost:2104',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api\/pdf-service/, '')
//       }
//     }
//   }
// })