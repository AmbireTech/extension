import { FC } from 'react'

export interface LedgerConnectModalProps {
  isVisible: boolean
  handleClose?: () => void
  handleOnConnect?: () => void
  /**
   * Web-only: the WebHID authorization affordance. Ignored on mobile, where the
   * connection is established through the BLE scan/select flow.
   */
  displayOptionToAuthorize?: boolean
  /**
   * Mobile-only: picks a device to install an app on instead of connecting to it.
   * The device stays on its home screen, so the Ethereum app check is skipped.
   */
  onSelectDeviceForAppInstall?: (device: { id: string }) => void
}

declare const LedgerConnectModal: FC<LedgerConnectModalProps>

export default LedgerConnectModal
