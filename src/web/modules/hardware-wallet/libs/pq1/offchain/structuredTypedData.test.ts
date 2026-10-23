// SafeTx / CoW order / Permit2 typed data → SIGN_OFFCHAIN kinds 4 / 5 / 6. The golden
// payloads in `structuredOffchain.goldens.json` come from the firmware repo
// (`tools/companion-stub/structured_offchain.py --emit-goldens`), built from
// the ethers-checked mainnet references its tests pin; Ambire's builders
// must reproduce them byte for byte.

import { hashTypedData, type TypedDataDefinition } from 'viem'

import { SIGN_OFFCHAIN_HEADER_LEN } from '../config'
import { GPV2_SETTLEMENT_ADDRESS } from '../cowswap/eip712'
import { packCowOrderBundle } from '../cowswap/orderBundle'
import { PERMIT2_ADDRESS } from '../permit2/eip712'
import { encodeSafeCanonical } from '../safe/canonical'
import { packSafeV1Bundle } from '../safe/safeV1Trailer'
import { bytesToHex0x } from '../transport/bytes'
import { buildSignOffchainPayload } from '../transport/offchain'
import goldens from './structuredOffchain.goldens.json'
import { classifyStructuredTypedData, type StructuredTypedDataInput } from './structuredTypedData'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({ captureException: jest.fn() }))

const golden = (name: string) => goldens.vectors.find((v) => v.name === name)!

/** The reference Safe: chain 1, its SafeTx pre-signs the reference CoW order. */
const REF_SAFE = '0x5afe3855358e112b5647b952709e6165e1c1eeee'
const REF_PRESIGN =
  '0xec6cb13f000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000038f97aaf408259debcbe9b251ac5e1097174cf0084fb2f382d8056617068eaa43a5afe3855358e112b5647b952709e6165e1c1eeee680000000000000000000000'

const SAFE_TX_TYPE = [
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'data', type: 'bytes' },
  { name: 'operation', type: 'uint8' },
  { name: 'safeTxGas', type: 'uint256' },
  { name: 'baseGas', type: 'uint256' },
  { name: 'gasPrice', type: 'uint256' },
  { name: 'gasToken', type: 'address' },
  { name: 'refundReceiver', type: 'address' },
  { name: 'nonce', type: 'uint256' }
]

const ZERO = '0x0000000000000000000000000000000000000000'

