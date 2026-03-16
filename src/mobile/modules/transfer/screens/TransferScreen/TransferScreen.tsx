import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import Alert from '@common/components/Alert'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useToast from '@common/hooks/useToast'
import BatchAdded from '@common/modules/sign-account-op/components/OneClick/BatchModal/BatchAdded'
import Estimation from '@common/modules/sign-account-op/components/OneClick/Estimation'
import TrackProgress from '@common/modules/sign-account-op/components/OneClick/TrackProgress'
import Completed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Completed'
import Failed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Failed'
import GasTankInfoModal from '@common/modules/transfer/components/GasTankInfoModal'
import SendForm from '@common/modules/transfer/components/SendForm/SendForm'
import useTransfer from '@common/modules/transfer/hooks/useTransfer'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import Modals from '@mobile/modules/sign-account-op/components/Modals'

const TransferScreen = ({ isTopUpScreen }: { isTopUpScreen?: boolean }) => {
  const { addToast } = useToast()
  const { t } = useTranslation()

  const {
    displayedView,
    submittedAccountOp,
    explorerLink,
    navigateOut,
    transferDispatch,
    buttons,
    handleGoBackPress,
    onBatchAddedPrimaryButtonPress,
    onBatchAddedSecondaryButtonPress,
    isTopUp,
    validationFormMsgs,
    isRecipientHumanizerKnownTokenOrSmartContract,
    isRecipientAddressUnknown,
    signAccountOpController,
    latestBroadcastedToken,
    hasProceeded,
    batchNetworkUserRequestsCount,
    transferState,
    amountFieldValue,
    setAmountFieldValue,
    addressStateFieldValue,
    setAddressStateFieldValue,
    addressInputState,
    hasGasTank,
    gasTankSheetRef,
    closeGasTankInfoBottomSheet,
    estimationModalRef,
    closeEstimationModalAndDispatch,
    updateController,
    handleUpdateStatus,
    portfolio,
    account
  } = useTransfer(!!isTopUpScreen)

  if (displayedView === 'loading') {
    return (
      <View style={[flexbox.flex1, flexbox.justifyCenter, flexbox.alignCenter]}>
        <Spinner />
      </View>
    )
  }

  if (displayedView === 'track') {
    const isLoading = submittedAccountOp?.status === AccountOpStatus.BroadcastedButNotConfirmed

    return (
      <TrackProgress
        onPrimaryButtonPress={navigateOut}
        secondaryButtonText={t('Add more')}
        handleClose={() => {
          transferDispatch({
            type: 'method',
            params: {
              method: 'destroyLatestBroadcastedAccountOp',
              args: []
            }
          })
        }}
      >
        {(submittedAccountOp?.status === AccountOpStatus.Success ||
          submittedAccountOp?.status === AccountOpStatus.UnknownButPastNonce ||
          isLoading) && (
          <Completed
            isLoading={isLoading}
            title={
              isLoading
                ? isTopUp
                  ? t('Confirming your top-up')
                  : t('Confirming your transfer')
                : isTopUp
                  ? t('Top up ready!')
                  : t('Transfer done!')
            }
            titleSecondary={
              isLoading
                ? t('Almost there!')
                : isTopUp
                  ? t('You can now use your gas tank')
                  : t('{{symbol}} delivered!', {
                      symbol: latestBroadcastedToken?.symbol || 'Token'
                    })
            }
            explorerLink={explorerLink}
            openExplorerText="View Transfer"
          />
        )}
        {/*
            Note: It's very unlikely for Transfer or Top-Up to fail. That's why we show a predefined error message.
            If it does fail, we need to retrieve the broadcast error from the main controller and display it here.
          */}
        {(submittedAccountOp?.status === AccountOpStatus.Failure ||
          submittedAccountOp?.status === AccountOpStatus.Rejected ||
          submittedAccountOp?.status === AccountOpStatus.BroadcastButStuck) && (
          <Failed
            title={t('Something went wrong!')}
            errorMessage={
              isTopUp
                ? t(
                    'Unable to top up the Gas tank. Please try again later or contact Ambire support.'
                  )
                : t(
                    "We couldn't complete your transfer. Please try again later or contact Ambire support."
                  )
            }
          />
        )}
      </TrackProgress>
    )
  }

  if (displayedView === 'batch') {
    return (
      <BatchAdded
        title={isTopUp ? t('Top Up Gas Tank') : t('Send')}
        callsCount={batchNetworkUserRequestsCount}
        primaryButtonText={t('Open dashboard')}
        secondaryButtonText={t('Add more')}
        onPrimaryButtonPress={onBatchAddedPrimaryButtonPress}
        onSecondaryButtonPress={onBatchAddedSecondaryButtonPress}
      />
    )
  }

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={handleGoBackPress}
        title={isTopUp ? t('Top Up Gas Tank') : t('Send')}
        withScroll
        keyboardAwareScrollViewProps={{ bottomOffset: 250 }}
      >
        {transferState?.isInitialized ? (
          <View>
            <SendForm
              addressInputState={addressInputState}
              hasGasTank={hasGasTank}
              amountErrorMessage={validationFormMsgs.amount.message || ''}
              isRecipientAddressUnknown={isRecipientAddressUnknown}
              isRecipientHumanizerKnownTokenOrSmartContract={
                isRecipientHumanizerKnownTokenOrSmartContract
              }
              amountFieldValue={amountFieldValue}
              setAmountFieldValue={setAmountFieldValue}
              addressStateFieldValue={addressStateFieldValue}
              setAddressStateFieldValue={setAddressStateFieldValue}
            />
            {isTopUp && !hasGasTank && (
              <View style={spacings.ptLg}>
                <Alert
                  type="warning"
                  title={
                    <Trans>
                      The Gas Tank is exclusively available for Smart Accounts. It lets you pre-pay
                      for network fees using stable coins and other tokens and use the funds on any
                      chain.{' '}
                      <Pressable
                        onPress={async () => {
                          try {
                            await openInTab({
                              url: 'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                            })
                          } catch {
                            addToast("Couldn't open link", { type: 'error' })
                          }
                        }}
                      >
                        <Text appearance="warningText" underline>
                          {t('Learn more')}
                        </Text>
                      </Pressable>
                      .
                    </Trans>
                  }
                  isTypeLabelHidden
                />
              </View>
            )}
            {isTopUp && hasGasTank && (
              <View style={spacings.ptLg}>
                <Alert
                  type="warning"
                  title={t('Gas Tank deposits cannot be withdrawn')}
                  isTypeLabelHidden
                />
              </View>
            )}
          </View>
        ) : (
          <SkeletonLoader
            width={640}
            height={420}
            appearance="primaryBackground"
            style={{ marginLeft: 'auto', marginRight: 'auto' }}
          />
        )}
        <View style={flexbox.flex1} />
        {buttons}
        <GasTankInfoModal
          id="gas-tank-info"
          sheetRef={gasTankSheetRef}
          closeBottomSheet={closeGasTankInfoBottomSheet}
          onPrimaryButtonPress={closeGasTankInfoBottomSheet}
          portfolio={portfolio}
          account={account}
        />
        <Estimation
          updateType="Transfer&TopUp"
          estimationModalRef={estimationModalRef}
          closeEstimationModal={closeEstimationModalAndDispatch}
          updateController={updateController}
          handleUpdateStatus={handleUpdateStatus}
          hasProceeded={hasProceeded}
          signAccountOpController={signAccountOpController}
          Modals={Modals}
        />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(TransferScreen)
