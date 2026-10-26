// PQ1Signer is Ambire's adapter around `pq1-sdk`, which has its own tests
// for the device protocol, clear signing and the send pipeline. These check
// the adapter: it refuses another PQ1, damaged key details and chains
// without the PQ1 contracts, passes the right account, chain and approved fee
// to the SDK, retries once after an idle-lock, words device and unexpected
// failures for the user, and leaves bundler rejections and RPC failures to
// Ambire's own broadcast error handling.

import type { JsonRpcProvider } from 'ethers'
import { DeviceError, Pq1Error } from 'pq1-sdk'
import {
  BundlerError,
  prepareTransaction,
  signPq1Message,
  signPreparedTransaction,
  submitUserOperation
} from 'pq1-sdk/aa'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'

import { PQ1_SEND_FAILED_MESSAGE } from '../pq1/errors'
import PQ1Signer from './PQ1Signer'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({ captureException: jest.fn() }))
jest.mock('pq1-sdk/aa', () => ({
  ...jest.requireActual('pq1-sdk/aa'),
  prepareTransaction: jest.fn(),
  signPreparedTransaction: jest.fn(),
  submitUserOperation: jest.fn(),
  signPq1Message: jest.fn(),
  signPq1TypedData: jest.fn()
}))

const WALLET = '0x00000000000000000000000000000000000abc25'
const SIGNATURE = '0x5191'

const mocked = <T extends (...args: never[]) => unknown>(fn: T) => fn as unknown as jest.Mock

