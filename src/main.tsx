import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ThemeProvider'

if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual'
  if (window.location.pathname === '/' && window.location.hash === '#chat') {
    window.history.replaceState(window.history.state, '', '/')
  }
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
