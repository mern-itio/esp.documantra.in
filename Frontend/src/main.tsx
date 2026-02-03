import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/pdfjsWorker' // Initialize PDF.js worker globally
import App from './App.tsx'
import './App.css'
// import './style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
