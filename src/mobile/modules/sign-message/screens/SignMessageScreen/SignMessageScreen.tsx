import React from 'react'
import { StyleSheet, View } from 'react-native'

import HoldToProceedButton from '@common/components/HoldToProceedButton'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Spinner from '@common/components/Spinner'
import SigningAuthBottomSheet from '@common/components/SigningAuthBottomSheet'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import Main from '@common/modules/sign-message/components/Contents/main'
import SignInWithEthereum from '@common/modules/sign-message/components/Contents/signInWithEthereum'
import KeySelect from '@common/modules/sign-message/components/KeySelect'
import SafeFooter from '@common/modules/sign-message/components/SafeFooter'
import SignWarningModal from '@common/modules/sign-message/components/SignWarningModal'
import useSignMessage from '@common/modules/sign-message/hooks/useSignMessage'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const SignMessageScreen = () => {
  const {
    t,
    signMessageState,
    signStatus,
    humanizedMessage,
    isHumanizing,
    hasReachedBottom,
    setHasReachedBottom,
    account,
    selectedAccountKeyStoreKeys,
    isViewOnly,
    hasOnlyUnsupportedKeys,
    userRequest,
    isLedgerConnected,
    isChooseSignerShown,
    setIsChooseSignerShown,
    shouldDisplayLedgerConnectModal,
    currentRequest,
    signingStep,
    moveToResponseScan,
    submitSignatureResponse,
    handleReject,
    handleQrSigningFlowOnBackPressed,
    handleQrSigningFlowOnRejectPressed,
    setSigner,
    signWithDefaultSignerIfPossible,
    resolveButtonText,
    handleDismissLedgerConnectModal,
    shouldDisplayEIP1271Warning,
    view,
    threshold,
    isSafeNotDeployed,
    isLoading,
    signingAuthSheetRef,
    cancelSigningAuth,
    signingAuthProps,
    holdToProceedButtonText,
    holdToProceedCompleteText,
    hasSafetyBanners,
    holdToProceedButtonType,
    isResolveActionDisabled,
    warningToConfirmBeforeSign,
    warningModalRef,
    confirmWarning,
    dismissWarning
  } = useSignMessage()
  const { styles } = useTheme(getStyles)

  if (isLoading || !account || !userRequest) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Spinner />
      </View>
    )
  }

  return (
    <MobileLayoutContainer
      withHorizontalPadding
      header={<ActionHeader />}
      footerStyle={{ ...spacings.ph0, ...spacings.pt0 }}
      footer={
        <View style={styles.footerContainer}>
          {!!account.safeCreation && hasOnlyUnsupportedKeys && (
            <View style={[spacings.phSm, spacings.ptSm]}>
              <NoKeysToSignAlert
                type="long"
                isTransaction={false}
                chainId={signMessageState.network?.chainId}
              />
            </View>
          )}
          {!!account.safeCreation ? (
            <SafeFooter
              account={account}
              isSignLoading={signStatus === 'LOADING'}
              onSign={setSigner}
              chainId={userRequest.meta.chainId.toString()}
              signed={signMessageState.signed || []}
              importedKeys={selectedAccountKeyStoreKeys}
              threshold={threshold}
              // the first signer from the array is the current one
              signingKeyAddr={signMessageState.signers?.[0]?.addr || ''}
              onReject={handleReject}
            />
          ) : (
            <ActionFooter
              onReject={handleReject}
              onResolve={signWithDefaultSignerIfPossible}
              resolveButtonText={resolveButtonText}
              resolveDisabled={isResolveActionDisabled}
              resolveButtonTestID="button-sign"
              rejectButtonText="Reject"
              withRejectOptions
              rejectOptionsTitle={t('Reject request')}
              rejectOptionText={t('Reject this request')}
              resolveNode={
                hasSafetyBanners && !isViewOnly ? (
                  <View style={flexbox.flex1}>
                    <HoldToProceedButton
                      testID="button-sign"
                      size="large"
                      text={holdToProceedButtonText}
                      completeText={holdToProceedCompleteText}
                      buttonType={holdToProceedButtonType}
                      onHoldComplete={signWithDefaultSignerIfPossible}
                      disabled={isResolveActionDisabled}
                    />
                  </View>
                ) : undefined
              }
            >
              {isViewOnly && (
                <View style={[spacings.mbSm]}>
                  <NoKeysToSignAlert
                    // In full, like on the sign transaction screen, to explain what to do
                    type={hasOnlyUnsupportedKeys ? 'long' : 'short'}
                    isTransaction={false}
                    chainId={signMessageState.network?.chainId}
                  />
                </View>
              )}
            </ActionFooter>
          )}
        </View>
      }
    >
      <SigningAuthBottomSheet
        sheetRef={signingAuthSheetRef}
        onCancel={cancelSigningAuth}
        {...signingAuthProps}
      />
      <KeySelect
        isSigning={signStatus === 'LOADING'}
        handleChooseKey={setSigner}
        isChooseSignerShown={isChooseSignerShown}
        isChooseFeePayerKeyShown={false}
        handleClose={() => setIsChooseSignerShown(false)}
        selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
        account={account}
      />
      {!!warningToConfirmBeforeSign && (
        <SignWarningModal
          sheetRef={warningModalRef}
          warning={warningToConfirmBeforeSign}
          onConfirm={confirmWarning}
          onCancel={dismissWarning}
        />
      )}
      {view === 'reinitializing' && (
        <View style={[StyleSheet.absoluteFill, flexbox.center]}>
          <Spinner />
        </View>
      )}
      {view === 'sign-message' && (
        <Main
          shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
          isLedgerConnected={isLedgerConnected}
          handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
          hasReachedBottom={hasReachedBottom}
          setHasReachedBottom={setHasReachedBottom}
          shouldDisplayEIP1271Warning={shouldDisplayEIP1271Warning}
          isSafeNotDeployed={isSafeNotDeployed}
          currentRequest={currentRequest}
          signingStep={signingStep}
          handleOnContinue={moveToResponseScan}
          handleSubmitSignatureResponse={submitSignatureResponse}
          handleQrSigningFlowOnRejectPressed={handleQrSigningFlowOnRejectPressed}
          handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
          humanizedMessage={humanizedMessage}
          isHumanizing={isHumanizing}
        />
      )}
      {view === 'siwe' && (
        <SignInWithEthereum
          shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
          isLedgerConnected={isLedgerConnected}
          handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
          isSafeNotDeployed={isSafeNotDeployed}
          currentRequest={currentRequest}
          signingStep={signingStep}
          handleOnContinue={moveToResponseScan}
          handleSubmitSignatureResponse={submitSignatureResponse}
          handleQrSigningFlowOnRejectPressed={handleQrSigningFlowOnRejectPressed}
          handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
        />
      )}
    </MobileLayoutContainer>
  )
}

export default React.memo(SignMessageScreen)
