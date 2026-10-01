const ONEKEY_WEBUSB_FILTERS = [
  { vendorId: 0x1209, productId: 0x53c0 },
  { vendorId: 0x1209, productId: 0x53c1 },
  { vendorId: 0x1209, productId: 0x4f4a },
  { vendorId: 0x1209, productId: 0x4f4b },
  { vendorId: 0x1209, productId: 0x4f4c }
]

type WebUsbDevice = {
  vendorId: number
  productId: number
  manufacturerName?: string | null
  serialNumber?: string | null
}

type WebUsbNavigator = Navigator & {
  usb?: {
    getDevices: () => Promise<WebUsbDevice[]>
    requestDevice: (options: { filters: typeof ONEKEY_WEBUSB_FILTERS }) => Promise<WebUsbDevice>
  }
}

const TREZOR_MANUFACTURER_NAMES = new Set(['trezor', 'trezor company', 'satoshilabs'])

const isOneKeyDevice = ({ vendorId, productId, manufacturerName }: WebUsbDevice) =>
  ONEKEY_WEBUSB_FILTERS.some(
    (filter) => filter.vendorId === vendorId && filter.productId === productId
  ) && !TREZOR_MANUFACTURER_NAMES.has(manufacturerName?.trim().toLowerCase() || '')

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
      filters: ONEKEY_WEBUSB_FILTERS
    }))

  return device.serialNumber || undefined
}

export default requestOneKeyDevicePermission
