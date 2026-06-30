import type Transport from '@ledgerhq/hw-transport'

// Platform-resolved USB (HID) transport for Ledger. Real implementation lives in
// the .android.ts file (`@ledgerhq/react-native-hid`, an Android-only native
// module); the .ios.ts file is a stub. Isolating the import this way keeps the
// Android-only package out of the iOS bundle entirely.
export interface LedgerUsbDevice {
  id: string
  name: string
}

export interface LedgerUsbTransport {
  // True only on Android with the native HID module present.
  isSupported: () => Promise<boolean>
  // Currently connected USB Ledger devices (wired — instant, no permission).
  // Empty on iOS / when none plugged in.
  list: () => Promise<LedgerUsbDevice[]>
  // Opens a transport to the connected USB Ledger (triggers Android's USB
  // permission dialog on first use). Throws if none is plugged in / unsupported.
  open: () => Promise<Transport>
  // Fires when a Ledger USB device is detached (cable pulled), even while idle.
  // Returns a subscription to release the listener.
  onDisconnect: (callback: () => void) => { unsubscribe: () => void }
}

declare const ledgerUsbTransport: LedgerUsbTransport

export default ledgerUsbTransport
