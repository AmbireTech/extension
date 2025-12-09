import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import {
  SignAccountOpUpdateProps,
  SigningStatus
} from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Key } from '@ambire-common/interfaces/keystore'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import usePrevious from '@common/hooks/usePrevious'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'
import { OneClickEstimationProps } from '@web/modules/sign-account-op/components/OneClick/Estimation/Estimation'
import { getIsSignLoading } from '@web/modules/sign-account-op/utils/helpers'

const PRIMARY_BUTTON_LABELS: Record<
  OneClickEstimationProps['updateType'] | 'Sign' | 'HW',
  { default: string; isLoading: string }
> = {
  'Swap&Bridge': {
    default: 'Swap',
    isLoading: 'Swapping...'
  },
  'Transfer&TopUp': {
    default: 'Send',
    isLoading: 'Sending...'
  },
  Sign: {
    default: 'Sign',
    isLoading: 'Signing...'
  },
  HW: {
    default: 'Begin signing',
    isLoading: 'Signing...'
  }
}

type Props = {
  handleUpdateStatus: (status: SigningStatus) => void
  handleBroadcast: () => void
  handleUpdate: (params: SignAccountOpUpdateProps) => void
  signAccountOpState: ISignAccountOpController | null
  isOneClickSign?: boolean
  updateType?: OneClickEstimationProps['updateType'] | undefined
}

