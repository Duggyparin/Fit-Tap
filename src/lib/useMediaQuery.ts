import { useCallback, useSyncExternalStore } from 'react'

// Same width as Tailwind's `lg:` breakpoint (64rem = 1024px).
export const DESKTOP_QUERY = '(min-width: 64rem)'

// True while the CSS media query matches. The value is read from
// window.matchMedia during the very first render (so the wrong layout never
// flashes) and updates when the screen crosses the breakpoint.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
