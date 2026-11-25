import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'

import type { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'

interface Props {
  /** What the scanner last reported, null before it starts */
  progress: QrScanProgress | null
  style?: ViewStyle
}

/**
 * Tells the user how to hold the camera while it scans the QR code of a QR-based wallet, the
 * same way the app data sync does. Fills up as the parts of an animated code come in.
 */
const QrScanFeedbackAlert = ({ progress, style }: Props) => {
  const { t } = useTranslation()
  const { feedback, expectedParts = 0, progress: receivedShare } = progress || {}
  const isReading = feedback === 'hold-still'
  const isCodeInSight = isReading || feedback === 'move-closer' || feedback === 'move-back'
  // Only an animated code has parts to fill up with, a single one is read at once
  const fill = isCodeInSight && expectedParts > 1 ? receivedShare || 0 : undefined

  const title = useMemo(() => {
    switch (feedback) {
      case 'hold-still':
        return t('QR code found. Hold still until the scan is complete.')
      case 'move-closer':
        return t('Move closer, the QR code is too small to read.')
      case 'move-back':
        return t('Move a little further away, the QR code does not fit.')
      case 'lost':
        return t('The QR code is out of sight. Point the camera at it again.')
      default:
        return t('Point the camera at the QR code on your wallet to start scanning.')
    }
  }, [feedback, t])

  return (
    <Alert
      type={isReading ? 'success' : 'info'}
      size="sm"
      title={title}
      progress={fill}
      style={style}
    />
  )
}

export default React.memo(QrScanFeedbackAlert)
