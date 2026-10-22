// Ambire's CoW and Safe encoders against the reference vectors the
// firmware's own tests use (`secure/src/tx/eip712/cowswap/e2e_decode_tests.rs`
// in the firmware repo). The firmware tests check the device against them;
// this checks Ambire against the same bytes, so a layout or EIP-712 drift on
// either side turns a test red. The references were generated with ethers
// v6's TypedDataEncoder for a real 1000 USDC -> >=0.5 WETH order on mainnet;
// the V constants are copied verbatim — don't edit the hex by hand.

import { encodeSafeCanonical, safeDataHash } from '../safe/canonical'
import { computeSafeTxHash } from '../safe/eip712'
import { bytesToHex0x, hexToBytes } from '../transport/bytes'
import { encodeCanonical } from './canonical'
import { buildOrderUid, GPV2_SETTLEMENT_ADDRESS } from './eip712'
import { type GPv2Order } from './types'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const
const MULTISEND_CALL_ONLY_130 = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D' as const

// Reference vectors — byte-identical to the firmware test's constants
// (ORDER_DIGEST_HEX, CANONICAL_HEX, DIRECT_PRESIGN_HEX, SAFE_* and MS_*).
const V = {
  order: {
    sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    receiver: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    sellAmount: '1000000000', // 1000 USDC (6 decimals)
    buyAmount: '500000000000000000', // 0.5 WETH
    validTo: 0x68000000,
    appData: '0x83b9dcb2316e54fc04c10f74c9a3d5dd66a9e4c43c04ccefb9c0c03e61e5fb28',
    feeAmount: '0'
  },
  canonical:
    '0x0000000000000001a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2742d35cc6634c0532925a3b844bc454e4438f44e000000000000000000000000000000000000000000000000000000003b9aca0000000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000000000000000000000000000680000000000000083b9dcb2316e54fc04c10f74c9a3d5dd66a9e4c43c04ccefb9c0c03e61e5fb28',
  orderDigest: '0xf97aaf408259debcbe9b251ac5e1097174cf0084fb2f382d8056617068eaa43a',
  direct: {
    owner: '0xfb3C7EB936CAa12B5a884D6123939969A557D430',
    setPreSignatureCalldata:
      '0xec6cb13f000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000038f97aaf408259debcbe9b251ac5e1097174cf0084fb2f382d8056617068eaa43afb3c7eb936caa12b5a884d6123939969a557d430680000000000000000000000'
  },
  safeWrapped: {
    owner: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
    presignCalldata:
      '0xec6cb13f000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000038f97aaf408259debcbe9b251ac5e1097174cf0084fb2f382d8056617068eaa43a5afe3855358e112b5647b952709e6165e1c1eeee680000000000000000000000',
    dataHash: '0x720774a1e1bb52a564f0c33e0ba05c1bac850d236bd19a8f1c4173364de23664',
    canonicalSafe:
      '0x00000000000000015afe3855358e112b5647b952709e6165e1c1eeee9008d19f58aabd9ed0d60971565aa8510560ab410000000000000000000000000000000000000000000000000000000000000000720774a1e1bb52a564f0c33e0ba05c1bac850d236bd19a8f1c4173364de2366400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    safeTxHash: '0x0e436954453310227409c573f988f1b7ff49cfe3588e493320396da72791bfaa'
  },
  safeMultiSend: {
    multiSendCalldata:
      '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000019200a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110000000000000000000000000000000000000000000000000000000003b9aca00009008d19f58aabd9ed0d60971565aa8510560ab41000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4ec6cb13f000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000038f97aaf408259debcbe9b251ac5e1097174cf0084fb2f382d8056617068eaa43a5afe3855358e112b5647b952709e6165e1c1eeee6800000000000000000000000000000000000000000000000000',
    dataHash: '0x044e1d2d0d84e26f34f54e2508eb075bf69058cde56c3bc78dfe645580a21149',
    canonicalSafe:
      '0x00000000000000015afe3855358e112b5647b952709e6165e1c1eeee40a2accbd92bca938b02010e17a5b8929b49130d0000000000000000000000000000000000000000000000000000000000000000044e1d2d0d84e26f34f54e2508eb075bf69058cde56c3bc78dfe645580a2114901000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
    safeTxHash: '0x540f823dbf50531a2252d640ad52141b254bc5c6eecd1c705b6132c774842cac'
  }
} as const