function signerWith(key: { deviceId?: string; index?: number } = {}) {
  const device = { commands: { name: 'commands' }, getInitCode: jest.fn() }
  const controller = {
    deviceId: 'device-a',
    getUnlockedDevice: jest.fn(async () => device)
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
  return { signer, controller, device }
}

const ctx = (chainId = 1n) => ({ chainId, provider: {} as JsonRpcProvider })

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

describe('PQ1Signer — device, key and chain checks', () => {
  it('refuses to sign with a PQ1 other than the one the account came from', async () => {
    const { signer } = signerWith({ deviceId: 'device-b' })
    const result = signer.signMessage('0x68656c6c6f', ctx())
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow('belongs to a different PQ1')
    expect(signPq1Message).not.toHaveBeenCalled()
  })

  it('refuses a key whose account number is missing instead of using account 0', async () => {
    const { signer } = signerWith({ index: undefined })
    await expect(signer.signMessage('0x68656c6c6f', ctx())).rejects.toThrow(
      'saved details are damaged'
    )
    expect(signPq1Message).not.toHaveBeenCalled()
  })

  it('refuses a chain without the PQ1 contracts before asking the device', async () => {
    const { signer, controller } = signerWith()
    await expect(signer.signMessage('0x68656c6c6f', ctx(10n))).rejects.toThrow(
      "PQ1 accounts aren't available on this network"
    )
    expect(controller.getUnlockedDevice).not.toHaveBeenCalled()
  })

  it('refuses to sign without the chain the signature will be verified on', async () => {
    const { signer } = signerWith()
    await expect(signer.signMessage('0x68656c6c6f')).rejects.toThrow(
      "Couldn't prepare this signature"
    )
    expect(signPq1Message).not.toHaveBeenCalled()
  })
})

describe('PQ1Signer.signMessage', () => {
  it("signs on the account's number, for the request's chain", async () => {
    mocked(signPq1Message).mockResolvedValueOnce(SIGNATURE)
    const { signer, device } = signerWith()
    await expect(signer.signMessage('0x68656c6c6f', ctx(8453n))).resolves.toBe(SIGNATURE)
    expect(signPq1Message).toHaveBeenCalledWith(
      expect.objectContaining({
        device: device.commands,
        accountIndex: 250,
        sender: WALLET,
        chain: expect.objectContaining({ chainId: 8453 })
      }),
      { raw: '0x68656c6c6f' }
    )
  })

  it('unlocks again and retries once when the PQ1 locked itself in between', async () => {
    mocked(signPq1Message)
      .mockRejectedValueOnce(new DeviceError('SIGN_OFFCHAIN: locked', 0x6985, 'locked'))
      .mockResolvedValueOnce(SIGNATURE)
    const { signer, controller } = signerWith()
    await expect(signer.signMessage('0x68656c6c6f', ctx())).resolves.toBe(SIGNATURE)
    expect(controller.getUnlockedDevice).toHaveBeenCalledTimes(2)
  })

  it('never retries a rejection on the device, and words it for the user', async () => {
    mocked(signPq1Message).mockRejectedValue(new DeviceError('rejected', 0x6982, 'rejected'))
    const { signer } = signerWith()
    const result = signer.signMessage('0x68656c6c6f', ctx())
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow('The request was rejected on the PQ1.')
    expect(signPq1Message).toHaveBeenCalledTimes(1)
  })

  it('words an unexpected failure for the user instead of showing technical text', async () => {
    mocked(signPq1Message).mockRejectedValueOnce(new Error('hex string has odd length'))
    const { signer } = signerWith()
    const result = signer.signMessage('0x123', ctx())
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.not.toThrow('odd length')
  })
})

describe('PQ1Signer.broadcastAccountOp', () => {
  const env = { ...process.env }
  const send = () =>
    signerWith().signer.broadcastAccountOp({
      chainId: 1n,
      provider: {} as JsonRpcProvider,
      calls: [{ to: WALLET, value: 1n, data: '0x' }],
      gasFeePayment: { gasPrice: 2n, maxPriorityFeePerGas: 1n }
    })
  const prepared = { chainId: 1, wallet: { nonce: 3n } }

  beforeEach(() => {
    process.env.REACT_APP_PIMLICO_API_KEY = 'test-key'
    mocked(prepareTransaction).mockResolvedValue(prepared)
    mocked(signPreparedTransaction).mockResolvedValue({ signed: true })
  })

  afterAll(() => {
    process.env = env
  })

  it('passes the approved fee and the account through, and returns the UserOp', async () => {
    mocked(submitUserOperation).mockResolvedValueOnce('0x01')
    await expect(send()).resolves.toEqual({ userOpHash: '0x01', nonce: 3n })
    expect(prepareTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        accountIndex: 250,
        sender: WALLET,
        calls: [{ to: WALLET, value: 1n, data: '0x' }],
        fee: { maxFeePerGas: 2n, maxPriorityFeePerGas: 1n },
        chain: expect.objectContaining({ chainId: 1 })
      })
    )
    expect(submitUserOperation).toHaveBeenCalledWith(expect.anything(), 1, { signed: true })
  })

  it('refuses a contract deployment before asking the device', async () => {
    const { signer, controller } = signerWith()
    const result = signer.broadcastAccountOp({
      chainId: 1n,
      provider: {} as JsonRpcProvider,
      calls: [{ to: undefined as never, value: 0n, data: '0x60' }],
      gasFeePayment: { gasPrice: 2n }
    })
    await expect(result).rejects.toThrow("can't create new contracts")
    expect(controller.getUnlockedDevice).not.toHaveBeenCalled()
  })

  it('refuses to send when this build has no bundler key', async () => {
    delete process.env.REACT_APP_PIMLICO_API_KEY
    await expect(send()).rejects.toThrow("isn't available in this version of Ambire")
    expect(prepareTransaction).not.toHaveBeenCalled()
  })

  it("leaves a bundler failure to Ambire's broadcast error handling", async () => {
    const failure = new BundlerError(-32500, "AA21 didn't pay prefund")
    mocked(submitUserOperation).mockRejectedValueOnce(failure)
    await expect(send()).rejects.toBe(failure)
  })

  it("leaves an RPC failure to Ambire's broadcast error handling", async () => {
    const failure = Object.assign(new Error('could not detect network'), { code: 'NETWORK_ERROR' })
    mocked(prepareTransaction).mockRejectedValueOnce(
      new Pq1Error('rpc', 'eth_getCode on chain 1 failed', { cause: failure })
    )
    await expect(send()).rejects.toBe(failure)
  })

  it('words an unexpected failure as a failed send, not as technical text', async () => {
    mocked(prepareTransaction).mockRejectedValueOnce(
      new Error('Cannot decode zero data ("0x") with ABI parameters.')
    )
    const result = send()
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow(PQ1_SEND_FAILED_MESSAGE)
  })

  it('words a refusal on the device for the user', async () => {
    mocked(signPreparedTransaction).mockRejectedValueOnce(
      new DeviceError('SIGN_USEROP: rejected', 0x6982, 'rejected')
    )
    const result = send()
    await expect(result).rejects.toBeInstanceOf(ExternalSignerError)
    await expect(result).rejects.toThrow('The request was rejected on the PQ1.')
    expect(submitUserOperation).not.toHaveBeenCalled()
  })
})
