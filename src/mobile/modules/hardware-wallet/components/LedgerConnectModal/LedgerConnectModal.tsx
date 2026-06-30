import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import LedgerLetterIconFilled from '@common/assets/svg/LedgerLetterIconFilled'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import MultistateToggleButton from '@common/components/MultistateToggleButton'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isAndroid } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useLedgerDeviceDiscovery, {
  LedgerDiscoveredDevice,
  LedgerTransportType
} from '@mobile/modules/hardware-wallet/hooks/useLedgerDeviceDiscovery'
import ledgerBleService from '@mobile/services/ledger/ledgerBleService'

type Props = {
  isVisible: boolean
  handleClose?: () => void
  handleOnConnect?: () => void
  // Web-only affordance (HID re-authorize hint); accepted for a shared interface
  // with the web modal, unused on mobile.
  displayOptionToAuthorize?: boolean
}

// Mobile counterpart of the web LedgerConnectModal. Shown during signing when a
// Ledger key is involved but the connection has dropped (BLE disconnects on
// idle). Reconnecting flips ledgerBleService.isConnected() →
// useLedger.isLedgerConnected → useSign auto-dismisses this modal, after which
// the user signs again (same flow as the extension).
const LedgerConnectModal = ({ isVisible, handleClose = () => {}, handleOnConnect }: Props) => {
  const { ref, open, close } = useModalize()
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [tab, setTab] = useState<LedgerTransportType>('ble')
  const [isConnecting, setIsConnecting] = useState(false)

  const onDiscoveryError = useCallback(
    (message: string) => addToast(message, { type: 'error' }),
    [addToast]
  )

  const { devices, isScanning, needsBlePermission, bluetoothOn, scanViaBluetooth, rescan } =
    useLedgerDeviceDiscovery({
      transport: tab,
      isActive: isVisible && !isConnecting,
      onError: onDiscoveryError
    })

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  const handleSelectDevice = useCallback(
    async (device: LedgerDiscoveredDevice) => {
      setIsConnecting(true)
      try {
        // Connect + probe (also settles the link and verifies the device is
        // usable before the user signs). Connected — useSign closes this modal
        // once useLedger reports the device as connected; the user then signs.
        await ledgerBleService.connectAndProbe(device)
        if (handleOnConnect) handleOnConnect()
      } catch (e: any) {
        addToast(normalizeLedgerMessage(e?.message), { type: 'error' })
      } finally {
        setIsConnecting(false)
      }
    },
    [addToast, handleOnConnect]
  )

  const isUsbTab = tab === 'usb'

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
        {isUsbTab
          ? t('2. Open the Ethereum app and connect it with a USB cable.')
          : t('2. Open the Ethereum app on the device.')}
      </Text>

      {/* Always rendered (not gated on connecting) so the uncontrolled toggle
          keeps its selected tab across a failed connect attempt. */}
      {isAndroid && (
        <MultistateToggleButton
          style={spacings.mbLg}
          states={[
            { text: 'Bluetooth', callback: () => setTab('ble') },
            { text: 'USB', callback: () => setTab('usb') }
          ]}
        />
      )}

      {!isUsbTab && !bluetoothOn && (
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
          <Text style={spacings.mbLg} fontSize={14} appearance="secondaryText">
            {devices.length ? t('Select your Ledger:') : t('Looking for your Ledger…')}
          </Text>
          {devices.map((device) => (
            <Button
              key={device.id}
              type="secondary"
              text={device.name}
              onPress={() => handleSelectDevice(device)}
              hasBottomSpacing
            />
          ))}
          {isScanning && (
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
              <Spinner style={{ width: 18, height: 18 }} />
              <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
                {t('Searching for nearby Bluetooth devices…')}
              </Text>
            </View>
          )}
          {!isUsbTab && needsBlePermission ? (
            <Button
              text={t('Scan via Bluetooth')}
              disabled={!bluetoothOn}
              onPress={scanViaBluetooth}
              hasBottomSpacing={false}
            />
          ) : (
            <Button
              type="secondary"
              text={isScanning ? t('Searching…') : t('Rescan')}
              disabled={isScanning}
              onPress={rescan}
              hasBottomSpacing={false}
            />
          )}
        </View>
      )}
    </BottomSheet>
  )
}

export default LedgerConnectModal
