import { useCallback, useEffect, useRef, useState } from 'react'

import ledgerTransportService, {
  LedgerSubscription
} from '@mobile/services/ledger/ledgerTransportService'

export type LedgerTransportType = 'ble' | 'usb'

export interface LedgerDiscoveredDevice {
  id: string
  name: string
  transport: LedgerTransportType
}

// Bluetooth scanning is costly; stop after this window and offer a manual rescan.
const BLE_SCAN_TIMEOUT = 15000

const useLedgerDeviceDiscovery = ({
  transport,
  isActive,
  onError
}: {
  transport: LedgerTransportType
  isActive: boolean
  onError: (message: string) => void
}) => {
  const [devices, setDevices] = useState<LedgerDiscoveredDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [needsBlePermission, setNeedsBlePermission] = useState(false)
  const [bluetoothOn, setBluetoothOn] = useState<boolean | null>(null)
  const [hasScanned, setHasScanned] = useState(false)

  const scanSubRef = useRef<LedgerSubscription | null>(null)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mergeDevice = useCallback((device: LedgerDiscoveredDevice) => {
    setDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device]))
  }, [])

  const stopScan = useCallback(() => {
    scanSubRef.current?.unsubscribe()
    scanSubRef.current = null
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScan = useCallback(
    (scanTransport: LedgerTransportType) => {
      stopScan()
      setIsScanning(true)
      setHasScanned(true)
      scanSubRef.current = ledgerTransportService.startDiscovering(
        scanTransport,
        (device) => mergeDevice({ id: device.id, name: device.name, transport: scanTransport }),
        (e: any) => onError(e?.message || 'Failed to scan for devices.')
      )
      // Bluetooth scanning drains battery, so cap it; USB discovery is cheap and
      // streams until the effect cleans up.
      if (scanTransport === 'ble') {
        scanTimeoutRef.current = setTimeout(stopScan, BLE_SCAN_TIMEOUT)
      }
    },
    [stopScan, mergeDevice, onError]
  )

  // Track the Bluetooth adapter state (drives the BLE tab's UI).
  useEffect(() => {
    const sub = ledgerTransportService.observeBluetoothState((state) =>
      setBluetoothOn(state.available)
    )
    return () => sub.unsubscribe()
  }, [])

  // Discover the active transport whenever it / activity changes.
  useEffect(() => {
    if (!isActive) return undefined
    // No point auto-scanning while Bluetooth is off (or its state isn't known
    // yet); the effect re-runs once bluetoothOn resolves to true (dependency
    // below).
    if (transport === 'ble' && bluetoothOn !== true) return undefined

    let cancelled = false
    // Reset + start asynchronously so there's no synchronous setState in the
    // effect body.
    void (async () => {
      setDevices([])
      setNeedsBlePermission(false)

      if (transport === 'usb') {
        startScan('usb')
        return
      }

      const granted = await ledgerTransportService.hasBlePermissions()
      if (cancelled) return
      if (granted) startScan('ble')
      else setNeedsBlePermission(true)
    })()

    return () => {
      cancelled = true
      stopScan()
    }
  }, [transport, isActive, bluetoothOn, startScan, stopScan])

  // Request BLE permission, then scan (the BLE tab's "Scan via Bluetooth" action).
  const scanViaBluetooth = useCallback(async () => {
    const granted = await ledgerTransportService.requestAndroidPermissions()
    if (!granted) {
      onError('Bluetooth permission is required to connect a Ledger device.')
      return
    }
    setNeedsBlePermission(false)
    startScan('ble')
  }, [startScan, onError])

  const rescan = useCallback(async () => {
    if (transport === 'ble' && bluetoothOn !== true) return
    setDevices([])
    if (transport === 'ble' && needsBlePermission) return
    startScan(transport)
  }, [transport, bluetoothOn, needsBlePermission, startScan])

  return {
    devices,
    isScanning,
    needsBlePermission,
    bluetoothOn,
    hasScanned,
    scanViaBluetooth,
    rescan
  }
}

export default useLedgerDeviceDiscovery
