// The PQ1 send pipeline. Host-side refusals must reach the user as plain
// language (`Pq1UserError`), never as protocol detail, and must happen
// before any device or network work.

import fs from 'fs'
import path from 'path'

import type { JsonRpcProvider } from 'ethers'
import {
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData,
  erc20Abi,
  getAddress,
  parseAbi
} from 'viem'

import {
  FACTORY,
  MAX_BATCH_TXS,
  PQ_INIT_CODE_LEN,
  SIG_WRAPPER_LEN,
  VERIFIER_STUB_RETURN_TRUE_CODE
} from '../config'
import { Pq1UserError } from '../errors'
import { bytesToHex0x, hexToBytes } from '../transport/bytes'
import type { DeviceCommands } from '../transport/commands'
import {
  buildSignBatchPayload,
  buildSignPayload,
  type BatchSignRequestParams,
  type SignRequestParams
} from '../transport/signRequest'
import { assertPq1CallCount, assertPq1CallDataFits, pq1BroadcastAccountOp } from './broadcast'
import { BundlerError } from './bundler'
import type { UserOpJson } from './userop'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

describe('assertPq1CallCount', () => {
  it(`accepts up to ${MAX_BATCH_TXS} calls`, () => {
    expect(() => assertPq1CallCount(new Array(MAX_BATCH_TXS).fill(null))).not.toThrow()
  })

  it('refuses a larger batch with a plain-language Pq1UserError', () => {
    let caught: unknown
    try {
      assertPq1CallCount(new Array(MAX_BATCH_TXS + 1).fill(null))
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(Pq1UserError)
    expect((caught as Pq1UserError).message).toContain(`up to ${MAX_BATCH_TXS} actions`)
    expect((caught as Pq1UserError).message).not.toContain('MAX_BATCH_TXS')
  })
})

describe('assertPq1CallDataFits', () => {
  const UNIVERSAL_ROUTER_EXECUTE = '3593564c'
  const SAFE_EXEC_TRANSACTION = '6a761202'
  /** `bytes` bytes of calldata starting with `selector`. */
  const callData = (bytes: number, selector = UNIVERSAL_ROUTER_EXECUTE): `0x${string}` =>
    `0x${selector}${'ab'.repeat(bytes - selector.length / 2)}`
  const refusalOf = (calls: { data: `0x${string}` }[]): Pq1UserError | undefined => {
    try {
      assertPq1CallDataFits(calls)
    } catch (e) {
      return e as Pq1UserError
    }
    return undefined
  }

  it('lets calls of up to 8,192 bytes through, alone or batched', () => {
    expect(refusalOf([{ data: callData(5050) }])).toBeUndefined()
    expect(refusalOf([{ data: callData(8192) }])).toBeUndefined()
    expect(refusalOf([{ data: callData(8192) }, { data: callData(8192) }])).toBeUndefined()
  })

  it('refuses a call over 8,192 bytes in plain language', () => {
    const refusal = refusalOf([{ data: callData(8193) }])
    expect(refusal).toBeInstanceOf(Pq1UserError)
    expect(refusal!.message).toContain('8,193 bytes in one action, and the most is 8,192')
    expect(refusal!.message).not.toContain('MAX_TX_LEN')
    expect(refusal!.technicalDetail).toContain('MAX_TX_LEN')
  })

  it('refuses a batch whose calls carry over 16,384 bytes together', () => {
    const refusal = refusalOf([
      { data: callData(8192) },
      { data: callData(8192) },
      { data: '0x01' }
    ])
    expect(refusal).toBeInstanceOf(Pq1UserError)
    expect(refusal!.message).toContain('16,385 bytes of data together')
  })

  it('keeps the 4,096-byte cap on a Safe execTransaction call', () => {
    expect(refusalOf([{ data: callData(4096, SAFE_EXEC_TRANSACTION) }])).toBeUndefined()
    const refusal = refusalOf([{ data: callData(4100, SAFE_EXEC_TRANSACTION) }])
    expect(refusal).toBeInstanceOf(Pq1UserError)
    expect(refusal!.message).toContain('This Safe transaction')
    expect(refusal!.message).toContain('4,100 bytes, and the most is 4,096')
  })
})

// ── The whole send pipeline ──────────────────────────────────────────────
// A fake PQ1 (it runs the real wire-payload builders, so firmware size caps
// and trailer rules still apply), a fake chain and a stubbed bundler: what
// the device is asked to sign, what reaches the bundler, and what is refused
// before either.

const PIPELINE_SENDER = '0x00000000000000000000000000000000000abc25'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const RECIPIENT = '0x1234567890abcdef1234567890abcdef12345678'
const VERIFIER = '0x00000000000000000000000000000000000c1010'
const ENTRY_POINT_NONCE = 7n
const ACCOUNT_INDEX = 3
const USER_OP_HASH = `0x${'ab'.repeat(32)}`
/** The bundler's estimate. Its total gas (1.05M) is already a multiple of
 *  10^4, so only the fee cap can need rounding for the device's screen. */
const BUNDLER_ESTIMATE = {
  callGasLimit: '0x30d40', // 200k
  verificationGasLimit: '0x186a0', // 100k — replaced by the 800k pin
  preVerificationGas: '0xc350' // 50k
}
/** The fee the user approved. The cap's wei-level dust can't be shown
 *  exactly on the device, so the pipeline rounds it up by less than 10^4. */
const APPROVED_FEE = { maxFeePerGas: 1_234_567_891n, maxPriorityFeePerGas: 1_000_000n }

const WALLET_ABI = parseAbi([
  'function executeWithOffchainCount(uint256 ownerIndex, uint256 newOffchainCount, address target, uint256 value, bytes data) returns (bytes)',
  'function executeBatchWithOffchainCount(uint256 ownerIndex, uint256 newOffchainCount, address[] targets, uint256[] values, bytes[] datas)',
  'function nextOwnerIndex() view returns (uint256)',
  'function offchainSigCount(uint256 ownerIndex) view returns (uint256)'
])
const READ_ABI = parseAbi([
  'function getNonce(address sender, uint192 key) view returns (uint256)',
  'function c10Verifier() view returns (address)',
  'function getAddress(bytes32 masterPkSeed, bytes32 masterPkRoot) view returns (address)'
])

const usdcTransfer = encodeFunctionData({
  abi: erc20Abi,
  functionName: 'transfer',
  args: [RECIPIENT, 25_000_000n]
})

const word = (v: bigint) => encodeAbiParameters([{ type: 'uint256' }], [v])
const addressWord = (a: `0x${string}`) => encodeAbiParameters([{ type: 'address' }], [a])

/** On-chain reads answered by function name; anything else fails the test. */
function fakeChain(opts: {
  deployed: boolean
  onchainOffchainCount?: bigint
  factoryPredicts?: `0x${string}`
  /** False for a chain the factory isn't deployed on. */
  factoryDeployed?: boolean
}) {
  const answer = (data: `0x${string}`): `0x${string}` => {
    for (const abi of [WALLET_ABI, READ_ABI]) {
      try {
        const { functionName } = decodeFunctionData({ abi, data })
        if (functionName === 'nextOwnerIndex') return word(2n) // owner 1 = slot 0
        if (functionName === 'offchainSigCount') return word(opts.onchainOffchainCount ?? 0n)
        if (functionName === 'getNonce') return word(ENTRY_POINT_NONCE)
        if (functionName === 'c10Verifier') return addressWord(VERIFIER)
        if (functionName === 'getAddress')
          return addressWord(opts.factoryPredicts ?? PIPELINE_SENDER)
      } catch {
        // Not a function of this ABI; try the next one.
      }
    }
    throw new Error(`unexpected eth_call ${data.slice(0, 10)}`)
  }
  const codeAt = (address: string) => {
    if (address.toLowerCase() === FACTORY.toLowerCase()) {
      return opts.factoryDeployed === false ? '0x' : '0x6080604052'
    }
    return opts.deployed && address.toLowerCase() === PIPELINE_SENDER ? '0x6080604052' : '0x'
  }
  const provider = {
    getCode: jest.fn(async (address: string) => codeAt(address)),
    call: jest.fn(async (tx: { data: `0x${string}` }) => answer(tx.data))
  }
  return { provider, jsonRpcProvider: provider as unknown as JsonRpcProvider }
}

/** A fake device that answers like the firmware: the device's off-chain
 *  count, its init code on a first deploy, and a signature wrapper. */
function fakeDevice(opts: { initCodeFactory?: `0x${string}` } = {}) {
  const initCode = new Uint8Array(PQ_INIT_CODE_LEN)
  initCode.set(hexToBytes(opts.initCodeFactory ?? FACTORY), 0)
  const signature = new Uint8Array(SIG_WRAPPER_LEN).fill(0x5a)
  const bundle = (includeInitCode?: boolean) => ({
    newOffchainCount: 9n,
    initCode: includeInitCode ? initCode : null,
    type1: null,
    type2: signature
  })
  const device = {
    getInitCode: jest.fn(async () => initCode),
    offchainSync: jest.fn(async () => {}),
    signUserOp: jest.fn(async (p: SignRequestParams) => {
      buildSignPayload(p)
      return bundle(p.includeInitCode)
    }),
    signUserOpBatch: jest.fn(async (p: BatchSignRequestParams) => {
      buildSignBatchPayload(p)
      return bundle(p.includeInitCode)
    })
  }
  return { device, commands: device as unknown as DeviceCommands, initCode, signature }
}

type JsonRpcRequest = { id: number; method: string; params: unknown[] }

/** Answers Pimlico and the extension's own catalog files. Nothing leaves the
 *  test: `eth_sendUserOperation` is only recorded. `noAnswer` makes the
 *  request for that method fail the way a dropped connection does. */
function stubNetwork(opts: { estimateError?: string; sendError?: string; noAnswer?: string } = {}) {
  const requests: JsonRpcRequest[] = []
  const submitted: UserOpJson[] = []
  const reply = (id: number, body: object) => ({
    ok: true,
    status: 200,
    json: async () => ({ jsonrpc: '2.0', id, ...body })
  })
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    if (!url.startsWith('https://api.pimlico.io/')) {
      const bytes = fs.readFileSync(path.join(PUBLIC_DIR, url))
      return { ok: true, status: 200, arrayBuffer: async () => bytes }
    }
    const req = JSON.parse(String(init?.body)) as JsonRpcRequest
    requests.push(req)
    if (req.method === opts.noAnswer) throw new TypeError('Failed to fetch')
    if (req.method === 'eth_estimateUserOperationGas') {
      return opts.estimateError
        ? reply(req.id, { error: { code: -32500, message: opts.estimateError } })
        : reply(req.id, { result: BUNDLER_ESTIMATE })
    }
    if (req.method === 'eth_sendUserOperation') {
      if (opts.sendError) return reply(req.id, { error: { code: -32500, message: opts.sendError } })
      submitted.push(req.params[0] as UserOpJson)
      return reply(req.id, { result: USER_OP_HASH })
    }
    return reply(req.id, { error: { code: -32601, message: `unexpected ${req.method}` } })
  }) as unknown as typeof fetch
  return { requests, submitted }
}

