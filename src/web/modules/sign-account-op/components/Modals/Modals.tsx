import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import useController from '@common/hooks/useController'
import useSign from '@common/hooks/useSign'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import SignAccountOpHardwareWalletSigningModal from '@web/modules/sign-account-op/components/SignAccountOpHardwareWalletSigningModal'

const { isTab } = getUiType()

type Props = Pick<
  ReturnType<typeof useSign>,
  | 'renderedButNotNecessarilyVisibleModal'
  | 'warningModalRef'
  | 'feePayerKeyType'
  | 'signingKeyType'
  | 'slowPaymasterRequest'
  | 'shouldDisplayLedgerConnectModal'
  | 'handleDismissLedgerConnectModal'
  | 'warningToPromptBeforeSign'
  | 'acknowledgeWarning'
  | 'dismissWarning'
> & {
  signAccountOpState: ISignAccountOpController | null
  autoOpen?: 'warnings'
  actionType?: 'swapAndBridge' | 'transfer'
}

const Modals: FC<Props> = ({
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
