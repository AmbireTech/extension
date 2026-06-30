import type Transport from '@ledgerhq/hw-transport'

// iOS has no wired USB access to Ledger for third-party apps (BLE only), and
// `@ledgerhq/react-native-hid` ships no iOS native module — so this is a stub.
const ledgerUsbTransport = {
  isSupported: async (): Promise<boolean> => false,
  list: async () => [],
  open: async (): Promise<Transport> => {
    throw new Error('Connecting to a Ledger over USB is not supported on iOS. Use Bluetooth.')
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDisconnect: (_callback: () => void) => ({ unsubscribe: () => {} })
}

export default ledgerUsbTransport
