import { describe, expect, jest, test } from '@jest/globals'

import { OneKeyBridgeInterface } from '@web/modules/hardware-wallet/onekey/types'

import OneKeyController from './OneKeyController'

const address = '0x1111111111111111111111111111111111111111'
const device = {
  connectId: 'connect-id',
  deviceId: 'seed-id',
  deviceType: 'pro',
  name: 'OneKey Pro'
}

const makeBridge = (overrides: Partial<OneKeyBridgeInterface> = {}) =>
  ({
    init: jest.fn(async () => {}),
    searchDevices: jest.fn(async () => ({ success: true, payload: [device] })),
    getOnekeyFeatures: jest.fn(async () => ({ success: true, payload: {} })),
    getPassphraseState: jest.fn(async () => ({ success: true, payload: 'state' })),
    evmGetAddress: jest.fn(async () => ({
      success: true,
      payload: { path: "m/44'/60'/0'/0/0", address }
    })),
    evmSignTransaction: jest.fn(),
    evmSignMessage: jest.fn(),
    evmSignTypedData: jest.fn(),
    cancel: jest.fn(async () => {}),
    ...overrides
  }) as unknown as OneKeyBridgeInterface

describe('OneKeyController compatibility detection', () => {
  test('identifies OneKey only after the proprietary feature request and address verification', async () => {
    const bridge = makeBridge()
    const controller = new OneKeyController(bridge)

    await expect(
      controller.connectFromTrezor('seed-id', "m/44'/60'/0'/0/0", address)
    ).resolves.toBe(true)
    expect(bridge.getOnekeyFeatures).toHaveBeenCalledWith('connect-id')
    expect(controller.deviceId).toBe('seed-id')
  })

  test('does not identify the device when getOnekeyFeatures fails', async () => {
    const bridge = makeBridge({
      getOnekeyFeatures: jest.fn(async () => ({
        success: false,
        payload: { error: 'Unknown message type' }
      }))
    })
    const controller = new OneKeyController(bridge)

    await expect(
      controller.connectFromTrezor('seed-id', "m/44'/60'/0'/0/0", address)
    ).resolves.toBe(false)
    expect(bridge.evmGetAddress).not.toHaveBeenCalled()
  })

  test('fails closed when the derived address does not match the stored key', async () => {
    const bridge = makeBridge({
      evmGetAddress: jest.fn(async () =>
        Promise.resolve({
          success: true as const,
          payload: {
            path: "m/44'/60'/0'/0/0",
            address: '0x2222222222222222222222222222222222222222'
          }
        })
      ) as OneKeyBridgeInterface['evmGetAddress']
    })
    const controller = new OneKeyController(bridge)

    await expect(
      controller.connectFromTrezor('seed-id', "m/44'/60'/0'/0/0", address)
    ).resolves.toBe(false)
  })
})
