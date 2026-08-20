import { FC } from 'react'

import { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'

export interface QrScannerWithPermissionProps {
  onComplete: (payload: Uint8Array) => void
  onOpenFullScreenScanner?: () => void
  disabled?: boolean
  externalError?: string | null
  onExternalRetry?: () => void
  /** Reports how the scan is going, so the caller can tell the user what to do */
  onProgress?: (progress: QrScanProgress) => void
}

declare const QrScannerWithPermission: FC<QrScannerWithPermissionProps>

export default QrScannerWithPermission
