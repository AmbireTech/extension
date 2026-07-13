import { useCallback, useEffect, useState } from 'react'

import ledgerTransportService from '@mobile/services/ledger/ledgerTransportService'

const useLedger = () => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(ledgerTransportService.isConnected())

  useEffect(() => {
    // Keep in sync with the native BLE service so the UI reacts to connect /
    // disconnect (e.g. device out of range) without polling.
    const sub = ledgerTransportService.subscribeConnection(setIsLedgerConnected)
    return () => sub.unsubscribe()
  }, [])

  const requestLedgerDeviceAccess = useCallback(async () => {
    // On mobile the actual connect flow (scan → select → open) lives in the
    // LedgerConnectScreen via ledgerTransportService. Here we only make sure the
    // Android runtime BLE permissions are granted (a no-op on iOS, which prompts
    // automatically via the Info.plist usage description).
    await ledgerTransportService.requestAndroidPermissions()
  }, [])

  return {
    requestLedgerDeviceAccess,
    isLedgerConnected,
    setIsLedgerConnected
  }
}

export default useLedger
