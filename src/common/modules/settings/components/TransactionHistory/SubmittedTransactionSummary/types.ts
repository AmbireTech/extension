import { ViewStyle } from 'react-native'

import { BalanceChange, SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'

export interface Props {
  submittedAccountOp: SubmittedAccountOp
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
