import { useCallback, useEffect, useState } from 'react'

import useDebounce from '@common/hooks/useDebounce'
import { browser } from '@web/constants/browserapi'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'

const useLedger = () => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(false)
  // Ledger SDK is weird and sometimes sends conflicting updates about the device connection status.
  // One such example is when no app is open on the device and the user opens an app. Then the device
  // goes through Connected --> Disconnected --> Connected states in quick succession.
  const debouncedIsLedgerConnected = useDebounce({ value: isLedgerConnected, delay: 500 })

  const onConnect = async ({ device }: { device: HIDDevice }) => {
    if (device.vendorId === LedgerController.vendorId) setIsLedgerConnected(true)
  }
  const onDisconnect = ({ device }: { device: HIDDevice }) => {
    if (device.vendorId === LedgerController.vendorId) setIsLedgerConnected(false)
  }
  const detectDevice = async () => setIsLedgerConnected(await LedgerController.isConnected())

  useEffect(() => {
    // Ledger requires WebHID for communication. No need to continue if that's not available.
    if (!('hid' in navigator)) return

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    detectDevice()

    navigator.hid.addEventListener('connect', onConnect)
    navigator.hid.addEventListener('disconnect', onDisconnect)
    browser.windows.onFocusChanged.addListener(detectDevice)

    return () => {
      navigator.hid.removeEventListener('connect', onConnect)
      navigator.hid.removeEventListener('disconnect', onDisconnect)
      browser.windows.onFocusChanged.removeListener(detectDevice)
    }
  }, [])

  const requestLedgerDeviceAccess = useCallback(async () => {
    const isSupported = LedgerController.isSupported()
    if (!isSupported) {
      const message =
        "Your browser doesn't support WebHID, which is required for the Ledger device. Please try using a different browser."
      throw new Error(message)
    }

    // The WebHID API requires: 1) A user gesture (click) to open the device
    // selection prompt (to allow the extension to access a HID device) and
    // 2) To call this in the extension foreground on a new tab (not in an request window).
    await LedgerController.grantDevicePermissionIfNeeded()
  }, [])

  return {
    requestLedgerDeviceAccess,
    isLedgerConnected: debouncedIsLedgerConnected,
    setIsLedgerConnected
  }
}

export default useLedger
