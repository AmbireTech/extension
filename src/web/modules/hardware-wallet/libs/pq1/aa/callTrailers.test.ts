// Which metadata `buildCallTrailers` attaches to a call, run against the real
// catalog blobs shipped in `public/pq1`: the ERC-20 bundle for the token an
// ERC-7730 descriptor or an approveHash's SafeTx names, the descriptor only
// when it covers the call's selector, and the curated selector bundle only
// for calls the device would otherwise blind-sign without a name.

import fs from 'fs'
import path from 'path'
import { encodeFunctionData, erc20Abi, parseAbi, zeroAddress } from 'viem'

import { bytesToHex } from '../transport/bytes'
import { Pq1UserError } from '../errors'
import { tryBuildSafeV1Trailer } from '../safe/safeV1Trailer'
import { buildCallTrailers } from './callTrailers'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const SAFE = '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const RECIPIENT = '0x1234567890abcdef1234567890abcdef12345678'
const SENDER = '0x2222222222222222222222222222222222222222'
const usdcTransfer = encodeFunctionData({
  abi: erc20Abi,
  functionName: 'transfer',
  args: [RECIPIENT, 100_000_000n]
})

jest.mock('../safe/safeV1Trailer', () => ({
  ...jest.requireActual('../safe/safeV1Trailer'),
  tryBuildSafeV1Trailer: jest.fn(async () => ({
    safeV1Bundle: new Uint8Array(283),
    fields: { to: USDC, value: 0n, data: usdcTransfer, operation: 0 }
  }))
}))

const PUBLIC_DIR = path.resolve(__dirname, '../../../../../public')

/** ERC-20 bundle layout: chain_id u64 LE, then the token address. */
const erc20BundleToken = (bundle: Uint8Array | undefined) =>
  bundle ? `0x${bytesToHex(bundle.subarray(8, 28))}` : undefined

const trailersFor = async (to: `0x${string}`, data: `0x${string}`, value = 0n) => {
  const { perCallTrailers, nameBundles } = await buildCallTrailers({
    chainId: 1,
    sender: SENDER,
    calls: [{ to, value, data }]
  })
  return { ...perCallTrailers[0]!, nameBundles }
}

describe('buildCallTrailers metadata routing', () => {
  const realFetch = global.fetch

  beforeAll(() => {
    global.fetch = (async (url: string) => {
      const bytes = fs.readFileSync(path.join(PUBLIC_DIR, url))
      return { ok: true, status: 200, arrayBuffer: async () => bytes }
    }) as unknown as typeof fetch
  })

  afterAll(() => {
    global.fetch = realFetch
  })

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('attaches the stETH metadata a wstETH wrap descriptor names', async () => {
    const t = await trailersFor(
      '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      '0xea598cb00000000000000000000000000000000000000000000000000de0b6b3a763fffe'
    )
    expect(t.erc7730Bundle).toBeDefined()
    expect(erc20BundleToken(t.erc20Bundle)).toBe('0xae7ab96520de3a18e5e111b5eaab095312d7fe84')
    expect(t.selectorBundle).toBeUndefined()
  })

  it('omits a descriptor that has no format for the selector (1inch ethUnoswap)', async () => {
    const t = await trailersFor(
      '0x111111125421ca6dc452d289314280a0f8842a65',
      '0xa76dfc3b00000000000000000000000000000000000000000000000000068ea41a18d0d020800000000000000000000004708077eca6bb527a5bbbd6358ffb043a9c1c14d1f115cb',
      2_000_000_000_000_000n
    )
    expect(t.erc7730Bundle).toBeUndefined()
  })

  it('names the function of a call with no descriptor (NFT safeTransferFrom)', async () => {
    const data = encodeFunctionData({
      abi: parseAbi(['function safeTransferFrom(address from, address to, uint256 tokenId)']),
      functionName: 'safeTransferFrom',
      args: [SENDER, RECIPIENT, 1234n]
    })
    const t = await trailersFor('0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', data)
    expect(t.erc7730Bundle).toBeUndefined()
    const bundle = t.selectorBundle!
    expect(bytesToHex(bundle.subarray(0, 4))).toBe('42842e0e')
    const text = String.fromCharCode(...bundle.subarray(5, 5 + bundle[4]!))
    expect(text).toBe('safeTransferFrom(address,address,uint256)')
  })

  it('sends no selector bundle where the device has its own decoder', async () => {
    const t = await trailersFor(USDC, usdcTransfer)
    expect(erc20BundleToken(t.erc20Bundle)).toBe(USDC)
    expect(t.selectorBundle).toBeUndefined()
  })

  it("attaches the token metadata of an approveHash's SafeTx", async () => {
    const approveHash = encodeFunctionData({
      abi: parseAbi(['function approveHash(bytes32 hashToApprove)']),
      functionName: 'approveHash',
      args: [`0x${'ab'.repeat(32)}`]
    })
    const t = await trailersFor(SAFE, approveHash)
    expect(t.safeV1Bundle).toBeDefined()
    expect(erc20BundleToken(t.erc20Bundle)).toBe(USDC)
    expect(t.selectorBundle).toBeUndefined()
  })
})

