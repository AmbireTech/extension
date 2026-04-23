import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import useSign from '@common/hooks/useSign'

export type ModalsProps = Pick<
  ReturnType<typeof useSign>,
  | 'renderedButNotNecessarilyVisibleModal'
  | 'warningModalRef'
  | 'feePayerKeyType'
  | 'signingKeyType'
  | 'slowPaymasterRequest'
  | 'shouldDisplayLedgerConnectModal'
  | 'handleDismissLedgerConnectModal'
  | 'shouldDisplayQrSigningModal'
  | 'handleQrSingingFlowOnContinuePressed'
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
  autoOpen?: 'warnings'
  actionType?: 'swapAndBridge' | 'transfer'
}
