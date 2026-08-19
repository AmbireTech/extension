import { useSyncExternalStore } from 'react'

// The in-app browser registers a handler here while its WebView has page history.
// The app-level back gesture and Android back button consult it first, so back
// walks the page history before popping the route (e.g. back to the apps catalog).
const state: { goBack: (() => void) | null } = { goBack: null }

const listeners = new Set<() => void>()

export const setWebViewGoBackHandler = (handler: (() => void) | null) => {
  if (state.goBack === handler) return

  state.goBack = handler
  listeners.forEach((notify) => notify())
}

// Returns whether the back action was consumed by the WebView's page history.
export const goBackInWebViewHistory = () => {
  if (!state.goBack) return false

  state.goBack()

  return true
}

/**
 * Whether the in-app browser currently has page history to walk back through.
 * Reactive, because the navigation stack has to hand the back swipe to the page
 * while there is history and to the platform - which pops the route - once there
 * is not.
 */
export const useCanGoBackInWebViewHistory = () =>
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)

      return () => {
        listeners.delete(onChange)
      }
    },
    () => state.goBack !== null
  )
