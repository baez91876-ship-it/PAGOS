import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const destino = import.meta.env.VITE_APP_URL
if (destino && new URL(destino).origin !== window.location.origin) {
  window.location.replace(destino)
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
