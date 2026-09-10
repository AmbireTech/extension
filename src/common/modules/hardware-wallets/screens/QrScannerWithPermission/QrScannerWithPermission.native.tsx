import { Buffer } from 'buffer'
import { useCameraPermissions } from 'expo-camera'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Linking, View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import {
  emptyQrScanLastRead,
  getQrScanFeedback,
  QR_SCAN_FEEDBACK_INTERVAL
} from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'
import { UrFragmentDecoder } from '@common/modules/hardware-wallets/qr/utils/UrFragmentDecoder'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import CameraScanner from '@mobile/components/CameraScanner'

import type { QrScannerWithPermissionProps } from './QrScannerWithPermission'

import type { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'
// Mobile counterpart of the web QrScannerWithPermission. It manages camera
// permission and assembles animated UR (bc-ur) fragments scanned by
// CameraScanner into a single CBOR payload, then hands it to `onComplete`.
// Non-animated (single) QR codes are forwarded as raw bytes for parity with web.
const QrScannerWithPermission = ({
  onComplete,
  disabled,
  externalError,
  onExternalRetry,
  onProgress
}: QrScannerWithPermissionProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const decoderRef = useRef(new UrFragmentDecoder())
  const isCompletedRef = useRef(false)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const lastReadRef = useRef(emptyQrScanLastRead())
  const lastProgressRef = useRef<QrScanProgress | null>(null)

  const permissionGranted = !!permission?.granted

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission()
  }, [permission, requestPermission])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return
      if (permission && !permission.granted && permission.canAskAgain) void requestPermission()
    })

    return () => subscription.remove()
  }, [permission, requestPermission])

  useEffect(() => {
    if (!onProgress || !permissionGranted || disabled) return

    const id = setInterval(() => {
      if (isCompletedRef.current) return

      const progress = {
        feedback: getQrScanFeedback(lastReadRef.current),
        expectedParts: decoderRef.current.expectedPartCount(),
        progress: decoderRef.current.progress()
      }

      // Only on change, so that the message the user is reading is not re-rendered while
      // nothing about the scan moved
      if (
        progress.feedback === lastProgressRef.current?.feedback &&
        progress.expectedParts === lastProgressRef.current?.expectedParts &&
        progress.progress === lastProgressRef.current?.progress
      )
        return

      lastProgressRef.current = progress
      onProgress(progress)
    }, QR_SCAN_FEEDBACK_INTERVAL)

    return () => clearInterval(id)
  }, [disabled, onProgress, permissionGranted])

  const handleScan = useCallback(
    (value: string, coverage: number) => {
      if (disabled || isCompletedRef.current) return

      lastReadRef.current = { count: lastReadRef.current.count + 1, at: Date.now(), coverage }

      try {
        const fragment = value.trim()

        if (fragment.toLowerCase().startsWith('ur:')) {
          decoderRef.current.add(fragment)

          if (!decoderRef.current.isComplete()) return

          isCompletedRef.current = true
          onComplete(decoderRef.current.result())
          return
        }

        isCompletedRef.current = true
        onComplete(new Uint8Array(Buffer.from(fragment, 'utf-8')))
      } catch (error: any) {
        isCompletedRef.current = false
        decoderRef.current.reset()
        setDecodeError(error?.message || t('Failed to decode QR payload.'))
      }
    },
    [disabled, onComplete, t]
  )

  const handleRetry = useCallback(() => {
    isCompletedRef.current = false
    decoderRef.current.reset()
    lastReadRef.current = emptyQrScanLastRead()
    lastProgressRef.current = null
    setDecodeError(null)
    onExternalRetry?.()
  }, [onExternalRetry])

  const errorMessage = externalError || decodeError

  // `useCameraPermissions` returns null until the status resolves. Render nothing
  // meanwhile so the "grant access" prompt doesn't flash before an already-granted
  // camera mounts.
  if (!permission) return <View style={flexbox.flex1} />

  if (!permissionGranted) {
    const canAskAgain = permission.canAskAgain

    return (
      <View style={[flexbox.flex1, flexbox.center, spacings.ph]}>
        <Text
          fontSize={14}
          color={theme.secondaryText}
          style={[spacings.mbSm, { textAlign: 'center' }]}
        >
          {t('To scan a QR code, camera access needs to be enabled.')}
        </Text>
        <Button
          type="secondary"
          text={canAskAgain ? t('Grant camera access') : t('Open settings')}
          onPress={() => (canAskAgain ? void requestPermission() : void Linking.openSettings())}
          hasBottomSpacing={false}
        />
      </View>
    )
  }

  if (errorMessage) {
    return (
      <View style={[flexbox.flex1, flexbox.center, spacings.ph]}>
        <Text fontSize={14} appearance="errorText" style={[spacings.mbSm, { textAlign: 'center' }]}>
          {errorMessage}
        </Text>
        <Button
          type="secondary"
          text={t('Try again')}
          onPress={handleRetry}
          hasBottomSpacing={false}
        />
      </View>
    )
  }

  // `disabled` pauses scanning; the completed case is guarded inside handleScan
  // (reading the ref here would be an illegal ref access during render).
  return <CameraScanner onScan={handleScan} isProcessing={!!disabled} />
}

export default QrScannerWithPermission
