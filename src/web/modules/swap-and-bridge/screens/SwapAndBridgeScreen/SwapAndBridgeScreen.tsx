import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { Key } from '@ambire-common/interfaces/keystore'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_MD, SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Form, Wrapper } from '@web/components/TransactionsScreen'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useSimulationError from '@web/modules/portfolio/hooks/SimulationError/useSimulationError'
import BatchAdded from '@web/modules/sign-account-op/components/OneClick/BatchModal/BatchAdded'
import Buttons from '@web/modules/sign-account-op/components/OneClick/Buttons'
import Estimation from '@web/modules/sign-account-op/components/OneClick/Estimation'
import RoutesModal from '@web/modules/swap-and-bridge/components/RoutesModal'
import useSwapAndBridgeForm from '@web/modules/swap-and-bridge/hooks/useSwapAndBridgeForm'
import { getUiType } from '@web/utils/uiType'

import TrackProgress from '../../components/Estimation/TrackProgress'
import FromToken from '../../components/FromToken'
import PriceImpactWarningModal from '../../components/PriceImpactWarningModal'
import RouteInfo from '../../components/RouteInfo'
import ToToken from '../../components/ToToken'

const { isTab, isRequestWindow } = getUiType()

const SwapAndBridgeScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
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
    isLocalStateOutOfSync
  } = useSwapAndBridgeForm()
  const {
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
  } = useSwapAndBridgeControllerState()
  const { portfolio } = useSelectedAccountControllerState()

  const { statuses: requestsCtrlStatuses } = useRequestsControllerState()
  const prevSelectedAccActiveRoutes: any[] | undefined = usePrevious(selectedAccActiveRoutes)
  const scrollViewRef: any = useRef(null)
  const { dispatch } = useBackgroundService()

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
    navigate(WEB_ROUTES.dashboard)
  }, [navigate])
  const onBatchAddedSecondaryButtonPress = useCallback(() => {
    setShowAddedToBatch(false)
  }, [setShowAddedToBatch])

  const onBackButtonPress = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN',
      params: { sessionId, forceUnload: true }
    })
    if (isRequestWindow) {
      dispatch({
        type: 'CLOSE_SIGNING_REQUEST_WINDOW',
        params: {
          type: 'swapAndBridge'
        }
      })
    } else {
      navigate(ROUTES.dashboard)
    }
  }, [dispatch, navigate, sessionId])

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      dispatch({
        type: 'CURRENT_SIGN_ACCOUNT_OP_UPDATE_STATUS',
        params: {
          updateType: 'Swap&Bridge',
          status
        }
      })
    },
    [dispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      dispatch({
        type: 'CURRENT_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          updateType: 'Swap&Bridge',
          ...params
        }
      })
    },
    [dispatch]
  )

  const buttons = useMemo(() => {
    return (
      <>
        {isTab && <BackButton onPress={onBackButtonPress} />}
        <Buttons
          signAccountOpErrors={swapSignErrors}
          isNotReadyToProceed={isNotReadyToProceed}
          isLoading={isLoading}
          handleSubmitForm={handleSubmitForm}
          isBridge={isBridge}
          networkUserRequests={networkUserRequests}
          isLocalStateOutOfSync={isLocalStateOutOfSync}
        />
      </>
    )
  }, [
    onBackButtonPress,
    swapSignErrors,
    isNotReadyToProceed,
    isLoading,
    handleSubmitForm,
    isBridge,
    networkUserRequests,
    isLocalStateOutOfSync
  ])

  if (!sessionIds.includes(sessionId)) {
    // If the portfolio has loaded we can skip the spinner as initializing the screen
    // takes a short time and the spinner will only flash.
    if (portfolio.isReadyToVisualize) return null

    return (
      <View style={[flexbox.flex1, flexbox.justifyCenter, flexbox.alignCenter]}>
        <Spinner />
      </View>
    )
  }

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
    <Wrapper title={t('Swap & Bridge')} buttons={buttons}>
      <Content scrollViewRef={scrollViewRef} buttons={buttons}>
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
        <Form>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
            {!isTab && <PanelBackButton onPress={onBackButtonPress} style={spacings.mrSm} />}
            <PanelTitle title={t('Swap & Bridge')} />
            {!isTab && <View style={{ width: 40 }} />}
          </View>
          <View style={{ marginBottom: SPACING_MD + SPACING_MI / 2 }}>
            <FromToken
              fromTokenOptions={fromTokenOptions}
              fromTokenValue={fromTokenValue}
              fromAmountValue={fromAmountValue}
              fromTokenAmountSelectDisabled={fromTokenAmountSelectDisabled}
              onFromAmountChange={onFromAmountChange}
              simulationFailed={!!fromChainSimulationError}
            />
          </View>
          <ToToken simulationFailed={!!toChainSimulationError} />
        </Form>
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