const useSign = ({
  handleUpdateStatus,
  signAccountOpState,
  handleBroadcast,
  handleUpdate,
  isOneClickSign,
  updateType = undefined
}: Props) => {
  const { t } = useTranslation()
  const { networks } = useNetworksControllerState()
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [isChooseFeePayerKeyShown, setIsChooseFeePayerKeyShown] = useState(false)
  const [shouldDisplayLedgerConnectModal, setShouldDisplayLedgerConnectModal] = useState(false)
  const prevIsChooseSignerShown = usePrevious(isChooseSignerShown)
  const { isLedgerConnected } = useLedger()
  const [slowRequest, setSlowRequest] = useState<boolean>(false)
  const [slowPaymasterRequest, setSlowPaymasterRequest] = useState<boolean>(true)
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<string[]>([])
  const { ref: warningModalRef, open: openWarningModal, close: closeWarningModal } = useModalize()
  const [initDispatchedForId, setInitDispatchedForId] = useState<number | string | null>(null)

  const hasEstimation = useMemo(
    () =>
      signAccountOpState?.isInitialized &&
      !!signAccountOpState?.gasPrices &&
      !signAccountOpState.estimation.error,
    [
      signAccountOpState?.estimation?.error,
      signAccountOpState?.gasPrices,
      signAccountOpState?.isInitialized
    ]
  )

  useEffect(() => {
    // Ensures user can re-open the modal, if previously being closed, e.g.
    // there is an error (modal closed), but user opts-in sign again (open it).
    const isModalStillOpen = isChooseSignerShown && prevIsChooseSignerShown
    // These errors get displayed in the UI (in the <Warning /> component),
    // so in case of an error, closing the signer key selection modal is needed,
    // otherwise errors will be displayed behind the modal overlay.
    if (isModalStillOpen && !!signAccountOpState?.errors.length) {
      setIsChooseSignerShown(false)
    }
  }, [isChooseSignerShown, prevIsChooseSignerShown, signAccountOpState?.errors.length])

  const isSignLoading = getIsSignLoading(signAccountOpState?.status)

  useEffect(() => {
    if (signAccountOpState?.estimation.estimationRetryError) {
      setSlowRequest(false)
      return
    }
    const timeout = setTimeout(() => {
      // set the request to slow if the state is not init (no estimation)
      // or the gas prices haven't been fetched
      if (!signAccountOpState?.isInitialized || !signAccountOpState?.gasPrices) {
        setSlowRequest(true)
      }
    }, 5000)

    if (signAccountOpState?.isInitialized && !!signAccountOpState?.gasPrices) {
      clearTimeout(timeout)
      setSlowRequest(false)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [
    signAccountOpState?.isInitialized,
    signAccountOpState?.gasPrices,
    signAccountOpState?.estimation.estimationRetryError
  ])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (slowPaymasterRequest) return

      if (signAccountOpState?.status?.type === SigningStatus.WaitingForPaymaster) {
        setSlowPaymasterRequest(true)
        openWarningModal()
      }
    }, 3000)

    if (signAccountOpState?.status?.type !== SigningStatus.WaitingForPaymaster) {
      clearTimeout(timeout)
      setSlowPaymasterRequest(false)
      if (slowPaymasterRequest) closeWarningModal()
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [closeWarningModal, openWarningModal, signAccountOpState?.status?.type, slowPaymasterRequest])

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === signAccountOpState?.accountOp?.chainId)
  }, [networks, signAccountOpState?.accountOp?.chainId])

  const signingKeyType = signAccountOpState?.accountOp?.signingKeyType
  const feePayerKeyType = signAccountOpState?.accountOp?.gasFeePayment?.paidByKeyType
  const isAtLeastOneOfTheKeysInvolvedLedger =
    signingKeyType === 'ledger' || feePayerKeyType === 'ledger'

  const handleDismissLedgerConnectModal = useCallback(() => {
    setShouldDisplayLedgerConnectModal(false)
  }, [])

  const warningToPromptBeforeSign = useMemo(
    () =>
      signAccountOpState?.warnings.find((warning) => {
        const signingType = isOneClickSign ? 'one-click-sign' : 'sign'
        const shouldPrompt = warning.promptBefore?.includes(signingType)

        if (!shouldPrompt) return false

        const isWarningAcknowledged = acknowledgedWarnings.includes(warning.id)

        return !isWarningAcknowledged
      }),
    [acknowledgedWarnings, isOneClickSign, signAccountOpState?.warnings]
  )

  const handleSign = useCallback(
    (_chosenSigningKeyType?: Key['type'], _warningAccepted?: boolean) => {
      // Prioritize warning(s) modals over all others
      // Warning modals are not displayed in the one-click swap flow
      if (warningToPromptBeforeSign && !_warningAccepted) {
        openWarningModal()
        handleUpdateStatus(SigningStatus.UpdatesPaused)
        return
      }

      const isFeePayerSameAsSigner =
        signAccountOpState?.accountOp.signingKeyAddr ===
        signAccountOpState?.accountOp.gasFeePayment?.paidBy
      const isLedgerKeyInvolvedInTheJustChosenKeys = _chosenSigningKeyType
        ? _chosenSigningKeyType === 'ledger' || feePayerKeyType === 'ledger'
        : isAtLeastOneOfTheKeysInvolvedLedger

      if (isLedgerKeyInvolvedInTheJustChosenKeys && !isLedgerConnected) {
        setShouldDisplayLedgerConnectModal(true)
        return
      }

      if ((signAccountOpState?.feePayerKeyStoreKeys?.length || 0) > 1 && !isFeePayerSameAsSigner) {
        setIsChooseFeePayerKeyShown(true)
        return
      }

      handleBroadcast()
    },
    [
      warningToPromptBeforeSign,
      signAccountOpState?.accountOp.signingKeyAddr,
      signAccountOpState?.accountOp.gasFeePayment?.paidBy,
      signAccountOpState?.feePayerKeyStoreKeys?.length,
      feePayerKeyType,
      isAtLeastOneOfTheKeysInvolvedLedger,
      isLedgerConnected,
      handleBroadcast,
      openWarningModal,
      handleUpdateStatus
    ]
  )

  const handleChangeSigningKey = useCallback(
    (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => {
      handleUpdate({ signingKeyAddr, signingKeyType: _chosenSigningKeyType })

      // Explicitly pass the currently selected signing key type, because
      // the signing key type in the state might not be updated yet,
      // and Sign Account Op controller assigns a default signing upfront
      handleSign(_chosenSigningKeyType)
    },
    [handleSign, handleUpdate]
  )

  const handleChangeFeePayerKeyType = useCallback(
    // Done for compatibility with the select component
    (_: Key['addr'], newFeePayerKeyType: Key['type']) => {
      handleUpdate({ paidByKeyType: newFeePayerKeyType })

      handleBroadcast()
    },
    [handleBroadcast, handleUpdate]
  )

  const onSignButtonClick = useCallback(() => {
    if (!signAccountOpState) return

    // If the account has only one signer, we don't need to show the select signer overlay,
    // and we will sign the transaction with the only one available signer (it is set by default in the controller).
    if (signAccountOpState?.accountKeyStoreKeys.length === 1) {
      handleSign()
      return
    }

    setIsChooseSignerShown(true)
  }, [signAccountOpState, handleSign])

  const acknowledgeWarning = useCallback(() => {
    if (!warningToPromptBeforeSign) return

    setAcknowledgedWarnings((prev) => [...prev, warningToPromptBeforeSign.id])
    closeWarningModal()
    handleSign(undefined, true)
  }, [warningToPromptBeforeSign, closeWarningModal, handleSign])

  useEffect(() => {
    if (shouldDisplayLedgerConnectModal && isLedgerConnected) {
      handleDismissLedgerConnectModal()
    }
  }, [handleDismissLedgerConnectModal, shouldDisplayLedgerConnectModal, isLedgerConnected])

  const dismissWarning = useCallback(() => {
    handleUpdateStatus(SigningStatus.ReadyToSign)

    closeWarningModal()
  }, [handleUpdateStatus, closeWarningModal])

  const isViewOnly = useMemo(
    () => signAccountOpState?.accountKeyStoreKeys.length === 0,
    [signAccountOpState?.accountKeyStoreKeys]
  )

  const isAtLeastOneOfTheKeysInvolvedExternal = useMemo(
    () =>
      (!!signingKeyType && signingKeyType !== 'internal') ||
      (!!feePayerKeyType && feePayerKeyType !== 'internal'),
    [feePayerKeyType, signingKeyType]
  )

  const renderedButNotNecessarilyVisibleModal: 'warnings' | 'ledger-connect' | 'hw-sign' | null =
    useMemo(() => {
      // Prioritize warning(s) modals over all others
      if (
        warningToPromptBeforeSign ||
        // We render the warning modal if the paymaster is loading, but
        // don't display it to the user until the paymaster has been loading for too long.
        // This is required because opening the modal isn't possible if it isn't rendered.
        signAccountOpState?.status?.type === SigningStatus.WaitingForPaymaster
      )
        return 'warnings'

      if (shouldDisplayLedgerConnectModal) return 'ledger-connect'

      if (isAtLeastOneOfTheKeysInvolvedExternal) return 'hw-sign'

      return null
    }, [
      isAtLeastOneOfTheKeysInvolvedExternal,
      shouldDisplayLedgerConnectModal,
      signAccountOpState?.status?.type,
      warningToPromptBeforeSign
    ])

  const primaryButtonText = useMemo(() => {
    const buttonLabelType = updateType || (isAtLeastOneOfTheKeysInvolvedExternal ? 'HW' : 'Sign')

    return t(
      isSignLoading
        ? PRIMARY_BUTTON_LABELS[buttonLabelType].isLoading
        : PRIMARY_BUTTON_LABELS[buttonLabelType].default
    )
  }, [isAtLeastOneOfTheKeysInvolvedExternal, isSignLoading, t, updateType])

  // When being done, there is a corner case if the sign succeeds, but the broadcast fails.
  // If so, the "Sign" button should NOT be disabled, so the user can retry broadcasting.
  const notReadyToSignButAlsoNotDone =
    !signAccountOpState?.readyToSign && signAccountOpState?.status?.type !== SigningStatus.Done

  const isSignDisabled = useMemo(() => {
    return (
      isViewOnly ||
      isSignLoading ||
      notReadyToSignButAlsoNotDone ||
      !signAccountOpState?.readyToSign ||
      (signAccountOpState && signAccountOpState.estimation.status === EstimationStatus.Loading)
    )
  }, [isViewOnly, isSignLoading, notReadyToSignButAlsoNotDone, signAccountOpState])

  const bundlerNonceDiscrepancy = useMemo(
    () =>
      signAccountOpState?.warnings.find((warning) => warning.id === 'bundler-nonce-discrepancy') ||
      signAccountOpState?.warnings.find((warning) => warning.id === 'bundler-failure'),
    [signAccountOpState?.warnings]
  )

  return {
    renderedButNotNecessarilyVisibleModal,
    isViewOnly,
    dismissWarning,
    acknowledgeWarning,
    onSignButtonClick,
    handleChangeSigningKey,
    warningToPromptBeforeSign,
    handleDismissLedgerConnectModal,
    isChooseSignerShown,
    setIsChooseSignerShown,
    slowPaymasterRequest,
    slowRequest,
    isSignLoading,
    hasEstimation,
    warningModalRef,
    signingKeyType,
    feePayerKeyType,
    handleChangeFeePayerKeyType,
    shouldDisplayLedgerConnectModal,
    network,
    notReadyToSignButAlsoNotDone,
    initDispatchedForId,
    setInitDispatchedForId,
    isSignDisabled,
    primaryButtonText,
    bundlerNonceDiscrepancy,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    shouldHoldToProceed: !!signAccountOpState?.banners?.length
  }
}

export default useSign
