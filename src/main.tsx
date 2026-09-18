import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './lib/store'
import { LocaleProvider } from './i18n'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
)
