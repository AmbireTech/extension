import React, { useMemo } from 'react'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import { ACCOUNTS_SYNC_QR_INTERVAL } from '@common/modules/accounts-sync/consts'

import type { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'

interface Props {
  /** What the scanner last reported, null before it starts */
  progress: QrScanProgress | null
}

/**
 * Tells the user how to hold the phone for the accounts sync to go through, so that a code
 * which is in the frame but unreadable does not look the same as no code at all. Worded for
 * both directions of the sync, where in either case it is the phone that has to be moved.
 */
const SyncScanFeedbackAlert = ({ progress }: Props) => {
  const { t } = useTranslation()
  const { feedback, expectedParts } = progress || {}

  /**
   * How long showing every fragment once takes on the exporting device, which is what the
   * scan amounts to when the camera keeps up with it. Known from the first fragment that is
   * read and constant from there on, so the number the user is given never moves.
   */
  const scanSeconds = expectedParts
    ? Math.ceil((expectedParts * ACCOUNTS_SYNC_QR_INTERVAL) / 1000)
    : null

  const title = useMemo(() => {
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
  }, [feedback, scanSeconds, t])

  return <Alert type={feedback === 'hold-still' ? 'success' : 'info'} size="sm" title={title} />
}

export default React.memo(SyncScanFeedbackAlert)
