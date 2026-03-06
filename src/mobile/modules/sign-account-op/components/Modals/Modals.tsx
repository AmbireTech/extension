import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import BottomSheet from '@common/components/BottomSheet'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import useController from '@common/hooks/useController'
import SignAccountOpHardwareWalletSigningModal from '@common/modules/sign-account-op/components/SignAccountOpHardwareWalletSigningModal'
import { ModalsProps } from '@common/modules/sign-account-op/types/modals'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

const Modals: FC<ModalsProps> = ({
  renderedButNotNecessarilyVisibleModal,
  signAccountOpState,
  warningModalRef,
  feePayerKeyType,
  signingKeyType,
  slowPaymasterRequest,
  shouldDisplayLedgerConnectModal,
  handleDismissLedgerConnectModal,
  warningToPromptBeforeSign,
  acknowledgeWarning,
  dismissWarning,
  autoOpen,
  actionType
}) => {
  const { t } = useTranslation()
  const { signAccountOpController: swapAndBridgeSignAccountOp } =
    useController('SwapAndBridgeController').state
  const {
    state: { signAccountOpController: transferSignAccountOp }
  } = useController('TransferController')
  const currentSignAccountOp = useController('SignAccountOpController').state

  if (renderedButNotNecessarilyVisibleModal === 'warnings') {
    return (
      <BottomSheet
        id="warning-modal"
        closeBottomSheet={!slowPaymasterRequest ? dismissWarning : undefined}
        sheetRef={warningModalRef}
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
    // TODO: impl ledger connect modal
    return null
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
      />
    )
  }

  return null
}

export default Modals
