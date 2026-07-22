import QrScannerLib from 'qr-scanner'
import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'

import { useTranslation } from '@common/config/localization'
import { browser, engine, isExtension } from '@web/constants/browserapi'
import { UrFragmentDecoder } from '@common/modules/hardware-wallets/qr/utils/UrFragmentDecoder'

// Firefox does not implement `BarcodeDetector`, so `qr-scanner` falls back to a Web Worker that it
// spawns from a `blob:` URL (see `qr-scanner-worker.min.js`). Firefox MV3 extension pages reject
// those workers under the default `script-src 'self'` CSP, which leaves the camera streaming but
// no frames ever get decoded. We ship the same worker as a real same-origin file at build time
// (see `webpack.config.js`) and point `qr-scanner` at it here, only for Gecko where it's needed.
if (engine === 'gecko' && isExtension && browser?.runtime?.getURL) {
  const workerUrl = browser.runtime.getURL('qr-scanner-worker.js')
  ;(QrScannerLib as any).createQrEngine = async () => new Worker(workerUrl)
}

type Props = {
  onComplete: (payload: Uint8Array) => void
  onError?: (message: string, rawError?: any) => void
  disabled?: boolean
}

const getCameraErrorMessage = (error: any, t: (message: string) => string) => {
  const rawMessage = typeof error === 'string' ? error : error?.message
  const normalizedMessage = rawMessage?.toLowerCase?.() || ''
  const cameraErrorType = error?.name || error?.type

  switch (cameraErrorType) {
    case 'NotAllowedError':
      return t('Camera access was denied.')
    case 'NotFoundError':
      return t('No camera device was found.')
    case 'NotReadableError':
      return t('The camera is unavailable or already being used by another app or browser tab.')
    case 'OverconstrainedError':
      return t('The selected camera does not support the required settings.')
    case 'SecurityError':
      return t('Camera access is only available on HTTPS or localhost.')
    case 'AbortError':
      return t('Camera startup was interrupted. Please try again.')
    default:
      if (normalizedMessage.includes('camera not found')) {
        return t('Camera permissions blocked. Please enable them from browser settings')
      }
      if (
        normalizedMessage.includes('notallowederror') ||
        normalizedMessage.includes('permission')
      ) {
        return t('Camera access was denied.')
      }
      if (normalizedMessage.includes('notreadableerror')) {
        return t('The camera is unavailable or already being used by another app or browser tab.')
      }
      if (normalizedMessage.includes('overconstrainederror')) {
        return t('The selected camera does not support the required settings.')
      }
      if (normalizedMessage.includes('securityerror') || normalizedMessage.includes('https')) {
        return t('Camera access is only available on HTTPS or localhost.')
      }
      if (normalizedMessage.includes('aborterror')) {
        return t('Camera startup was interrupted. Please try again.')
      }
      return rawMessage || t('Failed to start camera scanner.')
  }
}

const getFragmentFromResult = (result: string | { data?: unknown }) => {
  if (typeof result === 'string') return result
  if (typeof result?.data === 'string') return result.data

  throw new Error('Invalid QR scan result.')
}

const QrScanner = ({ onComplete, onError, disabled }: Props) => {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScannerLib | null>(null)
  const decoderRef = useRef(new UrFragmentDecoder())
  const isCompletedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current

    if (!video || disabled) return

    let disposed = false

    isCompletedRef.current = false
    decoderRef.current.reset()

    const reportError = (error: any, fallbackMessage = 'Failed to decode QR payload.') => {
      if (disposed) return
      onError?.(error?.message || fallbackMessage, error)
    }

    const scanner = new QrScannerLib(
      video,
      (result) => {
        if (disabled || isCompletedRef.current || disposed) return

        try {
          const fragment = getFragmentFromResult(result)

          if (fragment.toLowerCase().startsWith('ur:')) {
            decoderRef.current.add(fragment)

            if (!decoderRef.current.isComplete()) return

            isCompletedRef.current = true
            const payload = decoderRef.current.result()
            void scanner.stop()

            try {
              onComplete(payload)
            } catch (error: any) {
              isCompletedRef.current = false
              reportError(error)
            }

            return
          }

          isCompletedRef.current = true
          void scanner.stop()

          try {
            onComplete(new TextEncoder().encode(fragment))
          } catch (error: any) {
            isCompletedRef.current = false
            reportError(error)
          }
        } catch (error: any) {
          reportError(error)
        }
      },
      {
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        maxScansPerSecond: 8
      }
    )

    scannerRef.current = scanner
    ;(async () => {
      try {
        await scanner.start()
      } catch (err: any) {
        void scanner.stop()
        scanner.destroy()

        if (scannerRef.current === scanner) {
          scannerRef.current = null
        }

        if (!disposed) {
          onError?.(getCameraErrorMessage(err, t), err)
        }
      }
    })()

    return () => {
      disposed = true
      decoderRef.current.reset()
      isCompletedRef.current = false

      void scanner.stop()
      scanner.destroy()

      if (scannerRef.current === scanner) {
        scannerRef.current = null
      }
    }
  }, [disabled, onComplete, onError, t])

  return (
    <View
      style={{
        width: '100%',
        height: 290,
        borderRadius: 12,
        overflow: 'hidden'
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </View>
  )
}

export default QrScanner
