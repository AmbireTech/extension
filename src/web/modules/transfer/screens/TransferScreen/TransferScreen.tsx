import { parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { FEE_COLLECTOR } from '@ambire-common/consts/addresses'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Key } from '@ambire-common/interfaces/keystore'
import { CallsUserRequest, RequestExecutionType } from '@ambire-common/interfaces/userRequest'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { getSanitizedAmount } from '@ambire-common/libs/transfer/amount'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { getCallsCount } from '@ambire-common/utils/userRequest'
import Alert from '@common/components/Alert'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useNavigation from '@common/hooks/useNavigation'
import useSyncedState from '@common/hooks/useSyncedState'
import useToast from '@common/hooks/useToast'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import BatchAdded from '@web/modules/sign-account-op/components/OneClick/BatchModal/BatchAdded'
import Buttons from '@web/modules/sign-account-op/components/OneClick/Buttons'
import Estimation from '@web/modules/sign-account-op/components/OneClick/Estimation'
import SafeSigned from '@web/modules/sign-account-op/components/OneClick/SafeSigned'
import TrackProgress from '@web/modules/sign-account-op/components/OneClick/TrackProgress'
import Completed from '@web/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Completed'
import Failed from '@web/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Failed'
import InProgress from '@web/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/InProgress'
import useTrackAccountOp from '@web/modules/sign-account-op/hooks/OneClick/useTrackAccountOp'
import GasTankInfoModal from '@web/modules/transfer/components/GasTankInfoModal'
import SendForm from '@web/modules/transfer/components/SendForm/SendForm'

const { isRequestWindow } = getUiType()

