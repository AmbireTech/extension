import { ledgerUSBVendorId } from '@ledgerhq/devices'

export const hasConnectedLedgerDevice = async () => {
  const devices = await navigator.hid.getDevices()
  return devices.filter((device) => device.vendorId === ledgerUSBVendorId).length > 0
}
