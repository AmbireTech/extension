import { formatUnits, ZeroAddress } from 'ethers'

import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import formatDateTime from '@common/utils/formatDateTime'

import { DisplayBalanceChange, SubmittedAccountOpLike } from './types'

export const MAX_VISIBLE_BALANCE_CHANGES = 3

export const isNftBalanceChange = (
  change: DisplayBalanceChange
): change is Extract<DisplayBalanceChange, { tokenId: bigint }> => 'tokenId' in change

export const formatBalanceChangeAmount = (change: DisplayBalanceChange) => {
  if (isNftBalanceChange(change)) {
    return `${change.balanceChange < 0n ? '-' : '+'}${
      change.balanceChange < 0n ? -change.balanceChange : change.balanceChange
    }`
  }

  const formattedAmount = formatDecimals(
    parseFloat(
      formatUnits(
        change.balanceChange < 0n ? -change.balanceChange : change.balanceChange,
        change.decimals
      )
    ),
    'amount'
  )

  return `${change.balanceChange < 0n ? '-' : '+'}${formattedAmount}`
}

export const getFullBalanceChangeAmount = (change: DisplayBalanceChange) =>
  isNftBalanceChange(change)
    ? (change.balanceChange < 0n ? -change.balanceChange : change.balanceChange).toString()
    : formatUnits(
        change.balanceChange < 0n ? -change.balanceChange : change.balanceChange,
        change.decimals
      )

export const getBalanceChangeTooltipId = (
  change: DisplayBalanceChange,
  submittedAccountOp: SubmittedAccountOpLike
) =>
  `balance-change-${submittedAccountOp.id}-${change.chainId}-${change.address}-${
    isNftBalanceChange(change) ? change.tokenId.toString() : change.balanceChange.toString()
  }`

export const getFormattedSubmittedDate = (timestamp: number) => formatDateTime(timestamp)

export const getTruncatedTxnHash = (txnId?: string) => {
  if (!txnId) return ''
  if (txnId.length <= 12) return txnId

  return `${txnId.slice(0, 6)}...${txnId.slice(-4)}`
}

export const getTruncatedNetworkName = (name?: string, maxLength = 15) => {
  if (!name) return ''
  if (name.length <= maxLength) return name

  return `${name.slice(0, maxLength)}...`
}

export const getModalFinalStatus = (status?: AccountOpStatus) => {
  switch (status) {
    case AccountOpStatus.UnknownButPastNonce:
      return { label: 'Replaced by fee (RBF)', appearance: 'errorText' as const }
    case AccountOpStatus.BroadcastButStuck:
      return { label: 'The transaction could not be found', appearance: 'errorText' as const }
    case AccountOpStatus.Rejected:
      return { label: 'Failed to send', appearance: 'errorText' as const }
    case AccountOpStatus.PartiallyComplete:
      return { label: 'Partially completed', appearance: 'warningText' as const }
    case AccountOpStatus.Failure:
      return { label: 'Failed', appearance: 'errorText' as const }
    case AccountOpStatus.Success:
      return { label: 'Confirmed', appearance: 'successText' as const }
    case AccountOpStatus.BroadcastedButNotConfirmed:
      return { label: 'The transaction is pending', appearance: 'warningText' as const }
    default:
      return null
  }
}

export const getOrderedBalanceChanges = (submittedAccountOp: SubmittedAccountOpLike) => {
  const balanceChanges: DisplayBalanceChange[] = [
    ...(submittedAccountOp.balanceChanges || []),
    ...(submittedAccountOp.nftBalanceChanges || [])
  ]
  const positiveChanges = balanceChanges.filter((change) => change.balanceChange > 0n)
  const negativeChanges = balanceChanges.filter((change) => change.balanceChange < 0n)
  const nativeNegativeChanges = negativeChanges.filter(
    (change) => change.address.toLowerCase() === ZeroAddress.toLowerCase()
  )
  const nonNativeNegativeChanges = negativeChanges.filter(
    (change) => change.address.toLowerCase() !== ZeroAddress.toLowerCase()
  )

  return [...positiveChanges, ...nonNativeNegativeChanges, ...nativeNegativeChanges]
}

