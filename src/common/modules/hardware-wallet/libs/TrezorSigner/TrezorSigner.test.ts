import { describe, expect, jest, test } from '@jest/globals'

import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { ExternalKey } from '@ambire-common/interfaces/keystore'

import TrezorSigner, { isOneKeySafeTxCompatibilityError } from './TrezorSigner'

jest.mock('@ambire-common/utils/wait', () => ({
  __esModule: true,
  default: () => Promise.resolve()
}))
jest.mock('@trezor/connect-plugin-ethereum', () => ({
  __esModule: true,
  default: () => ({ domain_separator_hash: '0x01', message_hash: '0x02' })
}))

const compatibilityError = new TypeError("Cannot read properties of undefined (reading 'length')")
const key: ExternalKey = {
  addr: '0x1111111111111111111111111111111111111111',
  type: 'trezor',
  label: 'Trezor Key 1',
  dedicatedToOneSA: false,
  meta: {
    deviceId: 'device-id',
    deviceModel: 'Trezor',
    hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
    index: 0,
    createdAt: 1
  }
}
const typedData = {
  domain: { chainId: 42161 },
  types: { SafeTx: [{ name: 'to', type: 'address' }] },
  message: { to: key.addr },
  primaryType: 'SafeTx'
} as any

const makeController = (recoverSafeTxWithOneKey: jest.Mock) => ({
  initialLoadPromise: Promise.resolve(),
  isInitiated: true,
  signingCleanup: async () => {},
  recoverSafeTxWithOneKey,
  walletSDK: {
    ethereumSignTypedData: jest.fn(async () => {
      throw compatibilityError
    })
  }
})

describe('TrezorSigner OneKey SafeTx compatibility recovery', () => {
  test('matches only the exact compatibility error on SafeTx', () => {
    expect(isOneKeySafeTxCompatibilityError(compatibilityError, 'SafeTx')).toBe(true)
    expect(isOneKeySafeTxCompatibilityError(compatibilityError, 'Permit')).toBe(false)
    expect(isOneKeySafeTxCompatibilityError(new Error('Device disconnected'), 'SafeTx')).toBe(false)
  })

  test('returns the OneKey retry signature after the compatibility failure', async () => {
    const recover = jest.fn(async () => '0xrecovered')
    const signer = new TrezorSigner(key)
    signer.init(makeController(recover) as any)

    await expect(signer.signTypedData(typedData)).resolves.toBe('0xrecovered')
    expect(recover).toHaveBeenCalledWith(expect.objectContaining({ type: 'trezor' }), typedData)
  })

  test('recovers when Trezor Connect returns the compatibility failure as a response', async () => {
    const recover = jest.fn(async () => '0xrecovered')
    const controller = makeController(recover)
    controller.walletSDK.ethereumSignTypedData = jest.fn(async () => ({
      success: false as const,
      payload: { error: compatibilityError.message }
    })) as any
    const signer = new TrezorSigner(key)
    signer.init(controller as any)

    await expect(signer.signTypedData(typedData)).resolves.toBe('0xrecovered')
    expect(recover).toHaveBeenCalledTimes(1)
  })

  test('does not probe OneKey for a different primary type', async () => {
    const recover = jest.fn(async () => '0xrecovered')
    const signer = new TrezorSigner(key)
    signer.init(makeController(recover) as any)

    await expect(signer.signTypedData({ ...typedData, primaryType: 'Permit' })).rejects.toThrow(
      "Cannot read properties of undefined (reading 'length')"
    )
    expect(recover).not.toHaveBeenCalled()
  })
})
