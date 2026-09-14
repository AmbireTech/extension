import React, { useMemo } from 'react'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import { ACCOUNTS_SYNC_QR_INTERVAL } from '@common/modules/accounts-sync/consts'

import type { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'

interface Props {
  /** What the scanner last reported, null before it starts */
  progress: QrScanProgress | null
  /** Everything was received and parsed, so the password step is what is left */
  hasScannedPayload?: boolean
  /** How many accounts arrived, told to the user once everything is in */
  scannedAccountsCount?: number
}

/**
 * Tells the user how to hold the phone for the accounts sync to go through, so that a code
 * which is in the frame but unreadable does not look the same as no code at all. Worded for
 * both directions of the sync, where in either case it is the phone that has to be moved.
 *
 * While the codes are being read the alert doubles as the progress bar of the transfer.
 */
const SyncScanFeedbackAlert = ({ progress, hasScannedPayload, scannedAccountsCount }: Props) => {
  const { t } = useTranslation()
  const { feedback, expectedParts, progress: receivedShare } = progress || {}
  const isReading = feedback === 'hold-still'

  /**
   * How long showing every fragment once takes on the exporting device, which is what the
   * scan amounts to when the camera keeps up with it. Known from the first fragment that is
   * read and constant from there on, so the number the user is given never moves.
   */
  const scanSeconds = expectedParts
    ? Math.ceil((expectedParts * ACCOUNTS_SYNC_QR_INTERVAL) / 1000)
    : null

  /**
   * The fill of the alert, shown only while the codes are being read - once everything is
   * in there is no progress left to show and the alert goes back to its plain background.
   * The fragments are kept even when the camera loses them, so drifting out of the frame
   * hides the bar and coming back picks it up where it was left.
   */
  const fill = useMemo(() => {
    if (hasScannedPayload || !isReading) return undefined

    return receivedShare || 0
  }, [hasScannedPayload, isReading, receivedShare])

  const title = useMemo(() => {
    if (hasScannedPayload)
      return scannedAccountsCount
        ? t('All {{count}} account{{s}} received.', {
            count: scannedAccountsCount,
            s: scannedAccountsCount > 1 ? 's' : ''
          })
        : t('All accounts received.')

    switch (feedback) {
      case 'hold-still':
        return scanSeconds
          ? t('QR code found. Hold your phone still for about {{scanSeconds}} seconds.', {
              scanSeconds
            })
          : t('QR code found. Hold your phone still until the process is complete.')
      case 'move-closer':
        return t('Move your phone closer, the QR code is too small to read.')
      case 'move-back':
        return t('Move your phone a little further away, the QR code does not fit.')
      case 'lost':
        return t('The QR code is out of sight. Line your phone up with your computer again.')
      default:
        return t('Hold your phone in front of your computer to start scanning.')
    }
  }, [feedback, hasScannedPayload, scanSeconds, scannedAccountsCount, t])

  return (
    <Alert
      type={isReading || hasScannedPayload ? 'success' : 'info'}
      size="sm"
      title={title}
      progress={fill}
    />
  )
}

export default React.memo(SyncScanFeedbackAlert)
