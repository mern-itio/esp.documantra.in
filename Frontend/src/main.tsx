import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/pdfjsWorker'
import App from './App.tsx'
import './App.css'
import './style.css'

(globalThis as any).BRAND = {
  name: "Documantra"
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
