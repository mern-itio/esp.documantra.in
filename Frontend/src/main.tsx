import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/pdfjsWorker' // Initialize PDF.js worker globally
import App from './App.tsx'
import './App.css'
// Note: core design tokens & utilities have been moved into `index.css`.
// `style.css` still contains an older Tailwind setup and should not be imported,
// as it conflicts with Tailwind's current configuration and causes build errors.
import './style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
