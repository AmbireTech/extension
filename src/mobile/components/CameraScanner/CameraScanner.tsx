import { BlurView } from 'expo-blur'
import { CameraView } from 'expo-camera'
import { memo, useCallback, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'

import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import useTheme from '@common/hooks/useTheme'
import QrScanProgressBar from '@common/modules/hardware-wallets/components/QrScanProgressBar'
import { getQrCodeCoverage } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'
import { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles, { SCAN_FRAME_SIZE } from './styles'

import type { BarcodeScanningResult } from 'expo-camera'
interface Props {
  // Raw decoded value of a scanned QR code. Fires on every camera frame that
  // decodes (so multi-part / animated QR flows keep receiving fragments); the
  // caller owns any dedupe or single-shot guarding.
  // `coverage` is how much of the scan frame the code took up (0 when the platform
  // reported no corner points), which the caller can turn into aiming hints.
  onScan: (data: string, coverage: number) => void
  // When true, scans are ignored (e.g. while the caller processes a result).
  isProcessing?: boolean
  frameSize?: number
  // How much of an animated QR code is read, from 0 to 1. Shown as a bar along the
  // bottom of the scan frame, hidden when not passed.
  progress?: number
}

// Reusable camera surface: renders the back-facing QR camera, blurred, with the
// corners of the scan frame on top. Permission gating is the caller's
// responsibility — mount this only once camera access is granted.
const CameraScanner = ({
  onScan,
  isProcessing = false,
  frameSize = SCAN_FRAME_SIZE,
  progress
}: Props) => {
  const { styles } = useTheme(getStyles)
  // The screen stays mounted underneath when another one is pushed on top of it,
  // so the camera has to be switched off explicitly.
  const isFocused = useIsScreenFocused()
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

  const frameTop = containerSize ? (containerSize.height - frameSize) / 2 : 0
  const frameLeft = containerSize ? (containerSize.width - frameSize) / 2 : 0

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setContainerSize({ width, height })
  }, [])

  const handleBarcodeScanned = useCallback(
    (event: BarcodeScanningResult) => {
      if (isProcessing) return
      if (!event?.data) return

      // The corner points come in the coordinates of the camera preview, which the frame
      // is the visible window of, so the two are directly comparable
      onScan(event.data, getQrCodeCoverage(event.cornerPoints, frameSize))
    },
    [frameSize, isProcessing, onScan]
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

      {containerSize && progress !== undefined && (
        <QrScanProgressBar
          progress={progress}
          // Inside the frame, because the screens size the camera to the frame and leave no
          // room around it
          style={{
            position: 'absolute',
            bottom: frameTop + SPACING,
            left: frameLeft + SPACING,
            width: frameSize - SPACING * 2,
            zIndex: 200
          }}
        />
      )}

      {/* Blurs the whole camera view. Only what is shown is blurred - the scanner reads the
          frames straight from the camera */}
      <BlurView
        intensity={60}
        tint="dark"
        // Android renders only a dark tint instead of a blur unless this experimental
        // method is on
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
        pointerEvents="none"
      />

      <CameraView
        active={isFocused}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  )
}

export default memo(CameraScanner)
