import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { getFeatures } from '@ambire-common/libs/networks/networks'
import useController from '@common/hooks/useController'
import validateRequestParams from '@common/modules/action-requests/utils/validateRequestParams'

const useAddOrUpdateNetwork = () => {
  const { t } = useTranslation()
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const {
    state: { statuses, networkToAddOrUpdate, disabledNetworks, networks },
    dispatch: networksDispatch
  } = useController('NetworksController')

  const [features, setFeatures] = useState<NetworkFeature[]>(getFeatures(undefined, undefined))
  const [rpcUrlIndex, setRpcUrlIndex] = useState<number>(0)
  const [existingNetwork, setExistingNetwork] = useState<Network | null | undefined>(undefined)
  const actionButtonPressedRef = useRef(false)
  const [successStateText, setSuccessStateText] = useState<string>(
    t('already added to your wallet.')
  )

  const userRequest = useMemo(() => {
    if (!currentUserRequest) return undefined
    if (currentUserRequest.kind !== 'walletAddEthereumChain') return undefined

    return currentUserRequest
  }, [currentUserRequest])

  const requestData = useMemo(() => userRequest?.meta?.params?.[0], [userRequest])

  const requestKind = useMemo(() => userRequest?.kind, [userRequest?.kind])

  const areParamsValid = useMemo(
    () => validateRequestParams(requestKind, requestData),
    [requestData, requestKind]
  )

  const networkAlreadyAdded = useMemo(
    () =>
      networks.find(
        (network) => requestData?.chainId && network.chainId === BigInt(requestData.chainId)
      ) || null,
    [networks, requestData?.chainId]
  )

  // existingNetwork must be set in a useEffect and can't be a useMemo. That is because we must
  // set its value only once and never change it. Otherwise the screen rerenders when a network is
  // added/enabled with the wrong state.
  useEffect(() => {
    if (existingNetwork || existingNetwork === null || !requestData?.chainId) return
    const matchingNetwork =
      disabledNetworks.find((network) => network.chainId === BigInt(requestData.chainId)) || null

    setExistingNetwork(matchingNetwork)
  }, [disabledNetworks, existingNetwork, requestData?.chainId])

  const rpcUrls: string[] = useMemo(() => {
    if (existingNetwork) return existingNetwork.rpcUrls
    if (!requestData || !requestData?.rpcUrls) return []

    return requestData.rpcUrls.filter((url: string) => !!url && url.startsWith('http'))
  }, [requestData, existingNetwork])

  const networkDetails: AddNetworkRequestParams | undefined = useMemo(() => {
    if (!areParamsValid || !requestData) return undefined

    if (!requestData.rpcUrls) return
    if (existingNetwork) {
      return {
        ...existingNetwork,
        iconUrls: existingNetwork.iconUrls || requestData.iconUrls || []
      }
    }

    const name = requestData.chainName
    const nativeAssetSymbol = requestData.nativeCurrency?.symbol
    const nativeAssetName = requestData.nativeCurrency?.name

    try {
      return {
        name,
        rpcUrls,
        selectedRpcUrl: rpcUrls[rpcUrlIndex]!,
        chainId: BigInt(requestData.chainId),
        nativeAssetSymbol,
        nativeAssetName,
        explorerUrl: requestData.blockExplorerUrls?.[0],
        iconUrls: requestData.iconUrls || []
      }
    } catch (error) {
      console.error(error)
      return undefined
    }
  }, [areParamsValid, requestData, existingNetwork, rpcUrls, rpcUrlIndex])

  const isRpcUpdateRequested = useMemo(
    () =>
      networkDetails?.selectedRpcUrl &&
      networkDetails.selectedRpcUrl !== networkAlreadyAdded?.selectedRpcUrl &&
      networkDetails.rpcUrls.length === 1,
    [networkAlreadyAdded?.selectedRpcUrl, networkDetails]
  )

  useEffect(() => {
    // Don't set the network to add or update if the network is already in the extension
    if (!networkDetails || existingNetwork) return

    networksDispatch({
      type: 'method',
      params: {
        method: 'setNetworkToAddOrUpdate',
        args: [{ chainId: networkDetails.chainId, rpcUrl: networkDetails.selectedRpcUrl }]
      }
    })
  }, [
    networksDispatch,
    rpcUrlIndex,
    networkDetails,
    existingNetwork,
    networkToAddOrUpdate?.chainId
  ])

  useEffect(() => {
    if (existingNetwork) {
      setFeatures(
        getFeatures(
          {
            ...existingNetwork,
            isOptimistic: !!existingNetwork.isOptimistic,
            flagged: !!existingNetwork.flagged
          },
          existingNetwork
        )
      )

      return
    }

    setFeatures(getFeatures(networkToAddOrUpdate?.info, undefined))
  }, [networkToAddOrUpdate?.info, networkDetails, existingNetwork])

  useEffect(() => {
    if (!userRequest) return
    if (statuses.addNetwork === 'SUCCESS') {
      setSuccessStateText(t('successfully added to your wallet.'))
    } else if (statuses.updateNetwork === 'SUCCESS') {
      setSuccessStateText(t('successfully enabled.'))
    } else if (statuses.addNetwork === 'ERROR' || statuses.updateNetwork === 'ERROR') {
      actionButtonPressedRef.current = false
    }
  }, [t, statuses.addNetwork, userRequest, statuses.updateNetwork])

  const handleDenyButtonPress = useCallback(() => {
    if (!userRequest) return

    actionButtonPressedRef.current = true
    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.') as string, [userRequest.id]]
      }
    })
    networksDispatch({
      type: 'method',
      params: {
        method: 'setNetworkToAddOrUpdate',
        args: [null]
      }
    })
  }, [userRequest, t, requestsDispatch, networksDispatch])

  const handleCloseOnAlreadyAdded = useCallback(() => {
    if (!userRequest) return

    actionButtonPressedRef.current = true
    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [null, userRequest.id]
      }
    })
    networksDispatch({
      type: 'method',
      params: {
        method: 'setNetworkToAddOrUpdate',
        args: [null]
      }
    })
  }, [userRequest, requestsDispatch, networksDispatch])

  const handleUpdateNetwork = useCallback(() => {
    if (!networkDetails || !userRequest) return

    actionButtonPressedRef.current = true

    const matchedNetwork = networks.find((n) => n.chainId === networkDetails.chainId)
    if (!matchedNetwork?.rpcUrls) return

    const updatedRpcUrls = matchedNetwork.rpcUrls.filter(
      (url) => url !== networkDetails.selectedRpcUrl
    )

    networksDispatch({
      type: 'method',
      params: {
        method: 'updateNetwork',
        args: [
          {
            rpcUrls: Array.from(new Set([...updatedRpcUrls, networkDetails.selectedRpcUrl])),
            selectedRpcUrl: networkDetails.selectedRpcUrl
          },
          networkDetails.chainId
        ]
      }
    })

    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [null, userRequest.id]
      }
    })
  }, [userRequest, networksDispatch, requestsDispatch, networkDetails, networks])

  const handlePrimaryButtonPress = useCallback(() => {
    if (!networkDetails) return
    actionButtonPressedRef.current = true
    if (existingNetwork) {
      networksDispatch({
        type: 'method',
        params: {
          method: 'updateNetwork',
          args: [
            {
              disabled: false
            },
            existingNetwork.chainId
          ]
        }
      })
    } else {
      networksDispatch({
        type: 'method',
        params: {
          method: 'addNetwork',
          args: [networkDetails]
        }
      })
    }
  }, [networksDispatch, existingNetwork, networkDetails])

  const handleRetryWithDifferentRpcUrl = useCallback(() => {
    setRpcUrlIndex((prev) => prev + 1)
  }, [])

  const resolveButtonText = useMemo(() => {
    if (
      existingNetwork &&
      (statuses.updateNetwork === 'LOADING' || actionButtonPressedRef.current)
    ) {
      return t('Enabling network...')
    }
    if (!existingNetwork && (statuses.addNetwork === 'LOADING' || actionButtonPressedRef.current)) {
      return t('Adding network...')
    }

    return existingNetwork ? t('Enable network') : t('Add network')
  }, [existingNetwork, statuses.addNetwork, statuses.updateNetwork, t])

  const view: 'loading' | 'add' | 'update' | 'alreadyAdded' = useMemo(() => {
    if (!userRequest) return 'loading'
    if (networkAlreadyAdded) {
      if (isRpcUpdateRequested) return 'update'
      return 'alreadyAdded'
    }

    return 'add'
  }, [isRpcUpdateRequested, networkAlreadyAdded, userRequest])

  return {
    t,
    userRequest,
    statuses,
    features,
    existingNetwork,
    actionButtonPressedRef,
    successStateText,
    requestData,
    areParamsValid,
    networkAlreadyAdded,
    rpcUrls,
    rpcUrlIndex,
    networkDetails,
    isRpcUpdateRequested,
    handleDenyButtonPress,
    handleCloseOnAlreadyAdded,
    handleUpdateNetwork,
    handlePrimaryButtonPress,
    handleRetryWithDifferentRpcUrl,
    resolveButtonText,
    view
  }
}

export default useAddOrUpdateNetwork
