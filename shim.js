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

window.addEventListener = window.addEventListener || (() => {})
window.removeEventListener = window.removeEventListener || (() => {})
