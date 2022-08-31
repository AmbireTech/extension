import { BarCodeScanner } from 'expo-barcode-scanner'
import { Camera } from 'expo-camera'
import * as IntentLauncher from 'expo-intent-launcher'
import LottieView from 'lottie-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Linking, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CameraCorners from '@assets/svg/CameraCorners'
import { APP_ID, isiOS } from '@config/env'
import { useTranslation } from '@config/localization'
import AmbireLogo from '@modules/auth/components/AmbireLogo'
import Text from '@modules/common/components/Text'
import requestPermissionFlagging from '@modules/common/services/requestPermissionFlagging'
import colors from '@modules/common/styles/colors'
import spacings, { DEVICE_WIDTH } from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'

import Button from '../Button'
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

  const [hasPermission, setHasPermission] = useState<null | boolean>(null)
  const [scanned, setScanned] = useState<boolean>(false)
  const [ratio, setRatio] = useState<string | null>(null)
  const insets = useSafeAreaInsets()

  const { t } = useTranslation()

  useEffect(() => {
    ;(async () => {
      const { status } = await requestPermissionFlagging(Camera.requestCameraPermissionsAsync)
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScan = ({ data }: any) => {
    setScanned(true)
    !!onScan && onScan(data)
  }

  const requestCameraPermissionAgain = async () => {
    const { status } = await requestPermissionFlagging(Camera.requestCameraPermissionsAsync)
    setHasPermission(status === 'granted')
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
        // cameraRef.current?.getSupportedRatiosAsync()?.then((res: string[]) => {
        //   if (res.includes('1:1')) {
        //     setRatio('1:1')
        //   } else {
        //     setRatio(res[0])
        //   }
        // })
      } catch (e) {
        setRatio('1:1')
      }
    }
  }

  return (
    <Wrapper
      contentContainerStyle={[
        flexboxStyles.flex1,
        !!hasPermission && flexboxStyles.alignCenter,
        !!hasPermission && flexboxStyles.justifyCenter,
        !!hasPermission && { marginBottom: insets.bottom },
        !hasPermission && spacings.mbLg
      ]}
    >
      {!!hasPermission && (
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

      {hasPermission === false && (
        <>
          <AmbireLogo />
          <Text style={spacings.mbMi} fontSize={12}>
            {t('The request for accessing the phone camera was denied.')}
          </Text>
          {Platform.OS === 'android' && (
            <Button
              style={spacings.mtSm}
              type="outline"
              text={t('Request Camera Permission')}
              onPress={requestCameraPermissionAgain}
            />
          )}
          {Platform.OS === 'ios' && (
            <Text style={spacings.mbSm} fontSize={12}>
              {t(
                'To be able to scan the login QR code, go to: Settings/Ambire app and check Alow Camera Access.'
              )}
            </Text>
          )}
          {Platform.OS === 'android' && (
            <Text fontSize={12}>
              {t(
                "Or if you've previously chosen don't ask again - to be able to scan the login QR code, first go to Settings. Then - select Ambire app from the list of installed apps. Finally, check alow camera access."
              )}
            </Text>
          )}
          <Button
            style={spacings.mtSm}
            type="outline"
            text={t('Open Settings')}
            onPress={handleGoToSettings}
          />
        </>
      )}
    </Wrapper>
  )
}

export default QRCodeScanner
