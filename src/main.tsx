import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import App from './App'
import { isDesktop } from './desktop/client'
import WorkspaceTheme from './components/WorkspaceTheme'
import './styles/tokens.css'
import './styles/global.css'
import './styles/workspace-theme.css'

// This entrypoint mounts once; it is not a Fast Refresh component module.
// eslint-disable-next-line react-refresh/only-export-components
const DesktopApp = lazy(() => import('./desktop/DesktopApp'))
// eslint-disable-next-line react-refresh/only-export-components
const MobileApp = lazy(() => import('./mobile/MobileApp'))
const isMobile = location.pathname === '/mobile' || location.pathname.startsWith('/mobile/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {!isMobile && <WorkspaceTheme />}
    <Suspense fallback={<div className="boot" />}>
      {isMobile ? <MobileApp /> : isDesktop ? <DesktopApp /> : <App />}
    </Suspense>
  </StrictMode>,
)
