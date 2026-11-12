import { describe, expect, jest, test, beforeEach } from '@jest/globals'

import { UiManager } from '@ambire-common/interfaces/ui'
import * as env from '@common/config/env'
import { TREZOR_CONNECT_MANIFEST } from '@common/modules/hardware-wallet/constants/trezor'
import trezorConnect from '@trezor/connect-webextension'

import TrezorController from './TrezorController'

jest.mock('@common/config/env', () => ({ __esModule: true, isFirefoxBuild: false }))
jest.mock('@trezor/connect-webextension', () => ({
  __esModule: true,
  default: {
    init: jest.fn(async () => {}),
    cancel: jest.fn(),
    ethereumGetAddress: jest.fn()
  }
}))

const closePopupWithUrl = jest.fn<UiManager['window']['closePopupWithUrl']>(async () => {})
const windowManager = { closePopupWithUrl } as unknown as UiManager['window']

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(env, { isFirefoxBuild: false })
  delete (trezorConnect as any).on
})

describe('TrezorController SDK compatibility', () => {
  test('initializes v10 without the removed event API and popup settings', async () => {
    const controller = new TrezorController(windowManager)

    await controller.initialLoadPromise

    expect(trezorConnect.init).toHaveBeenCalledWith({ manifest: TREZOR_CONNECT_MANIFEST })
    expect(controller.isInitiated).toBe(true)
  })

  test('keeps the v9 settings and device events for Firefox', async () => {
    Object.assign(env, { isFirefoxBuild: true })
    const on = jest.fn()
    Object.assign(trezorConnect, { on })
    const controller = new TrezorController(windowManager)

    await controller.initialLoadPromise

    expect(trezorConnect.init).toHaveBeenCalledWith({
      manifest: TREZOR_CONNECT_MANIFEST,
      lazyLoad: true,
      popup: true
    })
    const listener = on.mock.calls[0]![1] as (event: any) => void
    listener({ payload: { name: 'Trezor Safe 5', id: 'device-id' } })
    expect(controller.deviceModel).toBe('Safe 5')
    expect(controller.deviceId).toBe('device-id')
  })

  test.each([
    [false, 'https://suite.trezor.io/web/connect-popup'],
    [true, 'https://connect.trezor.io/9/popup.html']
  ])('closes the correct popup when Firefox is %s', async (isFirefoxBuild, popupUrl) => {
    Object.assign(env, { isFirefoxBuild })
    if (isFirefoxBuild) Object.assign(trezorConnect, { on: jest.fn() })
    const controller = new TrezorController(windowManager)
    await controller.initialLoadPromise

    await controller.signingCleanup()

    expect(trezorConnect.cancel).toHaveBeenCalled()
    expect(closePopupWithUrl).toHaveBeenCalledWith(popupUrl)
  })

  test.each([
    { success: false, error: { code: 'Device_Disconnected', message: 'Device disconnected' } },
    { success: false, payload: { code: 'Device_Disconnected', error: 'Device disconnected' } }
  ])('reports disconnection errors from either SDK response format', async (response) => {
    jest.mocked(trezorConnect.ethereumGetAddress).mockResolvedValueOnce(response as any)
    const controller = new TrezorController(windowManager)
    await controller.initialLoadPromise

    await expect(controller.unlock("m/44'/60'/0'/0/0")).rejects.toThrow(
      'Trezor device got disconnected.'
    )
  })
})
