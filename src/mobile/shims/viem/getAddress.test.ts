/* eslint-disable @typescript-eslint/no-require-imports */
// The shim routes checksumming into Rust, which does not exist under jest, so
// the turbo-module is replaced here by an independent EIP-55 implementation
// built on ethers' keccak. That is what makes this a differential test rather
// than a tautology: viem and the stand-in agree on a well-formed address and
// disagree on everything else, so any input the shim wrongly lets through the
// native path shows up as a mismatch against viem.
//
// What is under test is therefore the part of the shim that is not the hash:
// which inputs may take the native path, the cache, and the fallback for input
// the native side refuses. The Rust codec itself can only be checked on a
// device.

import { keccak256, toUtf8Bytes } from 'ethers'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

const HEX_PREFIX = '0x'
const ADDRESS_HEX_DIGITS = 40
const UPPER_CASE_FROM_NIBBLE = 8

const isHexDigit = (character: string): boolean =>
  (character >= '0' && character <= '9') ||
  (character >= 'a' && character <= 'f') ||
  (character >= 'A' && character <= 'F')

const isPlainHexAddress = (value: string): boolean => {
  if (!value.startsWith(HEX_PREFIX)) return false
  if (value.length !== HEX_PREFIX.length + ADDRESS_HEX_DIGITS) return false

  for (let index = HEX_PREFIX.length; index < value.length; index += 1) {
    if (!isHexDigit(value[index]!)) return false
  }

  return true
}

/**
 * EIP-55 checksum, written out rather than taken from viem or ethers so a
 * mismatch cannot come from the two sides sharing an implementation. Throws for
 * anything that is not a 20-byte hex address, which is what the Rust crate does
 * and what the shim has to be ready for.
 */
const referenceChecksum = (address: string): string => {
  if (!isPlainHexAddress(address)) throw new Error(`not an address: ${address}`)

  const body = address.slice(HEX_PREFIX.length).toLowerCase()
  const hash = keccak256(toUtf8Bytes(body)).slice(HEX_PREFIX.length)
  let result = HEX_PREFIX

  for (let index = 0; index < body.length; index += 1) {
    const nibble = parseInt(hash[index]!, 16)

    result += nibble >= UPPER_CASE_FROM_NIBBLE ? body[index]!.toUpperCase() : body[index]!
  }

  return result
}

const checksumCalls: string[] = []

jest.mock('@mobile/services/nativeCrypto/nativeCrypto', () => ({
  nativeCrypto: {
    checksumAddress: (address: string) => {
      ;(global as any).__checksumCalls.push(address)

      return module.exports.__reference(address)
    }
  }
}))

// Reached from inside the mock factory, which jest hoists above the imports.
;(global as any).__checksumCalls = checksumCalls
module.exports.__reference = referenceChecksum

const shim = require('@mobile/shims/viem/getAddress') as {
  checksumAddress: (address: string, chainId?: number) => string
  getAddress: (address: string, chainId?: number) => string
}
const viem = require('@viem-original/getAddress') as {
  checksumAddress: (address: string, chainId?: number) => string
  getAddress: (address: string, chainId?: number) => string
}

/** Deterministic PRNG, so a failing corpus is the same one on the next run. */
const makeRandom = (seed: number) => {
  let state = seed

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff

    return state / 0x7fffffff
  }
}

const HEX_DIGITS = '0123456789abcdef'

const randomAddressBody = (random: () => number): string => {
  let body = ''

  for (let index = 0; index < ADDRESS_HEX_DIGITS; index += 1) {
    body += HEX_DIGITS[Math.floor(random() * HEX_DIGITS.length)]
  }

  return body
}

const randomiseCase = (value: string, random: () => number): string =>
  value
    .split('')
    .map((character) => (random() < 0.5 ? character.toUpperCase() : character.toLowerCase()))
    .join('')

/**
 * Inputs a real caller can produce, plus the ones that decide whether the
 * native path may be taken at all: a missing prefix, a wrong length, a
 * non-hex character, and the EIP-1191 chain variants.
 */
