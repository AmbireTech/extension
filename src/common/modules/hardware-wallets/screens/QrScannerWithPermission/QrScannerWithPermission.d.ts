import { FC } from 'react'

export interface QrScannerWithPermissionProps {
  onComplete: (payload: Uint8Array) => void
  onOpenFullScreenScanner?: () => void
  disabled?: boolean
  externalError?: string | null
  onExternalRetry?: () => void
}

declare const QrScannerWithPermission: FC<QrScannerWithPermissionProps>

export default QrScannerWithPermission
