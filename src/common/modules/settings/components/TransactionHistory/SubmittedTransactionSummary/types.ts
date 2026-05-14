import { ViewStyle } from 'react-native'

import {
  BalanceChange,
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
  iconType?: 'send' | 'swap' | 'receive' | 'ambire'
}

export type DisplayBalanceChange = BalanceChange & {
  iconType?: 'gasTank'
}
