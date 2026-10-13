import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

/** /print и ?print=1 — версия под PDF (слайды 1920×1080), отдельный чанк. */
const isPrint =
  new URLSearchParams(window.location.search).has('print') || window.location.pathname.replace(/\/+$/, '').endsWith('/print')
const Print = lazy(() => import('./print/Print'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPrint ? (
      <Suspense fallback={null}>
        <Print />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
