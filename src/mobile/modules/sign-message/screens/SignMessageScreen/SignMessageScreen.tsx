/* eslint-disable @typescript-eslint/no-floating-promises */
import React from 'react'
import { StyleSheet, View } from 'react-native'

import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Spinner from '@common/components/Spinner'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import Main from '@common/modules/sign-message/components/Contents/main'
import SignInWithEthereum from '@common/modules/sign-message/components/Contents/signInWithEthereum'
import KeySelect from '@common/modules/sign-message/components/KeySelect'
import SafeFooter from '@common/modules/sign-message/components/SafeFooter'
import useSignMessage from '@common/modules/sign-message/hooks/useSignMessage'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'
import useHumanizedMessage from '@web/modules/sign-message/hooks/useHumanizedMessage'

const SignMessageScreen = () => {
  const {
    signMessageState,
    signStatus,
    hasReachedBottom,
    setHasReachedBottom,
    account,
    selectedAccountKeyStoreKeys,
    isViewOnly,
    humanizationHasBlockingWarnings,
    isScrollToBottomForced,
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
    isLoading
  } = useSignMessage()

  // include erc-7730
  const { humanizedMessage, isHumanizing } = useHumanizedMessage(signMessageState.messageToSign)

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
      renderDirectChildren={() => {
        if (account.safeCreation) {
          return (
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
          )
        }

        return (
          <ActionFooter
            onReject={handleReject}
            onResolve={signWithDefaultSignerIfPossible}
            resolveButtonText={resolveButtonText}
            resolveDisabled={
              signStatus === 'LOADING' ||
              isScrollToBottomForced ||
              isViewOnly ||
              humanizationHasBlockingWarnings ||
              isSafeNotDeployed
            }
            resolveButtonTestID="button-sign"
            rejectButtonText="Reject"
            {...(isViewOnly
              ? {
                  resolveNode: (
                    <View style={[{ flex: 3 }, flexbox.directionRow, flexbox.justifyEnd]}>
                      <NoKeysToSignAlert
                        type="short"
                        isTransaction={false}
                        chainId={signMessageState.network?.chainId}
                      />
                    </View>
                  )
                }
              : {})}
          />
        )
      }}
    >
      <KeySelect
        isSigning={signStatus === 'LOADING'}
        handleChooseKey={setSigner}
        isChooseSignerShown={isChooseSignerShown}
        isChooseFeePayerKeyShown={false}
        handleClose={() => setIsChooseSignerShown(false)}
        selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
        account={account}
      />
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
