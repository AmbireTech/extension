import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, View } from 'react-native'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Key } from '@ambire-common/interfaces/keystore'
import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
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
import SafeOwners from '@common/modules/sign-account-op/components/SafeOwners'
import SafetyChecksOverlay from '@common/modules/sign-account-op/components/SafetyChecksOverlay'
import SectionHeading from '@common/modules/sign-account-op/components/SectionHeading'
import Simulation from '@common/modules/sign-account-op/components/Simulation'
import KeySelect from '@common/modules/sign-message/components/KeySelect'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import Modals from '@web/modules/sign-account-op/components/Modals/Modals'

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
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)

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
    warningToPromptBeforeSign,
    handleDismissLedgerConnectModal,
    slowPaymasterRequest,
    slowRequest,
    isSignLoading,
    hasEstimation,
    warningModalRef,
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
    shouldHoldToProceed,
    shouldDisplayQrSigningModal,
    handleQrSingingFlowOnContinuePressed,
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
    hasReachedBottom
  })

  const accountOpRequest = useMemo(() => {
    if (currentUserRequest?.kind !== 'calls') return undefined
    return currentUserRequest as CallsUserRequest
  }, [currentUserRequest])

  const handleRejectAccountOp = useCallback(() => {
    if (!accountOpRequest) return

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
  }, [requestsDispatch, accountOpRequest, visibleUserRequests.length])

  const handleAddToCart = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    closeCurrentWindow()
  }, [])

  useEffect(() => {
    if (isSignDisabled || !containerHeight || !contentHeight) return
    const isScrollNotVisible = contentHeight <= containerHeight

    if (setHasReachedBottom && !hasReachedBottom) setHasReachedBottom(isScrollNotVisible)
  }, [
    contentHeight,
    containerHeight,
    setHasReachedBottom,
    hasReachedBottom,
    hasEstimation,
    isSignDisabled
  ])

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
        handleQrSingingFlowOnContinuePressed={handleQrSingingFlowOnContinuePressed}
        handleQrSigningFlowSubmitSignatureResponse={handleQrSigningFlowSubmitSignatureResponse}
        handleQrSigningFlowOnClosePressed={handleQrSigningFlowOnClosePressed}
        handleQrSigningFlowOnRejectPressed={handleQrSigningFlowOnRejectPressed}
        handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
      />
      <TabLayoutContainer
        width="full"
        backgroundColor={theme.primaryBackground}
        withHorizontalPadding={false}
        style={spacings.phMd}
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <View style={[spacings.mh, spacings.mv]}>
            <GlassView>
              <View style={[spacings.ph, spacings.pv, flexbox.flex1]}>
                {!estimationFailed &&
                signAccountOpState?.canBroadcast &&
                signAccountOpState?.status?.type !== SigningStatus.Queued ? (
                  <View style={spacings.mbXl}>
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
                  buttonText={primaryButtonText}
                  shouldHoldToProceed={shouldHoldToProceed}
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
        <TabLayoutWrapperMainContent withScroll={false}>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mb
            ]}
          >
            <SectionHeading withMb={false}>{t('Overview')}</SectionHeading>
            <NetworkBadge chainId={network?.chainId} withOnPrefix />
          </View>
          {/* TabLayoutWrapperMainContent supports scroll but the logic that determines the height
          of the content doesn't work with it, so we use a ScrollView here */}
          <ScrollView
            onScroll={(e) => {
              if (isCloseToBottom(e.nativeEvent) && setHasReachedBottom) setHasReachedBottom(true)
            }}
            onLayout={(e) => {
              setContainerHeight(e.nativeEvent.layout.height)
            }}
            onContentSizeChange={(_, height) => {
              setContentHeight(height)
            }}
            scrollEventThrottle={16}
            style={contentHeight > containerHeight ? spacings.prMi : {}}
          >
            <PendingTransactions
              network={network}
              setDelegation={signAccountOpState?.accountOp.meta?.setDelegation}
              delegatedContract={signAccountOpState?.delegatedContract}
              hideDeleteIcon={!!signAccountOpState?.accountOp.signed?.length}
            />
            {/* Display errors only if the user is not in view-only mode */}
            {signAccountOpState?.errors?.length && !isViewOnly ? (
              <ErrorInformation />
            ) : (
              <Simulation
                network={network}
                isViewOnly={isViewOnly}
                isEstimationComplete={!!signAccountOpState?.isInitialized && !!network}
              />
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
            {isViewOnly && <NoKeysToSignAlert chainId={signAccountOpState?.accountOp?.chainId} />}
          </ScrollView>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(SignAccountOpScreen)
