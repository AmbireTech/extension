import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type PermissionState = 'idle' | 'requesting' | 'granted' | 'error'

const getCameraPermissionErrorMessage = (error: any, t: (text: string) => string) => {
  switch (error?.name) {
    case 'NotAllowedError':
      return t(
        'Camera access was denied. Please allow camera access for this page in your browser settings and try again.'
      )
    case 'NotFoundError':
      return t('No camera device was found.')
    case 'NotReadableError':
      return t('The camera is unavailable or already being used by another app or browser tab.')
    case 'SecurityError':
      return t('Camera access is only available on HTTPS or localhost.')
    case 'AbortError':
      return t('Camera permission request was interrupted. Please try again.')
    default:
      return error?.message || t('Failed to request camera access.')
  }
}

const QrCameraPermissionPage = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [state, setState] = useState<PermissionState>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleEnableCamera = useCallback(async () => {
    setState('requesting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      stream.getTracks().forEach((track) => track.stop())

      setState('granted')
    } catch (e: any) {
      setError(getCameraPermissionErrorMessage(e, t))
      setState('error')
    }
  }, [t])

  const title = useMemo(() => {
    switch (state) {
      case 'granted':
        return t('Camera enabled')
      case 'error':
        return t('Camera access required')
      default:
        return t('Enable camera access')
    }
  }, [state, t])

  const description = useMemo(() => {
    switch (state) {
      case 'granted':
        return t(
          'Camera access is now enabled. Return to the extension popup and continue scanning there.'
        )
      case 'error':
        return error || t('Ambire could not get camera access.')
      case 'requesting':
        return t('Waiting for camera permission...')
      default:
        return t('Enable camera access forever to enjoy seamless QR hardware wallet support.')
    }
  }, [state, t, error])

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.center,
        {
          backgroundColor: theme.primaryBackground
        }
      ]}
    >
      <View
        style={[
          flexbox.center,
          {
            width: 500
          }
        ]}
      >
        <Text appearance="primaryText" fontSize={24} weight="semiBold" style={[spacings.mb]}>
          {title}
        </Text>

        <Text
          appearance="secondaryText"
          style={[
            spacings.mbLg,
            {
              textAlign: 'center'
            }
          ]}
        >
          {description}
        </Text>

        {state !== 'granted' && (
          <FooterGlassView size="sm" absolute={false} style={spacings.pv}>
            <Button
              hasBottomSpacing={false}
              disabled={state === 'requesting'}
              text={state === 'requesting' ? t('Requesting camera...') : t('Enable camera')}
              onPress={handleEnableCamera}
            />
          </FooterGlassView>
        )}
      </View>
    </View>
  )
}

export default QrCameraPermissionPage
