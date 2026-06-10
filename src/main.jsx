import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

// Mount the React application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AppProvider wraps the entire app — all pages share context */}
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
