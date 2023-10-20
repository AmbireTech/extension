// TODO: fill in the missing types
import { Bundle } from 'adex-protocol-eth/js'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import { useCallback } from 'react'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import useRelayerData from '@common/hooks/useRelayerData'
import useRequests from '@common/hooks/useRequests'
import useToast from '@common/hooks/useToast'

// 10% in geth and most EVM chain RPCs; relayer wants 12%
const RBF_THRESHOLD = 1.14

const relayerURL = CONFIG.RELAYER_URL

const useTransactions = () => {
  const { addToast } = useToast()
  const { selectedAcc } = useAccounts()
  const { setSendTxnState, showSendTxns } = useRequests()
  const { network }: any = useNetwork()
  const { addRequest } = useRequests()
  const { cacheBreak } = useCacheBreak({
    breakPoint: 5000,
    refreshInterval: 10000
  })

  const showSendTxnsForReplacement = useCallback(
    (bundle) => {
      bundle.txns.slice(0, -1).forEach((txn: any, index: any) => {
        addRequest({
          id: `replace_${index}`,
          dateAdded: new Date().valueOf(),
          chainId: network.chainId,
          account: selectedAcc,
          type: 'eth_sendTransaction',
          txn: {
            to: txn[0].toLowerCase(),
            value: txn[1] === '0x' ? '0x0' : txn[1],
            data: txn[2]
          }
        })
      })
      setSendTxnState({ showing: true, replaceByDefault: true, mustReplaceNonce: bundle.nonce })
    },
    [addRequest, network, selectedAcc, setSendTxnState]
  )

  const url = CONFIG.RELAYER_URL
    ? `${CONFIG.RELAYER_URL}/identity/${selectedAcc}/${network.id}/transactions?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading, forceRefresh } = useRelayerData({ url })
  const urlGetFeeAssets = CONFIG.RELAYER_URL
    ? `${CONFIG.RELAYER_URL}/gas-tank/assets?cacheBreak=${cacheBreak}`
    : null
  const { data: feeAssets } = useRelayerData({ url: urlGetFeeAssets })

  // @TODO: visualize other pending bundles
  const allPending = data && data.txns.filter((x: any) => !x.executed && !x.replaced)
  const firstPending = allPending && allPending[0]

  // Removed fee txn if Gas tank is not used for payment method
  const removeFeeTxnFromBundleIfGasTankDisabled = (bundle: any) =>
    !bundle.gasTankFee ? { ...bundle, txns: bundle.txns.slice(0, -1) } : bundle

  const mapToBundle = (relayerBundle: any, extra = {}) =>
    new Bundle({
      ...relayerBundle,
      nonce: relayerBundle.nonce.num,
      gasLimit: null,
      // Instruct the relayer to abide by this minimum fee in USD per gas, to ensure we are truly replacing the txn
      minFeeInUSDPerGas: relayerBundle.feeInUSDPerGas * RBF_THRESHOLD,
      ...extra
    })

  const cancelByReplacing = (relayerBundle: any) =>
    setSendTxnState({
      showing: true,
      replacementBundle: mapToBundle(relayerBundle, {
        txns: [[selectedAcc, '0x0', '0x']]
      }),
      mustReplaceNonce: relayerBundle.nonce.num
    })

  const cancel = (relayerBundle: any) => {
    // @TODO relayerless
    mapToBundle(relayerBundle)
      .cancel({ relayerURL, fetch })
      .then(({ success, message }: any) => {
        if (!success) {
          if (message.includes('not possible to cancel')) {
            addToast(
              'Transaction already picked up by the network, you will need to pay a fee to replace it with a cancellation transaction.'
            )
          } else {
            addToast(
              `Not possible to cancel: ${message}, you will need to pay a fee to replace it with a cancellation transaction.`
            )
          }
          cancelByReplacing(relayerBundle)
        } else {
          addToast('Transaction cancelled successfully')
        }
      })
      .catch((e: any) => {
        console.error(e)
        cancelByReplacing(relayerBundle)
      })
  }

  // @TODO: we are currently assuming the last txn is a fee; change that (detect it)
  const speedup = (relayerBundle: any) =>
    setSendTxnState({
      showing: true,
      replacementBundle: mapToBundle(removeFeeTxnFromBundleIfGasTankDisabled(relayerBundle)),
      mustReplaceNonce: relayerBundle.nonce.num
    })

  const replace = (relayerBundle: any) =>
    showSendTxnsForReplacement(mapToBundle(removeFeeTxnFromBundleIfGasTankDisabled(relayerBundle)))

  return {
    data,
    feeAssets,
    errMsg,
    isLoading,
    firstPending,
    speedup,
    replace,
    cancel,
    showSendTxns,
    forceRefresh
  }
}

export default useTransactions