const buildCorpus = (): { address: string; chainId?: number }[] => {
  const random = makeRandom(20260821)
  const corpus: { address: string; chainId?: number }[] = []

  for (let index = 0; index < 400; index += 1) {
    const body = randomAddressBody(random)
    const checksummed = referenceChecksum(`${HEX_PREFIX}${body}`)

    corpus.push({ address: `${HEX_PREFIX}${body}` })
    corpus.push({ address: `${HEX_PREFIX}${body.toUpperCase()}` })
    corpus.push({ address: checksummed })
    corpus.push({ address: `${HEX_PREFIX}${randomiseCase(body, random)}` })
    // Same address twice, so a wrong cache key shows up as a wrong answer.
    corpus.push({ address: checksummed })
    // Prefixless, which viem checksums by dropping the first two digits.
    corpus.push({ address: body })
    corpus.push({ address: `0X${body}` })
    corpus.push({ address: `${HEX_PREFIX}${body.slice(1)}` })
    corpus.push({ address: `${HEX_PREFIX}${body}0` })
    corpus.push({ address: `${HEX_PREFIX}${body.slice(0, -1)}z` })
    // EIP-1191, which must stay on viem: mainnet, RSK, and RSK testnet.
    corpus.push({ address: `${HEX_PREFIX}${body}`, chainId: 1 })
    corpus.push({ address: checksummed, chainId: 30 })
    corpus.push({ address: `${HEX_PREFIX}${body}`, chainId: 31 })
  }

  const edgeCases = ['', HEX_PREFIX, '0X', '0x0', 'not an address', `${HEX_PREFIX}ü`.repeat(20)]
  edgeCases.forEach((address) => corpus.push({ address }))

  return corpus
}

const CORPUS = buildCorpus()

/** The value or the thrown error's name, so both outcomes compare as one. */
const outcomeOf = (run: () => string): string => {
  try {
    return `value:${run()}`
  } catch (error: any) {
    return `throw:${error?.name}:${error?.shortMessage ?? error?.message}`
  }
}

describe('viem getAddress shim', () => {
  beforeEach(() => {
    checksumCalls.length = 0
  })

  test('reproduces viem checksumAddress for every input in the corpus', () => {
    const mismatches = CORPUS.filter(
      ({ address, chainId }) =>
        outcomeOf(() => shim.checksumAddress(address, chainId)) !==
        outcomeOf(() => viem.checksumAddress(address, chainId))
    )

    expect(mismatches).toEqual([])
    expect(CORPUS.length).toBeGreaterThan(5000)
  })

  test('reproduces viem getAddress for every input in the corpus', () => {
    const mismatches = CORPUS.filter(
      ({ address, chainId }) =>
        outcomeOf(() => shim.getAddress(address, chainId)) !==
        outcomeOf(() => viem.getAddress(address, chainId))
    )

    expect(mismatches).toEqual([])
  })

  test('takes the native path for a plain address and only for a plain address', () => {
    const address = referenceChecksum(`${HEX_PREFIX}${'ab'.repeat(20)}`)

    shim.checksumAddress(address)
    expect(checksumCalls).toEqual([address])

    checksumCalls.length = 0
    // A chain id selects EIP-1191, which the shim must not send to Rust.
    shim.checksumAddress(address, 30)
    // Prefixless, which viem interprets differently than Rust would.
    shim.checksumAddress('ab'.repeat(20))
    shim.checksumAddress('')
    expect(checksumCalls).toEqual([])
  })

  test('caches so a repeated address crosses into the native side once', () => {
    const address = referenceChecksum(`${HEX_PREFIX}${'cd'.repeat(20)}`)

    const first = shim.checksumAddress(address)
    const second = shim.checksumAddress(address)
    const third = shim.getAddress(address)

    expect([second, third]).toEqual([first, first])
    expect(checksumCalls).toEqual([address])
  })

  test('falls back to viem when the native side refuses the address', () => {
    // 40 hex digits, so the shim's own gate lets it through, but the stand-in
    // throws for it the way the Rust crate throws for what it cannot parse.
    const address = `${HEX_PREFIX}${'ef'.repeat(20)}`
    const reference = module.exports.__reference
    module.exports.__reference = () => {
      throw new Error('native refused')
    }

    try {
      expect(shim.checksumAddress(address)).toBe(viem.checksumAddress(address))
      expect(checksumCalls).toEqual([address])
    } finally {
      module.exports.__reference = reference
    }
  })
})
