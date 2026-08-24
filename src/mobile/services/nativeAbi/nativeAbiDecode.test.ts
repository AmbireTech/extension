/* eslint-disable @typescript-eslint/no-require-imports */
// The Rust ABI codec does not exist under jest, so it is stood in for here by
// one that answers correctly but only through the real wire format: an ABI as a
// JSON string, arguments and results as richJson. What that leaves under test is
// everything between viem's call signature and that boundary — the ABI
// serialisation and its cache, the richJson round trip for bigints and nested
// tuples, the void-function result, and the handover back to viem — which is
// where a value can be lost without either side being wrong.
//
// The Rust codec itself can only be checked on a device, so a mismatch there
// would not show up here. That is what `VERIFY_AGAINST_VIEM` in the module under
// test is for.

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import {
  parse as richParse,
  stringify as richStringify
} from '@ambire-common/libs/richJson/richJson'

const viemEncode = (
  require('@viem-original/encodeFunctionData') as { encodeFunctionData: (params: any) => any }
).encodeFunctionData
const viemDecode = (
  require('@viem-original/decodeFunctionResult') as { decodeFunctionResult: (params: any) => any }
).decodeFunctionResult
// Return data is the outputs with no selector in front, which is what
// `encodeFunctionData` cannot build. Taken from the barrel because no shim
// replaces this one.
const { encodeAbiParameters } = require('viem') as {
  encodeAbiParameters: (params: any[], values: any[]) => `0x${string}`
}

const AbiError_Tags = { AmbiguousOverload: 'AmbiguousOverload', UnsupportedType: 'UnsupportedType' }

/** What the stand-in was asked to do, so the handover rules can be asserted. */
const nativeCalls: { fn: string; abiJson: string; functionName: string }[] = []
/** Set by a test to make the stand-in refuse, the way Rust refuses. */
let nativeRefusal: { tag?: string } | null = null

jest.mock('@mobile/services/nativeCrypto/nativeCrypto', () => ({
  nativeCrypto: {
    AbiError_Tags: { AmbiguousOverload: 'AmbiguousOverload', UnsupportedType: 'UnsupportedType' },

    // Both of these answer only from what crossed the boundary: the ABI is
    // re-parsed from the JSON string rather than closed over, so a broken
    // `abiToJson` cannot be papered over by the stand-in.
    decodeFunctionResult: (abiJson: string, functionName: string, data: string) => {
      ;(global as any).__nativeCalls.push({ fn: 'decode', abiJson, functionName })
      if ((global as any).__nativeRefusal()) throw (global as any).__nativeRefusal()

      const decoded = (global as any).__viemDecode({
        abi: JSON.parse(abiJson),
        functionName,
        data
      })

      return (global as any).__richStringify(decoded === undefined ? null : decoded)
    },

    encodeFunctionData: (abiJson: string, functionName: string, argsJson: string) => {
      ;(global as any).__nativeCalls.push({ fn: 'encode', abiJson, functionName })
      if ((global as any).__nativeRefusal()) throw (global as any).__nativeRefusal()

      return (global as any).__viemEncode({
        abi: JSON.parse(abiJson),
        functionName,
        args: (global as any).__richParse(argsJson)
      })
    }
  }
}))

// Reached from inside the mock factory, which jest hoists above the imports.
Object.assign(global as any, {
  __nativeCalls: nativeCalls,
  __nativeRefusal: () => nativeRefusal,
  __viemDecode: viemDecode,
  __viemEncode: viemEncode,
  __richStringify: richStringify,
  __richParse: richParse
})

const { makeNativeDecodeFunctionResult, makeNativeEncodeFunctionData } =
  require('@mobile/services/nativeAbi/nativeAbiDecode') as typeof import('@mobile/services/nativeAbi/nativeAbiDecode')

const shimEncode = makeNativeEncodeFunctionData(viemEncode)
const shimDecode = makeNativeDecodeFunctionResult(viemDecode)

const ADDRESS_A = '0x77777777789A8BBEE6C64381e5E89E501fb0e4c8'
const ADDRESS_B = '0x8ba1f109551bD432803012645Ac136ddd64DBA72'

