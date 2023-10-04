import { BarCodeScanner, PermissionStatus } from 'expo-barcode-scanner'
import { Camera } from 'expo-camera'
import * as IntentLauncher from 'expo-intent-launcher'
import LottieView from 'lottie-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Linking, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CameraCorners from '@common/assets/svg/CameraCorners'
import Text from '@common/components/Text'
import { APP_ID, isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import AmbireLogo from '@common/modules/auth/components/AmbireLogo'
import requestPermissionFlagging from '@common/services/requestPermissionFlagging'
import colors from '@common/styles/colors'
import spacings, { DEVICE_WIDTH } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import Button from '../Button'
import Spinner from '../Spinner'
import Wrapper from '../Wrapper'
import CameraAnimation from './camera-animation.json'
import styles from './styles'

interface Props {
  onScan?: (data: string) => void
}

const maxLength = DEVICE_WIDTH - 90

const cameraDimensions = (ratio?: string | null) => {
  if (!ratio)
    return {
      width: maxLength,
      height: maxLength
    }

  const ratios = ratio.split(':')

  if (+ratios[0] <= +ratios[1]) {
    return {
      width: (+ratios[1] / +ratios[0]) * maxLength,
      height: maxLength
    }
  }
  return {
    width: maxLength,
    height: (+ratios[0] / +ratios[1]) * maxLength
  }
}

const QRCodeScanner = ({ onScan }: Props) => {
  const cameraRef: any = useRef(null)

  const [permission, setPermission] = useState<PermissionStatus | null>(null)
  const [scanned, setScanned] = useState<boolean>(false)
  const [ratio, setRatio] = useState<string | null>(null)
  const insets = useSafeAreaInsets()

  const { t } = useTranslation()

  useEffect(() => {
    ;(async () => {
      const { status } = await requestPermissionFlagging(Camera.requestCameraPermissionsAsync)
      setPermission(status)
    })()
  }, [])

  const handleBarCodeScan = ({ data }: any) => {
    setScanned(true)
    !!onScan && onScan(data)
  }

  const handleGoToSettings = () =>
    Platform.OS === 'ios'
      ? Linking.openURL(`app-settings://camera/${APP_ID}`)
      : IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: `package:${APP_ID}` }
        )

  const onCameraReady = () => {
    if (isiOS) {
      setRatio('1:1')
      return
    }
    if (cameraRef.current) {
      try {
        cameraRef.current?.getSupportedRatiosAsync()?.then((res: string[]) => {
          if (res.includes('1:1')) {
            setRatio('1:1')
          } else {
            setRatio(res[0])
          }
        })
      } catch (e) {
        setRatio('1:1')
      }
    }
  }

  return (
    <Wrapper
      contentContainerStyle={
        permission === PermissionStatus.GRANTED
          ? [
              flexboxStyles.flex1,
              flexboxStyles.alignCenter,
              flexboxStyles.justifyCenter,
              { marginBottom: insets.bottom }
            ]
          : [flexboxStyles.flex1, flexboxStyles.justifySpaceBetween]
      }
    >
      {!permission && (
        <View style={[flexboxStyles.center, spacings.mt]}>
          <Spinner />
        </View>
      )}
      {permission && permission === PermissionStatus.GRANTED && (
        <View>
          <View style={styles.cameraWrapper}>
            <View style={[styles.borderTopLeft]}>
              <CameraCorners type="top-left" />
            </View>
            <View style={styles.borderTopRight}>
              <CameraCorners type="top-right" />
            </View>
            <View style={styles.borderBottomLeft}>
              <CameraCorners type="bottom-left" />
            </View>
            <View style={[styles.borderBottomRight]}>
              <CameraCorners type="bottom-right" />
            </View>
            {!!ratio && (
              <LottieView style={styles.animation} source={CameraAnimation} autoPlay loop />
            )}
            <Camera
              ref={cameraRef}
              ratio={ratio as string}
              onBarCodeScanned={scanned ? undefined : handleBarCodeScan}
              onCameraReady={onCameraReady}
              barCodeScannerSettings={{
                barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr]
              }}
              style={{
                width: cameraDimensions(ratio).width,
                height: cameraDimensions(ratio).height,
                backgroundColor: colors.vulcan
              }}
            />
          </View>
          <Text style={textStyles.center} fontSize={12}>
            Place the QR code inside the frame
          </Text>
        </View>
      )}

      {permission && permission !== PermissionStatus.GRANTED && (
        <>
          <AmbireLogo shouldExpand={false} />
          <View>
            <Text style={spacings.mbMi} fontSize={12}>
              {t('The request for accessing the phone camera was previously denied.')}
            </Text>
            {Platform.OS === 'ios' && (
              <Text style={spacings.mbSm} fontSize={12}>
                {t(
                  "To enable camera access for Ambire, please follow these steps:\n\n1. Tap the 'Open Settings' button below.\n\n2. Toggle the switch next to 'Camera' to the right to allow Ambire to access your camera."
                )}
              </Text>
            )}
            {Platform.OS === 'android' && (
              <Text fontSize={12}>
                {t(
                  "To enable camera access for Ambire, please follow these steps:\n\n1. Tap the 'Open Settings' button below..\n\n2. Tap 'Permissions' and toggle the switch next to 'Camera' to the right to allow Ambire to access your camera."
                )}
              </Text>
            )}
            <Button
              style={spacings.mtSm}
              type="outline"
              text={t('Open Settings')}
              onPress={handleGoToSettings}
            />
          </View>
        </>
      )}
    </Wrapper>
  )
}

export default QRCodeScanner
