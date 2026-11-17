import { ViewStyle } from 'react-native'

import {
  BalanceChange,
  NftBalanceChange,
  SubmittedAccountOpLike
} from '@ambire-common/libs/accountOp/submittedAccountOp'

export type { SubmittedAccountOpLike }

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
  iconType?: 'send' | 'swap' | 'receive' | 'ambire' | 'walletStaking' | 'safe'
  description?: string
  address?: string
  /** The nonce of the transaction a cancel takes the place of */
  nonce?: bigint
  token?: string
  amount?: bigint
}

export type DisplayBalanceChange =
  | (BalanceChange & {
      iconType?: 'gasTank'
    })
  | (NftBalanceChange & {
      iconType?: never
    })
