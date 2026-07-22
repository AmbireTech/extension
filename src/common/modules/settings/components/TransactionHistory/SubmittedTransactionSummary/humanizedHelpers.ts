import { Dapp } from '@ambire-common/interfaces/dapp'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import {
  flattenHumanizerVisualizations,
  hasErc7730Humanization
} from '@ambire-common/libs/humanizer/utils'

import { DappInteraction, SubmittedAccountOpLike } from './types'

export const getHumanizedCalls = (submittedAccountOp: SubmittedAccountOpLike): IrCall[] => {
  const clearSigningHum = submittedAccountOp.meta?.clearSigningHumanization
  const clearSign = hasErc7730Humanization(clearSigningHum) ? clearSigningHum : null
  if (clearSign) {
    return clearSign.map((call, index) => ({
      ...call,
      id: call.id || String(index)
    }))
  }

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

export const getDappInteractions = (
  submittedAccountOp: SubmittedAccountOpLike
): DappInteraction[] => {
  const interactions: DappInteraction[] = []
  const seen = new Set<string>()
  const humanizedCalls = getHumanizedCalls(submittedAccountOp)
  const sendAddresses = Array.from(
    new Set(
      humanizedCalls.flatMap((call) => {
        const firstVisualization = call.fullVisualization?.[0]
        const isSend =
          firstVisualization?.type === 'erc7730'
            ? firstVisualization.title === 'Send'
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
