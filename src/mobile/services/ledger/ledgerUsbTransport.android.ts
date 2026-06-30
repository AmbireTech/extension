import { DeviceEventEmitter } from 'react-native'

import { identifyUSBProductId, ledgerUSBVendorId } from '@ledgerhq/devices'
import HIDTransport from '@ledgerhq/react-native-hid'

// The HID descriptor's `name`/`deviceName` are the Linux device path
// (e.g. "/dev/bus/usb/002/003"), not a friendly name. Map the USB productId to
// the Ledger model and drop the "Ledger " prefix to match the Bluetooth naming
// (e.g. "Nano X").
const friendlyUsbName = (productId: number): string => {
  const productName = identifyUSBProductId(productId)?.productName
  if (!productName) return 'Ledger'
  return productName.startsWith('Ledger ') ? productName.slice('Ledger '.length) : productName
}

// Android USB (OTG) transport. `@ledgerhq/react-native-hid` is an Android-only
// native module (autolinked); `open()` triggers Android's "Allow access to USB
// device?" system dialog itself, so the app doesn't request USB permission.
const ledgerUsbTransport = {
  isSupported: () => HIDTransport.isSupported(),
  list: async () => {
    const devices = await HIDTransport.list()
    return devices.map((device: any) => ({
      id: String(device?.deviceId ?? device?.productId ?? 'usb'),
      name: friendlyUsbName(device?.productId)
    }))
  },
  open: async () => {
    const devices = await HIDTransport.list()
    if (!devices.length) {
      throw new Error(
        'No Ledger found over USB. Connect it with a cable, unlock it and open the Ethereum app, then try again.'
      )
    }
    // The Ledger is wired, so there's no scanning/pairing — open the first
    // connected device.
    return HIDTransport.open(devices[0])
  },
  onDisconnect: (callback: () => void) => {
    // The native module registers the USB attach/detach receiver in its
    // constructor, so this fires even while idle (cable pulled mid-session).
    const sub = DeviceEventEmitter.addListener('onDeviceDisconnect', (device: any) => {
      if (device?.vendorId === ledgerUSBVendorId) callback()
    })
    return { unsubscribe: () => sub.remove() }
  }
}

export default ledgerUsbTransport
