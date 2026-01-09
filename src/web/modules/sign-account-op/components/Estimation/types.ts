import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import { Sponsor } from '@ambire-common/libs/erc7677/types'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { SelectValue } from '@common/components/Select/types'

type FeeOption = Pick<SelectValue, 'value' | 'label' | 'disabled'> &
  Pick<FeePaymentOption, 'paidBy'> & {
    token: TokenResult | null
  }

type Props = {
  signAccountOpState: ISignAccountOpController | null
  disabled: boolean
  hasEstimation: boolean
  slowRequest: boolean
  isViewOnly: boolean
  isSponsored: boolean
  sponsor: Sponsor | undefined
  updateType: 'Requests' | 'Swap&Bridge' | 'Transfer&TopUp'
  bundlerNonceDiscrepancy?: {
    id: string
    title: string
  }
  serviceFee?: SwapAndBridgeRoute['serviceFee']
}

export type { FeeOption, Props }
