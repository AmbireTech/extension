import QrScannerLib from 'qr-scanner'
import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'

import { UrFragmentDecoder } from '@web/modules/hardware-wallet/qr/utils/UrFragmentDecoder'

type Props = {
  onComplete: (payload: Uint8Array) => void
  onError?: (message: string) => void
  disabled?: boolean
}

const QrScanner = ({ onComplete, onError, disabled }: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScannerLib | null>(null)
  const decoderRef = useRef(new UrFragmentDecoder())
  const isCompletedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || disabled) return

    isCompletedRef.current = false
    decoderRef.current.reset()

    const scanner = new QrScannerLib(
      video,
      (result) => {
        if (disabled || isCompletedRef.current) return

        const fragment = typeof result === 'string' ? result : result.data

        try {
          if (fragment.toLowerCase().startsWith('ur:')) {
            decoderRef.current.add(fragment)

            if (decoderRef.current.isComplete()) {
              isCompletedRef.current = true
              const payload = decoderRef.current.result()
              void scanner.stop()
              onComplete(payload)
            }
          } else {
            isCompletedRef.current = true
            void scanner.stop()
            onComplete(new TextEncoder().encode(fragment))
          }
        } catch (e: any) {
          onError?.(e?.message || 'Failed to decode QR payload.')
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

    scanner.start().catch((err: any) => {
      onError?.(err?.message || 'Failed to start camera scanner.')
    })

    return () => {
      decoderRef.current.reset()
      isCompletedRef.current = false

      void scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [disabled, onComplete, onError])

  return (
    <View
      style={{
        width: '100%',
        height: 290,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#111'
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
