import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/pdfjsWorker'
import App from './App.tsx'
import './App.css'
import './style.css'

import { BRAND } from './config/brand'
import { redirectEsignPublicHostIfNeeded } from './config/appMode'

;(globalThis as typeof globalThis & { BRAND: typeof BRAND }).BRAND = BRAND

redirectEsignPublicHostIfNeeded()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
