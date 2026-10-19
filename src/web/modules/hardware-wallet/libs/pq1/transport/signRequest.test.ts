// The SIGN_USEROP / SIGN_USEROP_BATCH builders refuse, as the device would,
// a call that needs a bundle it lacks: a direct CoW presign, a Safe
// approveHash, and a CoW presign inside a Safe transaction — single-call and
// in a MultiSendCallOnly batch. They also lay out the CoW order and Safe
// bundles of one call in the positions the device reads them from.

import { SAFE_EXEC_TRANSACTION_SELECTOR } from '../safe/execCalldata'
import { MULTI_SEND_SELECTOR } from '../safe/multiSend'
import { hexToBytes } from './bytes'
import { buildSignBatchPayload, buildSignPayload, type SignRequestParams } from './signRequest'

const GPV2_SETTLEMENT = '0x9008d19f58aabd9ed0d60971565aa8510560ab41' as `0x${string}`
const MS_CALL_ONLY_130 = '0x40a2accbd92bca938b02010e17a5b8929b49130d' as `0x${string}`
const TOKEN = '0x7070707070707070707070707070707070707070' as `0x${string}`
const SAFE_ADDR = '0x5afe0000000000000000000000000000000000a2' as `0x${string}`
const SENDER = '0x1111111111111111111111111111111111111111' as `0x${string}`
const OTHER_TO = '0x2222222222222222222222222222222222222222' as `0x${string}`

const COW_CANONICAL_LEN = 204 // a CoW order bundle without its ERC-20 legs
const SAFE_V1_CANONICAL_LEN = 281

/** Strict 164-byte `setPreSignature(orderUid, true)` calldata. */
function presignCalldata(): Uint8Array {
  const cd = new Uint8Array(164)
  cd.set([0xec, 0x6c, 0xb1, 0x3f], 0)
  cd[35] = 0x40
  cd[67] = 1
  cd[99] = 56
  for (let i = 100; i < 156; i++) cd[i] = 0xab
  return cd
}

/** 36-byte `approveHash(bytes32)` calldata. */
function approveHashCalldata(): Uint8Array {
  const cd = new Uint8Array(36)
  cd.set([0xd4, 0xd9, 0xbd, 0xcd], 0)
  cd.fill(0x42, 4)
  return cd
}

/** safe_v1 bundle: canonical(281) || u16 raw_data_len || raw_data, with
 *  the SafeTx inner `to` at canonical[28..48) and the operation byte at
 *  canonical[112]. */
function safeV1Bundle(innerTo: `0x${string}`, rawData: Uint8Array, operation = 0): Uint8Array {
  const out = new Uint8Array(SAFE_V1_CANONICAL_LEN + 2 + rawData.length)
  out.set(hexToBytes(innerTo), 28)
  out[112] = operation & 0xff
  out[SAFE_V1_CANONICAL_LEN] = (rawData.length >> 8) & 0xff
  out[SAFE_V1_CANONICAL_LEN + 1] = rawData.length & 0xff
  out.set(rawData, SAFE_V1_CANONICAL_LEN + 2)
  return out
}

/** Pack one multiSend record: `op || to || value(0) || dataLen || data`. */
function packMsRecord(op: number, to: `0x${string}`, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(85 + data.length)
  out[0] = op
  out.set(hexToBytes(to), 1)
  out[53 + 30] = (data.length >> 8) & 0xff
  out[53 + 31] = data.length & 0xff
  out.set(data, 85)
  return out
}

/** Canonical `multiSend(bytes)` calldata around packed records. */
function multiSendCalldata(...records: Uint8Array[]): Uint8Array {
  const packedLen = records.reduce((n, r) => n + r.length, 0)
  const padded = Math.ceil(packedLen / 32) * 32
  const out = new Uint8Array(4 + 64 + padded)
  out.set(MULTI_SEND_SELECTOR, 0)
  out[4 + 31] = 0x20
  out[4 + 32 + 30] = (packedLen >> 8) & 0xff
  out[4 + 32 + 31] = packedLen & 0xff
  let o = 68
  for (const r of records) {
    out.set(r, o)
    o += r.length
  }
  return out
}

/** Strict 68-byte ERC-20 `approve(spender, amount)` calldata. */
function approveCalldata(): Uint8Array {
  const cd = new Uint8Array(68)
  cd.set([0x09, 0x5e, 0xa7, 0xb3], 0)
  cd.set(hexToBytes('0xc92e8bdf79f0507f65a392b0ab4667716bfe0110'), 16)
  cd[67] = 1
  return cd
}

