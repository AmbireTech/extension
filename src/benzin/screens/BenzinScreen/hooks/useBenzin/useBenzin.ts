import { JsonRpcProvider } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking } from 'react-native'

import { BUNDLER } from '@ambire-common/consts/bundlers'
import {
  AccountOpIdentifiedBy,
  SubmittedAccountOp
} from '@ambire-common/libs/accountOp/submittedAccountOp'
import { relayerCall } from '@ambire-common/libs/relayerCall/relayerCall'
import { BundlerSwitcher } from '@ambire-common/services/bundlers/bundlerSwitcher'
import { getRpcProvider } from '@ambire-common/services/provider'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import useSteps from '@benzin/screens/BenzinScreen/hooks/useSteps'
import { ActiveStepType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import { setStringAsync } from '@common/utils/clipboard'
import { RELAYER_URL } from '@env'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

const fetch = window.fetch.bind(window) as any
const standardOptions = {
  fetch,
  callRelayer: relayerCall.bind({ url: RELAYER_URL, fetch })
}

interface Props {
  onOpenExplorer?: () => void
  extensionAccOp?: SubmittedAccountOp
}

const getParams = (search?: string) => {
  const params = new URLSearchParams(search)

  return {
    txnId: params.get('txnId') ?? null,
    userOpHash: params.get('userOpHash') ?? null,
    relayerId: params.get('relayerId') ?? null,
    isRenderedInternally: typeof params.get('isInternal') === 'string',
    chainId: params.get('chainId'),
    bundler: params.get('bundler') ?? null
  }
}

const useBenzin = ({ onOpenExplorer, extensionAccOp }: Props = {}) => {
  const { addToast } = useToast()
  const route = useRoute()
  const { txnId, userOpHash, relayerId, isRenderedInternally, chainId, bundler } = getParams(
    route?.search
  )

  const { networks } = useNetworksControllerState()
  const {
    benzinNetworks,
    loadingBenzinNetworks = [],
    addNetwork,
    notFoundNetworks
  } = useBenzinNetworksContext()
  const bigintChainId = BigInt(chainId || '') || 0n
  const actualNetworks = networks ?? benzinNetworks
  const areRelayerNetworksLoaded = actualNetworks && actualNetworks.length
  const isNetworkLoading = loadingBenzinNetworks.includes(bigintChainId)
  const [activeStep, setActiveStep] = useState<ActiveStepType>('signed')
  const isInitialized =
    !isNetworkLoading && areRelayerNetworksLoaded && (!!extensionAccOp || activeStep !== 'signed')

  const network = useMemo(() => {
    return actualNetworks.find((n) => n.chainId === bigintChainId) || null
  }, [actualNetworks, bigintChainId])

  const provider = useMemo(() => {
    if (!network || bigintChainId === 0n) return null
    // We are using ethers 6.14 in the app, while ambire-common is on 6.8. This causes ts errors
    // TODO: Implement the callProvider func to use the global provider once the refactor is complete and
    // all controllers from the MainController are shared across Benzin, Legends, Extension, and Mobile
    return getRpcProvider(
      network.rpcUrls,
      bigintChainId,
      network.selectedRpcUrl
    ) as unknown as JsonRpcProvider
  }, [network, bigintChainId])

  const switcher = useMemo(() => {
    if (!network) return null
    return new BundlerSwitcher(
      network,
      () => {
        return false
      },
      {
        canDelegate: false,
        preferredBundler: (bundler as BUNDLER) ?? undefined
      }
    )
  }, [network, bundler])

  const stepsState = useSteps({
    txnId,
    userOpHash,
    relayerId,
    network,
    standardOptions,
    setActiveStep,
    provider,
    switcher,
    extensionAccOp,
    networks: actualNetworks
  })

  const getIdentifiedBy = useCallback((): AccountOpIdentifiedBy => {
    if (relayerId) return { type: 'Relayer', identifier: relayerId }
    if (userOpHash)
      return {
        type: 'UserOperation',
        identifier: userOpHash,
        bundler: switcher ? switcher.getBundler().getName() : undefined
      }
    return { type: 'Transaction', identifier: txnId as string }
  }, [relayerId, userOpHash, switcher, txnId])

  useEffect(() => {
    if (areRelayerNetworksLoaded && !network && bigintChainId) {
      addNetwork(bigintChainId)
    }
  }, [bigintChainId, network, isNetworkLoading, addNetwork, areRelayerNetworksLoaded])

  const handleCopyText = useCallback(async () => {
    try {
      let address = window.location.href

      if (chainId) {
        address = `https://explorer.ambire.com/${getBenzinUrlParams({
          chainId,
          txnId: stepsState.txnId,
          identifiedBy: getIdentifiedBy()
        })}`
      }

      await setStringAsync(address)
    } catch {
      addToast('Error copying to clipboard', { type: 'error' })
    }
    addToast('Copied to clipboard!')
  }, [addToast, chainId, stepsState.txnId, getIdentifiedBy])

  const handleOpenExplorer = useCallback(async () => {
    if (!network?.explorerUrl) return

    const link = stepsState.txnId
      ? `${network.explorerUrl}/tx/${stepsState.txnId}`
      : `https://jiffyscan.xyz/userOpHash/${userOpHash}?network=${network.name.toLowerCase()}`

    try {
      await Linking.openURL(link)
    } catch {
      addToast('Error opening explorer', { type: 'error' })
    }
    onOpenExplorer && onOpenExplorer()
  }, [network, userOpHash, stepsState.txnId, onOpenExplorer, addToast])

  const showCopyBtn = useMemo(() => {
    if (!network) return false
    if (extensionAccOp && extensionAccOp.identifiedBy?.type === 'MultipleTxns') return false

    const isRejected = stepsState.finalizedStatus?.status === 'rejected'
    return !isRejected
  }, [network, stepsState.finalizedStatus?.status, extensionAccOp])

  const showOpenExplorerBtn = useMemo(() => {
    if (!network) return false
    // do not show the button until a txId is confirmed
    if (!stepsState.txnId) return false

    const isRejected = stepsState.finalizedStatus?.status === 'rejected'
    return !isRejected
  }, [network, stepsState.finalizedStatus?.status, stepsState.txnId])

  if (!chainId || (!txnId && !userOpHash && !relayerId)) return null

  return {
    activeStep,
    handleCopyText,
    handleOpenExplorer,
    stepsState,
    network,
    txnId: stepsState.txnId,
    userOpHash,
    isRenderedInternally,
    bigintChainId,
    showCopyBtn,
    showOpenExplorerBtn,
    isInitialized,
    isNetworkNotFound: notFoundNetworks.includes(bigintChainId)
  }
}

export default useBenzin
