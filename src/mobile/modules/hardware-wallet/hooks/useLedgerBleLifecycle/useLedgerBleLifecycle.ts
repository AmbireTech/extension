import { useEffect } from 'react'
import { AppState } from 'react-native'

import ledgerBleService from '@mobile/services/ledger/ledgerBleService'

// Tears down the persistent Ledger BLE connection on lock / background, so it
// doesn't linger while locked or backgrounded (battery + security). The
// transport transparently reopens via ledgerBleService's reconnect on the next
// operation.
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
