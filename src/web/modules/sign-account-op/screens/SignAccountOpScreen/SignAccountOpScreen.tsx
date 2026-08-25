import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import { SigningStatus } from '@ambire-common/interfaces/signAccountOp'
import { isSafeRejectionCall } from '@ambire-common/libs/accountOp/accountOp'
import Alert from '@common/components/Alert'
import GlassView from '@common/components/GlassView'
import NetworkBadge from '@common/components/NetworkBadge'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import useController from '@common/hooks/useController'
import useSign from '@common/hooks/useSign'
import useTheme from '@common/hooks/useTheme'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import ErrorInformation from '@common/modules/sign-account-op/components/ErrorInformation'
import Estimation from '@common/modules/sign-account-op/components/Estimation'
import Footer from '@common/modules/sign-account-op/components/Footer'
import PendingTransactions from '@common/modules/sign-account-op/components/PendingTransactions'
import SafeEip712Data from '@common/modules/sign-account-op/components/SafeEip712Data'
import SafeNonce from '@common/modules/sign-account-op/components/SafeNonce'
import SafeOwners from '@common/modules/sign-account-op/components/SafeOwners'
import SafetyChecksOverlay from '@common/modules/sign-account-op/components/SafetyChecksOverlay'
import SectionHeading from '@common/modules/sign-account-op/components/SectionHeading'
import Simulation from '@common/modules/sign-account-op/components/Simulation'
import KeySelect from '@common/modules/sign-message/components/KeySelect'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useCloseActionWindow from '@web/hooks/useCloseActionWindow'
import useDappVerificationHoldButtonType from '@web/hooks/useDappVerificationHoldButtonType'
import Modals from '@web/modules/sign-account-op/components/Modals/Modals'
import SafeAccountTabs from '@web/modules/sign-account-op/components/SafeAccountTabs'

