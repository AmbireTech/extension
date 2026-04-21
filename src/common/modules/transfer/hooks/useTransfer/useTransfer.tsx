import { parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { FEE_COLLECTOR } from '@ambire-common/consts/addresses'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Key } from '@ambire-common/interfaces/keystore'
import { CallsUserRequest, RequestExecutionType } from '@ambire-common/interfaces/userRequest'
import { getSanitizedAmount } from '@ambire-common/libs/transfer/amount'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { getCallsCount } from '@ambire-common/utils/userRequest'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useNavigation from '@common/hooks/useNavigation'
import useSyncedState from '@common/hooks/useSyncedState'
import useToast from '@common/hooks/useToast'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import Buttons from '@common/modules/sign-account-op/components/OneClick/Buttons'
import useTrackAccountOp from '@common/modules/sign-account-op/hooks/OneClick/useTrackAccountOp'
import { getUiType } from '@common/utils/uiType'

const { isRequestWindow } = getUiType()

const useTransfer = (isTopUpScreen: boolean) => {
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
  const { canUseGasTank } = useHasGasTank({ account })
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

  return {
    displayedView,
    submittedAccountOp,
    explorerLink,
    navigateOut,
    transferDispatch,
    addTransaction,
    buttons,
    handleGoBackPress,
    onBatchAddedPrimaryButtonPress,
    onBatchAddedSecondaryButtonPress,
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
    isRecipientAddressViewOnly,
    batchNetworkUserRequestsCount,
    transferState,
    addressInputState,
    canUseGasTank,
    amountFieldValue,
    setAmountFieldValue,
    addressStateFieldValue,
    setAddressStateFieldValue,
    gasTankSheetRef,
    openGasTankInfoBottomSheet,
    closeGasTankInfoBottomSheet,
    estimationModalRef,
    closeEstimationModalAndDispatch,
    updateController,
    handleUpdateStatus,
    portfolio,
    account
  }
}

export default useTransfer
