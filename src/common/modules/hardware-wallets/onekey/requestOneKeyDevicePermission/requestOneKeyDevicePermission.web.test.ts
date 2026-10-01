/**
 * @jest-environment jsdom
 */
import requestOneKeyDevicePermission, {
  hasAuthorizedOneKeyDevice
} from './requestOneKeyDevicePermission.web'

const oneKeyPro = {
  vendorId: 0x1209,
  productId: 0x53c1,
  manufacturerName: 'OneKey',
  serialNumber: 'onekey-serial'
}

describe('requestOneKeyDevicePermission', () => {
  const setUsb = (usb: unknown) => {
    Object.defineProperty(navigator, 'usb', { configurable: true, value: usb })
  }

  afterEach(() => {
    setUsb(undefined)
  })

  test('reuses a previously authorized OneKey device', async () => {
    const requestDevice = jest.fn()
    setUsb({ getDevices: jest.fn(async () => [oneKeyPro]), requestDevice })

    await expect(requestOneKeyDevicePermission()).resolves.toBe('onekey-serial')
    expect(requestDevice).not.toHaveBeenCalled()
  })

  test('opens the browser chooser when no OneKey device is authorized', async () => {
    const requestDevice = jest.fn(async () => oneKeyPro)
    setUsb({ getDevices: jest.fn(async () => []), requestDevice })

    await expect(requestOneKeyDevicePermission()).resolves.toBe('onekey-serial')
    expect(requestDevice).toHaveBeenCalledWith({
      filters: [
        { vendorId: 0x1209, productId: 0x53c0 },
        { vendorId: 0x1209, productId: 0x53c1 },
        { vendorId: 0x1209, productId: 0x4f4a },
        { vendorId: 0x1209, productId: 0x4f4b },
        { vendorId: 0x1209, productId: 0x4f4c }
      ]
    })
  })

  test('does not mistake an authorized Trezor with shared USB identifiers for OneKey', async () => {
    const requestDevice = jest.fn(async () => oneKeyPro)
    setUsb({
      getDevices: jest.fn(async () => [
        { ...oneKeyPro, manufacturerName: 'SatoshiLabs', serialNumber: 'trezor-serial' }
      ]),
      requestDevice
    })

    await expect(requestOneKeyDevicePermission()).resolves.toBe('onekey-serial')
    expect(requestDevice).toHaveBeenCalled()
  })

  test('reports an authorized OneKey only when one is plugged in', async () => {
    setUsb({ getDevices: jest.fn(async () => [oneKeyPro]) })
    await expect(hasAuthorizedOneKeyDevice()).resolves.toBe(true)

    setUsb({
      getDevices: jest.fn(async () => [{ ...oneKeyPro, manufacturerName: 'SatoshiLabs' }])
    })
    await expect(hasAuthorizedOneKeyDevice()).resolves.toBe(false)

    setUsb(undefined)
    await expect(hasAuthorizedOneKeyDevice()).resolves.toBe(false)
  })
})
