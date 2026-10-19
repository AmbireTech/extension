// The `execTransaction` decoder must accept and refuse exactly what the
// device does: whether a Safe transaction pre-signs a CoW order (and so
// needs a CoW order bundle) is decided on this decode. The encoder below is
// written from the canonical Solidity ABI layout, not by inverting the
// decoder, so a shared bug can't hide.

import { hexToBytes } from '../transport/bytes'
import {
  decodeExecTransaction,
  isSafeExecTransaction,
  SAFE_EXEC_TRANSACTION_SELECTOR
} from './execCalldata'

const GPV2_SETTLEMENT = '0x9008d19f58aabd9ed0d60971565aa8510560ab41'

function word(fill: (w: Uint8Array) => void): Uint8Array {
  const w = new Uint8Array(32)
  fill(w)
  return w
}

function addressWord(addr: string): Uint8Array {
  return word((w) => w.set(hexToBytes(addr), 12))
}

function u256Word(v: bigint): Uint8Array {
  return word((w) => {
    let x = v
    for (let i = 31; i >= 0; i--) {
      w[i] = Number(x & 0xffn)
      x >>= 8n
    }
  })
}

function pad32(b: Uint8Array): Uint8Array {
  const padded = new Uint8Array(Math.ceil(b.length / 32) * 32)
  padded.set(b)
  return padded
}

/** Canonical Solidity encoding of
 *  `execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)`:
 *  10 head words, then the `data` tail at offset 320, then `signatures`. */
function encodeExecTransaction(args: {
  to: string
  value?: bigint
  data: Uint8Array
  operation?: number
  signatures?: Uint8Array
}): Uint8Array {
  const sigs = args.signatures ?? new Uint8Array(0)
  const dataOff = 10 * 32
  const sigsOff = dataOff + 32 + pad32(args.data).length
  const chunks = [
    SAFE_EXEC_TRANSACTION_SELECTOR,
    addressWord(args.to),
    u256Word(args.value ?? 0n),
    u256Word(BigInt(dataOff)),
    u256Word(BigInt(args.operation ?? 0)),
    u256Word(0n), // safeTxGas
    u256Word(0n), // baseGas
    u256Word(0n), // gasPrice
    addressWord('0x' + '00'.repeat(20)), // gasToken
    addressWord('0x' + '00'.repeat(20)), // refundReceiver
    u256Word(BigInt(sigsOff)),
    u256Word(BigInt(args.data.length)),
    pad32(args.data),
    u256Word(BigInt(sigs.length)),
    pad32(sigs)
  ]
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return out
}

/** Strict 164-byte `setPreSignature(orderUid, true)` calldata. */
function presignCalldata(): Uint8Array {
  const cd = new Uint8Array(164)
  cd.set([0xec, 0x6c, 0xb1, 0x3f], 0)
  cd[35] = 0x40 // bytes offset
  cd[67] = 1 // signed = true
  cd[99] = 56 // bytes length
  for (let i = 100; i < 156; i++) cd[i] = 0xab // orderUid
  return cd
}

describe('decodeExecTransaction', () => {
  it('decodes a canonical encoding and extracts the inner call', () => {
    const inner = presignCalldata()
    const cd = encodeExecTransaction({
      to: GPV2_SETTLEMENT,
      value: 7n,
      data: inner,
      operation: 0,
      signatures: new Uint8Array([0xde, 0xad])
    })
    const d = decodeExecTransaction(cd)
    expect(d).not.toBeNull()
    expect(d!.to).toBe(GPV2_SETTLEMENT)
    expect(d!.value).toBe(7n)
    expect(d!.operation).toBe(0)
    expect(Array.from(d!.data)).toEqual(Array.from(inner))
  })

  it('decodes an empty data tail', () => {
    const cd = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: new Uint8Array(0) })
    const d = decodeExecTransaction(cd)
    expect(d).not.toBeNull()
    expect(d!.data.length).toBe(0)
  })

  it('decodes operation=1 (DelegateCall is range-valid; refusal is downstream)', () => {
    const cd = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: new Uint8Array(0), operation: 1 })
    expect(decodeExecTransaction(cd)!.operation).toBe(1)
  })

  it('refuses operation > 1 and a dirty operation word', () => {
    const op2 = encodeExecTransaction({
      to: GPV2_SETTLEMENT,
      data: new Uint8Array(0),
      operation: 2
    })
    expect(decodeExecTransaction(op2)).toBeNull()

    const dirty = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: new Uint8Array(0) })
    dirty[4 + 3 * 32 + 7] = 1 // junk in the upper bytes of the operation word
    expect(decodeExecTransaction(dirty)).toBeNull()
  })

  it('refuses non-canonical address words (to / gasToken / refundReceiver)', () => {
    for (const wordIdx of [0, 7, 8]) {
      const cd = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: new Uint8Array(0) })
      cd[4 + wordIdx * 32 + 5] = 1 // non-zero byte in the 12-byte prefix
      expect(decodeExecTransaction(cd)).toBeNull()
    }
  })

  it('refuses a data offset that points into the head', () => {
    const cd = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: presignCalldata() })
    const w = 4 + 2 * 32
    cd.fill(0, w, w + 32)
    cd[w + 31] = 0x40 // offset 64 — inside the 320-byte head
    expect(decodeExecTransaction(cd)).toBeNull()
  })

  it('refuses out-of-bounds tails', () => {
    const cd = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: presignCalldata() })
    // Point signatures past the end of the calldata.
    const w = 4 + 9 * 32
    cd.fill(0, w, w + 32)
    cd[w + 29] = 0xff
    expect(decodeExecTransaction(cd)).toBeNull()
    // Truncate below the data tail's payload end.
    const ok = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: presignCalldata() })
    expect(decodeExecTransaction(ok.subarray(0, 4 + 320 + 64 + 32))).toBeNull()
  })

  it('refuses short calldata and wrong selectors', () => {
    const cd = encodeExecTransaction({ to: GPV2_SETTLEMENT, data: new Uint8Array(0) })
    // Still an execTransaction to the device, which then refuses it.
    expect(isSafeExecTransaction(cd.subarray(0, 100))).toBe(true)
    expect(decodeExecTransaction(cd.subarray(0, 100))).toBeNull()
    const wrong = cd.slice()
    wrong[0] = wrong[0]! ^ 1
    expect(isSafeExecTransaction(wrong)).toBe(false)
    expect(decodeExecTransaction(wrong)).toBeNull()
  })
})
