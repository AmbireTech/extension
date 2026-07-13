import { scanFromURLAsync } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, Linking, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import EditPenIcon from '@common/assets/svg/EditPenIcon'
import GalleryIcon from '@common/assets/svg/GalleryIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import CameraScanner from '@mobile/components/CameraScanner'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import useWalletConnect from '@mobile/modules/wallet-connect/hooks/useWalletConnect'

const QrReaderScreen = () => {
  const { theme } = useTheme()
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
  const {
    ref: manualEntrySheetRef,
    open: openManualEntrySheet,
    close: closeManualEntrySheet
  } = useModalize()
  const [manualValue, setManualValue] = useState('')
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions()
  const galleryRequestedRef = useRef(false)

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission()
    }
  }, [permission, requestPermission])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return
      if (permission && !permission.granted) {
        void requestPermission()
      }
      if (galleryRequestedRef.current && galleryPermission && !galleryPermission.granted) {
        void requestGalleryPermission()
      }
    })
    return () => subscription.remove()
  }, [permission, requestPermission, galleryPermission, requestGalleryPermission])

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

  const handleScan = useCallback(
    (value: string) => {
      if (isProcessingRef.current) return
      if (!value) return
      isProcessingRef.current = true
      void handleScannedValue(value)
    },
    [handleScannedValue]
  )

  const handleEnterManually = () => {
    openManualEntrySheet()
  }

  const handleManualSubmit = useCallback(() => {
    const value = manualValue.trim()
    if (!value) return
    closeManualEntrySheet()
    setManualValue('')
    void handleScannedValue(value)
  }, [manualValue, closeManualEntrySheet, handleScannedValue])

  const handleManualCancel = useCallback(() => {
    closeManualEntrySheet()
    setManualValue('')
  }, [closeManualEntrySheet])

  const handleGalleryPress = useCallback(async () => {
    galleryRequestedRef.current = true
    if (!galleryPermission?.granted) {
      if (!galleryPermission || galleryPermission.canAskAgain) {
        const result = await requestGalleryPermission()
        if (!result.granted) return
      } else {
        void Linking.openSettings()
        return
      }
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1
    })

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return

    const uri = pickerResult.assets[0].uri
    try {
      const scanResults = await scanFromURLAsync(uri)
      if (!scanResults.length) {
        addToast(t('The image does not contain a valid QR code for connection.'), { type: 'error' })
        return
      }
      void handleScannedValue(scanResults![0]!.data)
    } catch {
      addToast(t('The image does not contain a valid QR code for connection.'), { type: 'error' })
    }
  }, [galleryPermission, requestGalleryPermission, addToast, t, handleScannedValue])

  const rightIcon = permissionGranted ? (
    <Pressable onPress={handleGalleryPress} hitSlop={12}>
      <GalleryIcon width={22} height={22} />
    </Pressable>
  ) : undefined

  const footer = permissionGranted ? (
    <View style={flexbox.alignCenter}>
      <Button
        type="secondary"
        text={t('Enter code manually')}
        onPress={handleEnterManually}
        childrenPosition="left"
        hasBottomSpacing={false}
        containerStyle={{ height: 44 }}
        style={{ height: 44 }}
      >
        <EditPenIcon width={24} height={24} style={spacings.mrMi} />
      </Button>
    </View>
  ) : (
    <Button
      type="secondary"
      text={t('Open settings')}
      onPress={handleOpenSettings}
      hasBottomSpacing={false}
    />
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
            <CameraScanner onScan={handleScan} />
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
      <BottomSheet
        id="qr-manual-entry"
        type="modal"
        sheetRef={manualEntrySheetRef}
        closeBottomSheet={handleManualCancel}
        shouldBeClosableOnDrag={false}
        backgroundColor="secondaryBackground"
      >
        <Text fontSize={18} weight="semiBold" style={spacings.mbLg}>
          {t('Enter QR code data')}
        </Text>
        <Input
          value={manualValue}
          onChangeText={setManualValue}
          autoFocus
          borderless
          onSubmitEditing={handleManualSubmit}
          returnKeyType="done"
          placeholder="wc: ..."
          containerStyle={spacings.mbLg}
        />
        <View style={[flexbox.directionRow, flexbox.justifyEnd, flexbox.alignCenter]}>
          <Button
            type="ghost"
            text={t('Cancel')}
            size="large"
            onPress={handleManualCancel}
            hasBottomSpacing={false}
            style={{ height: 44, ...spacings.phLg }}
          />
          <Button
            type="primary"
            size="large"
            text={t('Done')}
            onPress={handleManualSubmit}
            disabled={!manualValue.trim()}
            hasBottomSpacing={false}
            style={{ borderRadius: 50, height: 44, ...spacings.phLg }}
          />
        </View>
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default QrReaderScreen
