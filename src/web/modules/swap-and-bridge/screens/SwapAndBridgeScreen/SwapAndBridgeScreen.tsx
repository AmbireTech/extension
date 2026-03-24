import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { Key } from '@ambire-common/interfaces/keystore'
import Alert from '@common/components/Alert'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Spinner from '@common/components/Spinner'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import BatchAdded from '@common/modules/sign-account-op/components/OneClick/BatchModal/BatchAdded'
import Buttons from '@common/modules/sign-account-op/components/OneClick/Buttons'
import Estimation from '@common/modules/sign-account-op/components/OneClick/Estimation'
import TrackProgress from '@common/modules/swap-and-bridge/components/Estimation/TrackProgress'
import FromToken from '@common/modules/swap-and-bridge/components/FromToken'
import PriceImpactWarningModal from '@common/modules/swap-and-bridge/components/PriceImpactWarningModal'
import RouteInfo from '@common/modules/swap-and-bridge/components/RouteInfo'
import RoutesModal from '@common/modules/swap-and-bridge/components/RoutesModal'
import ToToken from '@common/modules/swap-and-bridge/components/ToToken'
import useSwapAndBridgeForm from '@common/modules/swap-and-bridge/hooks/useSwapAndBridgeForm'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import useSimulationError from '@web/modules/portfolio/hooks/SimulationError/useSimulationError'
import Modals from '@web/modules/sign-account-op/components/Modals'

const { isRequestWindow } = getUiType()

const SwapAndBridgeScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const {
    sessionId,
    fromAmountValue,
    onFromAmountChange,
    fromTokenOptions,
    fromTokenValue,
    fromTokenAmountSelectDisabled,
    handleSubmitForm,
    highPriceImpactOrSlippageWarning,
    priceImpactModalRef,
    closePriceImpactModal,
    acknowledgeHighPriceImpact,
    selectedAccActiveRoutes,
    routesModalRef,
    openRoutesModal,
    closeRoutesModal,
    estimationModalRef,
    activeRoute,
    setActiveRoute,
    displayedView,
    closeEstimationModalWrapped,
    isBridge,
    setShowAddedToBatch,
    batchNetworkUserRequestsCount,
    networkUserRequests,
    isLocalStateOutOfSync,
    shouldDisableAddToBatch
  } = useSwapAndBridgeForm()
  const {
    state: {
      sessionIds,
      formStatus,
      fromChainId,
      toChainId,
      isHealthy,
      shouldEnableRoutesSelection,
      updateQuoteStatus,
      signAccountOpController,
      hasProceeded,
      swapSignErrors,
      quote
    },
    dispatch: swapAndBridgeDispatch
  } = useController('SwapAndBridgeController')
  const {
    state: { portfolio, account }
  } = useController('SelectedAccountController')

  const {
    dispatch: requestsCtrlDispatch,
    state: { statuses: requestsCtrlStatuses }
  } = useController('RequestsController')
  const prevSelectedAccActiveRoutes: any[] | undefined = usePrevious(selectedAccActiveRoutes)
  const scrollViewRef: any = useRef(null)

  const { maxWidthSize } = useWindowSize()
  const paddingHorizontalStyle = useMemo(() => getTabLayoutPadding(maxWidthSize), [maxWidthSize])

  const { simulationError: fromChainSimulationError } = useSimulationError({ chainId: fromChainId })
  const { simulationError: toChainSimulationError } = useSimulationError({ chainId: toChainId })

  useEffect(() => {
    if (!selectedAccActiveRoutes || !prevSelectedAccActiveRoutes) return
    if (!selectedAccActiveRoutes.length) return
    if (prevSelectedAccActiveRoutes.length < selectedAccActiveRoutes.length) {
      // scroll to top when there is a new item in the active routes list
      scrollViewRef.current?.scrollTo({ y: 0 })
    }
  }, [selectedAccActiveRoutes, prevSelectedAccActiveRoutes])

  // TODO: Disable tokens that are NOT supported
  // (not in the `fromTokenList` of the SwapAndBridge controller)

  // TODO: Confirmation modal (warn) if the diff in dollar amount between the
  // FROM and TO tokens is too high (therefore, user will lose money).

  const isEstimatingRoute =
    formStatus === SwapAndBridgeFormStatus.ReadyToEstimate &&
    (!signAccountOpController ||
      signAccountOpController.estimation.status === EstimationStatus.Loading)

  const isLoading = useMemo(() => {
    return (
      requestsCtrlStatuses.buildSwapAndBridgeUserRequest !== 'INITIAL' ||
      updateQuoteStatus === 'LOADING' ||
      isEstimatingRoute ||
      !!signAccountOpController?.safetyChecksLoading
    )
  }, [
    isEstimatingRoute,
    requestsCtrlStatuses.buildSwapAndBridgeUserRequest,
    updateQuoteStatus,
    signAccountOpController?.safetyChecksLoading
  ])

  const isNotReadyToProceed = useMemo(() => {
    return formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit || isLoading
  }, [formStatus, isLoading])

  const onBatchAddedPrimaryButtonPress = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: {
        method: 'resetForm',
        args: []
      }
    })
    navigate(WEB_ROUTES.dashboard)
  }, [swapAndBridgeDispatch, navigate])
  const onBatchAddedSecondaryButtonPress = useCallback(() => {
    setShowAddedToBatch(false)
  }, [setShowAddedToBatch])

  const onBackButtonPress = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: { method: 'unloadScreen', args: [sessionId, true] }
    })
    if (isRequestWindow) {
      if (!account) return

      requestsCtrlDispatch({
        type: 'method',
        params: {
          method: 'removeUserRequests',
          args: [[`${account.addr}-swap-and-bridge-sign`]]
        }
      })
    } else {
      navigate(ROUTES.dashboard)
    }
  }, [requestsCtrlDispatch, account, navigate, sessionId, swapAndBridgeDispatch])

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['updateStatus', [status]]
        }
      })
    },
    [swapAndBridgeDispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['update', [params]]
        }
      })
    },
    [swapAndBridgeDispatch]
  )

  const buttons = useMemo(() => {
    return (
      <Buttons
        signAccountOpErrors={swapSignErrors}
        isNotReadyToProceed={isNotReadyToProceed}
        isBatchDisabled={shouldDisableAddToBatch}
        isLoading={isLoading}
        handleSubmitForm={handleSubmitForm}
        isBridge={isBridge}
        networkUserRequests={networkUserRequests}
        isLocalStateOutOfSync={isLocalStateOutOfSync}
      />
    )
  }, [
    swapSignErrors,
    isNotReadyToProceed,
    isLoading,
    handleSubmitForm,
    isBridge,
    networkUserRequests,
    isLocalStateOutOfSync,
    shouldDisableAddToBatch
  ])

  if (activeRoute && displayedView === 'track') {
    return (
      <TrackProgress
        handleClose={() => {
          setActiveRoute(undefined)
        }}
        activeRoute={activeRoute}
      />
    )
  }

  if (displayedView === 'batch') {
    return (
      <BatchAdded
        title={t('Swap & Bridge')}
        callsCount={batchNetworkUserRequestsCount}
        primaryButtonText={t('Open dashboard')}
        secondaryButtonText={t('Add more')}
        onPrimaryButtonPress={onBatchAddedPrimaryButtonPress}
        onSecondaryButtonPress={onBatchAddedSecondaryButtonPress}
      />
    )
  }

  return (
    <Wrapper>
      <Content buttons={buttons}>
        {isHealthy === false && (
          <Alert
            type="error"
            title={t('Temporarily unavailable.')}
            text={t(
              "We're currently unable to initiate a swap or bridge request because our service provider's API is temporarily unavailable. Please try again later. If the issue persists, check for updates or contact support."
            )}
            style={spacings.mb}
          />
        )}
        <View>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
            <PanelBackButton onPress={onBackButtonPress} style={spacings.mrSm} />
            <PanelTitle title={t('Swap & Bridge')} />
            <View style={{ width: 40 }} />
          </View>
          <View style={spacings.mbTy}>
            <FromToken
              fromTokenOptions={fromTokenOptions}
              fromTokenValue={fromTokenValue}
              fromAmountValue={fromAmountValue}
              fromTokenAmountSelectDisabled={fromTokenAmountSelectDisabled}
              onFromAmountChange={onFromAmountChange}
              simulationFailed={!!fromChainSimulationError}
              isLoading={!sessionIds.includes(sessionId) || !portfolio.isReadyToVisualize}
            />
          </View>
          <ToToken simulationFailed={!!toChainSimulationError} />
        </View>
        <RouteInfo
          isEstimatingRoute={isEstimatingRoute}
          openRoutesModal={openRoutesModal}
          shouldEnableRoutesSelection={shouldEnableRoutesSelection}
        />
      </Content>
      <RoutesModal sheetRef={routesModalRef} closeBottomSheet={closeRoutesModal} />
      <Estimation
        updateType="Swap&Bridge"
        estimationModalRef={estimationModalRef}
        closeEstimationModal={closeEstimationModalWrapped}
        updateController={updateController}
        handleUpdateStatus={handleUpdateStatus}
        hasProceeded={hasProceeded}
        signAccountOpController={signAccountOpController}
        serviceFee={quote?.selectedRoute?.serviceFee}
        Modals={Modals}
      />
      <PriceImpactWarningModal
        sheetRef={priceImpactModalRef}
        closeBottomSheet={closePriceImpactModal}
        acknowledgeHighPriceImpact={acknowledgeHighPriceImpact}
        highPriceImpactOrSlippageWarning={highPriceImpactOrSlippageWarning}
      />
    </Wrapper>
  )
}

export default React.memo(SwapAndBridgeScreen)
