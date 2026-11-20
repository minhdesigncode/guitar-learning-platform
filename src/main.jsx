import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { LangProvider } from './i18n/index.jsx'
import { AuthProvider } from './cloud/auth.jsx'
import './styles.css'
import './motion.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </React.StrictMode>
)
