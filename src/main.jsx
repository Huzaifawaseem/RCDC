import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import TimeLogger from './TimeLogger';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <TimeLogger />
  </StrictMode>,
)
