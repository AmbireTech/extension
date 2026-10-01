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

describe('OneKeyController stale connection recovery', () => {
  test('connects again and retries once when the device behind the connection changed', async () => {
    const evmGetAddress = jest
      .fn<OneKeyBridgeInterface['evmGetAddress']>()
      .mockResolvedValueOnce({
        success: false,
        payload: { error: 'Device not found', code: 105 }
      })
      .mockResolvedValueOnce({ success: true, payload: { path: "m/44'/60'/0'/0/0", address } })
    const bridge = makeBridge({ evmGetAddress })
    const controller = new OneKeyController(bridge)
    controller.connectId = 'stale-connect-id'
    controller.deviceId = 'stale-device-id'

    await expect(controller.unlock("m/44'/60'/0'/0/0", address)).resolves.toBe('JUST_UNLOCKED')
    expect(bridge.searchDevices).toHaveBeenCalledTimes(1)
    expect(evmGetAddress).toHaveBeenNthCalledWith(
      1,
      'stale-connect-id',
      'stale-device-id',
      expect.anything()
    )
    expect(evmGetAddress).toHaveBeenNthCalledWith(2, 'connect-id', 'seed-id', expect.anything())
  })

  test('does not retry other failures', async () => {
    const evmGetAddress = jest.fn<OneKeyBridgeInterface['evmGetAddress']>().mockResolvedValue({
      success: false,
      payload: { error: 'Action cancelled by user', code: 803 }
    })
    const bridge = makeBridge({ evmGetAddress })
    const controller = new OneKeyController(bridge)
    controller.connectId = 'connect-id'
    controller.deviceId = 'seed-id'

    await expect(controller.unlock("m/44'/60'/0'/0/0", address)).rejects.toThrow(
      'Action cancelled by user'
    )
    expect(evmGetAddress).toHaveBeenCalledTimes(1)
    expect(bridge.searchDevices).not.toHaveBeenCalled()
  })
})
