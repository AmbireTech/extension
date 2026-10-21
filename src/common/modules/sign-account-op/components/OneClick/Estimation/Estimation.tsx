import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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
import Button, { BUTTON_HEIGHT } from '@common/components/Button'
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
import CompactFooterButtons, {
  COMPACT_FEE_TO_BUTTONS_SPACING
} from '@common/modules/sign-account-op/components/Footer/CompactFooterButtons'
import PendingTransactions from '@common/modules/sign-account-op/components/PendingTransactions'
import SafetyChecksBanner from '@common/modules/sign-account-op/components/SafetyChecksBanner'
import { ModalsProps } from '@common/modules/sign-account-op/types/modals'
import KeySelect from '@common/modules/sign-message/components/KeySelect'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export type OneClickEstimationProps = {
  closeEstimationModal: () => void
  /** Called once the sheet closed. Must only reset state, closing the sheet from it loops */
  onEstimationModalClosed?: () => void
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
// A full tab shows the estimation in a centered modal, everywhere else it's a bottom sheet with a dragger
const isEstimationSheetModal = isTab && !isSidePanel

// The footer takes over the bottom inset, so the scroll content doesn't pad above it too
const MOBILE_SCROLL_VIEW_PROPS = { contentContainerStyle: { paddingBottom: 0 } }

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const OneClickEstimation = ({
  closeEstimationModal,
  onEstimationModalClosed,
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
  const { isCompactLayout } = useCompactLayout()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const chainId = signAccountOpController?.accountOp.chainId
  const network = useMemo(() => networks.find((n) => n.chainId === chainId), [networks, chainId])
  const hasFreshActionPressRef = useRef(false)

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
    holdToSignButtonText,
    extremeGasFeeSignButtonType,
    isLinkingNewFeePayerToSafe,
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

    // The wide footer keeps `smaller` buttons, but as tall as the compact ones
    const signButtonStyle = isCompactLayout ? { width: '100%' as const } : { height: BUTTON_HEIGHT }
    const signButton =
      (!!banners && !!banners.length) || isLinkingNewFeePayerToSafe ? (
        <HoldToProceedButton
          testID="sign-proceed-btn"
          text={holdToSignButtonText}
          buttonType={
            extremeGasFeeSignButtonType === 'warning' || isLinkingNewFeePayerToSafe
              ? 'warning'
              : 'primary'
          }
          disabled={isSignDisabled || signingErrors.length > 0}
          onPressIn={markFreshActionPress}
          onHoldComplete={() => runWithFreshActionPress(onSignButtonClick)}
          size={isCompactLayout ? 'regular' : 'smaller'}
          style={signButtonStyle}
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
          style={signButtonStyle}
        />
      )

    return (
      <View
        style={[
          // Keeps the fee header off the bottom sheet's dragger
          !isEstimationSheetModal && spacings.ptTy,
          // A bit more room above the home indicator, if the phone has one
          isMobile && { paddingBottom: bottom ? bottom + SPACING_TY : SPACING_SM }
        ]}
      >
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
        {isCompactLayout ? (
          <View style={{ paddingTop: COMPACT_FEE_TO_BUTTONS_SPACING }}>
            <CompactFooterButtons
              isEvenSplit
              secondaryActions={
                <Button
                  testID="back-button"
                  // The web secondary background matches the sheet, tertiary keeps it visible
                  type={isWeb ? 'tertiary' : 'secondary'}
                  text={t('Back')}
                  onPress={closeEstimationModal}
                  hasBottomSpacing={false}
                  disabled={isSignLoading}
                  size="regular"
                  style={flexbox.flex1}
                />
              }
              primaryAction={signButton}
            />
          </View>
        ) : (
          <FooterGlassView size="sm" absolute={false} isSimpleBlur={false} style={spacings.pt}>
            <Button
              testID="back-button"
              type="secondary"
              text={t('Back')}
              onPress={closeEstimationModal}
              hasBottomSpacing={false}
              disabled={isSignLoading}
              style={{ width: 98, height: BUTTON_HEIGHT, ...spacings.mrLg }}
              size="smaller"
            />
            {signButton}
          </FooterGlassView>
        )}
      </View>
    )
  }, [
    signAccountOpController,
    bottom,
    banners,
    isLinkingNewFeePayerToSafe,
    bundlerNonceDiscrepancy,
    closeEstimationModal,
    extremeGasFeeSignButtonType,
    handleChangeFeePayerKeyType,
    handleChangeSigningKey,
    hasEstimation,
    isChooseFeePayerKeyShown,
    isChooseSignerShown,
    isCompactLayout,
    isSignDisabled,
    isSignLoading,
    isViewOnly,
    markFreshActionPress,
    onSignButtonClick,
    runWithFreshActionPress,
    serviceFee,
    setIsChooseFeePayerKeyShown,
    setIsChooseSignerShown,
    signButtonText,
    holdToSignButtonText,
    signingErrors,
    t,
    updateType
  ])

  return (
    <>
      <BottomSheet
        id="estimation-modal"
        sheetRef={estimationModalRef}
        type={isEstimationSheetModal ? 'modal' : 'bottom-sheet'}
        // NOTE: This must be lower than SigningKeySelect's z-index
        customZIndex={5}
        style={spacings.pb}
        closeBottomSheet={isWeb ? undefined : closeEstimationModal}
        // Dragging the sheet down closes it without calling closeBottomSheet, which would leave the
        // flow marked as proceeded and the Proceed button disabled. Every other close already resets it
        onClosed={isMobile ? onEstimationModalClosed : undefined}
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
      {isMobile && (
        <SigningAuthBottomSheet
          sheetRef={signingAuthSheetRef}
          onCancel={cancelSigningAuth}
          {...signingAuthProps}
        />
      )}
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
