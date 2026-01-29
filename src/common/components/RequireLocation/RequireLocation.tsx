import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, Linking, PermissionsAndroid, PermissionStatus, View } from 'react-native'
import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box'
import { BleErrorCode } from 'react-native-ble-plx'
import { Observable } from 'rxjs'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

const RequireLocation: React.FC<any> = ({ children }) => {
  const { t } = useTranslation()
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>()
  // Assumes they are enabled by default and sets the flag
  // in case the `new Observable(TransportBLE.listen).subscribe` fails.
  const [locationServicesEnabled, setLocationServicesEnabled] = useState<boolean | null>(true)

  const setLocationState = () => {
    const sub = new Observable(TransportBLE.listen).subscribe({
      next: () => {
        sub.unsubscribe()
        setLocationServicesEnabled(true)
      },
      error: (e) => {
        const disabled = e?.errorCode === BleErrorCode.LocationServicesDisabled
        sub.unsubscribe()
        setLocationServicesEnabled(!disabled)
      }
    })
  }

  useEffect(() => {
    const subscription: any = AppState.addEventListener('focus', () => {
      // Called when the app state changes from blurred to focused
      setLocationState()
    })

    // Initial call
    setLocationState()

    return () => {
      if (subscription) subscription?.remove()
    }
  }, [])

  const requestPermissions = useCallback(async () => {
    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!,
      {
        title: t('Location permission required'),
        message: t(
          'Ambire requires location permission to pair your device through Bluetooth. Ambire does not access your location information.'
        ),
        buttonNegative: t('Cancel'),
        buttonPositive: t('Allow')
      }
    )

    setPermissionStatus(status)
  }, [t])

  useEffect(() => {
    requestPermissions()
  }, [requestPermissions])

  const handleOpenLocationSettings = () =>
    LocationServicesDialogBox.checkLocationServicesIsEnabled({
      enableHighAccuracy: false,
      showDialog: false,
      openLocationServices: true
    })

  if (permissionStatus !== PermissionsAndroid.RESULTS.GRANTED) {
    return (
      <View style={spacings.ph}>
        <Text style={spacings.mbSm} fontSize={12}>
          {t(
            'Please allow Location services first, in order to connect to hardware wallet devices.'
          )}
        </Text>
        <Text style={spacings.mbSm} fontSize={12}>
          {t(
            'Location services are required, in order for us to pair your device through Bluetooth. Ambire does not access your location information.'
          )}
        </Text>
        {permissionStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? (
          <Button onPress={Linking.openSettings} text={t('Open permission settings')} />
        ) : (
          <Button onPress={requestPermissions} text={t('Grant permission')} />
        )}
      </View>
    )
  }

  if (!locationServicesEnabled) {
    return (
      <View style={spacings.ph}>
        <Text style={spacings.mbMi} fontSize={12}>
          {t(
            'Location services are required, in order for us to pair your device through Bluetooth.'
          )}
        </Text>
        <Text style={spacings.mbSm} fontSize={12}>
          {t('Ambire does not access your location information.')}
        </Text>
        <Button onPress={handleOpenLocationSettings} text={t('Open Location Settings')} />
      </View>
    )
  }

  return children
}

export default RequireLocation
