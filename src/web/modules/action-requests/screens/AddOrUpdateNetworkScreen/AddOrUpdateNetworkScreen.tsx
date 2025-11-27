/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { getFeatures } from '@ambire-common/libs/networks/networks'
import Spinner from '@common/components/Spinner'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import validateRequestParams from '@web/modules/action-requests/screens/AddOrUpdateNetworkScreen/validateRequestParams'

import AddChain from './AddChain'
import AlreadyAddedChain from './AlreadyAddedChain'
import UpdateChain from './UpdateChain'

/**
 * This screen is used to add a new network to the wallet. If the network is already in the wallet
 * but disabled, it will be enabled. The configuration usually comes from the dApp, but in the case
 * that it already exists, the dApp configuration is ignored.
 */
const AddOrUpdateNetworkScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { currentUserRequest } = useRequestsControllerState()
  const { statuses, networkToAddOrUpdate, disabledNetworks, networks } =
    useNetworksControllerState()
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
        selectedRpcUrl: rpcUrls[rpcUrlIndex],
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

    dispatch({
      type: 'SETTINGS_CONTROLLER_SET_NETWORK_TO_ADD_OR_UPDATE',
      params: { chainId: networkDetails.chainId, rpcUrl: networkDetails.selectedRpcUrl }
    })
  }, [dispatch, rpcUrlIndex, networkDetails, existingNetwork, networkToAddOrUpdate?.chainId])

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
  }, [dispatch, t, statuses.addNetwork, userRequest, statuses.updateNetwork])

  const handleDenyButtonPress = useCallback(() => {
    if (!userRequest) return

    actionButtonPressedRef.current = true
    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: userRequest.id }
    })
  }, [userRequest, t, dispatch])

  const handleCloseOnAlreadyAdded = useCallback(() => {
    if (!userRequest) return

    actionButtonPressedRef.current = true
    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: { data: null, id: userRequest.id }
    })
  }, [userRequest, dispatch])

  const handleUpdateNetwork = useCallback(() => {
    if (!networkDetails || !userRequest) return

    actionButtonPressedRef.current = true

    const matchedNetwork = networks.find((n) => n.chainId === networkDetails.chainId)
    if (!matchedNetwork?.rpcUrls) return

    const updatedRpcUrls = matchedNetwork.rpcUrls.filter(
      (url) => url !== networkDetails.selectedRpcUrl
    )

    dispatch({
      type: 'MAIN_CONTROLLER_UPDATE_NETWORK',
      params: {
        network: {
          rpcUrls: Array.from(new Set([...updatedRpcUrls, networkDetails.selectedRpcUrl])),
          selectedRpcUrl: networkDetails.selectedRpcUrl
        },
        chainId: networkDetails.chainId
      }
    })

    dispatch({
      type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
      params: { data: null, id: userRequest.id }
    })
  }, [userRequest, dispatch, networkDetails, networks])

  const handlePrimaryButtonPress = useCallback(() => {
    if (!networkDetails) return
    actionButtonPressedRef.current = true
    if (existingNetwork) {
      dispatch({
        type: 'MAIN_CONTROLLER_UPDATE_NETWORK',
        params: {
          chainId: existingNetwork.chainId,
          network: {
            disabled: false
          }
        }
      })
    } else {
      dispatch({
        type: 'MAIN_CONTROLLER_ADD_NETWORK',
        params: networkDetails
      })
    }
  }, [dispatch, existingNetwork, networkDetails])

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

  if (view === 'loading') {
    return (
      <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Spinner />
      </View>
    )
  }

  if (view === 'update' && networkAlreadyAdded) {
    return (
      <UpdateChain
        handleDenyButtonPress={handleDenyButtonPress}
        handleUpdateNetwork={handleUpdateNetwork}
        handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
        areParamsValid={areParamsValid}
        statuses={statuses}
        features={features}
        networkDetails={networkDetails}
        networkAlreadyAdded={networkAlreadyAdded}
        userRequest={userRequest}
        actionButtonPressedRef={actionButtonPressedRef}
        rpcUrls={rpcUrls}
        rpcUrlIndex={rpcUrlIndex}
      />
    )
  }

  if (view === 'alreadyAdded' && networkAlreadyAdded) {
    return (
      <AlreadyAddedChain
        handleCloseOnAlreadyAdded={handleCloseOnAlreadyAdded}
        statuses={statuses}
        networkAlreadyAdded={networkAlreadyAdded}
        successStateText={successStateText}
      />
    )
  }

  return (
    <AddChain
      handleDenyButtonPress={handleDenyButtonPress}
      handlePrimaryButtonPress={handlePrimaryButtonPress}
      handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
      areParamsValid={areParamsValid}
      statuses={statuses}
      features={features}
      networkDetails={networkDetails}
      actionButtonPressedRef={actionButtonPressedRef}
      rpcUrls={rpcUrls}
      rpcUrlIndex={rpcUrlIndex}
      resolveButtonText={resolveButtonText}
      existingNetwork={existingNetwork}
      userRequest={userRequest}
    />
  )
}

export default React.memo(AddOrUpdateNetworkScreen)