const TransferScreen = ({ isTopUpScreen }: { isTopUpScreen?: boolean }) => {
  const { addToast } = useToast()
  const { state: transferState, dispatch: transferDispatch } = useController('TransferController')
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { dispatch: mainDispatch } = useController('MainController')
  const {
    isTopUp,
    validationFormMsgs,
    addressState,
    isRecipientHumanizerKnownTokenOrSmartContract,
    isRecipientAddressUnknown,
    isRecipientAddressUnknownAgreed,
    isRecipientAddressFirstTimeSend,
    isFormValid,
    signAccountOpController,
    latestBroadcastedAccountOp,
    latestBroadcastedToken,
    hasProceeded,
    selectedToken,
    amountFieldMode,
    amount: controllerAmount,
    amountInFiat,
    isRecipientAddressViewOnly
  } = transferState

  const amountInFiatBigInt = useMemo(() => {
    try {
      return parseUnits(getSanitizedAmount(amountInFiat, 6), 6)
    } catch (e) {
      return 0n
    }
  }, [amountInFiat])

  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { visibleUserRequests } = useController('RequestsController').state
  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')
  const { userRequests } = useController('RequestsController').state

  const {
    ref: gasTankSheetRef,
    open: openGasTankInfoBottomSheet,
    close: closeGasTankInfoBottomSheet
  } = useModalize()
  const { accountsOps } = useController('ActivityController').state
  const { hasGasTank } = useHasGasTank({ account })
  const recipientMenuClosedAutomatically = useRef(false)

  const [showAddedToBatch, setShowAddedToBatch] = useState(false)
  const [showSafeSigned, setShowSafeSigned] = useState(false)
  const [latestBatchedNetwork, setLatestBatchedNetwork] = useState<bigint | undefined>()

  const controllerAmountFieldValue = amountFieldMode === 'token' ? controllerAmount : amountInFiat
  const [amountFieldValue, setAmountFieldValue] = useSyncedState<string>({
    backgroundState: controllerAmountFieldValue,
    updateBackgroundState: (newAmount) => {
      transferDispatch({
        type: 'method',
        params: { method: 'update', args: [{ amount: newAmount }] }
      })
    },
    forceUpdateOnChangeList: [
      transferState.programmaticUpdateCounter,
      transferState.amountFieldMode
    ]
  })
  const [addressStateFieldValue, setAddressStateFieldValue] = useSyncedState<string>({
    backgroundState: addressState.fieldValue,
    updateBackgroundState: (newAddress: string) => {
      transferDispatch({
        type: 'method',
        params: { method: 'update', args: [{ addressState: { fieldValue: newAddress } }] }
      })
    },
    forceUpdateOnChangeList: [transferState.programmaticUpdateCounter]
  })

  const isLocalStateOutOfSync =
    controllerAmountFieldValue !== amountFieldValue ||
    addressState.fieldValue !== addressStateFieldValue

  const submittedAccountOp = useMemo(() => {
    if (!accountsOps.transfer || !latestBroadcastedAccountOp?.signature) return

    return accountsOps.transfer.result.items.find(
      (accOp) => accOp.signature === latestBroadcastedAccountOp.signature
    )
  }, [accountsOps.transfer, latestBroadcastedAccountOp?.signature])

  const accountUserRequests = useMemo(() => {
    if (!account || !userRequests.length) return []

    return userRequests.filter(
      (r) =>
        r.kind === 'calls' &&
        r.meta.accountAddr === account.addr &&
        !r.signAccountOp.isSignAndBroadcastInProgress &&
        !r.signAccountOp.accountOp.signature
    )
  }, [userRequests, account])

  const networkUserRequests = useMemo(() => {
    if (!selectedToken || !account || !userRequests.length) return []

    return accountUserRequests.filter((r) => r.meta.chainId === selectedToken.chainId)
  }, [selectedToken, account, userRequests.length, accountUserRequests])

  const batchNetworkUserRequestsCount = useMemo(() => {
    if (!latestBatchedNetwork || !account || !accountUserRequests.length) return 0

    const reqs = accountUserRequests.filter((r) => r.meta.chainId === latestBatchedNetwork)

    return getCallsCount(reqs)
  }, [latestBatchedNetwork, account, accountUserRequests])

  const navigateOut = useCallback(() => {
    if (isRequestWindow) {
      if (!account) return

      requestsDispatch({
        type: 'method',
        params: {
          method: 'removeUserRequests',
          args: [[`${account.addr}-transfer-sign`]]
        }
      })
    } else {
      navigate(WEB_ROUTES.dashboard)
    }
  }, [requestsDispatch, navigate, account])

  const { sessionHandler } = useTrackAccountOp({
    address: latestBroadcastedAccountOp?.accountAddr,
    chainId: latestBroadcastedAccountOp?.chainId,
    sessionId: 'transfer'
  })

  const explorerLink = useMemo(() => {
    if (!submittedAccountOp) return

    const { chainId, identifiedBy, txnId } = submittedAccountOp

    if (!chainId || !identifiedBy || !txnId) return

    return `https://explorer.ambire.com/${getBenzinUrlParams({ chainId, txnId, identifiedBy })}`
  }, [submittedAccountOp])

  useEffect(() => {
    // Optimization: Don't apply filtration if we don't have a recent broadcasted account op
    if (!latestBroadcastedAccountOp?.accountAddr || !latestBroadcastedAccountOp?.chainId) return

    sessionHandler.initSession()

    return () => {
      sessionHandler.killSession()
    }
  }, [latestBroadcastedAccountOp?.accountAddr, latestBroadcastedAccountOp?.chainId, sessionHandler])

  useEffect(() => {
    if (showSafeSigned) return
    if (
      signAccountOpController &&
      signAccountOpController.account.safeCreation &&
      signAccountOpController.status?.type === SigningStatus.Queued
    ) {
      setShowSafeSigned(true)
      mainDispatch({
        type: 'method',
        params: {
          method: 'fetchSafeTxns',
          args: [[signAccountOpController.accountOp.chainId]]
        }
      })
    }
  }, [showSafeSigned, signAccountOpController, mainDispatch])

  const displayedView: 'transfer' | 'batch' | 'track' | 'safe-signed' | 'loading' = useMemo(() => {
    // If the screen type doesn't match the controller state, we show a loading state
    // This avoids showing the wrong screen for a brief moment0
    if (!!isTopUpScreen !== !!isTopUp) return 'loading'

    if (showSafeSigned) return 'safe-signed'

    if (showAddedToBatch) return 'batch'

    if (latestBroadcastedAccountOp) return 'track'

    return 'transfer'
  }, [isTopUp, showSafeSigned, isTopUpScreen, latestBroadcastedAccountOp, showAddedToBatch])

  const {
    ref: estimationModalRef,
    open: openEstimationModal,
    close: closeEstimationModal
  } = useModalize()

  const closeEstimationModalAndDispatch = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'setUserProceeded',
        args: [false]
      }
    })
    closeEstimationModal()
  }, [closeEstimationModal, transferDispatch])

  const openEstimationModalAndDispatch = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'setUserProceeded',
        args: [true]
      }
    })
    openEstimationModal()
  }, [openEstimationModal, transferDispatch])

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      transferDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['update', [status]]
        }
      })
    },
    [transferDispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      transferDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['update', [params]]
        }
      })
    },
    [transferDispatch]
  )

  // Used to resolve ENS, not to update the field value
  const setAddressState = useCallback(
    (newPartialAddressState: AddressStateOptional) => {
      transferDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [{ addressState: newPartialAddressState }]
        }
      })
    },
    [transferDispatch]
  )

  const onRecipientAddressUnknownAgree = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'update',
        args: [{ isRecipientAddressUnknownAgreed: true }]
      }
    })
  }, [transferDispatch])

  const addressInputState = useAddressInput({
    addressState: {
      ...addressState,
      fieldValue: addressStateFieldValue
    },
    overwriteValidationFieldValue: addressState.fieldValue,
    setAddressState,
    overwriteValidation: validationFormMsgs.recipientAddress
  })

  /**
   * True if the user has pending user requests and there is no amount set in the form.
   * Used to allow the user to open the SignAccountOp window to sign the requests.
   */
  const isSendingBatch =
    accountUserRequests.length > 0 && !transferState.amount && visibleUserRequests.length > 0

  const submitButtonText = useMemo(() => {
    const callsCount = getCallsCount(isSendingBatch ? accountUserRequests : networkUserRequests)

    if (!callsCount) {
      return t('Proceed')
    }

    return t('Proceed ({{count}})', {
      count: callsCount
    })
  }, [accountUserRequests, isSendingBatch, networkUserRequests, t])

  const isTransferFormValid = useMemo(() => {
    return !!(isTopUp
      ? isFormValid
      : isFormValid && addressInputState.validation.severity !== 'error')
  }, [addressInputState.validation.severity, isFormValid, isTopUp])

  const resetTransferForm = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: { method: 'resetForm', args: [] }
    })
    recipientMenuClosedAutomatically.current = false
  }, [transferDispatch])

  const addTransaction = useCallback(
    (executionType: RequestExecutionType) => {
      if (isSendingBatch) {
        const request = visibleUserRequests.find((r) => r.kind === 'calls')

        if (!request) {
          addToast(
            t('Failed to open batch. If this error persists please reject it from the dashboard.'),
            { type: 'error' }
          )
          return
        }

        requestsDispatch({
          type: 'method',
          params: {
            method: 'setCurrentUserRequestById',
            args: [request.id]
          }
        })
        return
      }

      if (isFormValid && transferState.selectedToken) {
        // Proceed in OneClick txn
        if (executionType === 'open-request-window') {
          // one click mode opens signAccountOp if more than 1 req in batch
          if (networkUserRequests.length > 0) {
            requestsDispatch({
              type: 'method',
              params: {
                method: 'build',
                args: [
                  {
                    type: 'transferRequest',
                    params: {
                      amount: transferState.amount,
                      amountInFiat: amountInFiatBigInt, // used only for topUp calcs
                      selectedToken: transferState.selectedToken,
                      recipientAddress: isTopUp
                        ? FEE_COLLECTOR
                        : getAddressFromAddressState(addressState),
                      executionType
                    }
                  }
                ]
              }
            })
            window.close()
          } else {
            openEstimationModalAndDispatch()
          }
          return
        }

        // Batch
        requestsDispatch({
          type: 'method',
          params: {
            method: 'build',
            args: [
              {
                type: 'transferRequest',
                params: {
                  amount: transferState.amount,
                  amountInFiat: amountInFiatBigInt, // used only for topUp calcs
                  selectedToken: transferState.selectedToken,
                  recipientAddress: isTopUp
                    ? FEE_COLLECTOR
                    : getAddressFromAddressState(addressState),
                  executionType
                }
              }
            ]
          }
        })

        setShowAddedToBatch(true)
        setLatestBatchedNetwork(transferState.selectedToken?.chainId)

        resetTransferForm()
      }
    },
    [
      isSendingBatch,
      isFormValid,
      transferState.selectedToken,
      transferState.amount,
      amountInFiatBigInt,
      visibleUserRequests,
      requestsDispatch,
      addToast,
      t,
      isTopUp,
      addressState,
      resetTransferForm,
      networkUserRequests.length,
      openEstimationModalAndDispatch
    ]
  )

  const isSignAccountOpInProgress = useMemo(() => {
    if (!account || !userRequests.length || !selectedToken) return false

    const signAccountOpRequest = userRequests.find(
      (r) =>
        r.kind === 'calls' &&
        r.meta.accountAddr === account.addr &&
        r.meta.chainId === selectedToken.chainId
    ) as CallsUserRequest | undefined
    return !!signAccountOpRequest?.signAccountOp.isSignAndBroadcastInProgress
  }, [account, selectedToken, userRequests])

  const buttons = useMemo(() => {
    return (
      <Buttons
        handleSubmitForm={(isOneClickMode) =>
          addTransaction(isOneClickMode ? 'open-request-window' : 'queue')
        }
        proceedBtnText={submitButtonText}
        isBatchDisabled={isSendingBatch || isSignAccountOpInProgress}
        isNotReadyToProceed={!isTransferFormValid}
        signAccountOpErrors={[]}
        networkUserRequests={networkUserRequests}
        isLocalStateOutOfSync={isLocalStateOutOfSync}
        shouldHoldToProceed={
          (isRecipientAddressUnknown &&
            !isRecipientAddressUnknownAgreed &&
            !isRecipientHumanizerKnownTokenOrSmartContract &&
            isRecipientAddressFirstTimeSend) ||
          isRecipientAddressViewOnly
        }
        onRecipientAddressUnknownAgree={onRecipientAddressUnknownAgree}
      />
    )
  }, [
    submitButtonText,
    isSendingBatch,
    isSignAccountOpInProgress,
    isTransferFormValid,
    networkUserRequests,
    isLocalStateOutOfSync,
    isRecipientAddressUnknown,
    isRecipientAddressUnknownAgreed,
    isRecipientHumanizerKnownTokenOrSmartContract,
    isRecipientAddressFirstTimeSend,
    isRecipientAddressViewOnly,
    onRecipientAddressUnknownAgree,
    addTransaction
  ])

  const handleGoBackPress = useCallback(() => {
    if (!isRequestWindow) {
      navigate(ROUTES.dashboard)
    } else {
      if (!account) return

      requestsDispatch({
        type: 'method',
        params: {
          method: 'removeUserRequests',
          args: [[`${account.addr}-transfer-sign`]]
        }
      })
    }
  }, [navigate, requestsDispatch, account])

  const onBatchAddedPrimaryButtonPress = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'destroyLatestBroadcastedAccountOp',
        args: []
      }
    })
    navigate(WEB_ROUTES.dashboard)
  }, [transferDispatch, navigate])
  const onBatchAddedSecondaryButtonPress = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'destroyLatestBroadcastedAccountOp',
        args: []
      }
    })
    setShowAddedToBatch(false)
  }, [transferDispatch, setShowAddedToBatch])

  if (displayedView === 'loading') {
    return (
      <View style={[flexbox.flex1, flexbox.justifyCenter, flexbox.alignCenter]}>
        <Spinner />
      </View>
    )
  }

  if (displayedView === 'track') {
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
        {submittedAccountOp?.status === AccountOpStatus.BroadcastedButNotConfirmed && (
          <InProgress title={isTopUp ? t('Confirming your top-up') : t('Confirming your transfer')}>
            <Text fontSize={16} weight="medium" appearance="secondaryText">
              {t('Almost there!')}
            </Text>
          </InProgress>
        )}
        {(submittedAccountOp?.status === AccountOpStatus.Success ||
          submittedAccountOp?.status === AccountOpStatus.UnknownButPastNonce) && (
          <Completed
            title={isTopUp ? t('Top up ready!') : t('Transfer done!')}
            titleSecondary={
              isTopUp
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

  if (displayedView === 'safe-signed') {
    return (
      <SafeSigned
        title={isTopUp ? t('Top Up Gas Tank') : t('Send')}
        primaryButtonText={t('Open dashboard')}
        onPrimaryButtonPress={onBatchAddedPrimaryButtonPress}
      />
    )
  }

  return (
    <Wrapper>
      <Content buttons={buttons}>
        {transferState?.isInitialized ? (
          <View>
            <SendForm
              handleGoBack={handleGoBackPress}
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
      </Content>
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
      />
    </Wrapper>
  )
}

export default React.memo(TransferScreen)
