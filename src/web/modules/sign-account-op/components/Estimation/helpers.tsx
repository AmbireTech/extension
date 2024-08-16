import { formatUnits } from 'ethers'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import {
  FeeSpeed,
  SignAccountOpController
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'

import PayOption from './components/PayOption'
import { NO_FEE_OPTIONS } from './consts'
import { FeeOption } from './types'

const sortBasedOnUSDValue = (a: FeePaymentOption, b: FeePaymentOption) => {
  const aPrice = a.token.priceIn?.[0].price
  const bPrice = b.token.priceIn?.[0].price

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
  signAccountOpState: SignAccountOpController
) => {
  const aId = getFeeSpeedIdentifier(
    a,
    signAccountOpState.accountOp.accountAddr,
    signAccountOpState.rbfAccountOps[a.paidBy]
  )
  const aSlow = signAccountOpState.feeSpeeds[aId].find((speed) => speed.type === 'slow')
  if (!aSlow) return -1
  const aCanCoverFee = a.availableAmount >= aSlow.amount

  const bId = getFeeSpeedIdentifier(
    b,
    signAccountOpState.accountOp.accountAddr,
    signAccountOpState.rbfAccountOps[b.paidBy]
  )
  const bSlow = signAccountOpState.feeSpeeds[bId].find((speed) => speed.type === 'slow')
  if (!bSlow) return 1
  const bCanCoverFee = b.availableAmount >= bSlow.amount

  if (aCanCoverFee && !bCanCoverFee) return -1
  if (!aCanCoverFee && bCanCoverFee) return 1
  if (a.token.flags.onGasTank && !b.token.flags.onGasTank) return -1
  if (!a.token.flags.onGasTank && b.token.flags.onGasTank) return 1
  if (a.token.flags.onGasTank && b.token.flags.onGasTank) {
    return sortBasedOnUSDValue(a, b)
  }
  if (!a.token.flags.onGasTank && !b.token.flags.onGasTank) {
    return sortBasedOnUSDValue(a, b)
  }
  return 0
}

const mapFeeOptions = (
  feeOption: FeePaymentOption,
  signAccountOpState: SignAccountOpController
) => {
  const gasTankKey = feeOption.token.flags.onGasTank ? 'gasTank' : ''

  const id = getFeeSpeedIdentifier(
    feeOption,
    signAccountOpState.accountOp.accountAddr,
    signAccountOpState.rbfAccountOps[feeOption.paidBy]
  )
  const speedCoverage: FeeSpeed[] = []
  signAccountOpState.feeSpeeds[id].forEach((speed) => {
    if (feeOption.availableAmount >= speed.amount) speedCoverage.push(speed.type)
  })

  const isDisabled = !speedCoverage.includes(FeeSpeed.Slow)
  const disabledReason = isDisabled ? 'Insufficient amount' : undefined

  return {
    value:
      feeOption.paidBy +
      feeOption.token.address +
      feeOption.token.symbol.toLowerCase() +
      gasTankKey,
    label: <PayOption feeOption={feeOption} disabledReason={disabledReason} />,
    paidBy: feeOption.paidBy,
    token: feeOption.token,
    disabled: isDisabled,
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

  return NO_FEE_OPTIONS as FeeOption
}

export { sortFeeOptions, mapFeeOptions, getDefaultFeeOption }
