import { useCallback, useEffect, useState } from 'react'

import ledgerBleService from '@mobile/services/ledger/ledgerBleService'

const useLedger = () => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(ledgerBleService.isConnected())

  useEffect(() => {
    // Keep in sync with the native BLE service so the UI reacts to connect /
    // disconnect (e.g. device out of range) without polling.
    const sub = ledgerBleService.subscribeConnection(setIsLedgerConnected)
    return () => sub.unsubscribe()
  }, [])

  const requestLedgerDeviceAccess = useCallback(async () => {
    // On mobile the actual connect flow (scan → select → open) lives in the
    // LedgerConnectScreen via ledgerBleService. Here we only make sure the
    // Android runtime BLE permissions are granted (a no-op on iOS, which prompts
    // automatically via the Info.plist usage description).
    await ledgerBleService.requestAndroidPermissions()
  }, [])

  return {
    requestLedgerDeviceAccess,
    isLedgerConnected,
    setIsLedgerConnected
  }
}

export default useLedger
