import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import QrScanner from '@web/modules/hardware-wallet/screens/QrScannerWithPermission/QrScanner'

type Props = {
  onComplete: (payload: Uint8Array) => void
  onOpenFullScreenScanner?: () => void
  disabled?: boolean
  externalError?: string | null
  onExternalRetry?: () => void
}

const shouldUseFullScreenFallback = (message: string, rawError?: any) => {
  const value = `${message} ${rawError?.name || ''}`.toLowerCase()

  return (
    value.includes('failed to start camera') ||
    value.includes('notallowederror') ||
    value.includes('camera access was denied') ||
    value.includes('permission') ||
    value.includes('blocked') ||
    value.includes('aborterror')
  )
}

const QrScannerWithPermission = ({
  onComplete,
  onOpenFullScreenScanner,
  disabled,
  externalError,
  onExternalRetry
}: Props) => {
  const { isPopup } = getUiType()
  const { t } = useTranslation()
  const { theme } = useTheme()

  const [cameraError, setCameraError] = useState<{
    message: string
    rawError?: any
  } | null>(null)
  const hasActiveErrorRef = useRef(false)

  const [scannerKey, setScannerKey] = useState(0)
  const [showFullScreenFallback, setShowFullScreenFallback] = useState(false)

  const handleRetry = useCallback(() => {
    hasActiveErrorRef.current = false
    setCameraError(null)
    setShowFullScreenFallback(false)
    setScannerKey((k) => k + 1)
  }, [])

  const handleComplete = useCallback(
    (payload: Uint8Array) => {
      hasActiveErrorRef.current = false
      setCameraError(null)
      setShowFullScreenFallback(false)
      onComplete(payload)
    },
    [onComplete]
  )

  const handleError = useCallback(
    (message?: string, rawError?: any) => {
      if (hasActiveErrorRef.current) return

      hasActiveErrorRef.current = true
      const normalizedMessage =
        (typeof message === 'string' && message.trim()) ||
        (typeof rawError?.message === 'string' && rawError.message.trim()) ||
        t('Failed to start camera. Please try again.')

      setCameraError({
        message: normalizedMessage,
        rawError
      })

      if (isPopup && shouldUseFullScreenFallback(normalizedMessage, rawError)) {
        setShowFullScreenFallback(true)
        return
      }

      setShowFullScreenFallback(false)
    },
    [isPopup, t]
  )

  const message = useMemo(() => {
    if (!cameraError) return null

    const value = cameraError.message.toLowerCase()

    if (showFullScreenFallback) {
      return t(
        'Camera scanning works in the extension popup only after camera permission is already granted. Open the full-screen scanner to allow camera access and continue.'
      )
    }

    if (value.includes('https') || value.includes('localhost')) {
      return t('Camera access works only on HTTPS or localhost.')
    }

    if (value.includes('denied') || value.includes('blocked') || value.includes('permission')) {
      return isPopup
        ? t(
            'Camera access is blocked in the popup. Open the full-screen scanner to allow camera access and continue.'
          )
        : t(
            'Camera access is blocked. Please allow camera access for this page in your browser settings, then try again.'
          )
    }

    return cameraError.message
  }, [cameraError, isPopup, showFullScreenFallback, t])

  if (showFullScreenFallback) {
    return (
      <View
        style={[
          flexbox.flex1,
          flexbox.justifyCenter,
          common.borderRadiusPrimary,
          spacings.pv,
          spacings.ph,
          {
            minHeight: 290,
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <Text
          appearance="primaryText"
          fontSize={16}
          weight="semiBold"
          style={[
            spacings.mb,
            {
              textAlign: 'center',
              marginBottom: 12
            }
          ]}
        >
          {t('Camera access required')}
        </Text>

        <Text
          appearance="primaryText"
          fontSize={14}
          style={[
            spacings.pbSm,
            spacings.phSm,
            {
              textAlign: 'center'
            }
          ]}
        >
          {message}
        </Text>
        <FooterGlassView size="sm" absolute={false} style={spacings.pv}>
          <Button
            size="small"
            hasBottomSpacing={false}
            text={t('Open full-screen')}
            onPress={onOpenFullScreenScanner}
          />
        </FooterGlassView>
      </View>
    )
  }

  return (
    <View
      style={[
        flexbox.flex1,
        common.borderRadiusPrimary,
        {
          height: 290,
          overflow: 'hidden',
          backgroundColor: theme.secondaryBackground,
          position: 'relative'
        }
      ]}
    >
      <QrScanner
        key={scannerKey}
        disabled={disabled || !!cameraError || !!externalError || showFullScreenFallback}
        onComplete={handleComplete}
        onError={handleError}
      />

      {cameraError || externalError ? (
        <View
          style={[
            flexbox.center,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.secondaryBackground
            }
          ]}
        >
          <Text
            appearance="primaryText"
            style={[
              spacings.mbSm,
              spacings.phSm,
              {
                textAlign: 'center'
              }
            ]}
          >
            {cameraError ? message : externalError}
          </Text>

          <FooterGlassView size="sm" absolute={false}>
            <Button
              size="small"
              hasBottomSpacing={false}
              text={t('Retry')}
              onPress={externalError ? onExternalRetry : handleRetry}
            />
          </FooterGlassView>
        </View>
      ) : null}
    </View>
  )
}

export default QrScannerWithPermission
