import { formatUnits } from 'ethers'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'

import PayOption from './components/PayOption'
import { NO_FEE_OPTIONS } from './consts'
import { FeeOption } from './types'

const sortBasedOnUSDValue = (a: FeePaymentOption, b: FeePaymentOption) => {
  if (!a || !b) return 0

  const aPrice = a.token?.priceIn?.[0]?.price
  const bPrice = b.token?.priceIn?.[0]?.price

  if (!aPrice || !bPrice) return 0
  const aBalance = formatUnits(a.availableAmount, a.token.decimals)
  const bBalance = formatUnits(b.availableAmount, b.token.decimals)
  const aValue = parseFloat(aBalance) * aPrice
  const bValue = parseFloat(bBalance) * bPrice

  if (aValue > bValue) return -1
  if (aValue < bValue) return 1
  return 0
}

/**
 * Sorts fee options by the following criteria:
 * - Gas tank options first
 * - USD value
 */
const sortFeeOptions = (
  a: FeePaymentOption,
  b: FeePaymentOption,
  signAccountOpState: ISignAccountOpController
) => {
  const aId = getFeeSpeedIdentifier(a, signAccountOpState.accountOp.accountAddr)
  const aSlow = signAccountOpState.feeSpeeds[aId]?.find((speed) => speed.type === 'slow')
  if (!aSlow) return 1
  const aCanCoverFee = a.availableAmount >= aSlow.amount

  const bId = getFeeSpeedIdentifier(b, signAccountOpState.accountOp.accountAddr)
  const bSlow = signAccountOpState.feeSpeeds[bId]?.find((speed) => speed.type === 'slow')
  if (!bSlow) return -1
  const bCanCoverFee = b.availableAmount >= bSlow.amount

  if (aCanCoverFee && !bCanCoverFee) return -1
  if (!aCanCoverFee && bCanCoverFee) return 1
  if (!signAccountOpState) sortBasedOnUSDValue(a, b)

  // gas tank first
  if (a.token.flags.onGasTank && !b.token.flags.onGasTank) return -1
  if (!a.token.flags.onGasTank && b.token.flags.onGasTank) return 1

  // native second
  if (a.token.address === ZERO_ADDRESS && b.token.address !== ZERO_ADDRESS) return -1
  if (a.token.address !== ZERO_ADDRESS && b.token.address === ZERO_ADDRESS) return 1

  // based on value after
  return sortBasedOnUSDValue(a, b)
}

const mapFeeOptions = (
  feeOption: FeePaymentOption,
  signAccountOpState: ISignAccountOpController
) => {
  let disabledReason: string | undefined
  let disabledTextAppearance: 'errorText' | 'infoText' | undefined

  const gasTankKey = feeOption.token.flags.onGasTank ? 'gasTank' : ''
  const speedCoverage: FeeSpeed[] = []
  const id = getFeeSpeedIdentifier(feeOption, signAccountOpState.accountOp.accountAddr)

  signAccountOpState.feeSpeeds[id]?.forEach((speed) => {
    if (feeOption.availableAmount >= speed.amount) speedCoverage.push(speed.type)
  })

  const feeSpeed = signAccountOpState.feeSpeeds[id]?.find(
    (speed) => speed.type === signAccountOpState.selectedFeeSpeed
  )
  const feeSpeedAmount = feeSpeed?.amount || 0n
  const feeSpeedUsd = feeSpeed?.amountUsd || '0'

  if (!speedCoverage.includes(FeeSpeed.Slow)) {
    if (!feeOption.token.priceIn.length) {
      disabledReason = 'No price data'
    } else {
      disabledReason = 'Insufficient amount'
    }
  }

  // TODO: TBD, should we refactor and move `disabledReason` logic together with `speedCoverage` into controller.
  // Note: `accountKeyStoreKeys` can simultaneously store hardware keys and hot wallet keys.
  // In this case, the `isExternal` check will still resolve to `true`, and we will disable ERC-20 fee options.
  // We decided to leave it as is, since it's rare to import both a hardware wallet and its seed phrase as a hot wallet.
  // Additionally, we expect hardware wallets to support EIP-7702 soon, so we prefer not to complicate the UX.
  const isExternal = signAccountOpState.accountKeyStoreKeys.find(
    (keyStoreKey) => keyStoreKey.addr === feeOption.paidBy && keyStoreKey.isExternallyStored
  )
  const canNotBecomeSmarter = !canBecomeSmarter(
    signAccountOpState.account,
    signAccountOpState.accountKeyStoreKeys
  )

  if (isExternal && canNotBecomeSmarter && feeOption.token.address !== ZERO_ADDRESS) {
    disabledReason = 'Coming soon for more hardware wallets'
    disabledTextAppearance = 'infoText'
  }

  return {
    value:
      feeOption.paidBy +
      feeOption.token.address +
      feeOption.token.symbol.toLowerCase() +
      gasTankKey,
    label: (
      <PayOption
        amount={feeSpeedAmount}
        amountUsd={feeSpeedUsd}
        feeOption={feeOption}
        disabledReason={disabledReason}
        disabledTextAppearance={disabledTextAppearance}
      />
    ),
    paidBy: feeOption.paidBy,
    token: feeOption.token,
    disabled: !!disabledReason,
    speedCoverage
  }
}

const getDefaultFeeOption = (
  payOptionsPaidByUsOrGasTank: FeeOption[],
  payOptionsPaidByEOA: FeeOption[]
) => {
  if (payOptionsPaidByUsOrGasTank.length > 0 && !payOptionsPaidByUsOrGasTank[0].disabled)
    return payOptionsPaidByUsOrGasTank[0]

  if (payOptionsPaidByEOA.length > 0 && !payOptionsPaidByEOA[0].disabled)
    return payOptionsPaidByEOA[0]

  // if there's nothing to cover the fee, select a disabled option
  if (payOptionsPaidByUsOrGasTank.length) return payOptionsPaidByUsOrGasTank[0]
  if (payOptionsPaidByEOA.length) return payOptionsPaidByEOA[0]

  return NO_FEE_OPTIONS as FeeOption
}

export { getDefaultFeeOption, mapFeeOptions, sortFeeOptions }
