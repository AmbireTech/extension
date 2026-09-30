import { expect, jest, test } from '@jest/globals'

import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { ExternalKey } from '@ambire-common/interfaces/keystore'
import OneKeyController from '@web/modules/hardware-wallet/controllers/OneKeyController'
import { OneKeyBridgeInterface } from '@web/modules/hardware-wallet/onekey/types'

import OneKeySigner from './OneKeySigner'

jest.mock('@trezor/connect-plugin-ethereum', () => ({
  __esModule: true,
  default: () => ({ domain_separator_hash: '0x01', message_hash: '0x02' })
}))

const address = '0x1111111111111111111111111111111111111111'
const path = "m/44'/60'/0'/0/0"
const key: ExternalKey = {
  addr: address,
  type: 'onekey',
  label: 'OneKey Key 1',
  dedicatedToOneSA: false,
  meta: {
    deviceId: 'device-id',
    deviceModel: 'OneKey Pro',
    hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
    index: 0,
    createdAt: 1
  }
}

const makeBridge = () =>
  ({
    init: jest.fn(async () => {}),
    searchDevices: jest.fn(),
    getOnekeyFeatures: jest.fn(),
    getPassphraseState: jest.fn(),
    evmGetAddress: jest.fn(),
    evmSignTransaction: jest.fn(),
    evmSignMessage: jest.fn(),
    evmSignTypedData: jest.fn(async () => ({
      success: true as const,
      payload: { address, signature: '0xsignature' }
    })),
    cancel: jest.fn(async () => {})
  }) as unknown as OneKeyBridgeInterface

test('signs SafeTx typed data through the native OneKey SDK', async () => {
  const bridge = makeBridge()
  const controller = new OneKeyController(bridge)
  controller.connectId = 'connect-id'
  controller.deviceId = 'device-id'
  controller.passphraseState = 'passphrase-state'
  controller.unlockedPath = path
  controller.unlockedPathKeyAddr = address

  const signer = new OneKeySigner(key)
  signer.init(controller)
  const typedData = {
    domain: { chainId: 42161 },
    types: { SafeTx: [{ name: 'to', type: 'address' }] },
    message: { to: address },
    primaryType: 'SafeTx'
  } as any

  await expect(signer.signTypedData(typedData)).resolves.toBe('0xsignature')
  expect(bridge.evmSignTypedData).toHaveBeenCalledWith(
    'connect-id',
    'device-id',
    expect.objectContaining({
      path,
      passphraseState: 'passphrase-state',
      metamaskV4Compat: true,
      domainHash: '0x01',
      messageHash: '0x02',
      chainId: 42161,
      data: expect.objectContaining({ primaryType: 'SafeTx' })
    })
  )
})
