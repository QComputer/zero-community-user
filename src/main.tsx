import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/theme-provider.tsx'
import './i18n/i18n.ts'

// Set direction based on language
const setDirection = () => {
  const html = document.documentElement;
  html.dir = 'rtl';
  html.lang = 'fa';
};

setDirection();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)