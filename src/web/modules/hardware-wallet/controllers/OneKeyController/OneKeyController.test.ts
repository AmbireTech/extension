import { describe, expect, jest, test } from '@jest/globals'

import { OneKeyBridgeInterface } from '@web/modules/hardware-wallet/onekey/types'

import OneKeyController from './OneKeyController'

const address = '0x1111111111111111111111111111111111111111'
const device = {
  connectId: 'connect-id',
  deviceId: 'seed-id',
  deviceType: 'pro',
  name: 'OneKey Pro',
  path: 'usb-serial-number'
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

describe('OneKeyController connection', () => {
  test('selects the device authorized by the browser from the OneKey SDK results', async () => {
    const bridge = makeBridge()
    const controller = new OneKeyController(bridge)

    await controller.connect('usb-serial-number')

    expect(bridge.searchDevices).toHaveBeenCalled()
    expect(controller.deviceId).toBe('seed-id')
  })
})
