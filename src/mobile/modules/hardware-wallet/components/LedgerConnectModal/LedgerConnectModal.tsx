import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import LedgerLetterIconFilled from '@common/assets/svg/LedgerLetterIconFilled'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ledgerBleService, {
  LedgerScannedDevice,
  LedgerSubscription
} from '@mobile/services/ledger/ledgerBleService'

type Props = {
  isVisible: boolean
  handleClose?: () => void
}

// Mobile counterpart of the web LedgerConnectModal. Shown during signing when a
// Ledger key is involved but the BLE link has dropped (BLE disconnects on idle).
// Reconnecting flips ledgerBleService.isConnected() → useLedger.isLedgerConnected
// → useSign auto-dismisses this modal, after which the user signs again (same
// flow as the extension).
const LedgerConnectModal = ({ isVisible, handleClose = () => {} }: Props) => {
  const { ref, open, close } = useModalize()
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [bluetoothOn, setBluetoothOn] = useState(true)
  const [devices, setDevices] = useState<LedgerScannedDevice[]>([])
  const [isConnecting, setIsConnecting] = useState(false)

  const scanSubRef = useRef<LedgerSubscription | null>(null)

  const stopScan = useCallback(() => {
    scanSubRef.current?.unsubscribe()
    scanSubRef.current = null
  }, [])

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  useEffect(() => {
    const sub = ledgerBleService.observeBluetoothState((state) => setBluetoothOn(state.available))
    return () => sub.unsubscribe()
  }, [])

  // Scan for devices while the modal is open.
  useEffect(() => {
    if (!isVisible) {
      stopScan()
      return undefined
    }

    let isActive = true
    void (async () => {
      const granted = await ledgerBleService.requestAndroidPermissions()
      if (!isActive) return
      if (!granted) {
        addToast(t('Bluetooth permission is required to connect a Ledger device.'), {
          type: 'error'
        })
        return
      }
      scanSubRef.current = ledgerBleService.startScan(
        (device) =>
          setDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device])),
        (scanError: any) =>
          addToast(scanError?.message || t('Failed to scan for devices.'), { type: 'error' })
      )
    })()

    return () => {
      isActive = false
      stopScan()
    }
  }, [isVisible, stopScan, addToast, t])

  const handleSelectDevice = useCallback(
    async (deviceId: string) => {
      stopScan()
      setIsConnecting(true)
      try {
        await ledgerBleService.connect(deviceId)
        // Connected — useSign closes this modal once useLedger reports the
        // device as connected. The user then presses sign again.
      } catch (e: any) {
        addToast(normalizeLedgerMessage(e?.message), { type: 'error' })
      } finally {
        setIsConnecting(false)
      }
    },
    [stopScan, addToast]
  )

  return (
    <BottomSheet
      id="ledger-connect-modal"
      sheetRef={ref}
      closeBottomSheet={handleClose}
      onClosed={handleClose}
      autoOpen={isVisible}
      withBackdropBlur={false}
    >
      <ModalHeader title={t('Connect Ledger')} handleClose={handleClose} />

      <LedgerLetterIconFilled
        style={{ alignSelf: 'center', marginBottom: 24 }}
        width={72}
        height={72}
      />

      <Text weight="regular" style={spacings.mbTy} fontSize={14}>
        {t('1. Turn on your Ledger and unlock it with your PIN.')}
      </Text>
      <Text weight="regular" style={spacings.mbLg} fontSize={14}>
        {t('2. Open the Ethereum app on the device.')}
      </Text>

      {!bluetoothOn && (
        <Text style={spacings.mbLg} fontSize={14} appearance="errorText">
          {t('Bluetooth is turned off. Please enable it to continue.')}
        </Text>
      )}

      {isConnecting ? (
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter]}>
          <Spinner style={{ width: 18, height: 18 }} />
          <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
            {t('Connecting to your Ledger…')}
          </Text>
        </View>
      ) : (
        <View>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
            <Spinner style={{ width: 18, height: 18 }} />
            <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
              {devices.length
                ? t('Select your Ledger device:')
                : t('Searching for nearby Ledger devices…')}
            </Text>
          </View>
          {devices.map((device, index) => (
            <Button
              key={device.id}
              type="secondary"
              text={device.name}
              onPress={() => handleSelectDevice(device.id)}
              hasBottomSpacing={index !== devices.length - 1}
            />
          ))}
        </View>
      )}
    </BottomSheet>
  )
}

export default LedgerConnectModal
