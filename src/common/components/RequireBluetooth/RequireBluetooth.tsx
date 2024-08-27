import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppState,
  Linking,
  PermissionsAndroid,
  PermissionStatus,
  Platform,
  View
} from 'react-native'
import { BleManager } from 'react-native-ble-plx'
import BluetoothStateManager from 'react-native-bluetooth-state-manager'

import Button from '@common/components/Button'
import RequireLocation from '@common/components/RequireLocation'
import Text from '@common/components/Text'
import { isAndroid } from '@common/config/env'
import requestPermissionFlagging from '@common/services/requestPermissionFlagging'
import spacings from '@common/styles/spacings'

const BLEMANAGER = new BleManager()
/**
 * Since Android 12 (API level 31), additional Bluetooth permissions are
 * required to connect to devices. Because of a possible bug in the Android
 * permissions library, these requests resolve to not granted (even though there
 * is no need to be granted) on Android 11 and below. So based on the Android
 * OS version (API level), we decide whether to ask for permissions or not.
 * {@link https://github.com/facebook/react-native/issues/30158}
 */
const SHOULD_ASK_FOR_EXTRA_PERMISSIONS = Platform.Version >= 31 && isAndroid

const RequireBluetooth: React.FC<any> = ({ children }) => {
  const { t } = useTranslation()
  const appState = useRef(AppState.currentState)
  const [androidPermissionStatus, setAndroidPermissionStatus] = useState<PermissionStatus | null>(
    SHOULD_ASK_FOR_EXTRA_PERMISSIONS ? null : PermissionsAndroid.RESULTS.GRANTED
  )
  const [isBluetoothTurningOn, setIsBluetoothTurningOn] = useState(false)
  const [isBluetoothPoweredOn, setInBluetoothPoweredOn] = useState<boolean | null>(null)

  const requestAndroidPermissions = useCallback(async () => {
    if (!SHOULD_ASK_FOR_EXTRA_PERMISSIONS) return

    const permissions = await requestPermissionFlagging(() =>
      // Since Android 12 (API level 31), the following extra permissions are needed
      // {@link https://github.com/dotintent/react-native-ble-plx/issues/998#issuecomment-1187040049}
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ])
    )

    const allPermissionsGranted = Object.values(permissions).every(
      (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
    )

    const onePermissionNeverAskAgain = Object.values(permissions).some(
      (permission) => permission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    )

    setAndroidPermissionStatus(
      allPermissionsGranted
        ? PermissionsAndroid.RESULTS.GRANTED
        : onePermissionNeverAskAgain
        ? PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        : PermissionsAndroid.RESULTS.DENIED
    )
  }, [])

  useEffect(() => {
    if (!isAndroid) return

    requestAndroidPermissions()

    // On Android, we need to request permissions again when the app comes to
    // the foreground. This is because the user can revoke permissions while
    // the app is in the background and also - can grant permissions.
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const isNotInTheMiddleOfAskingForPermissionOrLocalAuth =
        !global.isAskingForPermission && !global.isAskingForLocalAuth

      if (!isNotInTheMiddleOfAskingForPermissionOrLocalAuth) return

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // app has come to the foreground
        requestAndroidPermissions()
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [requestAndroidPermissions])

  useEffect(() => {
    const subscription = BLEMANAGER.onStateChange((state) => {
      setInBluetoothPoweredOn(state === 'PoweredOn')

      // On state change, assume that the module is no longer in process of
      // being turned on. Delay it a bit, otherwise, there is annoying UI jump.
      setTimeout(() => setIsBluetoothTurningOn(false), 1000)
    }, true)

    return () => subscription.remove()
  }, [])

  const turnOnBluetooth = () => {
    setIsBluetoothTurningOn(true)
    BluetoothStateManager.enable()
  }

  const handleOpenPermissionSettings = useCallback(async () => {
    Linking.openSettings()
  }, [])

  // On Android only, location permission (ACCESS_FINE_LOCATION) also is needed.
  // This is because, on Android 11 and lower, a Bluetooth scan could
  // potentially be used to gather information about the location of the user.
  const state = isAndroid ? <RequireLocation>{children}</RequireLocation> : children

  if (isAndroid && androidPermissionStatus !== PermissionsAndroid.RESULTS.GRANTED) {
    return (
      <View style={[spacings.ph]}>
        <Text style={spacings.mbSm} fontSize={12}>
          {t(
            'Please grant permission to use Bluetooth, in order to connect to hardware wallet devices.'
          )}
        </Text>
        {androidPermissionStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? (
          <Button onPress={handleOpenPermissionSettings} text={t('Open permission settings')} />
        ) : (
          <Button onPress={requestAndroidPermissions} text={t('Grant permission')} />
        )}
      </View>
    )
  }

  return isBluetoothPoweredOn ? (
    state
  ) : (
    <View style={[spacings.ph]}>
      <Text style={spacings.mbSm} fontSize={12}>
        {t('Please turn on Bluetooth first, in order to connect to hardware wallet devices.')}
      </Text>
      {isAndroid && (
        <Button
          disabled={isBluetoothTurningOn}
          text={isBluetoothTurningOn ? t('Turning on...') : t('Turn on Bluetooth')}
          onPress={turnOnBluetooth}
        />
      )}
    </View>
  )
}

export default RequireBluetooth
