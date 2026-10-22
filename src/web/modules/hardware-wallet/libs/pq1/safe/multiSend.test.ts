// The multiSend decoder, verdict and CoW-binding rules, case by case, as the
// device applies them (its own tests in `multi_send.rs` and `cow_binding.rs`
// under `secure/src/tx/eip712/safe/` in the firmware repo cover the same
// cases): both sides must decode the same records or refuse with the same
// message.

import { isCowPresignClaim } from '../cowswap/calldata'
import { hexToBytes } from '../transport/bytes'
import {
  assertSafeOperationSignable,
  decodeMultiSend,
  isAllowlistedMultiSendCallOnly,
  isMultiSendClaim,
  MULTI_SEND_SELECTOR,
  MULTISEND_CALL_ONLY_ADDRESSES_LC,
  MULTISEND_MAX_RECORDS,
  multiSendVerdict,
  resolveSafeCowBinding,
  summarizeMultiSend,
  walkMultiSendRecords
} from './multiSend'

const MS_CALL_ONLY_130 = '0x40a2accbd92bca938b02010e17a5b8929b49130d' as `0x${string}`
const GPV2_SETTLEMENT = '0x9008d19f58aabd9ed0d60971565aa8510560ab41' as `0x${string}`
const GPV2_VAULT_RELAYER = '0xc92e8bdf79f0507f65a392b0ab4667716bfe0110' as `0x${string}`
const TOKEN = `0x${'70'.repeat(20)}` as `0x${string}`

/** Pack one record: `op || to || value || dataLen || data`. */
function packRecord(op: number, to: `0x${string}`, value: bigint, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(1 + 20 + 32 + 32 + data.length)
  out[0] = op
  out.set(hexToBytes(to), 1)
  let v = value
  for (let i = 52; i >= 21; i--) {
    out[i] = Number(v & 0xffn)
    v >>= 8n
  }
  out[53 + 28] = (data.length >>> 24) & 0xff
  out[53 + 29] = (data.length >>> 16) & 0xff
  out[53 + 30] = (data.length >>> 8) & 0xff
  out[53 + 31] = data.length & 0xff
  out.set(data, 85)
  return out
}

/** Canonical `multiSend(bytes)` calldata around a packed payload —
 *  selector, offset word 0x20, length word, zero-padded tail. */
function encodeMs(packed: Uint8Array): Uint8Array {
  const padded = Math.ceil(packed.length / 32) * 32
  const out = new Uint8Array(4 + 64 + padded)
  out.set(MULTI_SEND_SELECTOR, 0)
  out[4 + 31] = 0x20
  out[4 + 32 + 28] = (packed.length >>> 24) & 0xff
  out[4 + 32 + 29] = (packed.length >>> 16) & 0xff
  out[4 + 32 + 30] = (packed.length >>> 8) & 0xff
  out[4 + 32 + 31] = packed.length & 0xff
  out.set(packed, 68)
  return out
}

/** Selector-correct 164-byte presign calldata (zero body — the resolver
 *  doesn't shape-check; the CoW pipeline does). */
function presignStub(): Uint8Array {
  const cd = new Uint8Array(164)
  cd.set([0xec, 0x6c, 0xb1, 0x3f], 0)
  return cd
}