const safeTx = (): StructuredTypedDataInput => ({
  domain: { chainId: 1, verifyingContract: REF_SAFE },
  types: {
    EIP712Domain: [
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    SafeTx: SAFE_TX_TYPE
  },
  primaryType: 'SafeTx',
  message: {
    to: GPV2_SETTLEMENT_ADDRESS,
    value: '0',
    data: REF_PRESIGN,
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO,
    refundReceiver: ZERO,
    nonce: '0'
  }
})

const ORDER_TYPE = [
  { name: 'sellToken', type: 'address' },
  { name: 'buyToken', type: 'address' },
  { name: 'receiver', type: 'address' },
  { name: 'sellAmount', type: 'uint256' },
  { name: 'buyAmount', type: 'uint256' },
  { name: 'validTo', type: 'uint32' },
  { name: 'appData', type: 'bytes32' },
  { name: 'feeAmount', type: 'uint256' },
  { name: 'kind', type: 'string' },
  { name: 'partiallyFillable', type: 'bool' },
  { name: 'sellTokenBalance', type: 'string' },
  { name: 'buyTokenBalance', type: 'string' }
]

const cowOrder = (): StructuredTypedDataInput => ({
  domain: {
    name: 'Gnosis Protocol',
    version: 'v2',
    chainId: 1,
    verifyingContract: GPV2_SETTLEMENT_ADDRESS
  },
  types: { Order: ORDER_TYPE },
  primaryType: 'Order',
  message: {
    sellToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    buyToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    receiver: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
    sellAmount: '1000000000',
    buyAmount: '500000000000000000',
    validTo: 0x68000000,
    appData: '0x83b9dcb2316e54fc04c10f74c9a3d5dd66a9e4c43c04ccefb9c0c03e61e5fb28',
    feeAmount: '0',
    kind: 'sell',
    partiallyFillable: false,
    sellTokenBalance: 'erc20',
    buyTokenBalance: 'erc20'
  }
})

const viemHash = (td: StructuredTypedDataInput) =>
  hashTypedData(td as unknown as TypedDataDefinition)

const payloadOf = (wire: Uint8Array) => bytesToHex0x(wire.subarray(SIGN_OFFCHAIN_HEADER_LEN))

const header = { accountIndex: 0, chainId: 1, slotIndex: 0, accountDeployed: true } as const

describe('classifyStructuredTypedData', () => {
  it('recognises the reference SafeTx and reproduces the golden hash and payload', () => {
    const s = classifyStructuredTypedData(safeTx())
    if (s.kind !== 'safe_tx') throw new Error(`classified as ${s.kind}`)
    const v = golden('safe_tx_cow_presign')
    expect(bytesToHex0x(s.digest)).toBe(v.digest)
    // The hash a raw32 (blind) sign would use is the same one, so the
    // device signs the same value either way.
    expect(viemHash(safeTx())).toBe(v.digest)
    const cow = classifyStructuredTypedData(cowOrder())
    if (cow.kind !== 'cow_order') throw new Error(`classified as ${cow.kind}`)
    const wire = buildSignOffchainPayload({
      ...header,
      kind: 'safe_tx',
      safeV1Bundle: packSafeV1Bundle(encodeSafeCanonical(s.canonical), s.rawData),
      cowOrderBundle: packCowOrderBundle(cow.order)
    })
    expect(wire[13]).toBe(v.kind)
    expect(payloadOf(wire)).toBe(v.payload)
  })

  it('recognises the reference CoW order and reproduces the golden hash and payload', () => {
    const s = classifyStructuredTypedData(cowOrder())
    if (s.kind !== 'cow_order') throw new Error(`classified as ${s.kind}`)
    const v = golden('cow_order')
    expect(bytesToHex0x(s.digest)).toBe(v.digest)
    expect(viemHash(cowOrder())).toBe(v.digest)
    const wire = buildSignOffchainPayload({
      ...header,
      kind: 'cow_order',
      cowOrderBundle: packCowOrderBundle(s.order)
    })
    expect(wire[13]).toBe(v.kind)
    expect(payloadOf(wire)).toBe(v.payload)
  })

  it('accepts a SafeTx without an explicit EIP712Domain type, numbers as bigint', () => {
    const td = safeTx()
    delete (td.types as Record<string, unknown>).EIP712Domain
    td.domain = { chainId: 1n, verifyingContract: REF_SAFE }
    td.message = { ...td.message, value: 0n, nonce: 0n }
    expect(classifyStructuredTypedData(td).kind).toBe('safe_tx')
  })

  const otherCases: [string, () => StructuredTypedDataInput][] = [
    [
      'a SafeTx domain with an extra key',
      () => ({ ...safeTx(), domain: { ...safeTx().domain, name: 'Safe' } })
    ],
    [
      'a Safe v1.1 domain (no chainId)',
      () => ({
        ...safeTx(),
        domain: { verifyingContract: REF_SAFE },
        types: { SafeTx: SAFE_TX_TYPE }
      })
    ],
    [
      'reordered SafeTx fields',
      () => ({
        ...safeTx(),
        types: { SafeTx: [SAFE_TX_TYPE[1]!, SAFE_TX_TYPE[0]!, ...SAFE_TX_TYPE.slice(2)] }
      })
    ],
    [
      'a pre-1.0 SafeTx (dataGas)',
      () => {
        const td = safeTx()
        const fields = SAFE_TX_TYPE.map((f) =>
          f.name === 'baseGas' ? { name: 'dataGas', type: 'uint256' } : f
        )
        const { baseGas, ...rest } = td.message
        return {
          ...td,
          types: { SafeTx: fields },
          message: { ...rest, dataGas: baseGas }
        }
      }
    ],
    [
      'a SafeTx with an extra unreferenced type',
      () => ({ ...safeTx(), types: { ...safeTx().types, Extra: [{ name: 'x', type: 'uint256' }] } })
    ],
    ['operation 2', () => ({ ...safeTx(), message: { ...safeTx().message, operation: 2 } })],
    [
      'an Order on another settlement contract',
      () => ({
        ...cowOrder(),
        domain: { ...cowOrder().domain, verifyingContract: REF_SAFE }
      })
    ],
    [
      'an Order with another domain name',
      () => ({ ...cowOrder(), domain: { ...cowOrder().domain, name: 'Gnosis Protocol v3' } })
    ],
    [
      'an Order with an unknown kind',
      () => ({ ...cowOrder(), message: { ...cowOrder().message, kind: 'limit' } })
    ],
    [
      'an Order with bytes32 enums',
      () => ({
        ...cowOrder(),
        types: {
          Order: ORDER_TYPE.map((f) => (f.type === 'string' ? { ...f, type: 'bytes32' } : f))
        }
      })
    ],
    [
      'an Order with validTo over uint32',
      () => ({ ...cowOrder(), message: { ...cowOrder().message, validTo: 2 ** 32 } })
    ],
    [
      'unrelated typed data',
      () => ({
        domain: { name: 'Ether Mail', version: '1', chainId: 1, verifyingContract: REF_SAFE },
        types: { Mail: [{ name: 'contents', type: 'string' }] },
        primaryType: 'Mail',
        message: { contents: 'Hello' }
      })
    ]
  ]

  it.each(otherCases)('treats %s as other', (_label, build) => {
    expect(classifyStructuredTypedData(build()).kind).toBe('other')
  })
})

describe('structured SIGN_OFFCHAIN payloads', () => {
  it('refuse an undeployed wallet', () => {
    const s = classifyStructuredTypedData(cowOrder())
    if (s.kind !== 'cow_order') throw new Error('not a CoW order')
    expect(() =>
      buildSignOffchainPayload({
        ...header,
        accountDeployed: false,
        kind: 'cow_order',
        cowOrderBundle: packCowOrderBundle(s.order)
      })
    ).toThrow('deployed wallet')
  })

  it('refuse a CoW payload whose legs do not frame exactly', () => {
    const s = classifyStructuredTypedData(cowOrder())
    if (s.kind !== 'cow_order') throw new Error('not a CoW order')
    const trailer = packCowOrderBundle(s.order)
    const padded = new Uint8Array(trailer.length + 1)
    padded.set(trailer)
    expect(() =>
      buildSignOffchainPayload({ ...header, kind: 'cow_order', cowOrderBundle: padded })
    ).toThrow('legs do not end')
  })
})

// ── Uniswap Permit2 (kind 6) ───────────────────────────────────────────
// The permits behind the four `permit2_*` goldens (the firmware's tests use
// the same ones; their digests are checked against viem there too).

const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
const WETH_BASE = '0x4200000000000000000000000000000000000006'
const USDC_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const UNIVERSAL_ROUTER_BASE = '0x6ff5693b99212da76ad316178a184ab56d299b43'
const UNIVERSAL_ROUTER_ETH = '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad'
const UINT160_MAX = (1n << 160n) - 1n
const UINT256_MAX = (1n << 256n) - 1n

const PERMIT_DETAILS_TYPE = [
  { name: 'token', type: 'address' },
  { name: 'amount', type: 'uint160' },
  { name: 'expiration', type: 'uint48' },
  { name: 'nonce', type: 'uint48' }
]
const TOKEN_PERMISSIONS_TYPE = [
  { name: 'token', type: 'address' },
  { name: 'amount', type: 'uint256' }
]
const permit2Domain = (chainId: number) => ({
  name: 'Permit2',
  chainId,
  verifyingContract: PERMIT2_ADDRESS
})

const permitSingle = (): StructuredTypedDataInput => ({
  domain: permit2Domain(8453),
  types: {
    PermitSingle: [
      { name: 'details', type: 'PermitDetails' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' }
    ],
    PermitDetails: PERMIT_DETAILS_TYPE
  },
  primaryType: 'PermitSingle',
  message: {
    details: { token: USDC_BASE, amount: '1000000000', expiration: '1798761600', nonce: '3' },
    spender: UNIVERSAL_ROUTER_BASE,
    sigDeadline: '1767225600'
  }
})

const permitBatch = (): StructuredTypedDataInput => ({
  domain: permit2Domain(8453),
  types: {
    PermitBatch: [
      { name: 'details', type: 'PermitDetails[]' },
      { name: 'spender', type: 'address' },
      { name: 'sigDeadline', type: 'uint256' }
    ],
    PermitDetails: PERMIT_DETAILS_TYPE
  },
  primaryType: 'PermitBatch',
  message: {
    details: [
      { token: USDC_BASE, amount: '1000000000', expiration: '1798761600', nonce: '3' },
      { token: WETH_BASE, amount: UINT160_MAX.toString(), expiration: '0', nonce: '0' }
    ],
    spender: UNIVERSAL_ROUTER_BASE,
    sigDeadline: '1767225600'
  }
})

const permitTransfer = (): StructuredTypedDataInput => ({
  domain: permit2Domain(1),
  types: {
    PermitTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ],
    TokenPermissions: TOKEN_PERMISSIONS_TYPE
  },
  primaryType: 'PermitTransferFrom',
  message: {
    permitted: { token: USDC_ETH, amount: '500000000' },
    spender: UNIVERSAL_ROUTER_ETH,
    nonce: '42',
    deadline: '1767225600'
  }
})

const permitBatchTransfer = (): StructuredTypedDataInput => ({
  domain: permit2Domain(8453),
  types: {
    PermitBatchTransferFrom: [
      { name: 'permitted', type: 'TokenPermissions[]' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ],
    TokenPermissions: TOKEN_PERMISSIONS_TYPE
  },
  primaryType: 'PermitBatchTransferFrom',
  message: {
    permitted: [
      { token: USDC_BASE, amount: UINT256_MAX.toString() },
      { token: WETH_BASE, amount: '123456789012345678' }
    ],
    spender: UNIVERSAL_ROUTER_BASE,
    nonce: ((1n << 200n) + 7n).toString(),
    deadline: UINT256_MAX.toString()
  }
})

/** `td` with its message's `field` replaced by `value`. */
const withMessageField = (
  td: StructuredTypedDataInput,
  field: string,
  value: unknown
): StructuredTypedDataInput => ({ ...td, message: { ...td.message, [field]: value } })

describe('classifyStructuredTypedData — Permit2', () => {
  it.each([
    ['permit2_single', permitSingle],
    ['permit2_batch', permitBatch],
    ['permit2_transfer', permitTransfer],
    ['permit2_batch_transfer', permitBatchTransfer]
  ] as const)('reproduces the %s golden hash and payload', (name, build) => {
    const s = classifyStructuredTypedData(build())
    if (s.kind !== 'permit2') throw new Error(`classified as ${s.kind}`)
    const v = golden(name)
    expect(s.chainId).toBe(BigInt(v.chainId))
    expect(bytesToHex0x(s.digest)).toBe(v.digest)
    expect(viemHash(build())).toBe(v.digest)
    const wire = buildSignOffchainPayload({
      ...header,
      chainId: v.chainId,
      kind: 'permit2',
      permit2Canonical: s.canonical,
      erc20Bundles: s.permit.tokens.map(() => undefined)
    })
    expect(wire[13]).toBe(v.kind)
    expect(payloadOf(wire)).toBe(v.payload)
  })

  it('accepts an explicit EIP712Domain type', () => {
    const td = permitSingle()
    td.types = {
      ...td.types,
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    }
    expect(classifyStructuredTypedData(td).kind).toBe('permit2')
  })

  const notPermit2: [string, () => StructuredTypedDataInput][] = [
    [
      'another verifying contract',
      () => ({
        ...permitSingle(),
        domain: { ...permit2Domain(8453), verifyingContract: UNIVERSAL_ROUTER_BASE }
      })
    ],
    [
      'a domain with a version',
      () => ({ ...permitSingle(), domain: { ...permit2Domain(8453), version: '1' } })
    ],
    [
      'another domain name',
      () => ({ ...permitSingle(), domain: { ...permit2Domain(8453), name: 'Permit3' } })
    ],
    [
      'a UniswapX witness permit',
      () => ({
        ...permitTransfer(),
        primaryType: 'PermitWitnessTransferFrom',
        types: { PermitWitnessTransferFrom: [], TokenPermissions: TOKEN_PERMISSIONS_TYPE }
      })
    ],
    ['an extra message field', () => withMessageField(permitSingle(), 'extra', '1')],
    [
      'an amount over uint160',
      () =>
        withMessageField(permitSingle(), 'details', {
          token: USDC_BASE,
          amount: (UINT160_MAX + 1n).toString(),
          expiration: '0',
          nonce: '0'
        })
    ],
    [
      'reordered PermitDetails fields',
      () => {
        const td = permitSingle()
        const [token, amount, expiration, nonce] = PERMIT_DETAILS_TYPE
        td.types = { ...td.types, PermitDetails: [amount!, token!, expiration!, nonce!] }
        return td
      }
    ],
    [
      'a missing PermitDetails type',
      () => ({ ...permitSingle(), types: { PermitSingle: permitSingle().types.PermitSingle! } })
    ],
    ['a single permit given an array', () => withMessageField(permitSingle(), 'details', [])]
  ]
  it.each(notPermit2)('treats %s as other', (_label, build) => {
    expect(classifyStructuredTypedData(build()).kind).toBe('other')
  })

  const batchDetails = (tokens: string[]) =>
    tokens.map((token) => ({ token, amount: '1', expiration: '0', nonce: '0' }))
  const refusals: [string, StructuredTypedDataInput, string][] = [
    [
      'the same token twice',
      withMessageField(permitBatch(), 'details', batchDetails([USDC_BASE, USDC_BASE])),
      'the same token more than once'
    ],
    [
      'more tokens than the device shows',
      withMessageField(
        permitBatch(),
        'details',
        batchDetails(
          Array.from({ length: 7 }, (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`)
        )
      ),
      'covers 7 tokens'
    ],
    ['no token', withMessageField(permitBatch(), 'details', []), 'names no token'],
    ['a zero spender', withMessageField(permitSingle(), 'spender', ZERO), 'an empty address'],
    [
      'a zero token',
      withMessageField(permitBatchTransfer(), 'permitted', [{ token: ZERO, amount: '1' }]),
      'an empty address'
    ]
  ]
  it.each(refusals)(
    'refuses a permit naming %s, instead of signing it blind',
    (_label, td, why) => {
      const s = classifyStructuredTypedData(td)
      if (s.kind !== 'refused') throw new Error(`classified as ${s.kind}`)
      expect(s.message).toContain(why)
      expect(s.message).toContain('Nothing was signed.')
    }
  )
})

describe('Permit2 SIGN_OFFCHAIN payload', () => {
  const single = () => {
    const s = classifyStructuredTypedData(permitSingle())
    if (s.kind !== 'permit2') throw new Error('not a permit')
    return { kind: 'permit2' as const, permit2Canonical: s.canonical, erc20Bundles: [undefined] }
  }

  it('refuses an undeployed wallet', () => {
    expect(() =>
      buildSignOffchainPayload({ ...header, accountDeployed: false, ...single() })
    ).toThrow('deployed wallet')
  })

  it('needs one ERC-20 slot per token and at most one name bundle', () => {
    expect(() => buildSignOffchainPayload({ ...header, ...single(), erc20Bundles: [] })).toThrow(
      '0 ERC-20 slots for 1 tokens'
    )
    const twoNames = [new Uint8Array(1), new Uint8Array(1)]
    expect(() =>
      buildSignOffchainPayload({ ...header, ...single(), nameBundles: twoNames })
    ).toThrow('2 name bundles > 1')
  })

  it('refuses a canonical permit with a byte after its last token', () => {
    const request = single()
    const padded = new Uint8Array(request.permit2Canonical.length + 1)
    padded.set(request.permit2Canonical)
    expect(() =>
      buildSignOffchainPayload({ ...header, ...request, permit2Canonical: padded })
    ).toThrow("can't be 115 bytes")
  })
})
