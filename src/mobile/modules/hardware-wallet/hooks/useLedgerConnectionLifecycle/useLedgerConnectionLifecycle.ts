import { useEffect } from 'react'
import { AppState } from 'react-native'

import ledgerTransportService from '@mobile/services/ledger/ledgerTransportService'

// Tears down the persistent Ledger BLE connection on lock / background, so it
// doesn't linger while locked or backgrounded (battery + security). The
// transport transparently reopens via ledgerTransportService's reconnect on the next
// operation.
const useLedgerConnectionLifecycle = (isKeystoreUnlocked: boolean) => {
  // A locked wallet should hold no hardware-wallet connection.
  useEffect(() => {
    if (!isKeystoreUnlocked) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ledgerTransportService.cleanUp()
    }
  }, [isKeystoreUnlocked])

  // Disconnect when the app goes to the background (not on transient 'inactive',
  // which fires for control center / app-switcher peeks on iOS).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ledgerTransportService.cleanUp()
      }
    })

    return () => subscription.remove()
  }, [])
}

export default useLedgerConnectionLifecycle