/** Strict 68-byte `approve(spender, amount)` calldata. */
function approveCalldata(spender: `0x${string}`, amountLow: number): Uint8Array {
  const cd = new Uint8Array(68)
  cd.set([0x09, 0x5e, 0xa7, 0xb3], 0)
  cd.set(hexToBytes(spender), 16)
  cd[67] = amountLow
  return cd
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

/** The Safe-UI CoW flow: `[approve(vault relayer) on TOKEN,
 *  setPreSignature]`, both records op 0 / value 0. */
function cowFlowCalldata(): Uint8Array {
  return encodeMs(
    concat(
      packRecord(0, TOKEN, 0n, approveCalldata(GPV2_VAULT_RELAYER, 1)),
      packRecord(0, GPV2_SETTLEMENT, 0n, presignStub())
    )
  )
}

describe('multiSend claim predicate', () => {
  it('fires for every allowlisted target under operation=1', () => {
    const cd = cowFlowCalldata()
    expect(MULTISEND_CALL_ONLY_ADDRESSES_LC).toHaveLength(4)
    for (const a of MULTISEND_CALL_ONLY_ADDRESSES_LC) {
      expect(isAllowlistedMultiSendCallOnly(a)).toBe(true)
      expect(isMultiSendClaim(1, a, cd)).toBe(true)
    }
  })

  it('does not fire under operation=0 (CALL — the Safe is not msg.sender for the records)', () => {
    expect(isMultiSendClaim(0, MS_CALL_ONLY_130, cowFlowCalldata())).toBe(false)
  })

  it('does not fire for a non-allowlisted target (incl. plain MultiSend v1.3.0)', () => {
    const cd = cowFlowCalldata()
    expect(isMultiSendClaim(1, `0x${'aa'.repeat(20)}`, cd)).toBe(false)
    expect(isMultiSendClaim(1, '0xa238cbeb142c10ef7ad8442c6d1f9e89e07e7761', cd)).toBe(false)
  })

  it('does not fire for a wrong selector or short data', () => {
    const cd = cowFlowCalldata()
    cd[0] = cd[0]! ^ 1
    expect(isMultiSendClaim(1, MS_CALL_ONLY_130, cd)).toBe(false)
    expect(isMultiSendClaim(1, MS_CALL_ONLY_130, new Uint8Array([0x8d, 0x80, 0xff]))).toBe(false)
  })

  it('fires even for a malformed tail — and the verdict rejects it loudly', () => {
    const cd = new Uint8Array([0x8d, 0x80, 0xff, 0x0a, 0xde, 0xad])
    expect(isMultiSendClaim(1, MS_CALL_ONLY_130, cd)).toBe(true)
    expect(multiSendVerdict(1, MS_CALL_ONLY_130, cd)).toEqual({
      kind: 'reject',
      banner: 'msend malformed'
    })
  })
})

describe('strict multiSend decode', () => {
  it('decodes the canonical two-record CoW flow', () => {
    const packed = decodeMultiSend(cowFlowCalldata())
    expect(packed).not.toBeNull()
    const records = walkMultiSendRecords(packed!)
    expect(records).not.toBeNull()
    expect(records).toHaveLength(2)
    expect(records![0]!.to).toBe(TOKEN)
    expect(records![0]!.data).toHaveLength(68)
    expect(records![1]!.to).toBe(GPV2_SETTLEMENT)
    expect(records![1]!.data).toHaveLength(164)
    expect(records!.every((r) => r.operation === 0 && r.value === 0n)).toBe(true)
  })

  it.each([
    ['wrong selector', (cd: Uint8Array) => void (cd[3] = cd[3]! ^ 1)],
    ['offset word != 0x20', (cd: Uint8Array) => void (cd[4 + 31] = 0x40)],
    ['offset word high bits', (cd: Uint8Array) => void (cd[4] = 0x01)],
    ['length word high bits', (cd: Uint8Array) => void (cd[4 + 32] = 0x01)],
    [
      'declared length overruns the calldata',
      (cd: Uint8Array) => cd.set([0x7f, 0xff, 0xff, 0xff], 4 + 32 + 28)
    ]
  ])('refuses %s', (_name, mutate) => {
    const cd = cowFlowCalldata()
    mutate(cd)
    expect(decodeMultiSend(cd)).toBeNull()
    expect(summarizeMultiSend(cd)).toBe('msend malformed')
  })

  it('refuses short input', () => {
    expect(decodeMultiSend(MULTI_SEND_SELECTOR)).toBeNull()
  })

  it('refuses trailing bytes after the padded tail', () => {
    const cd = cowFlowCalldata()
    expect(decodeMultiSend(concat(cd, new Uint8Array(32)))).toBeNull()
  })

  it('refuses non-zero padding bytes', () => {
    // Single 68-byte approve record → packed len 153 → 7 pad bytes.
    const packed = packRecord(0, TOKEN, 0n, approveCalldata(GPV2_VAULT_RELAYER, 1))
    expect(packed.length % 32).not.toBe(0)
    const cd = encodeMs(packed)
    cd[cd.length - 1] = 0xff
    expect(decodeMultiSend(cd)).toBeNull()
  })

  it('refuses a truncated record header and a record data overrun', () => {
    expect(walkMultiSendRecords(new Uint8Array(50))).toBeNull()
    const packed = packRecord(0, TOKEN, 0n, new Uint8Array([0xaa, 0xaa, 0xaa, 0xaa]))
    packed.set([0, 0, 0, 100], 53 + 28) // inflate dataLen past the slice end
    expect(walkMultiSendRecords(packed)).toBeNull()
  })

  it('refuses a record dataLen with bits above u32', () => {
    const packed = packRecord(0, TOKEN, 0n, new Uint8Array(0))
    packed[53] = 0x01
    expect(walkMultiSendRecords(packed)).toBeNull()
  })
})

describe('summarize + verdict hard rules', () => {
  it('summarizes the CoW flow: 2 records, unique presign at index 1', () => {
    const s = summarizeMultiSend(cowFlowCalldata())
    expect(typeof s).not.toBe('string')
    if (typeof s === 'string') return
    expect(s.records).toHaveLength(2)
    expect(s.presignRecordIndexes).toEqual([1])
  })

  it('accepts a multiSend wrapping ONLY the presign record', () => {
    const cd = encodeMs(packRecord(0, GPV2_SETTLEMENT, 0n, presignStub()))
    const v = multiSendVerdict(1, MS_CALL_ONLY_130, cd)
    expect(v.kind).toBe('accept')
    if (v.kind !== 'accept') return
    expect(v.summary.presignRecordIndexes).toEqual([0])
  })

  it("refuses a record with operation=1 ('msend rec op!=0')", () => {
    const cd = encodeMs(
      concat(
        packRecord(1, TOKEN, 0n, approveCalldata(GPV2_VAULT_RELAYER, 1)),
        packRecord(0, GPV2_SETTLEMENT, 0n, presignStub())
      )
    )
    expect(summarizeMultiSend(cd)).toBe('msend rec op!=0')
    expect(multiSendVerdict(1, MS_CALL_ONLY_130, cd)).toEqual({
      kind: 'reject',
      banner: 'msend rec op!=0'
    })
  })

  it("refuses a record with to=0x0 ('msend rec to=0') — v1.5.0 rewrites it to the Safe", () => {
    const cd = encodeMs(
      concat(
        packRecord(0, TOKEN, 0n, approveCalldata(GPV2_VAULT_RELAYER, 1)),
        packRecord(0, `0x${'00'.repeat(20)}`, 0n, new Uint8Array([0x0d, 0x58, 0x2f, 0x13]))
      )
    )
    expect(summarizeMultiSend(cd)).toBe('msend rec to=0')
    for (const a of MULTISEND_CALL_ONLY_ADDRESSES_LC) {
      expect(multiSendVerdict(1, a, cd)).toEqual({ kind: 'reject', banner: 'msend rec to=0' })
    }
  })

  it("refuses zero records and more than MULTISEND_MAX_RECORDS ('msend rec count')", () => {
    expect(summarizeMultiSend(encodeMs(new Uint8Array(0)))).toBe('msend rec count')
    const tooMany = concat(
      ...Array.from({ length: MULTISEND_MAX_RECORDS + 1 }, (_, i) =>
        packRecord(
          0,
          `0x${(i + 1).toString(16).padStart(2, '0').repeat(20)}`,
          0n,
          new Uint8Array(0)
        )
      )
    )
    expect(summarizeMultiSend(encodeMs(tooMany))).toBe('msend rec count')
  })

  it('quotes the operation banner for a combined violation, like the firmware walk order', () => {
    // 7 records where the overflowing 7th is also op=1: the firmware
    // checks each record's operation before the count overflow.
    const sevenLastOp1 = concat(
      ...Array.from({ length: MULTISEND_MAX_RECORDS }, (_, i) =>
        packRecord(
          0,
          `0x${(i + 1).toString(16).padStart(2, '0').repeat(20)}`,
          0n,
          new Uint8Array(0)
        )
      ),
      packRecord(1, TOKEN, 0n, new Uint8Array(0))
    )
    expect(summarizeMultiSend(encodeMs(sevenLastOp1))).toBe('msend rec op!=0')
  })

  it("refuses two presign records ('msend 2+ presign')", () => {
    const cd = encodeMs(
      concat(
        packRecord(0, GPV2_SETTLEMENT, 0n, presignStub()),
        packRecord(0, GPV2_SETTLEMENT, 0n, presignStub())
      )
    )
    expect(multiSendVerdict(1, MS_CALL_ONLY_130, cd)).toEqual({
      kind: 'reject',
      banner: 'msend 2+ presign'
    })
  })

  it('is not-multisend for a direct presign call', () => {
    expect(multiSendVerdict(0, GPV2_SETTLEMENT, presignStub())).toEqual({
      kind: 'not-multisend'
    })
  })
})

describe('resolveSafeCowBinding (mirror of resolve_safe_arm)', () => {
  it('binds the unique presign record of an allowlisted multiSend batch', () => {
    const binding = resolveSafeCowBinding(1, MS_CALL_ONLY_130, cowFlowCalldata())
    expect(binding.kind).toBe('bind')
    if (binding.kind !== 'bind') return
    expect(binding.calldata).toHaveLength(164)
    expect(Array.from(binding.calldata.subarray(0, 4))).toEqual([0xec, 0x6c, 0xb1, 0x3f])
  })

  it('binds the raw_data of a direct single-call presign (operation=0)', () => {
    const cd = presignStub()
    const binding = resolveSafeCowBinding(0, GPV2_SETTLEMENT, cd)
    expect(binding).toEqual({ kind: 'bind', calldata: cd })
  })

  it('resolves none for a generic batch with zero presign records', () => {
    const cd = encodeMs(packRecord(0, TOKEN, 0n, approveCalldata(GPV2_VAULT_RELAYER, 1)))
    expect(resolveSafeCowBinding(1, MS_CALL_ONLY_130, cd)).toEqual({ kind: 'none' })
  })

  it('resolves none for operation=1 to a non-allowlisted target (Safe verify refuses on-device first)', () => {
    expect(resolveSafeCowBinding(1, GPV2_SETTLEMENT, presignStub())).toEqual({ kind: 'none' })
    expect(resolveSafeCowBinding(1, `0x${'aa'.repeat(20)}`, cowFlowCalldata())).toEqual({
      kind: 'none'
    })
  })

  it('resolves none for operation=0 to a MultiSend address (not a batch — stays blind-sign)', () => {
    expect(resolveSafeCowBinding(0, MS_CALL_ONLY_130, cowFlowCalldata())).toEqual({ kind: 'none' })
  })

  it('refuses a multiSend violating a hard rule, quoting the device banner', () => {
    const twoPresigns = encodeMs(
      concat(
        packRecord(0, GPV2_SETTLEMENT, 0n, presignStub()),
        packRecord(0, GPV2_SETTLEMENT, 0n, presignStub())
      )
    )
    expect(resolveSafeCowBinding(1, MS_CALL_ONLY_130, twoPresigns)).toEqual({
      kind: 'refuse',
      banner: 'msend 2+ presign'
    })
    const malformed = new Uint8Array([0x8d, 0x80, 0xff, 0x0a, 0xde, 0xad])
    expect(resolveSafeCowBinding(1, MS_CALL_ONLY_130, malformed)).toEqual({
      kind: 'refuse',
      banner: 'msend malformed'
    })
  })
})

describe('assertSafeOperationSignable (host mirror of the Safe operation gates)', () => {
  it('accepts operation=0 and a hard-rule-passing multiSend batch', () => {
    expect(() => assertSafeOperationSignable(0, GPV2_SETTLEMENT, presignStub())).not.toThrow()
    expect(() => assertSafeOperationSignable(1, MS_CALL_ONLY_130, cowFlowCalldata())).not.toThrow()
  })

  it('refuses DelegateCall to a non-allowlisted target', () => {
    expect(() => assertSafeOperationSignable(1, TOKEN, cowFlowCalldata())).toThrow(
      'only supported by PQ1 firmware for a canonical MultiSendCallOnly'
    )
  })

  it('refuses a hard-rule-violating batch with the device banner quoted', () => {
    const recOp1 = encodeMs(packRecord(1, TOKEN, 0n, approveCalldata(GPV2_VAULT_RELAYER, 1)))
    expect(() => assertSafeOperationSignable(1, MS_CALL_ONLY_130, recOp1)).toThrow(
      'Safe sign / msend rec op!=0'
    )
  })
})

describe('isCowPresignClaim', () => {
  it('matches target+selector and fires for malformed presigns too (refuse loudly, not blind-sign)', () => {
    expect(isCowPresignClaim(GPV2_SETTLEMENT, presignStub())).toBe(true)
    expect(isCowPresignClaim(GPV2_SETTLEMENT, presignStub().subarray(0, 60))).toBe(true)
    expect(isCowPresignClaim(TOKEN, presignStub())).toBe(false)
    expect(isCowPresignClaim(GPV2_SETTLEMENT, new Uint8Array([0xec, 0x6c, 0xb1]))).toBe(false)
  })
})
