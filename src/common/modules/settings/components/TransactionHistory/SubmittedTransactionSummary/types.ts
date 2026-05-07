import { ViewStyle } from 'react-native'

import { BalanceChange, SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'

type SubmittedAccountOpActionFields = Pick<
  SubmittedAccountOp,
  | 'signingKeyAddr'
  | 'signingKeyType'
  | 'nonce'
  | 'eoaNonce'
  | 'feeCall'
  | 'activatorCall'
  | 'gasLimit'
  | 'signature'
  | 'asUserOperation'
  | 'signers'
  | 'signed'
  | 'safeTx'
  | 'flags'
>

export interface SubmittedAccountOpLike
  extends Pick<
      SubmittedAccountOp,
      | 'id'
      | 'accountAddr'
      | 'chainId'
      | 'calls'
      | 'gasFeePayment'
      | 'txnId'
      | 'status'
      | 'meta'
      | 'timestamp'
      | 'identifiedBy'
      | 'balanceChanges'
    >,
    Partial<SubmittedAccountOpActionFields> {}

export interface Props {
  submittedAccountOp: SubmittedAccountOpLike
  style?: ViewStyle
  size?: 'sm' | 'md' | 'lg'
  defaultType: 'summary' | 'full-info'
  modalType?: 'modal' | 'bottom-sheet'
}

export type DappInteraction = {
  id: string
  name: string
  iconUrl?: string | null
  iconType?: 'send' | 'swap'
}

export type DisplayBalanceChange = BalanceChange & {
  iconType?: 'gasTank'
}
