import { useCameraPermissions } from 'expo-camera'
import React, { useCallback, useRef } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { validateAddress } from '@ambire-common/services/validations'
import ScanIcon from '@common/assets/svg/ScanIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import CameraScanner from '@mobile/components/CameraScanner'

import { AddressScanButtonProps } from './AddressScanButton'

// Matches MOBILE_QR_SIZE in QrSignRequestScreen so the scan surface is the same
// square size as the sign-request QR code.
const CAMERA_SIZE = 284

// Extracts a plain address from a scanned QR value. Supports raw addresses and
// EIP-681 URIs (e.g. `ethereum:0xabc...@1?value=1`), stripping the scheme, the
// optional `pay-` prefix and any trailing chain/query/path suffix.
const parseScannedAddress = (raw: string): string => {
  let value = raw.trim()

  const scheme = 'ethereum:'
  if (value.toLowerCase().startsWith(scheme)) value = value.slice(scheme.length)

  const payPrefix = 'pay-'
  if (value.toLowerCase().startsWith(payPrefix)) value = value.slice(payPrefix.length)

  const cutAt = ['@', '?', '/'].reduce((end, separator) => {
    const index = value.indexOf(separator)
    return index !== -1 && index < end ? index : end
  }, value.length)

  return value.slice(0, cutAt).trim()
}

const AddressScanButton = ({ onScanned }: AddressScanButtonProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [permission, requestPermission] = useCameraPermissions()
  // CameraScanner fires onScan on every decoded frame, so guard against
  // processing the same result more than once.
  const isProcessingRef = useRef(false)
  // Avoids re-toasting on every frame while the same invalid QR stays in view.
  const lastRejectedRef = useRef<string | null>(null)

  const permissionGranted = !!permission?.granted

  const handleOpen = useCallback(() => {
    isProcessingRef.current = false
    lastRejectedRef.current = null
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission()
    openBottomSheet()
  }, [permission, requestPermission, openBottomSheet])

  const handleScan = useCallback(
    (rawValue: string) => {
      if (isProcessingRef.current) return

      const address = parseScannedAddress(rawValue)
      if (!address) return

      if (validateAddress(address).severity === 'error') {
        if (lastRejectedRef.current !== address) {
          lastRejectedRef.current = address
          addToast(t('Unsupported QR code. Expected a wallet address.'), { type: 'error' })
        }
        return
      }

      isProcessingRef.current = true
      onScanned(address)
      closeBottomSheet()
    },
    [onScanned, closeBottomSheet, addToast, t]
  )

  return (
    <>
      <Pressable onPress={handleOpen} hitSlop={12} style={spacings.mlTy}>
        <ScanIcon width={22} height={22} color={theme.secondaryText} />
      </Pressable>
      <BottomSheet
        id="recipient-address-scan"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        withBackdropBlur={false}
        shouldBeClosableOnDrag={false}
        isScrollEnabled={false}
      >
        <ModalHeader title={t('Scan address')} />
        <View style={[flexbox.alignCenter, { width: '100%', flexGrow: 1, flexShrink: 0 }]}>
          <Text style={[spacings.mbSm, { textAlign: 'center' }]}>
            {t('Scan a QR code containing a wallet address.')}
          </Text>
          <View style={[flexbox.alignCenter, flexbox.flex1, { width: '100%' }]}>
            {permissionGranted ? (
              <View
                style={[
                  { borderRadius: BORDER_RADIUS_PRIMARY + 6 },
                  { width: CAMERA_SIZE, height: CAMERA_SIZE, overflow: 'hidden' }
                ]}
              >
                <CameraScanner onScan={handleScan} />
              </View>
            ) : (
              <Text
                fontSize={14}
                appearance="secondaryText"
                style={[spacings.mbSm, spacings.ptLg, { textAlign: 'center' }]}
              >
                {t('To scan a QR code, camera access needs to be enabled.')}
              </Text>
            )}
            <FooterGlassView
              size="sm"
              absolute={false}
              style={{ ...spacings.ptSm, marginTop: 'auto' }}
              mobileStyle={spacings.ptLg}
            >
              <Button
                size="regular"
                hasBottomSpacing
                type="secondary"
                text={t('Back')}
                onPress={() => closeBottomSheet()}
              />
              {!permissionGranted && (
                <Button
                  size="regular"
                  hasBottomSpacing
                  text={
                    permission && !permission.canAskAgain
                      ? t('Open settings')
                      : t('Grant camera access')
                  }
                  onPress={() =>
                    permission && !permission.canAskAgain
                      ? void Linking.openSettings()
                      : void requestPermission()
                  }
                />
              )}
            </FooterGlassView>
          </View>
        </View>
      </BottomSheet>
    </>
  )
}

export default React.memo(AddressScanButton)
