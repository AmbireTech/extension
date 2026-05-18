import { formatUnits, ZeroAddress } from 'ethers'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import formatDateTime from '@common/utils/formatDateTime'

import { DappInteraction, DisplayBalanceChange, SubmittedAccountOpLike } from './types'

export const MAX_VISIBLE_BALANCE_CHANGES = 3

export const formatBalanceChangeAmount = (change: DisplayBalanceChange) => {
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
  formatUnits(
    change.balanceChange < 0n ? -change.balanceChange : change.balanceChange,
    change.decimals
  )

export const getBalanceChangeTooltipId = (
  change: DisplayBalanceChange,
  submittedAccountOp: SubmittedAccountOpLike
) =>
  `balance-change-${submittedAccountOp.id}-${change.chainId}-${change.address}-${change.balanceChange.toString()}`

export const getFormattedSubmittedDate = (timestamp: number) => formatDateTime(timestamp)

export const getTruncatedTxnHash = (txnId?: string) => {
  if (!txnId) return ''
  if (txnId.length <= 12) return txnId

  return `${txnId.slice(0, 6)}...${txnId.slice(-4)}`
}

export const getTruncatedNetworkName = (name?: string) => {
  if (!name) return ''
  if (name.length <= 15) return name

  return `${name.slice(0, 15)}...`
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
  const balanceChanges = submittedAccountOp.balanceChanges || []
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
): DisplayBalanceChange | null => {
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

export const getHumanizedCalls = (submittedAccountOp: SubmittedAccountOpLike): IrCall[] => {
  const accountOp: AccountOp = {
    id: submittedAccountOp.id,
    accountAddr: submittedAccountOp.accountAddr,
    chainId: submittedAccountOp.chainId,
    signingKeyAddr: submittedAccountOp.signingKeyAddr ?? null,
    signingKeyType: submittedAccountOp.signingKeyType ?? null,
    nonce: submittedAccountOp.nonce ?? null,
    eoaNonce: submittedAccountOp.eoaNonce,
    calls: submittedAccountOp.calls,
    feeCall: submittedAccountOp.feeCall,
    activatorCall: submittedAccountOp.activatorCall,
    gasLimit: submittedAccountOp.gasLimit ?? null,
    signature: submittedAccountOp.signature ?? null,
    gasFeePayment: submittedAccountOp.gasFeePayment,
    txnId: submittedAccountOp.txnId,
    status: submittedAccountOp.status,
    asUserOperation: submittedAccountOp.asUserOperation,
    signers: submittedAccountOp.signers,
    signed: submittedAccountOp.signed,
    safeTx: submittedAccountOp.safeTx,
    meta: submittedAccountOp.meta,
    flags: submittedAccountOp.flags
  }

  return humanizeAccountOp(accountOp).map((call, index) => ({
    ...call,
    id: call.id || String(index)
  }))
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

export const getDappInteractions = (
  submittedAccountOp: SubmittedAccountOpLike
): DappInteraction[] => {
  const interactions: DappInteraction[] = []
  const seen = new Set<string>()
  const humanizedCalls = getHumanizedCalls(submittedAccountOp)
  const sendAddresses = Array.from(
    new Set(
      humanizedCalls.flatMap((call) => {
        if (call.fullVisualization?.[0]?.content !== 'Send') return []

        return call.fullVisualization.flatMap((item) =>
          item.type === 'address' && item.address ? [item.address] : []
        )
      })
    )
  )

  const addInteraction = (interaction: DappInteraction) => {
    if (seen.has(interaction.id)) return
    seen.add(interaction.id)
    interactions.push(interaction)
  }

  submittedAccountOp.calls.forEach((call) => {
    const dapp = call.dapp as Dapp | undefined
    if (!dapp?.name) return

    addInteraction({
      id: `dapp:${dapp.id || `${dapp.name}-${dapp.url || ''}`}`,
      name: dapp.name.charAt(0).toUpperCase() + dapp.name.slice(1).toLowerCase(), // capitalize
      iconUrl: dapp.icon
    })
  })

  const isSwap = !!submittedAccountOp.meta?.swapTxn
  if (isSwap) {
    addInteraction({
      id: 'fallback:swap',
      name: 'Swap/Bridge',
      iconType: 'swap'
    })
  }

  const fuelsGasTank = humanizedCalls.some(
    (call) => call.fullVisualization?.[0]?.content === 'Fuel gas tank with'
  )
  if (fuelsGasTank) {
    addInteraction({
      id: 'fallback:gasTank',
      name: 'Fuel gas tank',
      iconType: 'ambire'
    })
  }

  if (submittedAccountOp.meta && 'setDelegation' in submittedAccountOp.meta) {
    if (submittedAccountOp.meta.setDelegation === false) {
      addInteraction({
        id: 'fallback:revoke',
        name: 'Revoke delegation',
        iconType: 'ambire'
      })
    } else {
      addInteraction({
        id: 'fallback:delegation',
        name: 'Enable smart settings',
        iconType: 'ambire'
      })
    }
  }

  if (!interactions.length) {
    if (submittedAccountOp.activitySource === 'external') {
      addInteraction({
        id: 'fallback:receive',
        name: 'Receive',
        iconType: 'receive'
      })
    } else {
      addInteraction({
        id: 'fallback:send',
        name: 'Send',
        iconType: 'send',
        address: sendAddresses.length === 1 ? sendAddresses[0] : undefined,
        description: sendAddresses.length > 1 ? 'multiple addresses' : undefined
      })
    }
  }

  return interactions
}
