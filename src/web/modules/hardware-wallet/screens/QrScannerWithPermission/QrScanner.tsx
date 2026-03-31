import QrScannerLib from 'qr-scanner'
import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'

import { UrFragmentDecoder } from '@web/modules/hardware-wallet/qr/utils/UrFragmentDecoder'

type Props = {
  onComplete: (payload: Uint8Array) => void
  onError?: (message: string, rawError?: any) => void
  disabled?: boolean
}

const getCameraErrorMessage = (error: any) => {
  switch (error?.name) {
    case 'NotAllowedError':
      return 'Camera access was denied.'
    case 'NotFoundError':
      return 'No camera device was found.'
    case 'NotReadableError':
      return 'The camera is unavailable or already being used by another app or browser tab.'
    case 'OverconstrainedError':
      return 'The selected camera does not support the required settings.'
    case 'SecurityError':
      return 'Camera access is only available on HTTPS or localhost.'
    case 'AbortError':
      return 'Camera startup was interrupted. Please try again.'
    default:
      return error?.message || 'Failed to start camera scanner.'
  }
}

const getFragmentFromResult = (result: string | { data?: unknown }) => {
  if (typeof result === 'string') return result
  if (typeof result?.data === 'string') return result.data

  throw new Error('Invalid QR scan result.')
}

const QrScanner = ({ onComplete, onError, disabled }: Props) => {
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
          onError?.(getCameraErrorMessage(err), err)
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
  }, [disabled, onComplete, onError])

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
