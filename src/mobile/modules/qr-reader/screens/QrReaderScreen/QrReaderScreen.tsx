import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native'
import {
  Camera,
  isScannedCode,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput
} from 'react-native-vision-camera'

import EditPenIcon from '@common/assets/svg/EditPenIcon'
import GalleryIcon from '@common/assets/svg/GalleryIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const QrReaderScreen = () => {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const { goBack } = useNavigation()
  const device = useCameraDevice('back')
  const { hasPermission, requestPermission } = useCameraPermission()
  const [permissionGranted, setPermissionGranted] = useState(hasPermission)
  const { t } = useTranslation()

  useEffect(() => {
    if (hasPermission) {
      setPermissionGranted(true)
      return
    }

    void requestPermission().then((granted) => {
      setPermissionGranted(granted)
    })
  }, [hasPermission, requestPermission])

  const handleGrantPermission = useCallback(async () => {
    const granted = await requestPermission()
    setPermissionGranted(granted)
  }, [requestPermission])

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings()
  }, [])

  useEffect(() => {
    if (!device) {
      Alert.alert(t('Camera unavailable'), t("We couldn't access your camera."), [
        { text: t('Go Back'), onPress: goBack }
      ])
    }
  }, [device, goBack, t])

  const objectOutput = useObjectOutput({
    types: ['qr', 'ean-13'],
    onObjectsScanned: (objects) => {
      if (!objects.length) return
      const obj = objects[0]
      if (obj && isScannedCode(obj)) {
        console.log('Scanned code value:', obj.value)
      } else {
        console.log('Scanned object:', obj)
      }
    }
  })

  const handleEnterManually = () => {
    console.log('Enter code manually pressed')
  }

  const handleGalleryPress = () => {
    console.log('Open gallery pressed')
  }

  const rightIcon = permissionGranted ? (
    <Pressable onPress={handleGalleryPress} hitSlop={12}>
      <GalleryIcon />
    </Pressable>
  ) : undefined

  const footer = permissionGranted ? (
    <Pressable
      onPress={handleEnterManually}
      hitSlop={8}
      style={[flexbox.directionRow, flexbox.center, spacings.pvLg]}
    >
      <EditPenIcon color={theme.successDecorative} width={20} height={20} />
      <Text fontSize={16} weight="medium" style={spacings.mlSm}>
        {t('Enter code manually')}
      </Text>
    </Pressable>
  ) : (
    <View style={spacings.phSm}>
      <Button type="primary" text={t('Grant camera permission')} onPress={handleGrantPermission} />
      <Button
        type="secondary"
        text={t('Open settings')}
        onPress={handleOpenSettings}
        hasBottomSpacing={false}
      />
    </View>
  )

  return (
    <MobileLayoutContainer footer={footer}>
      <MobileLayoutWrapperMainContent
        withBackButton
        title={t('Scan QR code')}
        rightIcon={rightIcon}
        withScroll={false}
        style={spacings.ph0}
      >
        {permissionGranted ? (
          <View style={[flexbox.flex1, { marginHorizontal: -SPACING_SM }]}>
            <View
              style={[StyleSheet.absoluteFill, flexbox.flex1, styles.dimMask]}
              pointerEvents="none"
            />
            <View style={[flexbox.flex1, flexbox.center]}>
              <View style={styles.scanFrame} pointerEvents="none">
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
            </View>

            {!!device && (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive
                outputs={[objectOutput]}
              />
            )}
          </View>
        ) : (
          <View style={[flexbox.flex1, flexbox.center, spacings.phLg]}>
            <Text fontSize={24} weight="semiBold" style={spacings.mbSm}>
              {t('Scan QR code')}
            </Text>
            <Text fontSize={16} color={theme.secondaryText} style={{ textAlign: 'center' }}>
              {t(
                'To scan a QR code, camera access needs to be enabled. Would you like to open Settings now?'
              )}
            </Text>
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default QrReaderScreen
