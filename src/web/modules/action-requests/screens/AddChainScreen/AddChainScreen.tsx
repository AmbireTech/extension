/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { DappRequestAction } from '@ambire-common/controllers/actions/actions'
import { AddNetworkRequestParams, NetworkFeature } from '@ambire-common/interfaces/network'
import { getFeatures } from '@ambire-common/libs/networks/networks'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Alert from '@common/components/Alert'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import ManifestImage from '@web/components/ManifestImage'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'
import NetworkDetails from '@web/components/NetworkDetails'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import validateRequestParams from '@web/modules/action-requests/screens/AddChainScreen/validateRequestParams'

import getStyles from './styles'

const AddChainScreen = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { dispatch } = useBackgroundService()
  const state = useActionsControllerState()
  const [areParamsValid, setAreParamsValid] = useState<boolean | null>(null)
  const { statuses, networkToAddOrUpdate } = useNetworksControllerState()
  const [features, setFeatures] = useState<NetworkFeature[]>(getFeatures(undefined, undefined))
  const [rpcUrlIndex, setRpcUrlIndex] = useState<number>(0)
  const actionButtonPressedRef = useRef(false)

  const dappAction = useMemo(() => {
    if (state.currentAction?.type !== 'dappRequest') return undefined
    return state.currentAction as DappRequestAction
  }, [state.currentAction])

  const userRequest = useMemo(() => {
    if (!dappAction) return undefined
    if (dappAction.userRequest.action.kind !== 'walletAddEthereumChain') return undefined

    return dappAction.userRequest
  }, [dappAction])

  const requestData = useMemo(() => userRequest?.action?.params?.[0], [userRequest])

  const requestKind = useMemo(() => userRequest?.action?.kind, [userRequest?.action?.kind])

  const requestSession = useMemo(() => userRequest?.session, [userRequest?.session])

  useEffect(() => {
    setAreParamsValid(validateRequestParams(requestKind, requestData))
  }, [requestKind, requestData])

  const rpcUrls: string[] = useMemo(() => {
    if (!requestData || !requestData?.rpcUrls) return []

    return requestData.rpcUrls.filter((url: string) => !!url && url.startsWith('http'))
  }, [requestData])

  const networkDetails: AddNetworkRequestParams | undefined = useMemo(() => {
    if (!areParamsValid || !requestData) return undefined
    if (!requestData.rpcUrls) return
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
  }, [areParamsValid, rpcUrls, requestData, rpcUrlIndex])

  useEffect(() => {
    if (!networkDetails) return

    dispatch({
      type: 'SETTINGS_CONTROLLER_SET_NETWORK_TO_ADD_OR_UPDATE',
      params: { chainId: networkDetails.chainId, rpcUrl: networkDetails.selectedRpcUrl }
    })
  }, [dispatch, rpcUrlIndex, networkDetails])

  useEffect(() => {
    setFeatures(getFeatures(networkToAddOrUpdate?.info, undefined))
  }, [networkToAddOrUpdate?.info, networkDetails])

  useEffect(() => {
    if (!dappAction) return
    if (statuses.addNetwork === 'SUCCESS') {
      dispatch({
        type: 'MAIN_CONTROLLER_RESOLVE_USER_REQUEST',
        params: { data: null, id: dappAction.id }
      })
    }
  }, [dispatch, statuses.addNetwork, dappAction])

  const handleDenyButtonPress = useCallback(() => {
    if (!dappAction) return

    actionButtonPressedRef.current = true
    dispatch({
      type: 'MAIN_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: dappAction.id }
    })
  }, [dappAction, t, dispatch])

  const handleAddNetworkButtonPress = useCallback(() => {
    if (!networkDetails) return
    actionButtonPressedRef.current = true
    dispatch({
      type: 'MAIN_CONTROLLER_ADD_NETWORK',
      params: networkDetails
    })
  }, [dispatch, networkDetails])

  const handleRetryWithDifferentRpcUrl = useCallback(() => {
    setRpcUrlIndex((prev) => prev + 1)
  }, [])

  return (
    <TabLayoutContainer
      width="full"
      header={<HeaderAccountAndNetworkInfo />}
      footer={
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAddNetworkButtonPress}
          resolveButtonText={
            statuses.addNetwork === 'LOADING' ? t('Adding network...') : t('Add network')
          }
          resolveDisabled={
            !areParamsValid ||
            statuses.addNetwork === 'LOADING' ||
            (features &&
              (features.some((f) => f.level === 'loading') ||
                !!features.filter((f) => f.id === 'flagged')[0]))
          }
        />
      }
      backgroundColor={theme.quinaryBackground}
    >
      <TabLayoutWrapperMainContent
        style={spacings.mbLg}
        withScroll={false}
        contentContainerStyle={[spacings.pvMd, { flexGrow: 1 }]}
      >
        <Text weight="medium" fontSize={20} style={spacings.mbMd}>
          {t('Add new network')}
        </Text>

        <View style={styles.dappInfoContainer}>
          <ManifestImage
            uri={requestSession?.icon}
            size={50}
            fallback={() => <ManifestFallbackIcon />}
          />

          <View style={styles.dappInfoContent}>
            <Trans values={{ name: requestSession?.name || 'The App' }}>
              <Text>
                <Text fontSize={20} appearance="secondaryText" weight="medium">
                  {t('Allow ')}
                </Text>
                <Text fontSize={20} weight="semiBold">
                  {'{{name}} '}
                </Text>
                <Text fontSize={20} appearance="secondaryText" weight="medium">
                  {t('to add a network')}
                </Text>
              </Text>
            </Trans>
          </View>
        </View>
        <Text fontSize={16} weight="semiBold" appearance="secondaryText" style={spacings.mbMd}>
          {t('Ambire Wallet does not verify custom networks.')}
        </Text>
        {!!areParamsValid && !!networkDetails && (
          <View style={[flexbox.directionRow, flexbox.flex1]}>
            <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
              <NetworkDetails
                name={userRequest?.action?.params?.[0]?.chainName}
                iconUrls={networkDetails?.iconUrls || []}
                chainId={networkDetails.chainId}
                rpcUrls={networkDetails.rpcUrls}
                selectedRpcUrl={rpcUrls[rpcUrlIndex]}
                nativeAssetSymbol={networkDetails.nativeAssetSymbol}
                nativeAssetName={networkDetails.nativeAssetName}
                explorerUrl={networkDetails.explorerUrl}
                predefined={false}
                style={{ backgroundColor: theme.primaryBackground }}
                type="vertical"
              />
            </ScrollableWrapper>
            <View style={styles.separator} />
            <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
              {!!networkDetails && (
                <NetworkAvailableFeatures
                  features={features}
                  chainId={networkDetails.chainId}
                  withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                  handleRetry={handleRetryWithDifferentRpcUrl}
                />
              )}
            </ScrollableWrapper>
          </View>
        )}
        {!areParamsValid && areParamsValid !== null && !actionButtonPressedRef.current && (
          <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
            <Alert
              title={t('Invalid Request Params')}
              text={t(
                `${
                  userRequest?.session?.name || 'The App'
                } provided invalid params for adding a new network.`
              )}
              type="error"
            />
          </View>
        )}
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(AddChainScreen)
