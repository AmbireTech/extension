import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import LedgerLetterIconFilled from '@common/assets/svg/LedgerLetterIconFilled'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
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
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { dispatch } = useControllersMiddleware()
  const mainCtrlState = useController('MainController').state
  const { initParams, type } = useController('AccountPickerController').state

  const [phase, setPhase] = useState<Phase>('intro')
  const [bluetoothOn, setBluetoothOn] = useState(true)
  const [devices, setDevices] = useState<LedgerScannedDevice[]>([])
  const [error, setError] = useState('')
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
      (scanError: any) => setError(scanError?.message || t('Failed to scan for devices.'))
    )

    return stopScan
  }, [phase, stopScan, t])

  // Release the scan when the screen unmounts.
  useEffect(() => stopScan, [stopScan])

  const handleStartScan = useCallback(async () => {
    const granted = await ledgerBleService.requestAndroidPermissions()
    if (!granted) {
      setError(t('Bluetooth permission is required to connect a Ledger device.'))
      return
    }
    setDevices([])
    setError('')
    setPhase('scanning')
  }, [t])

  const handleSelectDevice = useCallback(
    async (deviceId: string) => {
      stopScan()
      setPhase('connecting')
      try {
        await ledgerBleService.connect(deviceId)
        // Device is connected natively; ask the worker to derive accounts via
        // the bridge (mirrors the web flow).
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER' })
        setImportStarted(true)
      } catch (e: any) {
        setError(e?.message || t('Failed to connect to the Ledger device.'))
        setDevices([])
        setPhase('scanning')
      }
    },
    [dispatch, stopScan, t]
  )

  // Once the account picker is initialised for Ledger, advance to account selection.
  useEffect(() => {
    if (importStarted && initParams && type === 'ledger' && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      goToNextRoute()
    }
  }, [importStarted, initParams, type, goToNextRoute])

  const isInitLoading = mainCtrlState.statuses.handleAccountPickerInitLedger === 'LOADING'

  return (
    <MobileLayoutContainer>
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

        {!!error && (
          <Text style={spacings.mbXl} fontSize={14} appearance="errorText">
            {error}
          </Text>
        )}

        {phase === 'intro' && (
          <Button
            text={t('Scan for devices')}
            disabled={!bluetoothOn}
            onPress={handleStartScan}
            hasBottomSpacing={false}
          />
        )}

        {phase === 'scanning' && (
          <View>
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
              <Spinner style={{ width: 18, height: 18 }} />
              <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
                {t('Scanning for Ledger devices…')}
              </Text>
            </View>
            {devices.map((device) => (
              <Button
                key={device.id}
                type="secondary"
                text={device.name}
                onPress={() => handleSelectDevice(device.id)}
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
