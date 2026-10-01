const ONEKEY_WEBUSB_FILTERS = [
  { vendorId: 0x1209, productId: 0x53c0 },
  { vendorId: 0x1209, productId: 0x53c1 },
  { vendorId: 0x1209, productId: 0x4f4a },
  { vendorId: 0x1209, productId: 0x4f4b },
  { vendorId: 0x1209, productId: 0x4f4c }
]

type WebUsbNavigator = Navigator & {
  usb?: {
    requestDevice: (options: {
      filters: typeof ONEKEY_WEBUSB_FILTERS
    }) => Promise<{ serialNumber?: string | null }>
  }
}

export const isOneKeyWebUsbSupported = () => !!(navigator as WebUsbNavigator).usb

const requestOneKeyDevicePermission = async () => {
  const device = await (navigator as WebUsbNavigator).usb!.requestDevice({
    filters: ONEKEY_WEBUSB_FILTERS
  })

  return device.serialNumber || undefined
}

export default requestOneKeyDevicePermission
