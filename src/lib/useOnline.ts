import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

// False when the browser knows it has no network. Forms use this to disable
// their submit buttons. (true only means "connected to something", so saving
// must still handle failed requests.)
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}
