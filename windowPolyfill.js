// Runs as a Metro polyfill, ahead of React Native's InitializeCore: since RN 0.88 `setUpGlobals`
// defines `window` as a read-only, non-configurable global, unless one is already defined.
// Polyfills run without the module system, so this file must not import anything.

// ─────────────────────────────────────────────────────────────────────────────
// Window Proxy — hides `document` from `window.X` access
//
// WHY: @walletconnect/window-getters reads `window.document` via
// getFromWindow('document'). If it's truthy, getDocumentOrThrow() returns it,
// and getWindowMetadata() proceeds to call doc.getElementsByTagName('link')
// which crashes because our shim doesn't implement full DOM.
//
// By making `window.document` return `undefined`, getDocumentOrThrow() throws,
// getWindowMetadata() catches and returns null, and populateAppMetadata falls
// back to user-provided metadata (which WalletKit.init({ metadata }) supplies).
//
// Bare `document` (no `window.` prefix) still resolves to global.document
// (the shim in shim.js) because JS identifier resolution goes through the scope
// chain / globalThis, NOT through this Proxy.
//
// navigator, location, localStorage, addEventListener, etc. pass through
// unchanged so RN-specific and benign reads keep working.
// ─────────────────────────────────────────────────────────────────────────────
global.window = new Proxy(global, {
  get(target, prop, receiver) {
    if (prop === 'document') return undefined
    return Reflect.get(target, prop, receiver)
  },
  has(target, prop) {
    if (prop === 'document') return false
    return Reflect.has(target, prop)
  }
  // default set/defineProperty/deleteProperty pass through so WC SDK can do
  // window.X = ... assignments without breaking.
})
