import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import BottomSheet from '@common/components/BottomSheet'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import useController from '@common/hooks/useController'
import SignAccountOpHardwareWalletSigningModal from '@common/modules/sign-account-op/components/SignAccountOpHardwareWalletSigningModal'
import { ModalsProps } from '@common/modules/sign-account-op/types/modals'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import QrSigningFlowScreen from '@web/modules/hardware-wallet/screens/QrSigningFlowScreen'

const { isTab } = getUiType()

const Modals: FC<ModalsProps> = ({
  renderedButNotNecessarilyVisibleModal,
  signAccountOpState,
  warningModalRef,
  feePayerKeyType,
  signingKeyType,
  slowPaymasterRequest,
  shouldDisplayLedgerConnectModal,
  handleDismissLedgerConnectModal,
  shouldDisplayQrSigningModal,
  handleQrSingingFlowOnContinuePressed,
  handleQrSigningFlowSubmitSignatureResponse,
  handleQrSigningFlowOnClosePressed,
  handleQrSigningFlowOnRejectPressed,
  handleQrSigningFlowOnBackPressed,
  currentRequest,
  signingStep,
  warningToPromptBeforeSign,
  acknowledgeWarning,
  dismissWarning,
  autoOpen,
  actionType
}) => {
  const { t } = useTranslation()
  const {
    state: { signAccountOpController: swapAndBridgeSignAccountOp },
    dispatch: swapAndBridgeDispatch
  } = useController('SwapAndBridgeController')
  const {
    state: { signAccountOpController: transferSignAccountOp },
    dispatch: transferDispatch
  } = useController('TransferController')
  const { state: currentSignAccountOp, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController')
  const transactionProgress = useMemo(() => {
    const totalTransactions = signAccountOpState?.accountOp?.calls?.length || 0
    const signedTransactionsCount = signAccountOpState?.signedTransactionsCount

    if (
      totalTransactions <= 1 ||
      typeof signedTransactionsCount !== 'number' ||
      signedTransactionsCount < 0
    )
      return null

    return {
      current: Math.min(signedTransactionsCount, totalTransactions),
      total: totalTransactions
    }
  }, [signAccountOpState?.accountOp?.calls?.length, signAccountOpState?.signedTransactionsCount])

  if (renderedButNotNecessarilyVisibleModal === 'warnings') {
    return (
      <BottomSheet
        id="warning-modal"
        closeBottomSheet={!slowPaymasterRequest ? dismissWarning : undefined}
        sheetRef={warningModalRef}
        type={isTab ? 'modal' : 'bottom-sheet'}
        withBackdropBlur={false}
        shouldBeClosableOnDrag={false}
        autoOpen={autoOpen === 'warnings'}
      >
        {warningToPromptBeforeSign && (
          <DualChoiceWarningModal
            title={t(warningToPromptBeforeSign.title)}
            description={t(warningToPromptBeforeSign.text || '')}
            primaryButtonText={t('Proceed')}
            secondaryButtonText={t('Cancel')}
            onPrimaryButtonPress={acknowledgeWarning}
            onSecondaryButtonPress={dismissWarning}
            type={warningToPromptBeforeSign?.type}
          />
        )}
        {slowPaymasterRequest && (
          <DualChoiceWarningModal.Wrapper>
            <DualChoiceWarningModal.ContentWrapper>
              <DualChoiceWarningModal.TitleAndIcon
                title={t('Sending transaction is taking longer than expected')}
                style={spacings.mbTy}
              />
              <DualChoiceWarningModal.Text
                style={{ ...text.center, ...spacings.mbLg }}
                text={t('Please wait...')}
                weight="medium"
              />
              <DualChoiceWarningModal.Text
                style={{ ...text.center, fontSize: 14, ...spacings.mb }}
                text={t('(Reason: paymaster is taking longer than expected)')}
              />
            </DualChoiceWarningModal.ContentWrapper>
          </DualChoiceWarningModal.Wrapper>
        )}
      </BottomSheet>
    )
  }

  if (renderedButNotNecessarilyVisibleModal === 'ledger-connect') {
    return (
      <LedgerConnectModal
        isVisible={shouldDisplayLedgerConnectModal}
        handleClose={handleDismissLedgerConnectModal}
        displayOptionToAuthorize={false}
      />
    )
  }

  if (renderedButNotNecessarilyVisibleModal === 'qr-sign' && currentRequest && signingStep) {
    return (
      <QrSigningFlowScreen
        handleClose={handleQrSigningFlowOnClosePressed}
        isVisible={shouldDisplayQrSigningModal}
        onContinue={handleQrSingingFlowOnContinuePressed}
        currentRequest={currentRequest}
        signingStep={signingStep}
        transactionProgress={transactionProgress}
        submitSignatureResponse={handleQrSigningFlowSubmitSignatureResponse}
        onReject={handleQrSigningFlowOnRejectPressed}
        handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
      />
    )
  }

  if (renderedButNotNecessarilyVisibleModal === 'hw-sign' && signAccountOpState) {
    return (
      <SignAccountOpHardwareWalletSigningModal
        signingKeyType={signingKeyType}
        feePayerKeyType={feePayerKeyType}
        isSignAndBroadcastInProgress={(() => {
          if (actionType === 'swapAndBridge') {
            return !!swapAndBridgeSignAccountOp?.isSignAndBroadcastInProgress
          }
          if (actionType === 'transfer') {
            return !!transferSignAccountOp?.isSignAndBroadcastInProgress
          }

          return currentSignAccountOp ? currentSignAccountOp.isSignAndBroadcastInProgress : false
        })()}
        signAccountOpStatusType={signAccountOpState.status?.type}
        shouldSignAuth={signAccountOpState.shouldSignAuth}
        signedTransactionsCount={signAccountOpState.signedTransactionsCount}
        accountOp={signAccountOpState.accountOp}
        actionType={actionType}
        cancelReq={() => {
          if (actionType === 'swapAndBridge') {
            return swapAndBridgeDispatch({
              type: 'method',
              params: {
                method: 'cancelSignReq',
                args: []
              }
            })
          }
          if (actionType === 'transfer') {
            return transferDispatch({
              type: 'method',
              params: {
                method: 'cancelSignReq',
                args: []
              }
            })
          }

          signAccountOpDispatch({
            type: 'method',
            params: {
              method: 'cancelSignReq',
              args: []
            }
          })
        }}
      />
    )
  }

  return null
}

export default Modals
