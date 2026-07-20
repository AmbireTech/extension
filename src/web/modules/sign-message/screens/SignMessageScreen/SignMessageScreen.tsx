import React from 'react'
import { StyleSheet, View } from 'react-native'

import HoldToProceedButton from '@common/components/HoldToProceedButton'
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
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

const SignMessageScreen = () => {
  const {
    signMessageState,
    signStatus,
    humanizedMessage,
    isHumanizing,
    hasReachedBottom,
    setHasReachedBottom,
    account,
    selectedAccountKeyStoreKeys,
    isViewOnly,
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
    holdToProceedButtonText,
    holdToProceedCompleteText,
    hasSafetyBanners,
    holdToProceedButtonType,
    isResolveActionDisabled
  } = useSignMessage()

  // In the split second when the request window opens, but the state is not yet
  // initialized, to prevent a flash of the fallback visualization, show a
  // loading spinner instead (would better be a skeleton, but whatever).
  if (!signMessageState.isInitialized || !account || !userRequest) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Spinner />
      </View>
    )
  }

  return (
    <SmallNotificationWindowWrapper>
      <TabLayoutContainer
        width="full"
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
                onSignLater={() => closeCurrentWindow()}
              />
            )
          }

          return (
            <ActionFooter
              onReject={handleReject}
              onResolve={signWithDefaultSignerIfPossible}
              resolveButtonText={resolveButtonText}
              resolveDisabled={isResolveActionDisabled}
              resolveButtonTestID="button-sign"
              rejectButtonText="Reject"
              {...(hasSafetyBanners && !isViewOnly
                ? {
                    resolveNode: (
                      <View style={flexbox.flex1}>
                        <HoldToProceedButton
                          testID="button-sign"
                          style={{
                            ...flexbox.alignSelfEnd,
                            minWidth: 128
                          }}
                          textStyle={{
                            whiteSpace: 'nowrap'
                          }}
                          size="large"
                          text={holdToProceedButtonText}
                          completeText={holdToProceedCompleteText}
                          buttonType={holdToProceedButtonType}
                          onHoldComplete={signWithDefaultSignerIfPossible}
                          disabled={isResolveActionDisabled}
                        />
                      </View>
                    )
                  }
                : {})}
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
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(SignMessageScreen)
