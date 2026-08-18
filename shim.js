/* eslint-disable */
import { getRandomValues, install } from 'react-native-quick-crypto'
install()

// Every secret the wallet generates - the keystore main key, seed phrases, scrypt salts, AES IVs -
// traces back to this one function, and two of the polyfills below compete for it: whichever runs last
// owns `global.crypto.getRandomValues`. react-native-get-random-values only claims the slot if it is
// still empty, but when it does own it and its native module is unreachable it answers from a
// Math.random() loop, with a console warning and nothing more.
//
// `install()` wins because every import in this file is hoisted above it, so all of them have already
// run by the time it assigns. That ordering is invisible in the source and one bare import moved
// around would silently flip it, so it is asserted rather than trusted. Failing to boot is the right
// outcome here: a build that could seed keys from a non-cryptographic source must never ship.
if (global.crypto.getRandomValues !== getRandomValues)
  throw new Error(
    'shim.js: global.crypto.getRandomValues is not the one from react-native-quick-crypto, so key generation could fall back to a non-cryptographic random source. Refusing to start.'
  )

// 3. Ethers/Legacy shims
// Keep these for ethers v5/v6 compatibility until you fully migrate
import 'react-native-get-random-values'
import '@ethersproject/shims'

// 4. Basic Node process polyfills
if (typeof process === 'undefined') {
  global.process = require('process')
} else {
  const bProcess = require('process')
  for (const p in bProcess) {
    if (!(p in process)) process[p] = bProcess[p]
  }
}
process.browser = false

// ─────────────────────────────────────────────────────────────────────────────
// Location shim
// ─────────────────────────────────────────────────────────────────────────────
if (typeof location === 'undefined') {
  global.location = {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: '',
    protocol: 'https:',
    hostname: 'localhost'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Document shim
//
// Provides a minimal document object for common code shared between web and
// mobile (e.g. useSyncedState, EthereumProvider, Dropdown, Select components).
// Bare `document.X` references resolve here via global/globalThis lookup.
// ─────────────────────────────────────────────────────────────────────────────
const documentShim = {
  location: global.location,
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  visibilityState: 'visible',
  readyState: 'complete',
  hidden: false,
  body: {
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    removeChild: () => {}
  },
  documentElement: {
    classList: { add: () => {}, remove: () => {} }
  },
  head: null,
  title: '',
  createElement: () => ({
    setAttribute() {},
    appendChild() {},
    removeChild() {},
    click() {},
    remove() {},
    style: {},
    classList: { add() {}, remove() {} }
  })
}

global.document = documentShim

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
// (the shim above) because JS identifier resolution goes through the scope
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

// ─────────────────────────────────────────────────────────────────────────────
// Additional global shims
// ─────────────────────────────────────────────────────────────────────────────
if (typeof MutationObserver === 'undefined') {
  global.MutationObserver = class {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return []
    }
  }
}

if (typeof CustomEvent === 'undefined') {
  global.CustomEvent = class {
    constructor(type, options) {
      this.type = type
      this.detail = options?.detail || {}
    }
  }
}

// Typo handling because of certain library errors
if (typeof CustomeEvent === 'undefined') {
  global.CustomeEvent = global.CustomEvent
}

// Window-level event listener shims for mobile app compatibility.
// These are set on global (which the Proxy forwards for non-document props).
global.addEventListener = global.addEventListener || (() => {})
global.removeEventListener = global.removeEventListener || (() => {})
global.close = global.close || (() => {})
