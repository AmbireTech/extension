import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import useSign from '@common/hooks/useSign'

export type ModalsProps = Pick<
  ReturnType<typeof useSign>,
  | 'renderedButNotNecessarilyVisibleModal'
  | 'warningModalRef'
  | 'gasFeeUpdatedModalRef'
  | 'handleAcceptGasFeeUpdate'
  | 'handleDismissGasFeeUpdate'
  | 'slowPaymasterRequest'
  | 'shouldDisplayLedgerConnectModal'
  | 'handleDismissLedgerConnectModal'
  | 'shouldDisplayQrSigningModal'
  | 'handleQrSigningFlowOnContinuePressed'
  | 'handleQrSigningFlowSubmitSignatureResponse'
  | 'handleQrSigningFlowOnClosePressed'
  | 'handleQrSigningFlowOnRejectPressed'
  | 'handleQrSigningFlowOnBackPressed'
  | 'currentRequest'
  | 'signingStep'
  | 'warningToPromptBeforeSign'
  | 'acknowledgeWarning'
  | 'dismissWarning'
> & {
  signAccountOpState: ISignAccountOpController | null
  autoOpen?: 'warnings' | 'gas-fee-updated'
  actionType?: 'swapAndBridge' | 'transfer'
}
