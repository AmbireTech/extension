// PQ1Signer against a fake device: it refuses another PQ1 and damaged key
// details, words device and unexpected failures for the user while leaving
// bundler rejections and RPC failures to Ambire, and routes Safe / CoW typed
// data to the device's own screens (when its firmware has them) without ever
// retrying a refused request blind.

import type { JsonRpcProvider } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'

import { pq1BroadcastAccountOp } from '../pq1/aa/broadcast'
import { BundlerError } from '../pq1/aa/bundler'
import { C10_SIG_LEN, CAP_OFFCHAIN_COW_ORDER, CAP_OFFCHAIN_SAFE_TX } from '../pq1/config'
import { GPV2_SETTLEMENT_ADDRESS } from '../pq1/cowswap/eip712'
import { PQ1_SEND_FAILED_MESSAGE } from '../pq1/errors'
import { DeviceError } from '../pq1/transport/hid'
import { buildSignOffchainPayload, type SignOffchainParams } from '../pq1/transport/offchain'
import PQ1Signer from './PQ1Signer'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({ captureException: jest.fn() }))

const mockAccountState = { isDeployed: true, slotIndex: 0, ownerIndex: 1n }
jest.mock('../pq1/aa/accountState', () => ({
  resolvePq1AccountState: jest.fn(async () => mockAccountState)
}))
jest.mock('../pq1/aa/broadcast', () => ({
  ...jest.requireActual('../pq1/aa/broadcast'),
  pq1BroadcastAccountOp: jest.fn()
}))

const WALLET = '0x00000000000000000000000000000000000abc25'
const ZERO = '0x0000000000000000000000000000000000000000'

const SAFE_TX = {
  domain: { chainId: 1, verifyingContract: '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe' },
  types: {
    SafeTx: [
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
  },
  primaryType: 'SafeTx',
  message: {
    to: '0x1234567890AbcdEF1234567890aBcdef12345678',
    value: '1000',
    data: '0x',
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO,
    refundReceiver: ZERO,
    nonce: '3'
  }
}

const COW_ORDER = {
  domain: {
    name: 'Gnosis Protocol',
    version: 'v2',
    chainId: 1,
    verifyingContract: GPV2_SETTLEMENT_ADDRESS
  },
  types: {
    Order: [
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
  },
  primaryType: 'Order',
  message: {
    sellToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    buyToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    receiver: WALLET,
    sellAmount: '1500000000',
    buyAmount: '500000000000000000',
    validTo: 1893456000,
    appData: `0x${'00'.repeat(32)}`,
    feeAmount: '0',
    kind: 'sell',
    partiallyFillable: false,
    sellTokenBalance: 'erc20',
    buyTokenBalance: 'erc20'
  }
}

function signerWith(caps: number, refuse = false, key: { deviceId?: string; index?: number } = {}) {
  const sent: string[] = []
  const commands = {
    getCapabilities: jest.fn(async () => caps),
    signOffchain: jest.fn(async (p: SignOffchainParams) => {
      buildSignOffchainPayload(p)
      sent.push(p.kind)
      if (refuse) {
        throw new DeviceError('SIGN_OFFCHAIN failed: SW=0x6f00', 0x6f00, 'sign-refused')
      }
      return {
        kind: 'deployed' as const,
        newOffchainCount: 1n,
        innerSig: new Uint8Array(C10_SIG_LEN)
      }
    })
  }
  const controller = {
    deviceId: 'device-a',
    walletSDK: { commands },
    unlock: async () => 'ALREADY_UNLOCKED' as const
  }
  const signer = new PQ1Signer({
    addr: WALLET,
    type: 'pq1',
    label: 'PQ1',
    dedicatedToOneSA: false,
    meta: {
      deviceId: key.deviceId ?? 'device-a',
      deviceModel: 'pq1',
      hdPathTemplate: '',
      index: 'index' in key ? key.index : 250
    }
  } as never)
  signer.init(controller as never)
  return { signer, commands, sent }
}

const ctx = (chainId = 1n) => ({ chainId, provider: {} as JsonRpcProvider })

describe('PQ1Signer.signTypedData — Safe / CoW routing', () => {
  beforeEach(() => {
    mockAccountState.isDeployed = true
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends a SafeTx as kind 4 when the device can show it', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_SAFE_TX)
    await signer.signTypedData(SAFE_TX as never, ctx())
    expect(sent).toEqual(['safe_tx'])
  })

  it('sends a CoW order as kind 5 when the device can show it', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_COW_ORDER)
    await signer.signTypedData(COW_ORDER as never, ctx())
    expect(sent).toEqual(['cow_order'])
  })

  it('signs the hash blind on firmware without the capability bit', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_COW_ORDER) // no SafeTx bit
    await signer.signTypedData(SAFE_TX as never, ctx())
    expect(sent).toEqual(['raw32'])
  })

  it('never retries a refused structured sign blind', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_SAFE_TX | CAP_OFFCHAIN_COW_ORDER, true)
    await expect(signer.signTypedData(SAFE_TX as never, ctx())).rejects.toThrow(/refused/)
    expect(sent).toEqual(['safe_tx'])
  })

  it('refuses a request whose domain names another chain', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_SAFE_TX)
    await expect(signer.signTypedData(SAFE_TX as never, ctx(8453n))).rejects.toThrow(
      /different network/
    )
    expect(sent).toEqual([])
  })

  it('refuses an account not yet deployed on the network', async () => {
    mockAccountState.isDeployed = false
    const { signer, sent } = signerWith(CAP_OFFCHAIN_COW_ORDER)
    await expect(signer.signTypedData(COW_ORDER as never, ctx())).rejects.toThrow(/isn't set up/)
    expect(sent).toEqual([])
  })
})

