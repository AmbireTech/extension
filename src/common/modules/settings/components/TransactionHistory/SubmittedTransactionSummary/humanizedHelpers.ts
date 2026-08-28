import { useEffect, useMemo, useState } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { isSafeRejectionCall } from '@ambire-common/libs/accountOp/accountOp'
import { submittedAccountOpToAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import type { Erc7730CallDescriptors } from '@ambire-common/libs/humanizer/erc7730/types'
import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { flattenHumanizerVisualizations } from '@ambire-common/libs/humanizer/utils'
import useController from '@common/hooks/useController'

import { DappInteraction, SubmittedAccountOpLike } from './types'

export const getHumanizedCalls = (submittedAccountOp: SubmittedAccountOpLike): IrCall[] => {
  const accountOp = submittedAccountOpToAccountOp(submittedAccountOp)

  return humanizeAccountOp(accountOp).map((call, index) => ({
    ...call,
    id: call.id || String(index)
  }))
}

/**
 * Renders the plain humanization immediately, then upgrades it in place once `Erc7730Controller`
 * resolves the "clear signing" descriptors, so a past transaction reads the same way it did while
 * being signed. Any failure (unreachable relayer, no descriptor for these calls) simply leaves the
 * plain humanization on screen.
 */
export const useHumanizedCalls = (submittedAccountOp: SubmittedAccountOpLike): IrCall[] => {
  const { dispatchAndWait } = useController('Erc7730Controller')
  const fallbackCalls = useMemo(() => getHumanizedCalls(submittedAccountOp), [submittedAccountOp])
  const [erc7730Calls, setErc7730Calls] = useState<IrCall[] | null>(null)

  useEffect(() => {
    let isStale = false
    const accountOp = submittedAccountOpToAccountOp(submittedAccountOp)

    dispatchAndWait<'resolveDescriptorsForAccountOp', Erc7730CallDescriptors>({
      type: 'method',
      params: { method: 'resolveDescriptorsForAccountOp', args: [accountOp] }
    })
      .then((erc7730Descriptors) => {
        if (isStale || !erc7730Descriptors || !Object.keys(erc7730Descriptors).length) return

        setErc7730Calls(
          humanizeAccountOp(accountOp, { erc7730Descriptors }).map((call, index) => ({
            ...call,
            id: call.id || String(index)
          }))
        )
      })
      .catch(() => null)

    return () => {
      isStale = true
      setErc7730Calls(null)
    }
  }, [submittedAccountOp, dispatchAndWait])

  return erc7730Calls ?? fallbackCalls
}

export const getDappInteractionsFromHumanizedCalls = (
  submittedAccountOp: SubmittedAccountOpLike,
  humanizedCalls: IrCall[]
): DappInteraction[] => {
  if (isSafeRejectionCall(submittedAccountOp.calls, submittedAccountOp.accountAddr)) {
    const safeNonce = submittedAccountOp.safeTx?.nonce ?? submittedAccountOp.nonce

    return [
      {
        id: 'fallback:cancel',
        name: 'Cancel',
        iconType: 'safe',
        ...(safeNonce !== null && safeNonce !== undefined && { safeNonce: BigInt(safeNonce) })
      }
    ]
  }

  const interactions: DappInteraction[] = []
  const seen = new Set<string>()
  const sendAddresses = Array.from(
    new Set(
      humanizedCalls.flatMap((call) => {
        const firstVisualization = call.fullVisualization?.[0]
        const isSend =
          firstVisualization?.type === 'erc7730'
            ? firstVisualization.intent[0]?.content === 'Send'
            : firstVisualization?.content === 'Send'
        if (!isSend) return []

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

export const useDappInteractions = (
  submittedAccountOp: SubmittedAccountOpLike
): DappInteraction[] => {
  const humanizedCalls = useHumanizedCalls(submittedAccountOp)

  return useMemo(
    () => getDappInteractionsFromHumanizedCalls(submittedAccountOp, humanizedCalls),
    [submittedAccountOp, humanizedCalls]
  )
}
