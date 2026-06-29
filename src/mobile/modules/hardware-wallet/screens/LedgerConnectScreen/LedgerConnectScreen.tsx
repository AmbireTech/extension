import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import { BIP44_LEDGER_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import LedgerLetterIconFilled from '@common/assets/svg/LedgerLetterIconFilled'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import ledgerBleService, {
  LedgerScannedDevice,
  LedgerSubscription
} from '@mobile/services/ledger/ledgerBleService'

type Phase = 'intro' | 'scanning' | 'connecting'

const LedgerConnectScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { dispatch } = useControllersMiddleware()
  const mainCtrlState = useController('MainController').state
  const { initParams, type } = useController('AccountPickerController').state

  const [phase, setPhase] = useState<Phase>('intro')
  const [bluetoothOn, setBluetoothOn] = useState(true)
  const [devices, setDevices] = useState<LedgerScannedDevice[]>([])
  // Set once we've connected and asked the worker to init the account picker; the
  // navigation effect below waits for the picker to actually be ready.
  const [importStarted, setImportStarted] = useState(false)

  const scanSubRef = useRef<LedgerSubscription | null>(null)
  // Guards against navigating twice if the picker-ready effect re-fires before
  // this screen unmounts.
  const hasNavigatedRef = useRef(false)

  const stopScan = useCallback(() => {
    scanSubRef.current?.unsubscribe()
    scanSubRef.current = null
  }, [])

  // Track the Bluetooth adapter state for the whole screen lifetime.
  useEffect(() => {
    const sub = ledgerBleService.observeBluetoothState((state) => setBluetoothOn(state.available))
    return () => sub.unsubscribe()
  }, [])

  // Scan only while in the scanning phase; always tear the scan down on leave.
  // State resets live in the handlers that enter scanning (not here) to avoid
  // synchronous setState in an effect body.
  useEffect(() => {
    if (phase !== 'scanning') return undefined

    scanSubRef.current = ledgerBleService.startScan(
      (device) =>
        setDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device])),
      (scanError: any) =>
        addToast(scanError?.message || t('Failed to scan for devices.'), { type: 'error' })
    )

    return stopScan
  }, [phase, stopScan, t, addToast])

  // Release the scan when the screen unmounts.
  useEffect(() => stopScan, [stopScan])

  const handleStartScan = useCallback(async () => {
    const granted = await ledgerBleService.requestAndroidPermissions()
    if (!granted) {
      addToast(t('Bluetooth permission is required to connect a Ledger device.'), {
        type: 'error'
      })
      return
    }
    setDevices([])
    setPhase('scanning')
  }, [t, addToast])

  const handleSelectDevice = useCallback(
    async (deviceId: string) => {
      stopScan()
      setPhase('connecting')
      try {
        await ledgerBleService.connect(deviceId)
        // Opening the BLE transport succeeds even if the device is locked or not
        // on the Ethereum app, so probe an address first to surface those errors
        // here (instead of failing later, async, inside the worker init).
        await ledgerBleService.getAddress(
          getHdPathFromTemplate(BIP44_LEDGER_DERIVATION_TEMPLATE, 0)
        )
        // Device is ready; ask the worker to derive accounts via the bridge
        // (mirrors the web flow).
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER' })
        setImportStarted(true)
      } catch (e: any) {
        addToast(normalizeLedgerMessage(e?.message), { type: 'error' })
        // Keep the device listed so the user can retry after unlocking it /
        // opening the Ethereum app.
        setPhase('scanning')
      }
    },
    [dispatch, stopScan, addToast]
  )

  // Once the account picker is initialized for Ledger, advance to account selection.
  useEffect(() => {
    if (importStarted && initParams && type === 'ledger' && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      goToNextRoute()
    }
  }, [importStarted, initParams, type, goToNextRoute])

  const isInitLoading = mainCtrlState.statuses.handleAccountPickerInitLedger === 'LOADING'

  const isScanning = phase === 'scanning'

  // The scan trigger is pinned to the bottom via the layout footer. While
  // scanning it stays disabled and shows an in-button spinner. Connecting has no
  // action (the content shows its own status spinner).
  const footer =
    phase === 'connecting' ? undefined : (
      <Button
        text={isScanning ? t('Scanning…') : t('Scan for devices')}
        disabled={isScanning || !bluetoothOn}
        onPress={handleStartScan}
        hasBottomSpacing={false}
        childrenPosition="left"
      >
        {isScanning && (
          <Spinner variant="white" style={{ width: 20, height: 20, marginRight: 8 }} />
        )}
      </Button>
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
          {t('3. Make sure Bluetooth is enabled on your phone.')}
        </Text>

        {!bluetoothOn && (
          <Text style={spacings.mbXl} fontSize={14} appearance="errorText">
            {t('Bluetooth is turned off. Please enable it to continue.')}
          </Text>
        )}

        {phase === 'scanning' && (
          <View>
            <Text style={spacings.mbLg} fontSize={14} appearance="secondaryText">
              {devices.length
                ? t('Select your Ledger device:')
                : t('Searching for nearby Ledger devices…')}
            </Text>
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

        {phase === 'connecting' && (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Spinner style={{ width: 18, height: 18 }} />
            <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
              {isInitLoading
                ? t('Loading accounts from your Ledger…')
                : t('Connecting to your Ledger…')}
            </Text>
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(LedgerConnectScreen)
