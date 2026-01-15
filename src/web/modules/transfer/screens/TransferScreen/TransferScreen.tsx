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
import InfoIcon from '@common/assets/svg/InfoIcon'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useAddressInput, { ValidationWithSeverityType } from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Form, Wrapper } from '@web/components/TransactionsScreen'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHasGasTank from '@web/hooks/useHasGasTank'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSyncedState from '@web/hooks/useSyncedState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import BatchAdded from '@web/modules/sign-account-op/components/OneClick/BatchModal/BatchAdded'
import Buttons from '@web/modules/sign-account-op/components/OneClick/Buttons'
import Estimation from '@web/modules/sign-account-op/components/OneClick/Estimation'
import TrackProgress from '@web/modules/sign-account-op/components/OneClick/TrackProgress'
import Completed from '@web/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Completed'
import Failed from '@web/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Failed'
import InProgress from '@web/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/InProgress'
import useTrackAccountOp from '@web/modules/sign-account-op/hooks/OneClick/useTrackAccountOp'
import GasTankInfoModal from '@web/modules/transfer/components/GasTankInfoModal'
import SendForm from '@web/modules/transfer/components/SendForm/SendForm'
import { getUiType } from '@web/utils/uiType'

const { isTab, isRequestWindow } = getUiType()

const TransferScreen = ({ isTopUpScreen }: { isTopUpScreen?: boolean }) => {
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const { state } = useTransferControllerState()
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
  } = state

  const amountInFiatBigInt = useMemo(() => {
    try {
      return parseUnits(getSanitizedAmount(amountInFiat, 6), 6)
    } catch (e) {
      return 0n
    }
  }, [amountInFiat])

  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { visibleUserRequests } = useRequestsControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()
  const { userRequests } = useRequestsControllerState()
  const {
    ref: gasTankSheetRef,
    open: openGasTankInfoBottomSheet,
    close: closeGasTankInfoBottomSheet
  } = useModalize()
  const { accountsOps } = useActivityControllerState()
  const { hasGasTank } = useHasGasTank({ account })
  const recipientMenuClosedAutomatically = useRef(false)

  const [showAddedToBatch, setShowAddedToBatch] = useState(false)
  const [latestBatchedNetwork, setLatestBatchedNetwork] = useState<bigint | undefined>()

  const controllerAmountFieldValue = amountFieldMode === 'token' ? controllerAmount : amountInFiat
  const [amountFieldValue, setAmountFieldValue] = useSyncedState<string>({
    backgroundState: controllerAmountFieldValue,
    updateBackgroundState: (newAmount) => {
      dispatch({
        type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
        params: { formValues: { amount: newAmount } }
      })
    },
    forceUpdateOnChangeList: [state.programmaticUpdateCounter, state.amountFieldMode]
  })
  const [addressStateFieldValue, setAddressStateFieldValue] = useSyncedState<string>({
    backgroundState: addressState.fieldValue,
    updateBackgroundState: (newAddress: string) => {
      dispatch({
        type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
        params: { formValues: { addressState: { fieldValue: newAddress } } }
      })
    },
    forceUpdateOnChangeList: [state.programmaticUpdateCounter]
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
        !r.signAccountOp.isSignAndBroadcastInProgress
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
      dispatch({
        type: 'CLOSE_SIGNING_REQUEST_WINDOW',
        params: {
          type: 'transfer'
        }
      })
    } else {
      navigate(WEB_ROUTES.dashboard)
    }

    dispatch({
      type: 'TRANSFER_CONTROLLER_RESET_FORM'
    })
  }, [dispatch, navigate])

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

  const displayedView: 'transfer' | 'batch' | 'track' | 'loading' = useMemo(() => {
    // If the screen type doesn't match the controller state, we show a loading state
    // This avoids showing the wrong screen for a brief moment0
    if (!!isTopUpScreen !== !!isTopUp) return 'loading'

    if (showAddedToBatch) return 'batch'

    if (latestBroadcastedAccountOp) return 'track'

    return 'transfer'
  }, [isTopUp, isTopUpScreen, latestBroadcastedAccountOp, showAddedToBatch])

  // When navigating to another screen internally in the extension, we unload the TransferController
  // to ensure that no estimation or SignAccountOp logic is still running.
  // If the screen is closed entirely, the clean-up is handled by the port.onDisconnect callback in the background.
  useEffect(() => {
    return () => {
      dispatch({ type: 'TRANSFER_CONTROLLER_UNLOAD_SCREEN' })
    }
  }, [dispatch])

  const {
    ref: estimationModalRef,
    open: openEstimationModal,
    close: closeEstimationModal
  } = useModalize()

  const openEstimationModalAndDispatch = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_HAS_USER_PROCEEDED',
      params: {
        proceeded: true
      }
    })
    openEstimationModal()
  }, [openEstimationModal, dispatch])

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      dispatch({
        type: 'CURRENT_SIGN_ACCOUNT_OP_UPDATE_STATUS',
        params: {
          updateType: 'Transfer&TopUp',
          status
        }
      })
    },
    [dispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      dispatch({
        type: 'CURRENT_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          updateType: 'Transfer&TopUp',
          ...params
        }
      })
    },
    [dispatch]
  )

  // Used to resolve ENS, not to update the field value
  const setAddressState = useCallback(
    (newPartialAddressState: AddressStateOptional) => {
      dispatch({
        type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
        params: { formValues: { addressState: newPartialAddressState } }
      })
    },
    [dispatch]
  )

  const onRecipientAddressUnknownAgree = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_UPDATE_FORM',
      params: {
        formValues: { isRecipientAddressUnknownAgreed: true }
      }
    })
  }, [dispatch])

  const handleCacheResolvedDomain = useCallback(
    (address: string, ensAvatar: string | null, domain: string, type: 'ens') => {
      dispatch({
        type: 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP',
        params: {
          type,
          address,
          name: domain,
          ensAvatar
        }
      })
    },
    [dispatch]
  )

  const addressInputState = useAddressInput({
    addressState: {
      ...addressState,
      fieldValue: addressStateFieldValue
    },
    setAddressState,
    overwriteError:
      state?.isInitialized && !validationFormMsgs.recipientAddress.success
        ? validationFormMsgs.recipientAddress.message
        : '',
    overwriteValidLabel: validationFormMsgs?.recipientAddress.success
      ? validationFormMsgs.recipientAddress.message
      : '',
    overwriteSeverity: validationFormMsgs.recipientAddress
      .severity as ValidationWithSeverityType['severity'],
    handleCacheResolvedDomain
  })

  /**
   * True if the user has pending user requests and there is no amount set in the form.
   * Used to allow the user to open the SignAccountOp window to sign the requests.
   */
  const isSendingBatch =
    accountUserRequests.length > 0 && !state.amount && visibleUserRequests.length > 0

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
    return !!(isTopUp ? isFormValid : isFormValid && !addressInputState.validation.isError)
  }, [addressInputState.validation.isError, isFormValid, isTopUp])

  const onBack = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_RESET_FORM'
    })
    navigate(ROUTES.dashboard)
  }, [navigate, dispatch])

  const resetTransferForm = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_RESET_FORM'
    })
    recipientMenuClosedAutomatically.current = false
  }, [dispatch])

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

        dispatch({
          type: 'REQUESTS_CONTROLLER_SET_CURRENT_REQUEST_BY_ID',
          params: {
            requestId: request.id
          }
        })
        return
      }

      if (isFormValid && state.selectedToken) {
        // Proceed in OneClick txn
        if (executionType === 'open-request-window') {
          // one click mode opens signAccountOp if more than 1 req in batch
          if (networkUserRequests.length > 0) {
            dispatch({
              type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
              params: {
                type: 'transferRequest',
                params: {
                  amount: state.amount,
                  amountInFiat: amountInFiatBigInt, // used only for topUp calcs
                  selectedToken: state.selectedToken,
                  recipientAddress: isTopUp
                    ? FEE_COLLECTOR
                    : getAddressFromAddressState(addressState),
                  executionType
                }
              }
            })
            window.close()
          } else {
            openEstimationModalAndDispatch()
          }
          return
        }

        // Batch
        dispatch({
          type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
          params: {
            type: 'transferRequest',
            params: {
              amount: state.amount,
              amountInFiat: amountInFiatBigInt, // used only for topUp calcs
              selectedToken: state.selectedToken,
              recipientAddress: isTopUp ? FEE_COLLECTOR : getAddressFromAddressState(addressState),
              executionType
            }
          }
        })

        setShowAddedToBatch(true)
        setLatestBatchedNetwork(state.selectedToken?.chainId)

        resetTransferForm()
      }
    },
    [
      isSendingBatch,
      isFormValid,
      state.selectedToken,
      state.amount,
      amountInFiatBigInt,
      visibleUserRequests,
      dispatch,
      addToast,
      t,
      isTopUp,
      addressState,
      resetTransferForm,
      networkUserRequests.length,
      openEstimationModalAndDispatch
    ]
  )

  const handleGasTankInfoPressed = useCallback(
    () => openGasTankInfoBottomSheet(),
    [openGasTankInfoBottomSheet]
  )

  const gasTankLabelWithInfo = useMemo(() => {
    return (
      <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
        <Text
          fontSize={20}
          weight="medium"
          appearance="primaryText"
          numberOfLines={1}
          style={spacings.mrMi}
        >
          {t('Top Up Gas Tank')}
        </Text>
        <Pressable onPress={handleGasTankInfoPressed}>
          <InfoIcon width={20} height={20} />
        </Pressable>
      </View>
    )
  }, [handleGasTankInfoPressed, t])

  // Title shown in BottomSheet header
  const headerTitle = useMemo(
    () => (state.isTopUp ? gasTankLabelWithInfo : t('Send')),
    [state.isTopUp, gasTankLabelWithInfo, t]
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
      <>
        {isTab && <BackButton onPress={onBack} />}
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
      </>
    )
  }, [
    onBack,
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
      dispatch({
        type: 'TRANSFER_CONTROLLER_RESET_FORM'
      })
      navigate(ROUTES.dashboard)
    } else {
      dispatch({
        type: 'CLOSE_SIGNING_REQUEST_WINDOW',
        params: {
          type: 'transfer'
        }
      })
    }
  }, [navigate, dispatch])

  const onBatchAddedPrimaryButtonPress = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_DESTROY_LATEST_BROADCASTED_ACCOUNT_OP'
    })
    navigate(WEB_ROUTES.dashboard)
  }, [dispatch, navigate])
  const onBatchAddedSecondaryButtonPress = useCallback(() => {
    dispatch({
      type: 'TRANSFER_CONTROLLER_DESTROY_LATEST_BROADCASTED_ACCOUNT_OP'
    })
    setShowAddedToBatch(false)
  }, [dispatch, setShowAddedToBatch])

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
          dispatch({
            type: 'TRANSFER_CONTROLLER_UNLOAD_SCREEN',
            params: { forceUnload: true }
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

  return (
    <Wrapper title={headerTitle} buttons={buttons}>
      <Content buttons={buttons}>
        {state?.isInitialized ? (
          <Form>
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
                            await createTab(
                              'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                            )
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
          </Form>
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
        closeEstimationModal={closeEstimationModal}
        updateController={updateController}
        handleUpdateStatus={handleUpdateStatus}
        hasProceeded={hasProceeded}
        signAccountOpController={signAccountOpController}
      />
    </Wrapper>
  )
}

export default React.memo(TransferScreen)
