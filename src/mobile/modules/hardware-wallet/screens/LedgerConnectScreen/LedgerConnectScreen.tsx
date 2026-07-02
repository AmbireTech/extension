import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import LedgerLetterIconFilled from '@common/assets/svg/LedgerLetterIconFilled'
import Banner from '@common/components/Banner'
import Button from '@common/components/Button'
import MultistateToggleButton from '@common/components/MultistateToggleButton'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isAndroid } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import useLedgerDeviceDiscovery, {
  LedgerDiscoveredDevice,
  LedgerTransportType
} from '@mobile/modules/hardware-wallet/hooks/useLedgerDeviceDiscovery'
import ledgerBleService from '@mobile/services/ledger/ledgerBleService'

const LedgerConnectScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { dispatch } = useControllersMiddleware()
  const mainCtrlState = useController('MainController').state
  const { initParams, type } = useController('AccountPickerController').state

  // USB (OTG) is Android-only; iOS is Bluetooth-only for Ledger, so there's no tab.
  const [tab, setTab] = useState<LedgerTransportType>('ble')
  const [isConnecting, setIsConnecting] = useState(false)
  // Set once we've connected and asked the worker to init the account picker; the
  // navigation effect below waits for the picker to actually be ready.
  const [importStarted, setImportStarted] = useState(false)
  // Guards against navigating twice if the picker-ready effect re-fires before
  // this screen unmounts.
  const hasNavigatedRef = useRef(false)

  const onDiscoveryError = useCallback(
    (message: string) => addToast(message, { type: 'error' }),
    [addToast]
  )

  const {
    devices,
    isScanning,
    needsBlePermission,
    bluetoothOn,
    hasScanned,
    scanViaBluetooth,
    rescan
  } = useLedgerDeviceDiscovery({
    transport: tab,
    isActive: !isConnecting,
    onError: onDiscoveryError
  })

  const handleSelectDevice = useCallback(
    async (device: LedgerDiscoveredDevice) => {
      setIsConnecting(true)
      try {
        // Connects + probes (verifies the device is usable, surfacing locked /
        // wrong-app errors here instead of later inside the worker init), then
        // asks the worker to derive accounts via the bridge (mirrors web).
        await ledgerBleService.connectAndProbe(device)
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER' })
        setImportStarted(true)
      } catch (e: any) {
        addToast(normalizeLedgerMessage(e?.message), { type: 'error' })
        // Back to discovery so the user can retry after unlocking / opening the app.
        setIsConnecting(false)
      }
    },
    [dispatch, addToast]
  )

  // Once the account picker is initialized for Ledger, advance to account selection.
  useEffect(() => {
    if (importStarted && initParams && type === 'ledger' && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      goToNextRoute()
    }
  }, [importStarted, initParams, type, goToNextRoute])

  const isInitLoading = mainCtrlState.statuses.handleAccountPickerInitLedger === 'LOADING'
  const isUsbTab = tab === 'usb'

  const showScanViaBluetooth = !isUsbTab && needsBlePermission
  const showRescan = !showScanViaBluetooth && !isScanning

  const footer =
    isConnecting || (!showScanViaBluetooth && !showRescan) ? undefined : (
      <View>
        {showScanViaBluetooth ? (
          <Button
            text={t('Scan via Bluetooth')}
            disabled={!bluetoothOn}
            onPress={scanViaBluetooth}
            hasBottomSpacing={false}
          />
        ) : (
          <Button
            type="secondary"
            text={hasScanned ? t('Rescan') : t('Scan')}
            disabled={!isUsbTab && !bluetoothOn}
            onPress={rescan}
            hasBottomSpacing={false}
          />
        )}
      </View>
    )

  return (
    <MobileLayoutContainer footer={footer}>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Connect Ledger')}
        withScroll
      >
        <LedgerLetterIconFilled
          style={{ alignSelf: 'center', marginBottom: 32 }}
          width={96}
          height={96}
        />

        <Text weight="medium" style={spacings.mbSm} fontSize={14}>
          {t('1. Turn on your Ledger and unlock it with your PIN.')}
        </Text>
        <Text weight="medium" style={spacings.mbSm} fontSize={14}>
          {t('2. Open the Ethereum app on the device.')}
        </Text>
        <Text weight="medium" style={spacings.mbXl} fontSize={14}>
          {isUsbTab
            ? t('3. Connect your Ledger to the phone with a USB cable.')
            : t('3. Make sure Bluetooth is enabled on your phone.')}
        </Text>

        {/* Always rendered (not gated on connecting) so the uncontrolled toggle
            keeps its selected tab across a failed connect attempt. */}
        {isAndroid && (
          <MultistateToggleButton
            style={spacings.mbLg}
            states={[
              { text: t('Bluetooth'), callback: () => setTab('ble') },
              { text: t('USB'), callback: () => setTab('usb') }
            ]}
          />
        )}

        {!isUsbTab && bluetoothOn === false && (
          <Banner
            type="error"
            singleRow
            style={spacings.mbLg}
            title={t('Bluetooth is turned off. Please enable it to continue.')}
          />
        )}

        {isConnecting ? (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Spinner style={{ width: 18, height: 18 }} />
            <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
              {isInitLoading
                ? t('Loading accounts from your Ledger…')
                : t('Connecting to your Ledger')}
            </Text>
          </View>
        ) : (
          <View>
            {devices.length > 0 && (
              <Text style={spacings.mbLg} fontSize={14} appearance="secondaryText">
                {t('Select your Ledger:')}
              </Text>
            )}
            {devices.map((device) => (
              <Button
                key={device.id}
                type="secondary"
                text={device.name}
                onPress={() => handleSelectDevice(device)}
                style={{ backgroundColor: theme.neutral400 }}
              />
            ))}
            {isScanning && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyCenter,
                  spacings.pvLg
                ]}
              >
                <Spinner style={{ width: 18, height: 18 }} />
                <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
                  {t('Searching for Ledger devices')}
                </Text>
              </View>
            )}
            {!isScanning && devices.length === 0 && (
              <View style={[flexbox.alignCenter, spacings.pvLg]}>
                <Text fontSize={14} appearance="secondaryText">
                  {t('No devices were found')}
                </Text>
              </View>
            )}
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(LedgerConnectScreen)
