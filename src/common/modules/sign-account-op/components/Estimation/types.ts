import { FeeSpeed, ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import { Sponsor } from '@ambire-common/libs/erc7677/types'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { SelectValue } from '@common/components/Select/types'
import { SignAccountOpUpdateType } from '@common/hooks/useCallSignAccountOpMethod/useCallSignAccountOpMethod'

import type { TokenResult } from '@ambire-common/libs/portfolio'
type FeeOption = Pick<SelectValue, 'value' | 'label' | 'disabled'> &
  Pick<FeePaymentOption, 'paidBy'> & {
    token: TokenResult | null
    paidByAccountLabel?: string
  }

/**
 * A fee the transaction pays on top of the network fee, like a bridge's service fee. Shown in the
 * network's coin, with the bridge fee label, unless `token` and `label` say otherwise.
 */
type EstimationServiceFee = NonNullable<SwapAndBridgeRoute['serviceFee']> & {
  token?: TokenResult
  label?: { title: string; tooltip: string }
}

type Props = {
  signAccountOpState: ISignAccountOpController | null
  disabled: boolean
  hasEstimation: boolean
  slowRequest: boolean
  isViewOnly: boolean
  isSponsored: boolean
  sponsor: Sponsor | undefined
  updateType: SignAccountOpUpdateType
  bundlerNonceDiscrepancy?: {
    id: string
    title: string
  }
  serviceFee?: EstimationServiceFee
  withTitle?: boolean
  isOneClick?: boolean
}

type DispatchUpdate = (update: {
  feeToken?: SelectValue['token']
  paidBy?: string
  speed?: FeeSpeed
  shouldPersistSpeed?: boolean
  pendingFeeTokenPreference?: SelectValue['token'] | null
  customGasPrices?: GasSpeeds
  customGasLimit?: bigint
  shouldResetCustomGas?: boolean
}) => void

export type { DispatchUpdate, EstimationServiceFee, FeeOption, Props }
