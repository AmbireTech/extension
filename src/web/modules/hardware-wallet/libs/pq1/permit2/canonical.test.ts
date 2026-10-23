// The canonical Permit2 permit refuses what its fields can't hold and what
// the device's framing rules reject, instead of truncating a value or
// sending bytes the device would decode differently. The byte layout itself
// is checked against the firmware's golden payloads in
// `offchain/structuredTypedData.test.ts`.

import {
  PERMIT2_ALLOWANCE_HEAD_LEN,
  PERMIT2_ENTRY_LEN,
  PERMIT2_MAX_TOKENS,
  PERMIT2_TRANSFER_HEAD_LEN,
  PERMIT2_VARIANT_BATCH,
  PERMIT2_VARIANT_BATCH_TRANSFER,
  PERMIT2_VARIANT_SINGLE
} from '../config'
import {
  encodePermit2Canonical,
  readPermit2Framing,
  type Permit2Allowance,
  type Permit2Transfer
} from './canonical'

const SPENDER = '0x6ff5693b99212da76ad316178a184ab56d299b43'
const tokenAt = (i: number): `0x${string}` => `0x${(i + 1).toString(16).padStart(40, '0')}`

const allowance = (tokenCount = 1): Permit2Allowance => ({
  variant: tokenCount === 1 ? PERMIT2_VARIANT_SINGLE : PERMIT2_VARIANT_BATCH,
  chainId: 8453n,
  spender: SPENDER,
  sigDeadline: 1767225600n,
  tokens: Array.from({ length: tokenCount }, (_, i) => ({
    token: tokenAt(i),
    amount: 1n,
    expiration: 0n,
    nonce: 0n
  }))
})

const batchTransfer = (tokenCount: number): Permit2Transfer => ({
  variant: PERMIT2_VARIANT_BATCH_TRANSFER,
  chainId: 1n,
  spender: SPENDER,
  nonce: 0n,
  deadline: 1767225600n,
  tokens: Array.from({ length: tokenCount }, (_, i) => ({ token: tokenAt(i), amount: 1n }))
})

describe('encodePermit2Canonical', () => {
  it('lays a permit out as its head and one entry per token', () => {
    expect(encodePermit2Canonical(allowance())).toHaveLength(
      PERMIT2_ALLOWANCE_HEAD_LEN + PERMIT2_ENTRY_LEN
    )
    expect(encodePermit2Canonical(batchTransfer(PERMIT2_MAX_TOKENS))).toHaveLength(
      PERMIT2_TRANSFER_HEAD_LEN + PERMIT2_MAX_TOKENS * PERMIT2_ENTRY_LEN
    )
  })

  it('refuses a value its field is too narrow for', () => {
    const p = allowance()
    const token = p.tokens[0]!
    const cases: [Permit2Allowance, string][] = [
      [{ ...p, chainId: 1n << 64n }, 'chainId'],
      [{ ...p, tokens: [{ ...token, amount: 1n << 160n }] }, 'amount'],
      [{ ...p, tokens: [{ ...token, expiration: 1n << 48n }] }, 'expiration'],
      [{ ...p, tokens: [{ ...token, nonce: 1n << 48n }] }, 'nonce'],
      [{ ...p, sigDeadline: -1n }, 'sigDeadline']
    ]
    for (const [permit, field] of cases) {
      expect(() => encodePermit2Canonical(permit)).toThrow(`permit2: ${field} doesn't fit`)
    }
    expect(() =>
      encodePermit2Canonical({ ...p, tokens: [{ ...token, amount: (1n << 160n) - 1n }] })
    ).not.toThrow()
  })

  it('refuses a token count the variant does not allow', () => {
    expect(() =>
      encodePermit2Canonical({ ...allowance(2), variant: PERMIT2_VARIANT_SINGLE })
    ).toThrow("can't name 2 tokens")
    expect(() => encodePermit2Canonical(batchTransfer(0))).toThrow("can't name 0 tokens")
    expect(() => encodePermit2Canonical(batchTransfer(PERMIT2_MAX_TOKENS + 1))).toThrow(
      `can't name ${PERMIT2_MAX_TOKENS + 1} tokens`
    )
  })
})

describe('readPermit2Framing', () => {
  it('reads back the variant and token count', () => {
    expect(readPermit2Framing(encodePermit2Canonical(allowance(3)))).toEqual({
      variant: PERMIT2_VARIANT_BATCH,
      count: 3
    })
  })

  it('refuses an unknown variant, a wrong count and a wrong length', () => {
    const canonical = encodePermit2Canonical(allowance())
    const withByte = (offset: number, byte: number) => {
      const copy = canonical.slice()
      copy[offset] = byte
      return copy
    }
    expect(() => readPermit2Framing(withByte(0, 4))).toThrow('unknown variant 4')
    expect(() => readPermit2Framing(withByte(PERMIT2_ALLOWANCE_HEAD_LEN - 1, 2))).toThrow(
      "can't name 2 tokens"
    )
    expect(() => readPermit2Framing(canonical.subarray(0, canonical.length - 1))).toThrow(
      "can't be 113 bytes"
    )
    expect(() => readPermit2Framing(new Uint8Array(0))).toThrow('unknown variant')
  })
})
