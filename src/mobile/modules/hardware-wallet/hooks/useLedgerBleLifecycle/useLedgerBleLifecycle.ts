import { useEffect } from 'react'
import { AppState } from 'react-native'

import ledgerBleService from '@mobile/services/ledger/ledgerBleService'

// Tears down the persistent Ledger BLE connection on lock / background.
//
// Unlike Rabby mobile (which opens and closes the transport per operation, so it
// has nothing to tear down), our connection is established on the connect screen
// and reused by later worker-driven signing over the bridge. That persistent link
// must not linger when the wallet is locked or the app is backgrounded (battery
// + security). The transport transparently reopens via ledgerBleService's
// reconnect (ensureConnected + lastDeviceId) on the next operation.
const useLedgerBleLifecycle = (isKeystoreUnlocked: boolean) => {
  // A locked wallet should hold no hardware-wallet connection.
  useEffect(() => {
    if (!isKeystoreUnlocked) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ledgerBleService.cleanUp()
    }
  }, [isKeystoreUnlocked])

  // Disconnect when the app goes to the background (not on transient 'inactive',
  // which fires for control center / app-switcher peeks on iOS).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ledgerBleService.cleanUp()
      }
    })

    return () => subscription.remove()
  }, [])
}

export default useLedgerBleLifecycle