const outputs = (types: { type: string; components?: any[]; name?: string }[]) => types

/**
 * One case per ABI shape the wallet actually decodes, plus the ones that decide
 * whether a value survives richJson: a bigint, a negative int, a nested tuple,
 * an array of tuples, and a function with no outputs at all.
 */
const CASES: {
  name: string
  abi: any[]
  functionName: string
  args: any[]
  /** What the outputs decode to, which is a different shape from the inputs. */
  returnValues: any[]
}[] = [
  {
    name: 'uint256 balance',
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ type: 'address', name: 'owner' }],
        outputs: outputs([{ type: 'uint256' }])
      }
    ],
    functionName: 'balanceOf',
    args: [ADDRESS_A],
    returnValues: [123456789012345678901234567890n]
  },
  {
    name: 'many uint256, as a BalanceGetter response',
    abi: [
      {
        type: 'function',
        name: 'getBalances',
        stateMutability: 'view',
        inputs: [
          { type: 'address', name: 'owner' },
          { type: 'address[]', name: 'tokens' }
        ],
        outputs: outputs([{ type: 'uint256[]' }])
      }
    ],
    functionName: 'getBalances',
    args: [ADDRESS_A, [ADDRESS_A, ADDRESS_B]],
    returnValues: [[0n, 1n, 2n ** 255n - 1n, 10n ** 18n]]
  },
  {
    name: 'negative int256',
    abi: [
      {
        type: 'function',
        name: 'delta',
        stateMutability: 'view',
        inputs: [{ type: 'int256', name: 'amount' }],
        outputs: outputs([{ type: 'int256' }])
      }
    ],
    functionName: 'delta',
    args: [-123456789012345678901234567890n],
    returnValues: [-(2n ** 255n)]
  },
  {
    name: 'string, bool, bytes and bytes32 together',
    abi: [
      {
        type: 'function',
        name: 'meta',
        stateMutability: 'view',
        inputs: [
          { type: 'string', name: 'symbol' },
          { type: 'bool', name: 'flag' },
          { type: 'bytes', name: 'blob' },
          { type: 'bytes32', name: 'salt' }
        ],
        outputs: outputs([
          { type: 'string' },
          { type: 'bool' },
          { type: 'bytes' },
          { type: 'bytes32' }
        ])
      }
    ],
    functionName: 'meta',
    // A non-ASCII symbol, since the boundary is a UTF-8 one on the Rust side.
    args: ['Tether₮', true, '0xdeadbeef', `0x${'ab'.repeat(32)}`],
    returnValues: ['Tether₮ USD', false, `0x${'cd'.repeat(600)}`, `0x${'ef'.repeat(32)}`]
  },
  {
    name: 'nested tuple',
    abi: [
      {
        type: 'function',
        name: 'position',
        stateMutability: 'view',
        inputs: [
          {
            type: 'tuple',
            name: 'input',
            components: [
              { type: 'address', name: 'token' },
              {
                type: 'tuple',
                name: 'amounts',
                components: [
                  { type: 'uint256', name: 'principal' },
                  { type: 'int256', name: 'pnl' }
                ]
              }
            ]
          }
        ],
        outputs: outputs([{ type: 'uint256' }])
      }
    ],
    functionName: 'position',
    args: [{ token: ADDRESS_A, amounts: { principal: 2n ** 200n, pnl: -1n } }],
    returnValues: [2n ** 128n]
  },
  {
    name: 'array of tuples, as an NFTGetter response',
    abi: [
      {
        type: 'function',
        name: 'collectibles',
        stateMutability: 'view',
        inputs: [{ type: 'address', name: 'owner' }],
        outputs: outputs([
          {
            type: 'tuple[]',
            components: [
              { type: 'uint256', name: 'id' },
              { type: 'string', name: 'uri' },
              { type: 'address', name: 'collection' }
            ]
          }
        ])
      }
    ],
    functionName: 'collectibles',
    args: [ADDRESS_B],
    returnValues: [
      [
        { id: 1n, uri: 'ipfs://one', collection: ADDRESS_A },
        { id: 2n ** 96n, uri: '', collection: ADDRESS_B }
      ]
    ]
  },
  {
    name: 'no outputs at all',
    abi: [
      {
        type: 'function',
        name: 'poke',
        stateMutability: 'nonpayable',
        inputs: [{ type: 'uint8', name: 'amount' }],
        outputs: outputs([])
      }
    ],
    functionName: 'poke',
    args: [7],
    returnValues: []
  }
]

