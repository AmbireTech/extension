import React, { useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { QrReader } from 'react-qr-reader'

import { UrFragmentDecoder } from '@web/modules/hardware-wallet/qr/utils/UrFragmentDecoder'

type Props = {
  onComplete: (payload: Uint8Array) => void
  disabled?: boolean
}

const QrScanner = ({ onComplete, disabled }: Props) => {
  const decoderRef = useRef(new UrFragmentDecoder())
  const isCompletedRef = useRef(false)

  useEffect(() => {
    return () => {
      decoderRef.current.reset()
      isCompletedRef.current = false
    }
  }, [])

  return (
    <View style={{ width: '100%' }}>
      <QrReader
        constraints={{ facingMode: 'environment' }}
        onResult={(result) => {
          if (!result || disabled || isCompletedRef.current) return

          const fragment = result.getText()

          try {
            if (fragment.toLowerCase().startsWith('ur:')) {
              decoderRef.current.add(fragment)

              if (decoderRef.current.isComplete()) {
                isCompletedRef.current = true
                const payload = decoderRef.current.result()
                onComplete(payload)
              }
            } else {
              isCompletedRef.current = true
              onComplete(new TextEncoder().encode(fragment))
            }
          } catch (e) {
            // optional: ignore malformed scans or show error
          }
        }}
      />
    </View>
  )
}

export default QrScanner