export const getSyntheticGasTankBalanceChange = (
  submittedAccountOp: SubmittedAccountOpLike
): Exclude<DisplayBalanceChange, { tokenId: bigint }> | null => {
  const gasFeePayment = submittedAccountOp.gasFeePayment

  if (!gasFeePayment?.isGasTank || gasFeePayment.amount <= 0n) return null

  return {
    symbol: 'Gas Tank',
    name: 'Gas Tank',
    decimals: 6,
    address: 'gas-tank',
    chainId: gasFeePayment.feeTokenChainId || submittedAccountOp.chainId,
    priceIn: [],
    marketDataIn: [],
    flags: {
      onGasTank: true,
      rewardsType: null,
      canTopUpGasTank: false,
      isFeeToken: true
    },
    amount: 0n,
    amountBefore: 0n,
    amountAfter: 0n,
    balanceChange: -gasFeePayment.amount,
    iconType: 'gasTank'
  }
}

export const getSummaryBalanceChanges = (
  submittedAccountOp: SubmittedAccountOpLike
): DisplayBalanceChange[] => {
  const balanceChanges = getOrderedBalanceChanges(submittedAccountOp)
  const syntheticGasTankBalanceChange = getSyntheticGasTankBalanceChange(submittedAccountOp)

  return syntheticGasTankBalanceChange
    ? [...balanceChanges, syntheticGasTankBalanceChange]
    : balanceChanges
}

export const getVisibleSummaryBalanceChanges = (balanceChanges: DisplayBalanceChange[]) => {
  const gasTankBalanceChange = balanceChanges.find((change) => change.iconType === 'gasTank')

  if (!gasTankBalanceChange || balanceChanges.length <= MAX_VISIBLE_BALANCE_CHANGES) {
    return balanceChanges.slice(0, MAX_VISIBLE_BALANCE_CHANGES)
  }

  return [
    ...balanceChanges
      .filter((change) => change.iconType !== 'gasTank')
      .slice(0, MAX_VISIBLE_BALANCE_CHANGES - 1),
    gasTankBalanceChange
  ]
}

/**
 * A speed up that is still waiting to go through. The Activity shows it in place of the
 * transaction it replaces (see collapseReplacedAccountOps), so its row tells it's speeding up
 */
export const isSpeedingUp = (submittedAccountOp: SubmittedAccountOpLike) =>
  submittedAccountOp.status === AccountOpStatus.BroadcastedButNotConfirmed &&
  !!submittedAccountOp.meta?.speedUp?.enabled

/**
 * How much more a speed up pays than the transaction it replaces, in whole percent.
 * Null when it's unknown or not higher, e.g. when the speed up needs less gas
 */
export const getSpeedUpFeeIncreasePercent = (
  submittedAccountOp: SubmittedAccountOpLike
): number | null => {
  const replacedAmount = submittedAccountOp.meta?.speedUp?.replacedFees?.amount
  const newAmount = submittedAccountOp.gasFeePayment?.amount
  if (replacedAmount === undefined || newAmount === undefined || replacedAmount <= 0n) return null
  if (newAmount <= replacedAmount) return null

  return Math.round(Number(((newAmount - replacedAmount) * 10000n) / replacedAmount) / 100)
}

export const getPresentationalStatus = (
  submittedAccountOp: SubmittedAccountOpLike
): SubmittedAccountOpLike['status'] => {
  if (
    submittedAccountOp.identifiedBy.type !== 'MultipleTxns' ||
    submittedAccountOp.status === AccountOpStatus.BroadcastedButNotConfirmed
  )
    return submittedAccountOp.status

  const callWithoutATxId = submittedAccountOp.calls.find((call) => call.txnId === undefined)
  return !callWithoutATxId ? submittedAccountOp.status : AccountOpStatus.PartiallyComplete
}
