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
}

declare const LedgerConnectModal: FC<LedgerConnectModalProps>

export default LedgerConnectModal
