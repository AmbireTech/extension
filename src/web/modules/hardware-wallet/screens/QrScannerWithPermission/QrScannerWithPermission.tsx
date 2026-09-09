import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import { browser, engine, isSafari } from '@web/constants/browserapi'
import QrScanner from '@web/modules/hardware-wallet/screens/QrScannerWithPermission/QrScanner'

import type { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'
type Props = {
  onComplete: (payload: Uint8Array) => void
  onOpenFullScreenScanner?: () => void
  disabled?: boolean
  externalError?: string | null
  onExternalRetry?: () => void
  /** Reports how the scan is going, so the caller can tell the user what to do */
  onProgress?: (progress: QrScanProgress) => void
}

// Chromium is the only engine that lets an extension open the browser's own settings,
// and only there the camera permission of this page has a page of its own
const canOpenBrowserCameraSettings = engine === 'webkit' && !isSafari() && !!browser?.runtime?.id

/**
 * Opens the browser settings on the permissions of the extension itself, because once
 * the camera is blocked for a page, browsers never ask the user about it again.
 */
const openBrowserCameraSettings = async () => {
  try {
    const { origin } = new URL(browser.runtime.getURL('/'))

    await browser.tabs.create({
      active: true,
      url: `chrome://settings/content/siteDetails?site=${encodeURIComponent(origin)}`
    })
  } catch (error) {
    captureException(error)
  }
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
  onExternalRetry,
  onProgress
}: Props) => {
  const { isPopup, isSidePanel } = getUiType()
  const needsFullScreenCameraFallback = isPopup || isSidePanel
  const { t } = useTranslation()
  const { theme } = useTheme()

  const [cameraError, setCameraError] = useState<{
    message: string
    rawError?: any
  } | null>(null)
  const hasActiveErrorRef = useRef(false)

  const [scannerKey, setScannerKey] = useState(0)
  const [showFullScreenFallback, setShowFullScreenFallback] = useState(false)

  const resetScanner = useCallback(() => {
    hasActiveErrorRef.current = false
    setCameraError(null)
    setShowFullScreenFallback(false)
    setScannerKey((k) => k + 1)
  }, [])

  const handleRetry = useCallback(async () => {
    // Try to re-trigger browser camera permission when possible.
    // Some browsers won't show it again if permission is blocked.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      stream.getTracks().forEach((track) => track.stop())
    } catch (e: any) {
      const normalizedMessage =
        (typeof e?.message === 'string' && e.message.trim()) ||
        t('Failed to start camera. Please try again.')

      setCameraError({
        message: normalizedMessage,
        rawError: e
      })
      const isBlocked = shouldUseFullScreenFallback(normalizedMessage, e)

      setShowFullScreenFallback(
        needsFullScreenCameraFallback && !!onOpenFullScreenScanner && isBlocked
      )

      // The browser refused without asking the user anything, so the block can be
      // lifted from its settings only
      if (isBlocked && canOpenBrowserCameraSettings) void openBrowserCameraSettings()

      return
    }

    resetScanner()
  }, [needsFullScreenCameraFallback, onOpenFullScreenScanner, resetScanner, t])

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

      if (
        needsFullScreenCameraFallback &&
        shouldUseFullScreenFallback(normalizedMessage, rawError)
      ) {
        setShowFullScreenFallback(true)
        return
      }

      setShowFullScreenFallback(false)
    },
    [needsFullScreenCameraFallback, t]
  )

  const message = useMemo(() => {
    if (!cameraError) return null

    const value = cameraError.message.toLowerCase()

    if (showFullScreenFallback) {
      return t(
        'Camera scanning needs permission first. Open the full-screen scanner to allow camera access and continue.'
      )
    }

    if (value.includes('https') || value.includes('localhost')) {
      return t('Camera access works only on HTTPS or localhost.')
    }

    if (value.includes('denied') || value.includes('blocked') || value.includes('permission')) {
      return needsFullScreenCameraFallback
        ? t(
            'Camera access is blocked here. Open the full-screen scanner to allow camera access and continue.'
          )
        : t(
            'Camera access is blocked. Please allow camera access for this page in your browser settings, then try again.'
          )
    }

    return cameraError.message
  }, [cameraError, needsFullScreenCameraFallback, showFullScreenFallback, t])

  const isPermissionBlocked = useMemo(() => {
    if (!cameraError) return false
    return shouldUseFullScreenFallback(cameraError.message, cameraError.rawError)
  }, [cameraError])

  const shouldOpenFullScreenScanner =
    !!cameraError && isPermissionBlocked && !!onOpenFullScreenScanner

  const retryText = useMemo(() => {
    if (shouldOpenFullScreenScanner) return t('Open full-screen')
    // Asking again either brings the browser prompt back or sends the user to the
    // settings where the camera can be unblocked
    if (cameraError && isPermissionBlocked) return t('Allow camera access')

    return t('Retry')
  }, [cameraError, isPermissionBlocked, shouldOpenFullScreenScanner, t])

  const handleRetryPress = useCallback(() => {
    if (shouldOpenFullScreenScanner) return onOpenFullScreenScanner?.()
    if (cameraError) return handleRetry()

    return onExternalRetry?.()
  }, [
    cameraError,
    handleRetry,
    onExternalRetry,
    onOpenFullScreenScanner,
    shouldOpenFullScreenScanner
  ])

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
        {!!onOpenFullScreenScanner && (
          <FooterGlassView size="sm" absolute={false} style={spacings.pv}>
            <Button
              size="small"
              hasBottomSpacing={false}
              text={t('Open full-screen')}
              onPress={onOpenFullScreenScanner}
            />
          </FooterGlassView>
        )}
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
        onProgress={onProgress}
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
              text={retryText}
              onPress={handleRetryPress}
            />
          </FooterGlassView>
        </View>
      ) : null}
    </View>
  )
}

export default QrScannerWithPermission
