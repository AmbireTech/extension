/* eslint-disable */
import { install } from 'react-native-quick-crypto'
install()

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

if (typeof window === 'undefined') {
  global.window = global
}

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

if (typeof document === 'undefined') {
  global.document = {
    location: global.location
  }
}

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

// Event listener shims for mobile app compatibility for cetain common files between web and mobile
window.addEventListener = window.addEventListener || (() => {})
window.removeEventListener = window.removeEventListener || (() => {})
document.addEventListener = document.addEventListener || (() => {})
document.removeEventListener = document.removeEventListener || (() => {})
document.querySelector = document.querySelector || (() => {})
document.querySelectorAll = document.querySelectorAll || (() => {})
