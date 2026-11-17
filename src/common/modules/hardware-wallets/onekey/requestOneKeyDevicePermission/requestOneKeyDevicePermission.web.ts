import { ONEKEY_WEBUSB_FILTER } from '@onekeyfe/hd-shared'

type WebUsbDevice = {
  vendorId: number
  productId: number
  manufacturerName?: string | null
  serialNumber?: string | null
}

type WebUsbNavigator = Navigator & {
  usb?: {
    getDevices: () => Promise<WebUsbDevice[]>
    requestDevice: (options: { filters: typeof ONEKEY_WEBUSB_FILTER }) => Promise<WebUsbDevice>
  }
}

// Trezor devices share some of the OneKey USB ids. Newer OneKey SDK versions export this
// check as `isKnownTrezorWebUsbDevice`, but the SDK version Ambire uses doesn't have it yet.
const TREZOR_MANUFACTURER_NAMES = new Set(['trezor', 'trezor company', 'satoshilabs'])

const isOneKeyDevice = (device: WebUsbDevice) =>
  ONEKEY_WEBUSB_FILTER.some(
    (filter) => filter.vendorId === device.vendorId && filter.productId === device.productId
  ) && !TREZOR_MANUFACTURER_NAMES.has(device.manufacturerName?.trim().toLowerCase() || '')

export const isOneKeyWebUsbSupported = () => !!(navigator as WebUsbNavigator).usb

/**
 * Whether a OneKey the browser already allowed Ambire to use is plugged in. When it isn't,
 * the device has to be plugged in or allowed again from a tab, the only place the browser
 * shows its device picker.
 */
export const hasAuthorizedOneKeyDevice = async () => {
  if (!isOneKeyWebUsbSupported()) return false

  const authorizedDevices = await (navigator as WebUsbNavigator).usb!.getDevices()
  return authorizedDevices.some(isOneKeyDevice)
}

const requestOneKeyDevicePermission = async () => {
  const usb = (navigator as WebUsbNavigator).usb!
  const authorizedDevices = await usb.getDevices()
  const authorizedOneKeyDevice = authorizedDevices.find(isOneKeyDevice)
  const device =
    authorizedOneKeyDevice ||
    (await usb.requestDevice({
      filters: ONEKEY_WEBUSB_FILTER
    }))

  return device.serialNumber || undefined
}

export default requestOneKeyDevicePermission