describe('PQ1Signer — device and key checks', () => {
  beforeEach(() => {
    mockAccountState.isDeployed = true
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('refuses to sign with a PQ1 other than the one the account came from', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_SAFE_TX, false, { deviceId: 'device-b' })
    const result = signer.signMessage('0x68656c6c6f', ctx())
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow('belongs to a different PQ1')
    expect(sent).toEqual([])
  })

  it('refuses a key whose account number is missing instead of using account 0', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_SAFE_TX, false, { index: undefined })
    await expect(signer.signMessage('0x68656c6c6f', ctx())).rejects.toThrow(
      'saved details are damaged'
    )
    expect(sent).toEqual([])
  })

  it('words a malformed message for the user', async () => {
    const { signer, sent } = signerWith(CAP_OFFCHAIN_SAFE_TX)
    const result = signer.signMessage('0x123', ctx())
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.not.toThrow('odd-length')
    expect(sent).toEqual([])
  })
})

describe('PQ1Signer.broadcastAccountOp — errors', () => {
  const env = { ...process.env }
  const broadcast = pq1BroadcastAccountOp as jest.MockedFunction<typeof pq1BroadcastAccountOp>
  const send = () =>
    signerWith(0).signer.broadcastAccountOp({
      chainId: 1n,
      provider: {} as JsonRpcProvider,
      calls: [{ to: WALLET, value: 1n, data: '0x' }],
      gasFeePayment: { gasPrice: 2n, maxPriorityFeePerGas: 1n }
    })

  beforeAll(() => {
    process.env.REACT_APP_PIMLICO_API_KEY = 'test-key'
  })

  afterAll(() => {
    process.env = env
  })

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    broadcast.mockReset()
  })

  it("leaves a bundler failure to Ambire's broadcast error handling", async () => {
    const failure = new BundlerError(-32500, "AA21 didn't pay prefund")
    broadcast.mockRejectedValueOnce(failure)
    await expect(send()).rejects.toBe(failure)
  })

  it("leaves an RPC failure to Ambire's broadcast error handling", async () => {
    const failure = Object.assign(new Error('could not detect network'), { code: 'NETWORK_ERROR' })
    broadcast.mockRejectedValueOnce(failure)
    await expect(send()).rejects.toBe(failure)
  })

  it('words an unexpected failure as a failed send, not as technical text', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    broadcast.mockRejectedValueOnce(
      new Error('Cannot decode zero data ("0x") with ABI parameters.')
    )
    const result = send()
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow(PQ1_SEND_FAILED_MESSAGE)
  })

  it('words a refusal on the device for the user', async () => {
    broadcast.mockRejectedValueOnce(new DeviceError('SIGN_USEROP: rejected', 0x6982, 'rejected'))
    const result = send()
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow('The request was rejected on the PQ1.')
  })

  it('passes the approved fee and the chain through', async () => {
    broadcast.mockResolvedValueOnce({ userOpHash: '0x01', nonce: 3n })
    await expect(send()).resolves.toEqual({ userOpHash: '0x01', nonce: 3n })
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 1,
        accountIndex: 250,
        sender: WALLET,
        fee: { maxFeePerGas: 2n, maxPriorityFeePerGas: 1n }
      })
    )
  })
})
