import { BlurView } from 'expo-blur'
import { CameraView } from 'expo-camera'
import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import MaskedView from '@react-native-masked-view/masked-view'

import getStyles, { CORNER_RADIUS, SCAN_FRAME_SIZE } from './styles'

interface Props {
  // Raw decoded value of a scanned QR code. Fires on every camera frame that
  // decodes (so multi-part / animated QR flows keep receiving fragments); the
  // caller owns any dedupe or single-shot guarding.
  onScan: (data: string) => void
  // When true, scans are ignored (e.g. while the caller processes a result).
  isProcessing?: boolean
  frameSize?: number
}

// Reusable camera surface: renders the back-facing QR camera with a blurred
// overlay that cuts out a rounded scan frame. Permission gating is the caller's
// responsibility — mount this only once camera access is granted.
const CameraScanner = ({ onScan, isProcessing = false, frameSize = SCAN_FRAME_SIZE }: Props) => {
  const { styles } = useTheme(getStyles)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

  const frameTop = containerSize ? (containerSize.height - frameSize) / 2 : 0
  const frameLeft = containerSize ? (containerSize.width - frameSize) / 2 : 0

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setContainerSize({ width, height })
  }, [])

  const handleBarcodeScanned = useCallback(
    (event: { data: string }) => {
      if (isProcessing) return
      if (!event?.data) return
      onScan(event.data)
    },
    [isProcessing, onScan]
  )

  return (
    <View
      onLayout={handleLayout}
      style={[
        flexbox.flex1,
        { position: 'relative', overflow: 'hidden', backgroundColor: 'transparent' }
      ]}
    >
      {/* Corner markers */}
      <View style={[StyleSheet.absoluteFill, flexbox.center, { zIndex: 200 }]} pointerEvents="none">
        <View style={{ width: frameSize, height: frameSize }}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
      </View>

      {/* Blur overlay with a rounded hole where the camera shows through */}
      {containerSize && (
        <MaskedView
          style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
          maskElement={
            <Svg
              width={containerSize.width}
              height={containerSize.height}
              viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            >
              <Defs>
                <Mask id="hole">
                  {/* White = visible (blur shows) */}
                  <Rect
                    x="0"
                    y="0"
                    width={containerSize.width}
                    height={containerSize.height}
                    fill="white"
                  />
                  {/* Black = hidden (hole where camera shows through) */}
                  <Rect
                    x={frameLeft}
                    y={frameTop}
                    width={frameSize}
                    height={frameSize}
                    rx={CORNER_RADIUS}
                    ry={CORNER_RADIUS}
                    fill="black"
                  />
                </Mask>
              </Defs>
              <Rect
                x="0"
                y="0"
                width={containerSize.width}
                height={containerSize.height}
                fill="white"
                mask="url(#hole)"
              />
            </Svg>
          }
        >
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        </MaskedView>
      )}

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  )
}

export default React.memo(CameraScanner)
