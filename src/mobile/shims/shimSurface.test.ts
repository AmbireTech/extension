/* eslint-disable @typescript-eslint/no-require-imports */
// Every shim in this folder replaces a whole module, so an export the original
// grows and the shim does not is silently lost at runtime: Metro serves the
// shim and the missing name comes back undefined at the call site, with nothing
// pointing back to here. That is the failure this file exists to catch, and it
// can only happen on a dependency upgrade, which is why the versions the shims
// were written against are pinned below.

import { describe, expect, test } from '@jest/globals'

// react-native-quick-crypto ships untransformed ESM, which the scrypt-js and
// pbkdf2 shims import at module scope. Only their export lists are under test
// here, so the module is stubbed rather than transformed.
jest.mock(
  'react-native-quick-crypto',
  () => ({
    scrypt: jest.fn(),
    scryptSync: jest.fn(),
    pbkdf2: jest.fn(),
    pbkdf2Sync: jest.fn()
  }),
  { virtual: true }
)

const ROOT = require('path').resolve(__dirname, '../../..')

/**
 * The version each shim was written against. A bump here is the prompt to
 * re-read the module being replaced, not just to update the number.
 */
const PINNED_VERSIONS: Record<string, string> = {
  viem: '2.45.2',
  'scrypt-js': '3.0.1',
  pbkdf2: '3.1.5',
  'eth-crypto': '2.8.0'
}

type ShimCase = {
  name: string
  shim: string
  original: string
  /** Names the shim adds on top of the original, and why it is allowed to. */
  shimOnly?: string[]
}

const SHIMS: ShimCase[] = [
  {
    name: 'viem/getAddress',
    shim: '@mobile/shims/viem/getAddress',
    original: `${ROOT}/node_modules/viem/_cjs/utils/address/getAddress.js`
  },
  {
    name: 'viem/encodeFunctionData',
    shim: '@mobile/shims/viem/encodeFunctionData',
    original: `${ROOT}/node_modules/viem/_cjs/utils/abi/encodeFunctionData.js`
  },
  {
    name: 'viem/decodeFunctionResult',
    shim: '@mobile/shims/viem/decodeFunctionResult',
    original: `${ROOT}/node_modules/viem/_cjs/utils/abi/decodeFunctionResult.js`
  },
  {
    name: 'scrypt-js',
    shim: '@mobile/shims/scrypt-js',
    original: `${ROOT}/node_modules/scrypt-js/scrypt.js`,
    // The package is imported as `import scrypt from 'scrypt-js'` in places, so
    // the shim carries a default export the CommonJS original does not have.
    shimOnly: ['default']
  },
  {
    name: 'pbkdf2',
    shim: '@mobile/shims/pbkdf2',
    original: `${ROOT}/node_modules/pbkdf2/index.js`
  },
  {
    name: 'eth-crypto',
    shim: '@mobile/shims/eth-crypto',
    original: `${ROOT}/node_modules/eth-crypto/dist/lib/index.js`
  },
  {
    name: 'colibri',
    shim: '@mobile/shims/colibri',
    original: `${ROOT}/src/ambire-common/src/services/provider/colibri.ts`
  }
]

const exportsOf = (modulePath: string): string[] =>
  Object.keys(require(modulePath))
    .filter((name) => name !== '__esModule')
    .sort()

describe('mobile shims', () => {
  describe('replace every export of the module they stand in for', () => {
    test.each(SHIMS)('$name', ({ shim, original, shimOnly = [] }) => {
      const originalExports = exportsOf(original)
      const shimExports = exportsOf(shim)

      expect(originalExports.length).toBeGreaterThan(0)

      // The direction that breaks the app: a name callers can reach on the real
      // module but not on the shim.
      expect(originalExports.filter((name) => !shimExports.includes(name))).toEqual([])

      // The other direction is harmless at runtime but means the shim and the
      // module have drifted apart, so it has to be declared rather than appear.
      expect(shimExports.filter((name) => !originalExports.includes(name)).sort()).toEqual(
        [...shimOnly].sort()
      )
    })
  })

  describe('keep each replaced export the same kind of value', () => {
    test.each(SHIMS)('$name', ({ shim, original }) => {
      const originalModule = require(original)
      const shimModule = require(shim)

      exportsOf(original).forEach((name) => {
        expect(`${name}: ${typeof shimModule[name]}`).toBe(
          `${name}: ${typeof originalModule[name]}`
        )
      })
    })
  })

  describe('are pinned to the dependency version they were written against', () => {
    test.each(Object.entries(PINNED_VERSIONS))('%s', (packageName, expectedVersion) => {
      const { version } = require(`${ROOT}/node_modules/${packageName}/package.json`)

      expect(version).toBe(expectedVersion)
    })
  })
})
