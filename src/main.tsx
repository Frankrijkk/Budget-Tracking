import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// registerType: 'autoUpdate' auto-reloads once a new service worker
// activates, but the browser only checks the server for a changed sw.js at
// registration time by default -- if the installed app is reopened from the
// background rather than cold-started, a deploy pushed while it was
// backgrounded can go undetected indefinitely, serving stale JS/CSS (the
// "edge function 401", "blank Stats page" class of bugs this app hit
// repeatedly during development). registration.update() forces that
// server check; call it on every foreground and every 60s while
// foregrounded so an update is never more than a minute stale.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return

    const checkForUpdate = () => {
      registration.update().catch(() => {
        // offline or check failed -- next check will retry
      })
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })

    setInterval(() => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }, 60_000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
