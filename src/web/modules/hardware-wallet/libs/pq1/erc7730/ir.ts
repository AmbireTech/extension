// A minimal reader for the compiled ERC-7730 descriptors (the device's "IR"
// format) in `erc7730_db.bin`: the header, the format table and the fields'
// parameters (`pqsigner-erc7730/src/ir.rs` and
// `pqsigner-erc7730/src/render/params.rs` in the firmware repo). It doesn't
// validate a descriptor the way the device does — the device checks every
// descriptor it is sent, so a wrong answer here can only make Ambire attach
// (or leave out) a bundle the device then refuses or ignores. Never a wrong
// screen.
//
// What Ambire reads from it:
//   - the formats a descriptor has (a function's 4-byte selector, or an
//     EIP-712 primary type's full type hash), so a request the descriptor
//     does not cover is sent without the descriptor instead of failing its
//     binding check;
//   - for each `tokenAmount` field, where its token comes from (a constant
//     address, an ABI head word of the calldata, or the call target), so the
//     matching ERC-20 metadata bundle can ride along.

import { isSameBytes, readAddressWord, readU16Be, selectorMatches } from '../transport/bytes'

/** IR schema version this reader understands. */
const IR_SCHEMA_VER = 0x06
/** Fixed header length. */
const IR_HEADER_LEN = 134

/** What a descriptor describes: contract calls, or EIP-712 typed data. */
export const CTX_CONTRACT = 0x01
export const CTX_EIP712 = 0x02

/** `FormatOp::TokenAmount`. */
export const FORMAT_OP_TOKEN_AMOUNT = 0x03

const PARAM_TOKEN_PATH = 0x30
const PARAM_TOKEN = 0x31

const PATH_ROOT_STRUCTURED = 0x10
const PATH_ROOT_CONTAINER = 0x11
const PATH_FIELD_IDX = 0x20
/** The `@.to` container field: the called contract. */
const CONTAINER_FIELD_TO = 0x1b56

const ABI_WORD_LEN = 32
const SELECTOR_LEN = 4
const ADDRESS_LEN = 20

/** Where a `tokenAmount` field takes its token address from. Only the shapes
 *  Ambire can resolve without a full path interpreter are modelled;
 *  anything else (packed swap paths, dynamic arrays, …) is `null` and simply
 *  gets no ERC-20 bundle — the device then shows the raw amount and the
 *  token address. */
export type IrTokenSource =
  /** `params.token`: a literal address in the descriptor. */
  | { kind: 'constant'; address: Uint8Array }
  /** `params.tokenPath` into the calldata head: ABI word `slot` after the
   *  selector. */
  | { kind: 'calldataWord'; slot: number }
  /** `params.tokenPath = "@.to"`: the called contract itself. */
  | { kind: 'callTarget' }

/** One field of a format. */
export type IrField = {
  formatOp: number
  /** Set for `tokenAmount` fields whose token source this reader models. */
  tokenSource: IrTokenSource | null
}

/** One format (one function, or one EIP-712 primary type). */
export type IrFormat = {
  /** Calldata selector, or the first 4 bytes of the EIP-712 type hash. */
  selector: Uint8Array
  /** The full EIP-712 primary type hash, which the device finds typed
   *  data's format by; null for a function's format. */
  typeHash: Uint8Array | null
  fields: IrField[]
}

/** The parts of one IR blob Ambire uses. */
export type Erc7730IrView = {
  contextKind: number
  chainId: bigint
  contract: Uint8Array
  formats: IrFormat[]
}

function slice(b: Uint8Array, start: number, len: number, what: string): Uint8Array {
  if (start < 0 || len < 0 || start + len > b.length) {
    throw new Error(`erc7730 IR: ${what} out of range`)
  }
  return b.subarray(start, start + len)
}

/** Decode a `tokenPath` program (raw, no length prefix). */
function decodeTokenPath(prog: Uint8Array): IrTokenSource | null {
  if (prog.length === 0) return null
  if (prog[0] === PATH_ROOT_CONTAINER) {
    const isToField =
      prog.length === 4 && prog[1] === PATH_FIELD_IDX && readU16Be(prog, 2) === CONTAINER_FIELD_TO
    return isToField ? { kind: 'callTarget' } : null
  }
  if (prog[0] !== PATH_ROOT_STRUCTURED) return null
  // A static head word is addressed by a run of FieldIdx ops whose
  // arguments sum to the word's head slot. Any other op (offset follow,
  // slice, array index) needs the device's full resolver.
  let slot = 0
  let p = 1
  while (p < prog.length) {
    if (prog[p] !== PATH_FIELD_IDX || p + 3 > prog.length) return null
    slot += readU16Be(prog, p + 1)
    p += 3
  }
  return p === 1 ? null : { kind: 'calldataWord', slot }
}