const SAFE_ACCOUNT = '0x1111111111111111111111111111111111111111'
const NOT_MULTISEND = '0x3333333333333333333333333333333333333333'

const SAFE_ABI = parseAbi([
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)',
  'function approveHash(bytes32 hashToApprove)'
])

const execTransaction = (operation: number) =>
  encodeFunctionData({
    abi: SAFE_ABI,
    functionName: 'execTransaction',
    args: [NOT_MULTISEND, 0n, '0x', operation, 0n, 0n, 0n, zeroAddress, zeroAddress, '0x']
  })

describe('buildCallTrailers Safe refusals', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('refuses a Safe DelegateCall to a non-MultiSend target, in plain language', async () => {
    const result = buildCallTrailers({
      chainId: 1,
      sender: SENDER,
      calls: [{ to: SAFE_ACCOUNT, value: 0n, data: execTransaction(1) }]
    })
    await expect(result).rejects.toBeInstanceOf(Pq1UserError)
    const error: Pq1UserError = await result.then(
      () => {
        throw new Error('expected buildCallTrailers to reject')
      },
      (e: Pq1UserError) => e
    )
    expect(error.message).not.toContain('DelegateCall')
    expect(error.message).not.toContain('operation')
    expect(error.technicalDetail).toContain('DelegateCall')
  })

  /** The `Pq1UserError` `buildCallTrailers` rejects with for one call. */
  const refusalFor = (data: `0x${string}`) =>
    buildCallTrailers({
      chainId: 1,
      sender: SENDER,
      calls: [{ to: SAFE_ACCOUNT, value: 0n, data }]
    }).then(
      () => {
        throw new Error('expected buildCallTrailers to reject')
      },
      (e: Pq1UserError) => e
    )

  it('refuses an approveHash call that is not exactly 36 bytes, as the device does', async () => {
    const { tryBuildSafeV1Trailer: realTryBuild } = jest.requireActual('../safe/safeV1Trailer')
    jest.mocked(tryBuildSafeV1Trailer).mockImplementationOnce(realTryBuild)
    const approveHash = encodeFunctionData({
      abi: SAFE_ABI,
      functionName: 'approveHash',
      args: [`0x${'ab'.repeat(32)}`]
    })
    const error = await refusalFor(`${approveHash}00`)
    expect(error).toBeInstanceOf(Pq1UserError)
    expect(error.technicalDetail).toContain('approveHash')
  })

  it('refuses an execTransaction call it cannot decode, as the device does', async () => {
    const truncated = execTransaction(0).slice(0, 2 + 2 * 200) as `0x${string}`
    const error = await refusalFor(truncated)
    expect(error).toBeInstanceOf(Pq1UserError)
    expect(error.technicalDetail).toContain('not decodable')
  })

  it('attaches no Safe or CoW trailer to a plain Safe Call (operation 0)', async () => {
    const { perCallTrailers } = await buildCallTrailers({
      chainId: 1,
      sender: SENDER,
      calls: [{ to: SAFE_ACCOUNT, value: 0n, data: execTransaction(0) }]
    })
    expect(perCallTrailers).toHaveLength(1)
    expect(perCallTrailers[0]!.safeV1Bundle).toBeUndefined()
    expect(perCallTrailers[0]!.cowOrderBundle).toBeUndefined()
  })
})