/** The Safe-UI CoW flow batch: approve(vault relayer) + presign. */
function cowMultiSendCalldata(): Uint8Array {
  return multiSendCalldata(
    packMsRecord(0, TOKEN, approveCalldata()),
    packMsRecord(0, GPV2_SETTLEMENT, presignCalldata())
  )
}

/** Canonical `execTransaction(...)` calldata wrapping (innerTo, innerData). */
function execTransactionCalldata(
  innerTo: `0x${string}`,
  innerData: Uint8Array,
  operation = 0
): Uint8Array {
  const pad32 = (b: Uint8Array) => {
    const p = new Uint8Array(Math.ceil(b.length / 32) * 32)
    p.set(b)
    return p
  }
  const word = (v: number | bigint) => {
    const w = new Uint8Array(32)
    let x = BigInt(v)
    for (let i = 31; i >= 0; i--) {
      w[i] = Number(x & 0xffn)
      x >>= 8n
    }
    return w
  }
  const addrWord = (a: string) => {
    const w = new Uint8Array(32)
    w.set(hexToBytes(a), 12)
    return w
  }
  const dataOff = 10 * 32
  const sigsOff = dataOff + 32 + pad32(innerData).length
  const chunks = [
    SAFE_EXEC_TRANSACTION_SELECTOR,
    addrWord(innerTo),
    word(0), // value
    word(dataOff),
    word(operation),
    word(0),
    word(0),
    word(0),
    addrWord('0x' + '00'.repeat(20)),
    addrWord('0x' + '00'.repeat(20)),
    word(sigsOff),
    word(innerData.length),
    pad32(innerData),
    word(0), // signatures length
    pad32(new Uint8Array(0))
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

function baseParams(to: `0x${string}`, data: Uint8Array): SignRequestParams {
  return {
    chainId: 1,
    accountIndex: 0,
    slotIndex: 0,
    sender: SENDER,
    nonce: 0,
    callGas: 0,
    verGas: 0,
    preVerificationGas: 0,
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0,
    to,
    value: 0,
    data
  }
}

/** Walk the single-payload trailer chain (after the 330+data head) and
 *  return the section lengths in wire order. */
function trailerSectionLens(payload: Uint8Array, dataLen: number): number[] {
  let o = 330 + dataLen
  const lens: number[] = []
  while (o < payload.length) {
    const len = (payload[o]! << 8) | payload[o + 1]!
    lens.push(len)
    o += 2 + len
  }
  expect(o).toBe(payload.length)
  return lens
}

describe('buildSignPayload downgrade gates', () => {
  it('refuses a direct CoW setPreSignature without a cowOrderBundle', () => {
    expect(() => buildSignPayload(baseParams(GPV2_SETTLEMENT, presignCalldata()))).toThrow(
      /CoW setPreSignature requires a CoW order bundle/
    )
  })

  it('fires the direct gate on malformed presign calldata too (selector-only, like the firmware)', () => {
    const malformed = presignCalldata().subarray(0, 60)
    expect(() => buildSignPayload(baseParams(GPV2_SETTLEMENT, malformed))).toThrow(
      /CoW setPreSignature requires a CoW order bundle/
    )
  })

  it('accepts a direct CoW presign with a cowOrderBundle and skips the gate off-target', () => {
    expect(() =>
      buildSignPayload({
        ...baseParams(GPV2_SETTLEMENT, presignCalldata()),
        cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
      })
    ).not.toThrow()
    // Same selector to a non-settlement target — no gate.
    expect(() => buildSignPayload(baseParams(OTHER_TO, presignCalldata()))).not.toThrow()
  })

  it('refuses a Safe(approveHash)-wrapped CoW presign without a cowOrderBundle', () => {
    const bundle = safeV1Bundle(GPV2_SETTLEMENT, presignCalldata())
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: bundle
      })
    ).toThrow(/Safe-wrapped CoW setPreSignature requires a CoW order bundle/)
  })

  it('accepts a Safe(approveHash)-wrapped CoW presign with both bundles, sections framed in order', () => {
    const safe = safeV1Bundle(GPV2_SETTLEMENT, presignCalldata())
    const zk = new Uint8Array(COW_CANONICAL_LEN).fill(0xcc)
    const data = approveHashCalldata()
    const payload = buildSignPayload({
      ...baseParams(SAFE_ADDR, data),
      safeV1Bundle: safe,
      cowOrderBundle: zk
    })
    // erc20=0, reserved=0, CoW order, safe_v1 — trailing empty sections dropped.
    expect(trailerSectionLens(payload, data.length)).toEqual([0, 0, COW_CANONICAL_LEN, safe.length])
  })

  it('does not fire the wrapped gate for a Safe flow with a non-CoW inner call', () => {
    const bundle = safeV1Bundle(OTHER_TO, presignCalldata()) // wrong target
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: bundle
      })
    ).not.toThrow()
    const erc20Inner = safeV1Bundle(GPV2_SETTLEMENT, new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])) // wrong selector
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: erc20Inner
      })
    ).not.toThrow()
  })

  it('refuses a Safe(execTransaction)-wrapped CoW presign without a cowOrderBundle', () => {
    const data = execTransactionCalldata(GPV2_SETTLEMENT, presignCalldata())
    expect(() => buildSignPayload(baseParams(SAFE_ADDR, data))).toThrow(
      /Safe-wrapped CoW setPreSignature requires a CoW order bundle/
    )
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, data),
        cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
      })
    ).not.toThrow()
  })

  it('leaves DelegateCall execTransaction to the device (Safe verify refuses it first)', () => {
    const data = execTransactionCalldata(GPV2_SETTLEMENT, presignCalldata(), 1)
    expect(() => buildSignPayload(baseParams(SAFE_ADDR, data))).not.toThrow()
  })
})

