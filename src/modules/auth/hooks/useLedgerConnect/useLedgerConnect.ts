import { useEffect, useState } from 'react'
import { Observable } from 'rxjs'

import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import useToast from '@modules/common/hooks/useToast'

const deviceAddition = (device: any) => (devices: any) =>
  devices.some((i: any) => i.id === device.id) ? devices : devices.concat(device)

const useLedgerConnect = (shouldScan: boolean = true) => {
  const { addToast } = useToast()
  const [devices, setDevices] = useState<any>([])
  const [refreshing, setRefreshing] = useState<any>(false)

  let sub: any

  const startScan = async () => {
    setRefreshing(true)
    sub = new Observable(TransportBLE.listen).subscribe({
      complete: () => {
        setRefreshing(false)
      },
      next: (e: any) => {
        if (e.type === 'add') {
          setDevices(deviceAddition(e.descriptor))
        }
      },
      error: (e) => {
        // Timeout just for a better UX
        setTimeout(() => {
          addToast(e.message, { error: true })
          setRefreshing(false)
        }, 1200)
      }
    })

    setTimeout(() => {
      sub.complete()
    }, 40000)
  }

  const reload = async () => {
    if (sub) sub.unsubscribe()
    setRefreshing(false)
    startScan()
  }

  useEffect(() => {
    if (!shouldScan) {
      if (sub) sub.unsubscribe()

      return
    }

    setDevices([])
    startScan()

    return () => {
      if (sub) sub.unsubscribe()
    }
  }, [shouldScan])

  return {
    devices,
    refreshing,
    reload
  }
}

export default useLedgerConnect