/** Read the token source of one field's parameter TLV blob, or null. */
function readTokenSource(pool: Uint8Array, paramOff: number): IrTokenSource | null {
  if (paramOff === 0) return null
  const blobLen = pool[paramOff]
  if (blobLen === undefined) throw new Error('erc7730 IR: param blob out of range')
  const body = slice(pool, paramOff + 1, blobLen, 'param blob')
  let tokenPath: IrTokenSource | null | undefined
  let constant: IrTokenSource | null = null
  let p = 0
  while (p < body.length) {
    if (p + 2 > body.length) throw new Error('erc7730 IR: truncated param TLV')
    const tag = body[p]!
    const len = body[p + 1]!
    const payload = slice(body, p + 2, len, 'param TLV')
    p += 2 + len
    if (tag === PARAM_TOKEN_PATH) tokenPath = decodeTokenPath(payload)
    if (tag === PARAM_TOKEN && payload.length === ADDRESS_LEN) {
      constant = { kind: 'constant', address: payload.slice() }
    }
  }
  // The device resolves `tokenPath` first and only then the literal; same
  // precedence here.
  return tokenPath !== undefined ? tokenPath : constant
}

/** Parse the header and format table of one IR blob. Throws on a blob it
 *  cannot walk; callers treat that as "no descriptor". */
export function parseErc7730Ir(ir: Uint8Array): Erc7730IrView {
  if (ir.length < IR_HEADER_LEN) throw new Error('erc7730 IR: shorter than its header')
  if (ir[0] !== IR_SCHEMA_VER) {
    throw new Error(`erc7730 IR: schema 0x${ir[0]!.toString(16)} is not 0x06`)
  }
  const contextKind = ir[1]!
  if (contextKind !== CTX_CONTRACT && contextKind !== CTX_EIP712) {
    throw new Error(`erc7730 IR: unknown context kind ${contextKind}`)
  }
  let chainId = 0n
  for (let i = 2; i < 10; i++) chainId = (chainId << 8n) | BigInt(ir[i]!)
  const contract = ir.slice(10, 30)

  const metadataOff = readU16Be(ir, 126)
  const formatsOff = readU16Be(ir, 128)
  const poolLen = readU16Be(ir, 130)
  const formatsLen = readU16Be(ir, 132)
  if (metadataOff !== IR_HEADER_LEN || formatsOff !== metadataOff + poolLen) {
    throw new Error('erc7730 IR: bad section layout')
  }
  if (formatsOff + formatsLen !== ir.length) throw new Error('erc7730 IR: bad total length')
  const pool = ir.subarray(metadataOff, metadataOff + poolLen)
  const table = ir.subarray(formatsOff, formatsOff + formatsLen)

  const formats: IrFormat[] = []
  const formatCount = table.length === 0 ? 0 : table[0]!
  let p = table.length === 0 ? 0 : 1
  for (let f = 0; f < formatCount; f++) {
    const head = slice(table, p, 10, 'format header')
    const selector = head.slice(0, SELECTOR_LEN)
    const fieldCount = head[4]!
    const intentLen = head[5]!
    p += 10 + intentLen
    // An EIP-712 format carries the full primary type hash.
    let typeHash: Uint8Array | null = null
    if (contextKind === CTX_EIP712) {
      typeHash = slice(table, p, 32, 'type hash').slice()
      p += 32
    }
    const fields: IrField[] = []
    for (let i = 0; i < fieldCount; i++) {
      const fieldHead = slice(table, p, 2, 'field header')
      const formatOp = fieldHead[0]!
      const labelLen = fieldHead[1]!
      const offs = slice(table, p + 2 + labelLen, 4, 'field offsets')
      p += 2 + labelLen + 4
      const paramOff = readU16Be(offs, 2)
      fields.push({
        formatOp,
        tokenSource: formatOp === FORMAT_OP_TOKEN_AMOUNT ? readTokenSource(pool, paramOff) : null
      })
    }
    formats.push({ selector, typeHash, fields })
  }
  if (p > table.length) throw new Error('erc7730 IR: format table overrun')
  return { contextKind, chainId, contract, formats }
}

/** The format for calldata selector / EIP-712 type-hash prefix `selector`,
 *  or undefined when the descriptor has none (the device would refuse the
 *  descriptor's binding for that call). */
export function findIrFormat(view: Erc7730IrView, selector: Uint8Array): IrFormat | undefined {
  if (selector.length < SELECTOR_LEN) return undefined
  return view.formats.find((f) => selectorMatches(f.selector, selector.subarray(0, SELECTOR_LEN)))
}

/** Token addresses the `tokenAmount` fields of `format` resolve to for this
 *  call, in field order, without duplicates. Sources this reader doesn't
 *  model are skipped. */
export function tokenAmountAddresses(
  format: IrFormat,
  call: { to: Uint8Array; data: Uint8Array }
): Uint8Array[] {
  const out: Uint8Array[] = []
  const push = (addr: Uint8Array | null) => {
    if (!addr || addr.length !== ADDRESS_LEN) return
    if (out.some((a) => isSameBytes(a, addr))) return
    out.push(addr)
  }
  for (const field of format.fields) {
    const source = field.tokenSource
    if (!source) continue
    if (source.kind === 'constant') push(source.address)
    if (source.kind === 'callTarget') push(call.to)
    if (source.kind === 'calldataWord') {
      push(readAddressWord(call.data, SELECTOR_LEN + source.slot * ABI_WORD_LEN))
    }
  }
  return out
}
