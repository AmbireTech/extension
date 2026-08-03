// The in-app browser registers a handler here while its WebView has page history.
// The app-level back gesture and Android back button consult it first, so back
// walks the page history before popping the route (e.g. back to the apps catalog).
const state: { goBack: (() => void) | null } = { goBack: null }

export const setWebViewGoBackHandler = (handler: (() => void) | null) => {
  state.goBack = handler
}

// Returns whether the back action was consumed by the WebView's page history.
export const goBackInWebViewHistory = () => {
  if (!state.goBack) return false

  state.goBack()

  return true
}
