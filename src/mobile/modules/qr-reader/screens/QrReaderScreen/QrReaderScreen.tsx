import { CameraView } from 'expo-camera'
import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, StyleSheet, View } from 'react-native'

import EditPenIcon from '@common/assets/svg/EditPenIcon'
import GalleryIcon from '@common/assets/svg/GalleryIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import useWalletConnect from '@mobile/modules/wallet-connect/hooks/useWalletConnect'

import getStyles from './styles'

const QrReaderScreen = () => {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const { goBack } = useNavigation()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    pair,
    isInitialized: isWcInitialized,
    cameraPermission: permission,
    requestCameraPermission: requestPermission
  } = useWalletConnect()
  const permissionGranted = !!permission?.granted
  const isProcessingRef = useRef(false)

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission()
    }
  }, [permission, requestPermission])

  const handleGrantPermission = useCallback(async () => {
    await requestPermission()
  }, [requestPermission])

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings()
  }, [])

  const handleScannedValue = useCallback(
    async (rawValue: string) => {
      const value = rawValue.trim()

      if (value.toLowerCase().startsWith('wc:')) {
        if (!isWcInitialized) {
          addToast(t('WalletConnect is still initializing. Please try again in a moment.'), {
            type: 'warning'
          })
          isProcessingRef.current = false
          return
        }

        addToast(t('Connecting via WalletConnect…'))
        void pair(value)
        goBack()
        return
      }

      addToast(t('Unsupported QR code. Expected a WalletConnect URI (wc:…).'), {
        type: 'error'
      })
      isProcessingRef.current = false
    },
    [pair, isWcInitialized, addToast, t, goBack]
  )

  const handleBarcodeScanned = useCallback(
    (event: { data: string }) => {
      if (isProcessingRef.current) return
      const value = event.data
      if (!value) return
      isProcessingRef.current = true
      void handleScannedValue(value)
    },
    [handleScannedValue]
  )

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
          <View
            style={[
              flexbox.flex1,
              {
                marginHorizontal: -SPACING_SM,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'transparent'
              }
            ]}
          >
            <View style={[StyleSheet.absoluteFill, flexbox.flex1, flexbox.center, { zIndex: 100 }]}>
              <View style={styles.scanFrame} pointerEvents="none">
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
            </View>

            <CameraView
              style={[StyleSheet.absoluteFill]}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr']
              }}
              onBarcodeScanned={handleBarcodeScanned}
            />
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