import type { Key } from '@ambire-common/interfaces/keystore'
import type { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import type { ActiveTab as SafeEip712ActiveTab } from '@common/modules/sign-account-op/components/SafeEip712Data'
import type { SafeAccountTab } from '@web/modules/sign-account-op/components/SafeAccountTabs'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
const { isSidePanel } = getUiType()

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 40
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

const SignAccountOpScreen = () => {
  const {
    state: { currentUserRequest, visibleUserRequests },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { state: signAccountOpState, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController')
  const { t } = useTranslation()
  const { theme } = useTheme()
  const closeActionWindow = useCloseActionWindow()
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)

  const handleAddToCart = useCallback(() => {
    closeActionWindow()
  }, [closeActionWindow])

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      signAccountOpDispatch({
        type: 'method',
        params: {
          method: 'updateStatus',
          args: [status]
        }
      })
    },
    [signAccountOpDispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      signAccountOpDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [params]
        }
      })
    },
    [signAccountOpDispatch]
  )

  const {
    renderedButNotNecessarilyVisibleModal,
    isViewOnly,
    dismissWarning,
    acknowledgeWarning,
    isChooseSignerShown,
    setIsChooseSignerShown,
    onSignButtonClick,
    handleChangeSigningKey,
    handleChangeSigningKeyAndClose,
    warningToPromptBeforeSign,
    handleDismissLedgerConnectModal,
    slowPaymasterRequest,
    slowRequest,
    isSignLoading,
    hasEstimation,
    warningModalRef,
    gasFeeUpdatedModalRef,
    handleAcceptGasFeeUpdate,
    handleDismissGasFeeUpdate,
    handleChangeFeePayerKeyType,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    signingKeyType,
    feePayerKeyType,
    shouldDisplayLedgerConnectModal,
    network,
    isSignDisabled,
    bundlerNonceDiscrepancy,
    primaryButtonText,
    signButtonText,
    extremeGasFeeSignButtonType,
    shouldHoldToProceed,
    shouldDisplayQrSigningModal,
    handleQrSigningFlowOnContinuePressed,
    handleQrSigningFlowSubmitSignatureResponse,
    handleQrSigningFlowOnClosePressed,
    handleQrSigningFlowOnRejectPressed,
    handleQrSigningFlowOnBackPressed,
    currentRequest,
    signingStep,
    disabledReason,
    showSafeSigners
  } = useSign({
    handleUpdateStatus,
    signAccountOpState,
    handleUpdate: updateController,
    hasReachedBottom,
    onSafeSignComplete: handleAddToCart
  })

  const accountOpRequest = useMemo(() => {
    if (currentUserRequest?.kind !== 'calls') return undefined
    return currentUserRequest as CallsUserRequest
  }, [currentUserRequest])

  const [safeAccountTabState, setSafeAccountTabState] = useState({
    requestId: accountOpRequest?.id,
    activeTab: 'overview' as SafeAccountTab
  })
  const activeSafeAccountTab =
    safeAccountTabState.requestId === accountOpRequest?.id
      ? safeAccountTabState.activeTab
      : 'overview'
  const shouldUseSafeAccountTabs = !!signAccountOpState?.account.safeCreation && !isSidePanel
  const isOverviewTabActive = !shouldUseSafeAccountTabs || activeSafeAccountTab === 'overview'

  const handleSafeAccountTabChange = useCallback(
    (activeTab: SafeAccountTab) => {
      setSafeAccountTabState({ requestId: accountOpRequest?.id, activeTab })
    },
    [accountOpRequest?.id]
  )

  const shouldRejectOnchain = useMemo(() => {
    if (!signAccountOpState?.account.safeCreation) return false
    const { signature, signed } = signAccountOpState.accountOp
    const signedCount = signed?.length || 0

    return !!signature && signature !== '0x' && signedCount > 0
  }, [signAccountOpState])

  const isCancelDisabled = useMemo(() => {
    if (!shouldRejectOnchain || !signAccountOpState) return false

    const { calls, accountAddr } = signAccountOpState.accountOp
    return isSafeRejectionCall(calls, accountAddr)
  }, [shouldRejectOnchain, signAccountOpState])

  const handleRejectAccountOp = useCallback(() => {
    if (!accountOpRequest) return

    if (shouldRejectOnchain) {
      if (isCancelDisabled) return

      requestsDispatch({
        type: 'method',
        params: {
          method: 'build',
          args: [
            {
              type: 'onchainSafeRejection',
              params: { requestId: accountOpRequest.id }
            }
          ]
        }
      })
      return
    }

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [
          'User rejected the transaction request.',
          [accountOpRequest.id],
          { shouldOpenNextRequest: visibleUserRequests.length > 1 }
        ]
      }
    })
  }, [
    requestsDispatch,
    accountOpRequest,
    shouldRejectOnchain,
    isCancelDisabled,
    visibleUserRequests.length
  ])

  useEffect(() => {
    if (!isOverviewTabActive || isSignDisabled || !containerHeight || !contentHeight) return
    const isScrollNotVisible = contentHeight <= containerHeight

    const updateHasReachedBottomTimeout = setTimeout(() => {
      if (!hasReachedBottom) setHasReachedBottom(isScrollNotVisible)
    }, 0)

    return () => clearTimeout(updateHasReachedBottomTimeout)
  }, [
    contentHeight,
    containerHeight,
    hasReachedBottom,
    hasEstimation,
    isSignDisabled,
    isOverviewTabActive
  ])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isOverviewTabActive || hasReachedBottom) return
      if (isCloseToBottom(event.nativeEvent)) setHasReachedBottom(true)
    },
    [hasReachedBottom, isOverviewTabActive]
  )

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height)
  }, [])

  const handleContentSizeChange = useCallback(
    (_: number, height: number) => {
      if (isOverviewTabActive) setContentHeight(height)
    },
    [isOverviewTabActive]
  )

  const isAddToCartDisabled = useMemo(() => {
    if (signAccountOpState?.account.safeCreation) return false
    const readyToSign = signAccountOpState?.readyToSign

    return isSignLoading || (!readyToSign && !isViewOnly)
  }, [
    isSignLoading,
    isViewOnly,
    signAccountOpState?.readyToSign,
    signAccountOpState?.account.safeCreation
  ])

  const estimationFailed = signAccountOpState?.status?.type === SigningStatus.EstimationError
  const holdToProceedButtonType = useDappVerificationHoldButtonType(signAccountOpState?.banners)

  return (
    <SmallNotificationWindowWrapper>
      <SafetyChecksOverlay
        shouldBeVisible={
          !signAccountOpState?.isInitialized || !!signAccountOpState.safetyChecksLoading
        }
      />
      <Modals
        renderedButNotNecessarilyVisibleModal={renderedButNotNecessarilyVisibleModal}
        signAccountOpState={signAccountOpState}
        warningModalRef={warningModalRef}
        gasFeeUpdatedModalRef={gasFeeUpdatedModalRef}
        handleAcceptGasFeeUpdate={handleAcceptGasFeeUpdate}
        handleDismissGasFeeUpdate={handleDismissGasFeeUpdate}
        feePayerKeyType={feePayerKeyType}
        signingKeyType={signingKeyType}
        slowPaymasterRequest={slowPaymasterRequest}
        shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
        handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
        warningToPromptBeforeSign={warningToPromptBeforeSign}
        acknowledgeWarning={acknowledgeWarning}
        dismissWarning={dismissWarning}
        currentRequest={currentRequest}
        signingStep={signingStep}
        shouldDisplayQrSigningModal={shouldDisplayQrSigningModal}
        handleQrSigningFlowOnContinuePressed={handleQrSigningFlowOnContinuePressed}
        handleQrSigningFlowSubmitSignatureResponse={handleQrSigningFlowSubmitSignatureResponse}
        handleQrSigningFlowOnClosePressed={handleQrSigningFlowOnClosePressed}
        handleQrSigningFlowOnRejectPressed={handleQrSigningFlowOnRejectPressed}
        handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
        autoOpen={
          renderedButNotNecessarilyVisibleModal === 'gas-fee-updated'
            ? 'gas-fee-updated'
            : undefined
        }
      />
      <TabLayoutContainer
        width="full"
        backgroundColor={theme.primaryBackground}
        withHorizontalPadding={false}
        style={spacings.ph}
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <View style={[spacings.mh, spacings.mv]}>
            <GlassView>
              <View style={[spacings.ph, spacings.pvSm, flexbox.flex1]}>
                {!estimationFailed &&
                signAccountOpState?.canBroadcast &&
                signAccountOpState?.status?.type !== SigningStatus.Queued ? (
                  <View style={spacings.mb}>
                    <Estimation
                      signAccountOpState={signAccountOpState}
                      disabled={isSignLoading}
                      hasEstimation={!!hasEstimation}
                      slowRequest={slowRequest}
                      isViewOnly={isViewOnly}
                      isSponsored={signAccountOpState ? signAccountOpState.isSponsored : false}
                      sponsor={signAccountOpState ? signAccountOpState.sponsor : undefined}
                      updateType="Requests"
                      bundlerNonceDiscrepancy={bundlerNonceDiscrepancy}
                    />
                  </View>
                ) : null}

                {!isViewOnly &&
                  signAccountOpState &&
                  signAccountOpState?.errors.length === 0 &&
                  !signAccountOpState.canBroadcast &&
                  !!signAccountOpState.account.safeCreation &&
                  showSafeSigners && (
                    <SafeOwners
                      account={signAccountOpState.account}
                      onSign={handleChangeSigningKey}
                      onSignAndClose={handleChangeSigningKeyAndClose}
                      isSignLoading={isSignLoading}
                      signingKeyAddr={signAccountOpState.accountOp.signingKeyAddr}
                      chainId={signAccountOpState.accountOp.chainId.toString()}
                      signed={signAccountOpState.accountOp.signed || []}
                      importedKeys={signAccountOpState.accountKeyStoreKeys}
                      threshold={signAccountOpState.threshold}
                      style={spacings.mb}
                    />
                  )}

                <Footer
                  key={accountOpRequest?.id}
                  onReject={handleRejectAccountOp}
                  onAddToCart={handleAddToCart}
                  isAddToCartDisplayed={
                    !!signAccountOpState &&
                    !!network &&
                    signAccountOpState.accountOp.meta?.setDelegation === undefined
                  }
                  isSignLoading={isSignLoading}
                  isSignDisabled={isSignDisabled || !hasReachedBottom}
                  buttonTooltipText={disabledReason}
                  // Allow view only accounts or if no funds for gas to add to cart even if the txn is not ready to sign
                  // because they can't sign it anyway
                  isAddToCartDisabled={isAddToCartDisabled}
                  onSign={onSignButtonClick}
                  inProgressButtonText={primaryButtonText}
                  buttonText={signButtonText}
                  shouldHoldToProceed={shouldHoldToProceed}
                  shouldRejectOnchain={shouldRejectOnchain}
                  isRejectDisabled={isCancelDisabled}
                  holdToProceedButtonType={holdToProceedButtonType}
                  signButtonType={extremeGasFeeSignButtonType}
                />
              </View>
            </GlassView>
          </View>
        )}
      >
        {signAccountOpState && (
          <KeySelect
            isSigning={isSignLoading || !signAccountOpState.readyToSign}
            isChooseSignerShown={isChooseSignerShown}
            isChooseFeePayerKeyShown={isChooseFeePayerKeyShown}
            handleChooseKey={
              isChooseFeePayerKeyShown ? handleChangeFeePayerKeyType : handleChangeSigningKey
            }
            account={signAccountOpState.account}
            selectedAccountKeyStoreKeys={
              isChooseFeePayerKeyShown
                ? signAccountOpState.feePayerKeyStoreKeys
                : signAccountOpState.accountKeyStoreKeys
            }
            handleClose={() => {
              setIsChooseSignerShown(false)
              setIsChooseFeePayerKeyShown(false)
            }}
          />
        )}
        <TabLayoutWrapperMainContent withScroll={false} contentContainerStyle={spacings.mtSm}>
          {shouldUseSafeAccountTabs ? (
            <SafeAccountTabs
              activeTab={activeSafeAccountTab}
              networkChainId={network?.chainId}
              onTabChange={handleSafeAccountTabChange}
            />
          ) : isSidePanel && signAccountOpState?.account.safeCreation ? (
            <SafeNonce withNetwork />
          ) : (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignStart,
                flexbox.justifySpaceBetween,
                spacings.mb
              ]}
            >
              <SectionHeading withMb={false}>{t('Overview')}</SectionHeading>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <SafeNonce />
                <NetworkBadge
                  chainId={network?.chainId}
                  withOnPrefix
                  style={signAccountOpState?.account.safeCreation ? spacings.mlSm : undefined}
                />
              </View>
            </View>
          )}
          {/* TabLayoutWrapperMainContent supports scroll but the logic that determines the height
          of the content doesn't work with it, so we use a ScrollView here */}
          <ScrollView
            onScroll={handleScroll}
            onLayout={handleLayout}
            onContentSizeChange={handleContentSizeChange}
            scrollEventThrottle={16}
            style={contentHeight > containerHeight ? spacings.prMi : {}}
          >
            {isOverviewTabActive ? (
              <>
                <PendingTransactions
                  network={network}
                  setDelegation={signAccountOpState?.accountOp.meta?.setDelegation}
                  delegatedContract={signAccountOpState?.delegatedContract}
                  hideDeleteIcon={!!signAccountOpState?.accountOp.signed?.length}
                  size="md"
                />

                {/* Display errors only if the user is not in view-only mode */}
                {signAccountOpState?.errors?.length && !isViewOnly ? (
                  <ErrorInformation />
                ) : (
                  <>
                    <Simulation
                      network={network}
                      isViewOnly={isViewOnly}
                      isEstimationComplete={!!signAccountOpState?.isInitialized && !!network}
                    />
                    {!shouldUseSafeAccountTabs && (
                      <SafeEip712Data
                        accountAddr={signAccountOpState?.accountOp.accountAddr}
                        chainId={signAccountOpState?.accountOp.chainId}
                        safeEip712Data={signAccountOpState?.safeEip712Data}
                      />
                    )}
                  </>
                )}
                {signAccountOpState?.hasSafeApiFailed && (
                  <Alert
                    size="sm"
                    type="warning"
                    title={t('Safe API failure')}
                    text={t('Transaction was not sent to Safe Global due to a Safe API failure')}
                    style={spacings.mt}
                  />
                )}
                {isViewOnly && (
                  <NoKeysToSignAlert
                    style={spacings.mt}
                    chainId={signAccountOpState?.accountOp?.chainId}
                  />
                )}
              </>
            ) : (
              // The Hashes/Parsed/Raw sub-tabs are flattened into SafeAccountTabs above, so the
              // active one drives this instance instead of it rendering its own tab bar.
              <SafeEip712Data
                accountAddr={signAccountOpState?.accountOp.accountAddr}
                chainId={signAccountOpState?.accountOp.chainId}
                safeEip712Data={signAccountOpState?.safeEip712Data}
                withTitle={false}
                hideTabs
                activeTab={activeSafeAccountTab as SafeEip712ActiveTab}
                onTabChange={handleSafeAccountTabChange}
              />
            )}
          </ScrollView>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default memo(SignAccountOpScreen)