describe('buildSignPayload multiSend gates', () => {
  it('refuses an approveHash-flavour multiSend CoW batch without a cowOrderBundle', () => {
    const bundle = safeV1Bundle(MS_CALL_ONLY_130, cowMultiSendCalldata(), 1)
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: bundle
      })
    ).toThrow(/Safe-wrapped CoW setPreSignature requires a CoW order bundle/)
  })

  it('accepts an approveHash-flavour multiSend CoW batch with both bundles', () => {
    const bundle = safeV1Bundle(MS_CALL_ONLY_130, cowMultiSendCalldata(), 1)
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: bundle,
        cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
      })
    ).not.toThrow()
  })

  it('does not gate a generic batch with zero presign records', () => {
    const bundle = safeV1Bundle(
      MS_CALL_ONLY_130,
      multiSendCalldata(packMsRecord(0, TOKEN, approveCalldata())),
      1
    )
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: bundle
      })
    ).not.toThrow()
  })

  it('does not treat an operation=0 call to a MultiSend address as a batch', () => {
    // Under CALL the Safe is not msg.sender for the records — the
    // device blind-signs it and no CoW order bundle is required.
    const bundle = safeV1Bundle(MS_CALL_ONLY_130, cowMultiSendCalldata(), 0)
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: bundle
      })
    ).not.toThrow()
  })

  it("refuses a batch with two presign records regardless of trailers ('msend 2+ presign')", () => {
    const twoPresigns = multiSendCalldata(
      packMsRecord(0, GPV2_SETTLEMENT, presignCalldata()),
      packMsRecord(0, GPV2_SETTLEMENT, presignCalldata())
    )
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: safeV1Bundle(MS_CALL_ONLY_130, twoPresigns, 1),
        cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
      })
    ).toThrow(/Safe sign \/ msend 2\+ presign/)
  })

  it("refuses a malformed claimed multiSend regardless of trailers ('msend malformed')", () => {
    const malformed = new Uint8Array([0x8d, 0x80, 0xff, 0x0a, 0xde, 0xad])
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, approveHashCalldata()),
        safeV1Bundle: safeV1Bundle(MS_CALL_ONLY_130, malformed, 1),
        cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
      })
    ).toThrow(/Safe sign \/ msend malformed/)
  })

  it('gates the execTransaction flavour: multiSend CoW batch requires a CoW order bundle', () => {
    const data = execTransactionCalldata(MS_CALL_ONLY_130, cowMultiSendCalldata(), 1)
    expect(() => buildSignPayload(baseParams(SAFE_ADDR, data))).toThrow(
      /Safe-wrapped CoW setPreSignature requires a CoW order bundle/
    )
    expect(() =>
      buildSignPayload({
        ...baseParams(SAFE_ADDR, data),
        cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
      })
    ).not.toThrow()
  })
})

