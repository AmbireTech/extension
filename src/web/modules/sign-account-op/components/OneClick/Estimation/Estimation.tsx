import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
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
import useSign from '@common/hooks/useSign'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import BundlerWarning from '@web/modules/sign-account-op/components/Estimation/components/bundlerWarning'
import Modals from '@web/modules/sign-account-op/components/Modals/Modals'
import SafeOwners from '@web/modules/sign-account-op/components/SafeOwners'
import SafetyChecksBanner from '@web/modules/sign-account-op/components/SafetyChecksBanner'
import KeySelect from '@web/modules/sign-message/components/KeySelect'

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
}

const { isRequestWindow, isTab } = getUiType()

const OneClickEstimation = ({
  closeEstimationModal,
  handleUpdateStatus,
  updateController,
  estimationModalRef,
  signAccountOpController,
  hasProceeded,
  errors,
  updateType,
  serviceFee
}: OneClickEstimationProps) => {
  const { t } = useTranslation()

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
    handleSetMultisigSigners,
    onSignButtonClick,
    isSignDisabled,
    warningToPromptBeforeSign,
    warningModalRef,
    dismissWarning,
    acknowledgeWarning,
    handleChangeFeePayerKeyType,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    slowPaymasterRequest,
    primaryButtonText,
    bundlerNonceDiscrepancy
  } = useSign({
    signAccountOpState: signAccountOpController,
    handleUpdate: updateController,
    handleUpdateStatus,
    isOneClickSign: true,
    updateType
  })

  const { banners } = signAccountOpController || {}
  return (
    <>
      <BottomSheet
        id="estimation-modal"
        sheetRef={estimationModalRef}
        type={isTab ? 'modal' : 'bottom-sheet'}
        // NOTE: This must be lower than SigningKeySelect's z-index
        customZIndex={5}
        style={spacings.pb}
        autoOpen={hasProceeded || (isRequestWindow && !!signAccountOpController)}
        isScrollEnabled={false}
        shouldBeClosableOnDrag={false}
      >
        {!!banners && !!banners.length && (
          <View style={spacings.mbTy}>
            {banners.map((banner) => (
              <SafetyChecksBanner
                key={banner.id}
                type={banner.type}
                text={banner.text}
                style={spacings.mbTy}
              />
            ))}
          </View>
        )}
        {!!signAccountOpController && (
          <View>
            <KeySelect
              isSigning={isSignLoading || !signAccountOpController.readyToSign}
              isChooseSignerShown={isChooseSignerShown}
              isChooseFeePayerKeyShown={isChooseFeePayerKeyShown}
              handleSetMultisigSigners={handleSetMultisigSigners}
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
              signed={signAccountOpController.accountOp.signed || []}
              threshold={signAccountOpController.threshold}
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
              />
            )}
            {signAccountOpController &&
              signingErrors.length === 0 &&
              !signAccountOpController.canBroadcast &&
              !!signAccountOpController.account.safeCreation && (
                <ScrollView style={[{ maxHeight: 240 }]}>
                  <SafeOwners signAccountOpController={signAccountOpController} />
                </ScrollView>
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
            />
            <FooterGlassView size="sm" absolute={false} style={spacings.pt}>
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

              {!!banners && !!banners.length ? (
                <HoldToProceedButton
                  testID="sign-proceed-btn"
                  text={t('Hold to sign')}
                  disabled={isSignDisabled || signingErrors.length > 0}
                  onHoldComplete={onSignButtonClick}
                  size="smaller"
                />
              ) : (
                <ButtonWithLoader
                  testID="sign-button"
                  text={primaryButtonText}
                  isLoading={isSignLoading}
                  disabled={isSignDisabled || signingErrors.length > 0}
                  onPress={onSignButtonClick}
                  size="smaller"
                />
              )}
            </FooterGlassView>
          </View>
        )}
      </BottomSheet>
      <Modals
        renderedButNotNecessarilyVisibleModal={renderedButNotNecessarilyVisibleModal}
        signAccountOpState={signAccountOpController}
        warningModalRef={warningModalRef}
        feePayerKeyType={feePayerKeyType}
        signingKeyType={signingKeyType}
        slowPaymasterRequest={slowPaymasterRequest}
        shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
        handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
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
            : undefined
        }
        actionType={updateType === 'Swap&Bridge' ? 'swapAndBridge' : 'transfer'}
      />
    </>
  )
}

export default OneClickEstimation