const PUBLIC_DIR = path.resolve(__dirname, '../../../../../public')

describe('pq1BroadcastAccountOp', () => {
  const realFetch = global.fetch

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    global.fetch = realFetch
    jest.restoreAllMocks()
  })

  const send = (
    calls: { to: `0x${string}`; value: bigint; data: `0x${string}` }[],
    chain: ReturnType<typeof fakeChain>,
    device: ReturnType<typeof fakeDevice>,
    chainId = 1
  ) =>
    pq1BroadcastAccountOp({
      accountIndex: ACCOUNT_INDEX,
      sender: PIPELINE_SENDER,
      chainId,
      calls,
      pimlicoApiKey: 'test-key',
      provider: chain.jsonRpcProvider,
      device: device.commands,
      fee: APPROVED_FEE
    })

  it('signs a deployed send with the approved fee and submits exactly what was signed', async () => {
    const network = stubNetwork()
    const device = fakeDevice()
    const result = await send(
      [{ to: USDC, value: 0n, data: usdcTransfer }],
      fakeChain({ deployed: true }),
      device
    )

    expect(result).toEqual({ userOpHash: USER_OP_HASH, nonce: ENTRY_POINT_NONCE })
    expect(device.device.getInitCode).not.toHaveBeenCalled()
    expect(device.device.signUserOp).toHaveBeenCalledTimes(1)
    const signed = device.device.signUserOp.mock.calls[0]![0]
    expect(signed).toMatchObject({
      chainId: 1,
      accountIndex: ACCOUNT_INDEX,
      slotIndex: 0,
      includeInitCode: false,
      sender: PIPELINE_SENDER,
      nonce: ENTRY_POINT_NONCE,
      to: USDC,
      value: 0n
    })
    expect(bytesToHex0x(signed.data!)).toBe(usdcTransfer)
    // The token metadata rides along so the device can show "25 USDC".
    expect(signed.erc20Bundle).toBeDefined()

    expect(network.submitted).toHaveLength(1)
    const op = network.submitted[0]!
    // The fee the device showed is the fee submitted: the approved one, with
    // the cap rounded up by less than 10^4 wei so the device can show it.
    expect(BigInt(op.maxFeePerGas)).toBe(signed.maxFeePerGas)
    expect(BigInt(op.maxPriorityFeePerGas)).toBe(signed.maxPriorityFeePerGas)
    expect(BigInt(op.maxFeePerGas) - APPROVED_FEE.maxFeePerGas).toBeGreaterThanOrEqual(0n)
    expect(BigInt(op.maxFeePerGas) - APPROVED_FEE.maxFeePerGas).toBeLessThan(10_000n)
    expect(BigInt(op.maxPriorityFeePerGas)).toBe(APPROVED_FEE.maxPriorityFeePerGas)
    expect(BigInt(op.callGasLimit)).toBe(signed.callGas)
    expect(BigInt(op.verificationGasLimit)).toBe(800_000n)
    expect(BigInt(op.verificationGasLimit)).toBe(signed.verGas)
    expect(BigInt(op.nonce)).toBe(ENTRY_POINT_NONCE)
    expect(op.initCode).toBe('0x')
    expect(op.signature).toBe(bytesToHex0x(device.signature))
    // callData carries the device's off-chain count, not the estimate's.
    const { functionName, args } = decodeFunctionData({ abi: WALLET_ABI, data: op.callData })
    expect(functionName).toBe('executeWithOffchainCount')
    expect(args).toEqual([1n, 9n, getAddress(USDC), 0n, usdcTransfer])
  })

  it('signs a batch as one UserOp with every call in it', async () => {
    const network = stubNetwork()
    const device = fakeDevice()
    const approve = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [RECIPIENT, 1n]
    })
    await send(
      [
        { to: USDC, value: 0n, data: approve },
        { to: RECIPIENT, value: 10n ** 15n, data: '0x' }
      ],
      fakeChain({ deployed: true }),
      device
    )

    expect(device.device.signUserOp).not.toHaveBeenCalled()
    const signed = device.device.signUserOpBatch.mock.calls[0]![0]
    expect(signed.calls.map((c) => c.to)).toEqual([USDC, RECIPIENT])
    const { functionName, args } = decodeFunctionData({
      abi: WALLET_ABI,
      data: network.submitted[0]!.callData
    })
    expect(functionName).toBe('executeBatchWithOffchainCount')
    expect(args).toEqual([
      1n,
      9n,
      [getAddress(USDC), getAddress(RECIPIENT)],
      [0n, 10n ** 15n],
      [approve, '0x']
    ])
  })

  it("syncs the device's off-chain count up to the wallet's before estimating", async () => {
    const network = stubNetwork()
    const device = fakeDevice()
    await send(
      [{ to: RECIPIENT, value: 1n, data: '0x' }],
      fakeChain({ deployed: true, onchainOffchainCount: 4n }),
      device
    )

    expect(device.device.offchainSync).toHaveBeenCalledWith({
      accountIndex: ACCOUNT_INDEX,
      chainId: 1,
      slotIndex: 0,
      targetCount: 4n
    })
    const estimated = network.requests.find((r) => r.method === 'eth_estimateUserOperationGas')!
    const { args } = decodeFunctionData({
      abi: WALLET_ABI,
      data: (estimated.params[0] as UserOpJson).callData
    })
    expect(args[1]).toBe(4n)
  })

  it("deploys the wallet with the device's init code on its first transaction", async () => {
    const network = stubNetwork()
    const device = fakeDevice()
    await send([{ to: RECIPIENT, value: 1n, data: '0x' }], fakeChain({ deployed: false }), device)

    expect(device.device.getInitCode).toHaveBeenCalledWith(ACCOUNT_INDEX, 1)
    expect(device.device.offchainSync).not.toHaveBeenCalled()
    expect(device.device.signUserOp.mock.calls[0]![0].includeInitCode).toBe(true)
    const estimated = network.requests.find((r) => r.method === 'eth_estimateUserOperationGas')!
    expect((estimated.params[0] as UserOpJson).initCode).toBe(bytesToHex0x(device.initCode))
    // The estimate stubs the signature verifier so the dummy signature passes.
    expect(estimated.params[2]).toEqual({
      [VERIFIER]: { code: VERIFIER_STUB_RETURN_TRUE_CODE }
    })
    expect(network.submitted[0]!.initCode).toBe(bytesToHex0x(device.initCode))
  })

  it.each([
    ['the init code names another factory', { initCodeFactory: RECIPIENT }, {}],
    ['the factory predicts another address', {}, { factoryPredicts: RECIPIENT }]
  ] as const)(
    'refuses a first deploy when %s, before the device signs',
    async (_, deviceOpts, chainOpts) => {
      const network = stubNetwork()
      const device = fakeDevice(deviceOpts)
      const result = send(
        [{ to: RECIPIENT, value: 1n, data: '0x' }],
        fakeChain({ deployed: false, ...chainOpts }),
        device
      )

      await expect(result).rejects.toBeInstanceOf(Pq1UserError)
      await expect(result).rejects.toThrow("This PQ1's software doesn't match")
      expect(device.device.signUserOp).not.toHaveBeenCalled()
      expect(network.submitted).toHaveLength(0)
    }
  )

  it('refuses a first deploy on a chain without the factory, before asking the device', async () => {
    const network = stubNetwork()
    const device = fakeDevice()
    const result = send(
      [{ to: RECIPIENT, value: 1n, data: '0x' }],
      fakeChain({ deployed: false, factoryDeployed: false }),
      device
    )

    await expect(result).rejects.toBeInstanceOf(Pq1UserError)
    await expect(result).rejects.toThrow("PQ1 accounts aren't available on this network")
    // Each GET_INIT_CODE spends a signature of the bootstrap key.
    expect(device.device.getInitCode).not.toHaveBeenCalled()
    expect(network.requests).toHaveLength(0)
  })

  it('refuses in plain language when the bundler predicts a failure, and sends nothing', async () => {
    const network = stubNetwork({ estimateError: 'UserOperation reverted during simulation' })
    const device = fakeDevice()
    const result = send(
      [{ to: USDC, value: 0n, data: usdcTransfer }],
      fakeChain({ deployed: true }),
      device
    )

    await expect(result).rejects.toBeInstanceOf(Pq1UserError)
    await expect(result).rejects.toThrow('would most likely fail')
    expect(device.device.signUserOp).not.toHaveBeenCalled()
    expect(network.submitted).toHaveLength(0)
  })

  it('refuses a network without the PQ1 contracts before any network or device work', async () => {
    const network = stubNetwork()
    const chain = fakeChain({ deployed: true })
    const device = fakeDevice()
    const result = send([{ to: RECIPIENT, value: 1n, data: '0x' }], chain, device, 10)

    await expect(result).rejects.toBeInstanceOf(Pq1UserError)
    expect(chain.provider.getCode).not.toHaveBeenCalled()
    expect(network.requests).toHaveLength(0)
    expect(device.device.signUserOp).not.toHaveBeenCalled()
  })

  it("refuses in plain language when the bundler doesn't answer the estimate", async () => {
    const network = stubNetwork({ noAnswer: 'eth_estimateUserOperationGas' })
    const device = fakeDevice()
    const result = send(
      [{ to: RECIPIENT, value: 1n, data: '0x' }],
      fakeChain({ deployed: true }),
      device
    )

    await expect(result).rejects.toBeInstanceOf(Pq1UserError)
    await expect(result).rejects.toThrow('Nothing was sent.')
    expect(device.device.signUserOp).not.toHaveBeenCalled()
    expect(network.submitted).toHaveLength(0)
  })

  it("reports a send the bundler didn't answer as unconfirmed, not as failed", async () => {
    stubNetwork({ noAnswer: 'eth_sendUserOperation' })
    const result = send(
      [{ to: RECIPIENT, value: 1n, data: '0x' }],
      fakeChain({ deployed: true }),
      fakeDevice()
    )

    await expect(result).rejects.toBeInstanceOf(Pq1UserError)
    await expect(result).rejects.toThrow("We couldn't confirm whether your transaction was sent.")
  })

  it("leaves a bundler rejection of the signed UserOp as the bundler's own error", async () => {
    stubNetwork({ sendError: "AA21 didn't pay prefund" })
    const result = send(
      [{ to: RECIPIENT, value: 1n, data: '0x' }],
      fakeChain({ deployed: true }),
      fakeDevice()
    )

    await expect(result).rejects.toBeInstanceOf(BundlerError)
    await expect(result).rejects.toThrow("AA21 didn't pay prefund")
  })
})
