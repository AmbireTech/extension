import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SigningStatus } from '@ambire-common/interfaces/signAccountOp'
import { Key } from '@ambire-common/interfaces/keystore'
import {
  ISignAccountOpController,
  SignAccountOpError
} from '@ambire-common/interfaces/signAccountOp'
import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FooterGlassView from '@common/components/FooterGlassView'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import SigningAuthBottomSheet from '@common/components/SigningAuthBottomSheet'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useSign from '@common/hooks/useSign'
import Estimation from '@common/modules/sign-account-op/components/Estimation'
import BundlerWarning from '@common/modules/sign-account-op/components/Estimation/components/bundlerWarning'
import PendingTransactions from '@common/modules/sign-account-op/components/PendingTransactions'
import SafetyChecksBanner from '@common/modules/sign-account-op/components/SafetyChecksBanner'
import { ModalsProps } from '@common/modules/sign-account-op/types/modals'
import KeySelect from '@common/modules/sign-message/components/KeySelect'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export type OneClickEstimationProps = {
  closeEstimationModal: () => void
  handleUpdateStatus: (status: SigningStatus) => void
  updateController: (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => void
  estimationModalRef: React.RefObject<any>
  errors?: SignAccountOpError[]
  signAccountOpController: ISignAccountOpController | null
  hasProceeded: boolean
  updateType: 'Swap&Bridge' | 'Transfer&TopUp'
  serviceFee?: SwapAndBridgeRoute['serviceFee']
  shouldShowTxnDetails?: boolean
  Modals: React.ComponentType<ModalsProps>
}

const { isRequestWindow, isTab, isSidePanel } = getUiType()

// The footer takes over the bottom inset, so the scroll content doesn't pad above it too
const MOBILE_SCROLL_VIEW_PROPS = { contentContainerStyle: { paddingBottom: 0 } }

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const OneClickEstimation = ({
  closeEstimationModal,
  handleUpdateStatus,
  updateController,
  estimationModalRef,
  signAccountOpController,
  hasProceeded,
  errors,
  updateType,
  serviceFee,
  shouldShowTxnDetails = false,
  Modals
}: OneClickEstimationProps) => {
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const { isNarrowWebLayout, isCompactLayout } = useCompactLayout()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const chainId = signAccountOpController?.accountOp.chainId
  const network = useMemo(() => networks.find((n) => n.chainId === chainId), [networks, chainId])
  const hasFreshActionPressRef = useRef(false)
  // On web the back arrow next to "Network fee" replaces the Back button, which stays only as a
  // fallback while that title isn't shown, since the sheet can't be closed any other way there
  const [isFeeHeaderVisible, setIsFeeHeaderVisible] = useState(false)
  const shouldShowBackButton = !isMobile && !isFeeHeaderVisible

  const signingErrors = useMemo(() => {
    const signAccountOpErrors = signAccountOpController ? signAccountOpController.errors : []
    return [...(errors || []), ...signAccountOpErrors]
  }, [errors, signAccountOpController])

  const {
    isViewOnly,
    hasEstimation,
    signingKeyType,
    feePayerKeyType,
    handleDismissLedgerConnectModal,
    shouldDisplayLedgerConnectModal,
    isChooseSignerShown,
    setIsChooseSignerShown,
    isSignLoading,
    renderedButNotNecessarilyVisibleModal,
    handleChangeSigningKey,
    onSignButtonClick,
    isSignDisabled,
    warningToPromptBeforeSign,
    warningModalRef,
    gasFeeUpdatedModalRef,
    handleAcceptGasFeeUpdate,
    handleDismissGasFeeUpdate,
    dismissWarning,
    acknowledgeWarning,
    handleChangeFeePayerKeyType,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    slowPaymasterRequest,
    signButtonText,
    extremeGasFeeSignButtonType,
    bundlerNonceDiscrepancy,
    shouldDisplayQrSigningModal,
    handleQrSigningFlowOnContinuePressed,
    handleQrSigningFlowSubmitSignatureResponse,
    handleQrSigningFlowOnClosePressed,
    handleQrSigningFlowOnRejectPressed,
    handleQrSigningFlowOnBackPressed,
    currentRequest,
    signingStep,
    signingAuthSheetRef,
    cancelSigningAuth,
    signingAuthProps
  } = useSign({
    signAccountOpState: signAccountOpController,
    handleUpdate: updateController,
    handleUpdateStatus,
    isOneClickSign: true,
    updateType
  })
  const { banners } = signAccountOpController || {}

  // Disabled while signing, like the Back button
  const handleBackPress = useCallback(() => {
    if (isSignLoading) return
    closeEstimationModal()
  }, [closeEstimationModal, isSignLoading])

  // The narrow side panel stacks full-width buttons in a plain view like mobile
  const ButtonsWrapper = isCompactLayout ? View : FooterGlassView

  useEffect(() => {
    // Require a fresh click/press for each newly opened estimation flow.
    hasFreshActionPressRef.current = false
  }, [hasProceeded, signAccountOpController?.fromRequestId])

  const markFreshActionPress = useCallback(() => {
    hasFreshActionPressRef.current = true
  }, [])

  const runWithFreshActionPress = useCallback((action: () => void) => {
    if (isWeb && !hasFreshActionPressRef.current) return

    // Consume once to prevent accidental repeats in the same interaction cycle.
    hasFreshActionPressRef.current = false
    action()
  }, [])

  // Everything from the network fee down is the sheet's footer, so it stays visible while the
  // transaction details above it scroll
  const footerComponent = useMemo(() => {
    if (!signAccountOpController) return null

    return (
      <View style={isMobile ? { paddingBottom: bottom || SPACING_SM } : undefined}>
        <KeySelect
          isSigning={isSignLoading || !signAccountOpController.readyToSign}
          isChooseSignerShown={isChooseSignerShown}
          isChooseFeePayerKeyShown={isChooseFeePayerKeyShown}
          handleChooseKey={
            isChooseFeePayerKeyShown ? handleChangeFeePayerKeyType : handleChangeSigningKey
          }
          account={signAccountOpController.account}
          selectedAccountKeyStoreKeys={
            isChooseFeePayerKeyShown
              ? signAccountOpController.feePayerKeyStoreKeys
              : signAccountOpController.accountKeyStoreKeys
          }
          handleClose={() => {
            setIsChooseSignerShown(false)
            setIsChooseFeePayerKeyShown(false)
          }}
        />
        {signAccountOpController?.canBroadcast && (
          <Estimation
            updateType={updateType}
            signAccountOpState={signAccountOpController}
            disabled={signAccountOpController.status?.type !== SigningStatus.ReadyToSign}
            hasEstimation={!!hasEstimation}
            // TODO<oneClickSwap>
            slowRequest={false}
            // TODO<oneClickSwap>
            isViewOnly={isViewOnly}
            isSponsored={signAccountOpController ? signAccountOpController.isSponsored : false}
            sponsor={signAccountOpController ? signAccountOpController.sponsor : undefined}
            serviceFee={serviceFee}
            isOneClick
            onBackPress={isWeb ? handleBackPress : undefined}
            onFeeHeaderVisibilityChange={setIsFeeHeaderVisible}
          />
        )}
        {isViewOnly && (
          <NoKeysToSignAlert
            style={spacings.mt}
            chainId={signAccountOpController?.accountOp?.chainId}
          />
        )}
        {!isViewOnly && signingErrors && signingErrors[0] && (
          <Alert title={t(signingErrors[0].title)} type="error" style={spacings.mt} />
        )}
        <BundlerWarning
          signAccountOpState={signAccountOpController}
          bundlerNonceDiscrepancy={bundlerNonceDiscrepancy}
          hasMarginTop
        />
        <ButtonsWrapper
          size="sm"
          absolute={false}
          isSimpleBlur={false}
          style={isCompactLayout ? { ...spacings.ptLg, gap: SPACING_TY } : spacings.pt}
        >
          {shouldShowBackButton && !isNarrowWebLayout && (
            <Button
              testID="back-button"
              type="secondary"
              text={t('Back')}
              onPress={closeEstimationModal}
              hasBottomSpacing={false}
              disabled={isSignLoading}
              style={{ width: 98, ...spacings.mrLg }}
              size="smaller"
            />
          )}

          {!!banners && !!banners.length ? (
            <HoldToProceedButton
              testID="sign-proceed-btn"
              text={t('Hold to sign')}
              buttonType={extremeGasFeeSignButtonType === 'warning' ? 'warning' : 'primary'}
              disabled={isSignDisabled || signingErrors.length > 0}
              onPressIn={markFreshActionPress}
              onHoldComplete={() => runWithFreshActionPress(onSignButtonClick)}
              size={isCompactLayout ? 'regular' : 'smaller'}
            />
          ) : (
            <ButtonWithLoader
              testID="sign-button"
              text={signButtonText}
              type={extremeGasFeeSignButtonType}
              isLoading={isSignLoading}
              disabled={isSignDisabled || signingErrors.length > 0}
              onPressIn={markFreshActionPress}
              onPress={() => runWithFreshActionPress(onSignButtonClick)}
              size={isCompactLayout ? 'regular' : 'smaller'}
            />
          )}

          {/* Side panel only: stack Back under the primary action */}
          {shouldShowBackButton && isNarrowWebLayout && (
            <Button
              testID="back-button"
              // The web secondary background matches the sheet, tertiary keeps it visible
              type="tertiary"
              text={t('Back')}
              onPress={closeEstimationModal}
              hasBottomSpacing={false}
              disabled={isSignLoading}
              size="regular"
            />
          )}
        </ButtonsWrapper>
      </View>
    )
  }, [
    signAccountOpController,
    bottom,
    ButtonsWrapper,
    banners,
    bundlerNonceDiscrepancy,
    closeEstimationModal,
    extremeGasFeeSignButtonType,
    handleChangeFeePayerKeyType,
    handleBackPress,
    handleChangeSigningKey,
    hasEstimation,
    isChooseFeePayerKeyShown,
    isChooseSignerShown,
    isCompactLayout,
    isNarrowWebLayout,
    isSignDisabled,
    isSignLoading,
    isViewOnly,
    markFreshActionPress,
    shouldShowBackButton,
    onSignButtonClick,
    runWithFreshActionPress,
    serviceFee,
    setIsChooseFeePayerKeyShown,
    setIsChooseSignerShown,
    signButtonText,
    signingErrors,
    t,
    updateType
  ])

  return (
    <>
      <BottomSheet
        id="estimation-modal"
        sheetRef={estimationModalRef}
        type={isTab && !isSidePanel ? 'modal' : 'bottom-sheet'}
        // NOTE: This must be lower than SigningKeySelect's z-index
        customZIndex={5}
        style={spacings.pb}
        closeBottomSheet={isWeb ? undefined : closeEstimationModal}
        autoOpen={hasProceeded || (isRequestWindow && !!signAccountOpController)}
        isScrollEnabled={isMobile || shouldShowTxnDetails}
        shouldBeClosableOnDrag={isMobile}
        FooterComponent={footerComponent}
        scrollViewProps={isMobile ? MOBILE_SCROLL_VIEW_PROPS : undefined}
      >
        {!!banners && !!banners.length && (
          <View style={spacings.mbTy}>
            {banners.map((banner) => (
              <SafetyChecksBanner
                key={banner.id}
                type={banner.type}
                title={banner.title}
                text={banner.text}
                secondaryText={banner.secondaryText}
                trustableDappUrls={banner.trustableDappUrls}
                style={spacings.mbTy}
              />
            ))}
          </View>
        )}
        {!!signAccountOpController && shouldShowTxnDetails && (
          // A small top margin keeps the sheet's drag handle vertically centered
          <View style={spacings.mtTy}>
            <PendingTransactions
              network={network}
              setDelegation={signAccountOpController.accountOp.meta?.setDelegation}
              delegatedContract={signAccountOpController.delegatedContract}
              hideDeleteIcon
              signAccountOpState={signAccountOpController}
              size="md"
            />
          </View>
        )}
      </BottomSheet>
      <SigningAuthBottomSheet
        sheetRef={signingAuthSheetRef}
        onCancel={cancelSigningAuth}
        {...signingAuthProps}
      />
      <Modals
        renderedButNotNecessarilyVisibleModal={renderedButNotNecessarilyVisibleModal}
        signAccountOpState={signAccountOpController}
        warningModalRef={warningModalRef}
        gasFeeUpdatedModalRef={gasFeeUpdatedModalRef}
        handleAcceptGasFeeUpdate={handleAcceptGasFeeUpdate}
        handleDismissGasFeeUpdate={handleDismissGasFeeUpdate}
        feePayerKeyType={feePayerKeyType}
        signingKeyType={signingKeyType}
        slowPaymasterRequest={slowPaymasterRequest}
        shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
        handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
        currentRequest={currentRequest}
        signingStep={signingStep}
        shouldDisplayQrSigningModal={shouldDisplayQrSigningModal}
        handleQrSigningFlowOnContinuePressed={handleQrSigningFlowOnContinuePressed}
        handleQrSigningFlowSubmitSignatureResponse={handleQrSigningFlowSubmitSignatureResponse}
        handleQrSigningFlowOnClosePressed={handleQrSigningFlowOnClosePressed}
        handleQrSigningFlowOnRejectPressed={handleQrSigningFlowOnRejectPressed}
        handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
        warningToPromptBeforeSign={warningToPromptBeforeSign}
        acknowledgeWarning={acknowledgeWarning}
        dismissWarning={dismissWarning}
        autoOpen={
          // Display the warning automatically if the user closed
          // the extension popup while the warning modal was open.
          warningToPromptBeforeSign &&
          renderedButNotNecessarilyVisibleModal === 'warnings' &&
          isSignLoading
            ? 'warnings'
            : renderedButNotNecessarilyVisibleModal === 'gas-fee-updated'
              ? 'gas-fee-updated'
              : undefined
        }
        actionType={updateType === 'Swap&Bridge' ? 'swapAndBridge' : 'transfer'}
      />
    </>
  )
}

export default OneClickEstimation