describe('buildSignBatchPayload downgrade gates', () => {
  const batchBase = {
    chainId: 1,
    accountIndex: 0,
    slotIndex: 0,
    sender: SENDER,
    nonce: 0,
    callGas: 0,
    verGas: 0,
    preVerificationGas: 0,
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0
  }

  it('refuses a Safe-wrapped CoW presign call without a cowOrderBundle (both flavours)', () => {
    expect(() =>
      buildSignBatchPayload({
        ...batchBase,
        calls: [
          {
            to: SAFE_ADDR,
            value: 0,
            data: approveHashCalldata(),
            safeV1Bundle: safeV1Bundle(GPV2_SETTLEMENT, presignCalldata())
          }
        ]
      })
    ).toThrow(/inner call 0: Safe-wrapped CoW setPreSignature requires a CoW order bundle/)

    expect(() =>
      buildSignBatchPayload({
        ...batchBase,
        calls: [
          { to: OTHER_TO, value: 0, data: new Uint8Array(0) },
          {
            to: SAFE_ADDR,
            value: 0,
            data: execTransactionCalldata(GPV2_SETTLEMENT, presignCalldata())
          }
        ]
      })
    ).toThrow(/inner call 1: Safe-wrapped CoW setPreSignature requires a CoW order bundle/)
  })

  it('refuses a multiSend-batched CoW presign call without a cowOrderBundle (both flavours)', () => {
    expect(() =>
      buildSignBatchPayload({
        ...batchBase,
        calls: [
          {
            to: SAFE_ADDR,
            value: 0,
            data: approveHashCalldata(),
            safeV1Bundle: safeV1Bundle(MS_CALL_ONLY_130, cowMultiSendCalldata(), 1)
          }
        ]
      })
    ).toThrow(/inner call 0: Safe-wrapped CoW setPreSignature requires a CoW order bundle/)

    expect(() =>
      buildSignBatchPayload({
        ...batchBase,
        calls: [
          {
            to: SAFE_ADDR,
            value: 0,
            data: execTransactionCalldata(MS_CALL_ONLY_130, cowMultiSendCalldata(), 1)
          }
        ]
      })
    ).toThrow(/inner call 0: Safe-wrapped CoW setPreSignature requires a CoW order bundle/)
  })

  it('refuses a hard-rule-violating multiSend batch on the batch wire, quoting the banner', () => {
    const twoPresigns = multiSendCalldata(
      packMsRecord(0, GPV2_SETTLEMENT, presignCalldata()),
      packMsRecord(0, GPV2_SETTLEMENT, presignCalldata())
    )
    expect(() =>
      buildSignBatchPayload({
        ...batchBase,
        calls: [
          {
            to: SAFE_ADDR,
            value: 0,
            data: approveHashCalldata(),
            safeV1Bundle: safeV1Bundle(MS_CALL_ONLY_130, twoPresigns, 1),
            cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
          }
        ]
      })
    ).toThrow(/inner call 0: Safe multiSend batch refused .* msend 2\+ presign/)
  })

  it('accepts a multiSend CoW batch with the CoW order and safe_v1 bundles on the same call', () => {
    expect(() =>
      buildSignBatchPayload({
        ...batchBase,
        calls: [
          {
            to: SAFE_ADDR,
            value: 0,
            data: approveHashCalldata(),
            safeV1Bundle: safeV1Bundle(MS_CALL_ONLY_130, cowMultiSendCalldata(), 1),
            cowOrderBundle: new Uint8Array(COW_CANONICAL_LEN)
          }
        ]
      })
    ).not.toThrow()
  })

  it('routes kind 3 (CoW order) and kind 4 (safe_v1) TLV records to the same tx_idx', () => {
    const safe = safeV1Bundle(GPV2_SETTLEMENT, presignCalldata())
    const zk = new Uint8Array(COW_CANONICAL_LEN).fill(0xcc)
    const data = approveHashCalldata()
    const payload = buildSignBatchPayload({
      ...batchBase,
      calls: [
        { to: OTHER_TO, value: 0, data: new Uint8Array(0) },
        { to: SAFE_ADDR, value: 0, data, safeV1Bundle: safe, cowOrderBundle: zk }
      ]
    })
    // Header(276) + wire_version + count, then 2 inner calls, then the
    // TLV trailer list: [count][{kind, tx_idx, u16 len, bytes}...].
    let o = 276 + 1 + 1
    o += 20 + 32 + 2 + 0 // call 0
    o += 20 + 32 + 2 + data.length // call 1
    const recCount = payload[o]!
    o += 1
    const records: Array<{ kind: number; txIdx: number; len: number }> = []
    for (let i = 0; i < recCount; i++) {
      const kind = payload[o]!
      const txIdx = payload[o + 1]!
      const len = (payload[o + 2]! << 8) | payload[o + 3]!
      records.push({ kind, txIdx, len })
      o += 4 + len
    }
    expect(o).toBe(payload.length)
    expect(records).toEqual([
      { kind: 3, txIdx: 1, len: COW_CANONICAL_LEN },
      { kind: 4, txIdx: 1, len: safe.length }
    ])
  })
})
