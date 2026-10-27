import { WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { isSafeRejectionCall } from '@ambire-common/libs/accountOp/accountOp'
import { getCancelledNonce, isCancelAccountOp } from '@ambire-common/libs/accountOp/cancel'
import { submittedAccountOpToAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { flattenHumanizerVisualizations } from '@ambire-common/libs/humanizer/utils'

import { DappInteraction, SubmittedAccountOpLike } from './types'

import type { HumanizerVisualization, IrCall } from '@ambire-common/libs/humanizer/interfaces'
const WALLET_STAKING_ACTIVITY_MATCHES = [
  {
    action: 'Wrap',
    tokenAddress: WALLET_STAKING_ADDR,
    interaction: {
      id: 'fallback:migrateXWallet',
      name: 'Migrate xWALLET',
      iconType: 'walletStaking'
    }
  },
  {
    action: 'Stake and wrap',
    tokenAddress: WALLET_TOKEN,
    interaction: {
      id: 'fallback:stakeWallet',
      name: 'Stake WALLET',
      iconType: 'walletStaking'
    }
  }
] as const

const getWalletStakingInteraction = (humanizedCalls: IrCall[]): DappInteraction | null => {
  for (const match of WALLET_STAKING_ACTIVITY_MATCHES) {
    const hasMatch = humanizedCalls.some((call) => {
      const visualizations = flattenHumanizerVisualizations(call.fullVisualization)
      const hasAction = visualizations.some(
        ({ type, content }) => type === 'action' && content === match.action
      )
      const hasToken = visualizations.some(
        ({ type, address }) =>
          type === 'token' && address.toLowerCase() === match.tokenAddress.toLowerCase()
      )

      return hasAction && hasToken
    })

    if (hasMatch) return match.interaction
  }

  return null
}

export const getHumanizedCalls = (submittedAccountOp: SubmittedAccountOpLike): IrCall[] => {
  const accountOp = submittedAccountOpToAccountOp(submittedAccountOp)

  return humanizeAccountOp(accountOp).map((call, index) => ({
    ...call,
    id: call.id || String(index)
  }))
}

// The verbs a call's intent uses for a plain outgoing transfer. Both are matched because an
// ERC-7730 descriptor may word it either way, and an interpolated intent leads with the template's
// own verb rather than with the descriptor's plain `intent`.
const SEND_INTENT_WORDS = ['send', 'transfer']

const isSendVisualization = (visualization?: HumanizerVisualization): boolean => {
  if (!visualization) return false

  const intentText =
    visualization.type === 'erc7730' ? visualization.intent[0]?.content : visualization.content

  return !!intentText && SEND_INTENT_WORDS.includes(intentText.trim().toLowerCase())
}

export const getDappInteractionsFromHumanizedCalls = (
  submittedAccountOp: SubmittedAccountOpLike,
  humanizedCalls: IrCall[]
): DappInteraction[] => {
  if (submittedAccountOp.meta?.isSafeDeploy) {
    return [
      {
        id: 'fallback:safeDeploy',
        name: 'Activate Safe account',
        iconType: 'safe'
      }
    ]
  }

  // Must come before the Safe cancellation check: a delegation change is also an empty,
  // 0-value call and would otherwise be mistaken for a cancellation
  if (submittedAccountOp.meta && 'setDelegation' in submittedAccountOp.meta) {
    return [
      submittedAccountOp.meta.setDelegation === false
        ? { id: 'fallback:revoke', name: 'Revoke delegation', iconType: 'ambire' }
        : { id: 'fallback:delegation', name: 'Enable smart settings', iconType: 'ambire' }
    ]
  }

  // A cancel of a pending transaction, by any account. Must come before the Safe check, as its
  // empty call also looks like a Safe rejection, but the nonce it cancels may not be the
  // account's own nonce (e.g. a 7702 EOA cancels by its transaction count)
  if (isCancelAccountOp(submittedAccountOp)) {
    const cancelledNonce = getCancelledNonce(submittedAccountOp)
    // Only a Safe collects the signatures of its owners
    const isSafeCancel = !!submittedAccountOp.signed?.length

    return [
      {
        id: 'fallback:cancel',
        name: 'Cancel',
        iconType: isSafeCancel ? 'safe' : 'ambire',
        ...(cancelledNonce !== null && { nonce: cancelledNonce })
      }
    ]
  }

  if (isSafeRejectionCall(submittedAccountOp.calls, submittedAccountOp.accountAddr)) {
    const safeNonce = submittedAccountOp.safeTx?.nonce ?? submittedAccountOp.nonce

    return [
      {
        id: 'fallback:cancel',
        name: 'Cancel',
        iconType: 'safe',
        ...(safeNonce !== null && safeNonce !== undefined && { nonce: BigInt(safeNonce) })
      }
    ]
  }

  const interactions: DappInteraction[] = []
  const seen = new Set<string>()
  const walletStakingInteraction = getWalletStakingInteraction(humanizedCalls)
  if (walletStakingInteraction) return [walletStakingInteraction]

  const sendAddresses = Array.from(
    new Set(
      humanizedCalls.flatMap((call) => {
        if (!isSendVisualization(call.fullVisualization?.[0])) return []

        return flattenHumanizerVisualizations(call.fullVisualization).flatMap((item) =>
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

  const gasTankHumanization = humanizedCalls.find(
    (call) => call.fullVisualization?.[0]?.content === 'Fuel gas tank with'
  )
  if (gasTankHumanization) {
    const gasTankToken = gasTankHumanization.fullVisualization?.[1]

    addInteraction({
      id: 'fallback:gasTank',
      name: 'Fuel gas tank',
      iconType: 'ambire',
      ...(gasTankToken?.type === 'token'
        ? { token: gasTankToken.address, amount: gasTankToken.value }
        : {})
    })
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