// Reconstruct the SAME order the vectors were generated from.
const order: GPv2Order = {
  chainId: 1,
  sellToken: V.order.sellToken,
  buyToken: V.order.buyToken,
  receiver: V.order.receiver,
  sellAmount: BigInt(V.order.sellAmount),
  buyAmount: BigInt(V.order.buyAmount),
  validTo: V.order.validTo,
  appData: hexToBytes(V.order.appData),
  feeAmount: BigInt(V.order.feeAmount),
  kind: 'sell',
  partiallyFillable: false,
  sellTokenBalance: 'erc20',
  buyTokenBalance: 'erc20'
}

const walletOwner = V.direct.owner as `0x${string}`
const safeAddr = V.safeWrapped.owner as `0x${string}`

describe('extension producers emit the exact firmware-consumed bytes', () => {
  it('encodeCanonical == firmware canonical', () => {
    expect(bytesToHex0x(encodeCanonical(order))).toBe(V.canonical)
  })

  it("extension's own EIP-712 orderDigest == reference (ethers == firmware)", () => {
    const uid = buildOrderUid(order, walletOwner)
    expect(bytesToHex0x(uid.bytes.slice(0, 32))).toBe(V.orderDigest)
  })

  it('direct orderUid bytes == the setPreSignature calldata the firmware verified', () => {
    const uid = buildOrderUid(order, walletOwner)
    const calldata = hexToBytes(V.direct.setPreSignatureCalldata)
    expect(bytesToHex0x(uid.bytes)).toBe(bytesToHex0x(calldata.slice(100, 156)))
  })

  it('Safe-wrapped orderUid embeds the Safe as owner (== presign calldata)', () => {
    const uid = buildOrderUid(order, safeAddr)
    const calldata = hexToBytes(V.safeWrapped.presignCalldata)
    expect(bytesToHex0x(uid.bytes)).toBe(bytesToHex0x(calldata.slice(100, 156)))
  })

  it('safeDataHash(presign) + encodeSafeCanonical == firmware Safe canonical (wrapped)', () => {
    const presign = hexToBytes(V.safeWrapped.presignCalldata)
    const dataHash = safeDataHash(presign)
    expect(bytesToHex0x(dataHash)).toBe(V.safeWrapped.dataHash)
    const canon = encodeSafeCanonical({
      chainId: 1,
      safeAddress: safeAddr,
      to: GPV2_SETTLEMENT_ADDRESS,
      value: 0n,
      dataHash,
      operation: 0,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZERO_ADDR,
      refundReceiver: ZERO_ADDR,
      nonce: 0n
    })
    expect(bytesToHex0x(canon)).toBe(V.safeWrapped.canonicalSafe)
  })

  it("extension's computeSafeTxHash == reference safeTxHash (wrapped)", () => {
    const presign = hexToBytes(V.safeWrapped.presignCalldata)
    const h = computeSafeTxHash({
      chainId: 1,
      safeAddress: safeAddr,
      to: GPV2_SETTLEMENT_ADDRESS,
      value: 0n,
      dataHash: safeDataHash(presign),
      operation: 0,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZERO_ADDR,
      refundReceiver: ZERO_ADDR,
      nonce: 0n
    })
    expect(bytesToHex0x(h)).toBe(V.safeWrapped.safeTxHash)
  })

  it('safeDataHash(multiSend) + encodeSafeCanonical == firmware Safe canonical (multiSend)', () => {
    const ms = hexToBytes(V.safeMultiSend.multiSendCalldata)
    const dataHash = safeDataHash(ms)
    expect(bytesToHex0x(dataHash)).toBe(V.safeMultiSend.dataHash)
    const canon = encodeSafeCanonical({
      chainId: 1,
      safeAddress: safeAddr,
      to: MULTISEND_CALL_ONLY_130,
      value: 0n,
      dataHash,
      operation: 1, // DELEGATECALL into MultiSendCallOnly
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZERO_ADDR,
      refundReceiver: ZERO_ADDR,
      nonce: 1n
    })
    expect(bytesToHex0x(canon)).toBe(V.safeMultiSend.canonicalSafe)
  })

  it("extension's computeSafeTxHash == reference safeTxHash (multiSend)", () => {
    const ms = hexToBytes(V.safeMultiSend.multiSendCalldata)
    const h = computeSafeTxHash({
      chainId: 1,
      safeAddress: safeAddr,
      to: MULTISEND_CALL_ONLY_130,
      value: 0n,
      dataHash: safeDataHash(ms),
      operation: 1,
      safeTxGas: 0n,
      baseGas: 0n,
      gasPrice: 0n,
      gasToken: ZERO_ADDR,
      refundReceiver: ZERO_ADDR,
      nonce: 1n
    })
    expect(bytesToHex0x(h)).toBe(V.safeMultiSend.safeTxHash)
  })
})
