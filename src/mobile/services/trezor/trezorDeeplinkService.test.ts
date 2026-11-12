import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import TrezorConnect from '@trezor/connect-mobile'

import trezorDeeplinkService from './trezorDeeplinkService'

jest.mock('react-native', () => ({
  Linking: { addEventListener: jest.fn(), openURL: jest.fn() }
}))
jest.mock('@trezor/connect-mobile', () => ({
  __esModule: true,
  default: { init: jest.fn(async () => {}), ethereumGetAddress: jest.fn() }
}))

const getAddress = jest.mocked(TrezorConnect.ethereumGetAddress)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Trezor deep-link failures', () => {
  test('preserves v10 device errors instead of treating them as cancellation', async () => {
    getAddress.mockResolvedValueOnce({
      success: false,
      error: { code: 'Device_Disconnected', message: 'Device disconnected' }
    })

    const response = await trezorDeeplinkService.ethereumGetAddress({ path: "m/44'/60'/0'/0/0" })

    expect(response.payload).toEqual({
      code: 'Device_Disconnected',
      error: 'Device disconnected'
    })
  })

  test('preserves v9 failure details', async () => {
    const response = {
      success: false,
      payload: { code: 'Failure_ActionCancelled', error: 'Cancelled on device' }
    }
    getAddress.mockResolvedValueOnce(response as any)

    await expect(trezorDeeplinkService.ethereumGetAddress({})).resolves.toBe(response)
  })

  test('explains a Suite cancellation with an empty payload', async () => {
    getAddress.mockResolvedValueOnce({ success: false, payload: {} } as any)

    await expect(trezorDeeplinkService.ethereumGetAddress({})).resolves.toEqual({
      success: false,
      payload: { error: 'The request was cancelled in Trezor Suite.' }
    })
  })

  test('leaves successful responses unchanged', async () => {
    const response = { success: true, payload: { address: '0x1234' } }
    getAddress.mockResolvedValueOnce(response as any)

    await expect(trezorDeeplinkService.ethereumGetAddress({})).resolves.toBe(response)
  })
})