/** Return data for a case, built with viem so the decode has something real. */
const returnDataFor = ({
  abi,
  functionName,
  returnValues
}: (typeof CASES)[number]): `0x${string}` => {
  const item = abi.find((entry) => entry.name === functionName)!

  if (!item.outputs.length) return '0x'

  return encodeAbiParameters(item.outputs, returnValues)
}

describe('native ABI codec wrappers', () => {
  beforeEach(() => {
    nativeCalls.length = 0
    nativeRefusal = null
  })

  describe('encodeFunctionData matches viem', () => {
    test.each(CASES)('$name', (testCase) => {
      const params = { abi: testCase.abi, functionName: testCase.functionName, args: testCase.args }

      expect(shimEncode(params)).toBe(viemEncode(params))
      expect(nativeCalls.map((call) => call.fn)).toEqual(['encode'])
    })
  })

  describe('decodeFunctionResult matches viem', () => {
    test.each(CASES)('$name', (testCase) => {
      // The args of a case are its inputs, so the output data is built from the
      // outputs and only then decoded.
      const params = {
        abi: testCase.abi,
        functionName: testCase.functionName,
        data: returnDataFor(testCase)
      }

      expect(shimDecode(params)).toEqual(viemDecode(params))
      expect(nativeCalls.map((call) => call.fn)).toEqual(['decode'])
    })
  })

  test('serializes the ABI once per object, however many calls it serves', () => {
    const { abi, functionName, args } = CASES[0]!

    shimEncode({ abi, functionName, args })
    shimEncode({ abi, functionName, args })
    shimEncode({ abi, functionName, args })

    expect(nativeCalls).toHaveLength(3)
    // The same string every time, which is what the WeakMap is for. A rebuilt
    // one would still be equal, so identity is what proves the cache is used.
    const [first, second, third] = nativeCalls.map((call) => call.abiJson)
    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  test('leaves a call with no function name to viem', () => {
    const case0 = CASES[0]!
    const { abi, args } = case0
    const data = returnDataFor(case0)

    // A single-function ABI is one viem can resolve on its own, so both sides
    // answer rather than throw and the results have to match.
    expect(shimEncode({ abi, args })).toBe(viemEncode({ abi, args } as any))
    expect(shimDecode({ abi, data })).toEqual(viemDecode({ abi, data } as any))
    expect(nativeCalls).toEqual([])
  })

  test('leaves a decode with non-string data to viem', () => {
    const { abi, functionName } = CASES[0]!

    expect(() => shimDecode({ abi, functionName, data: undefined })).toThrow()
    expect(nativeCalls).toEqual([])
  })

  describe('hands back to viem when the native side refuses', () => {
    test.each([
      ['an expected handover', { tag: AbiError_Tags.AmbiguousOverload }, false],
      ['an unsupported type', { tag: AbiError_Tags.UnsupportedType }, false],
      ['an unexpected failure', { tag: 'Corrupt' }, true]
    ])('%s', (_label, refusal, shouldReport) => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      const { abi, functionName, args } = CASES[0]!
      nativeRefusal = refusal as { tag?: string }

      try {
        expect(shimEncode({ abi, functionName, args })).toBe(
          viemEncode({ abi, functionName, args })
        )
        // Only a genuine failure is worth reporting; a handover is routine.
        expect(consoleError.mock.calls.length > 0).toBe(shouldReport)
      } finally {
        consoleError.mockRestore()
      }
    })
  })

  test('propagates viem error when both sides refuse the data', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { abi, functionName } = CASES[0]!
    nativeRefusal = { tag: AbiError_Tags.UnsupportedType }

    try {
      expect(() => shimDecode({ abi, functionName, data: '0xnothex' })).toThrow()
    } finally {
      consoleError.mockRestore()
    }
  })
})
