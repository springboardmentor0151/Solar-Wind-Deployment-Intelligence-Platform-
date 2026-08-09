import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: 'rgba(10, 4, 48, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          color: '#fff',
        },
      }}
    />
  </StrictMode>,
)
