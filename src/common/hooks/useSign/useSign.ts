import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SignAccountOpType } from '@ambire-common/controllers/signAccountOp/helper'
import { Key } from '@ambire-common/interfaces/keystore'
import { ISignAccountOpController, SigningStatus } from '@ambire-common/interfaces/signAccountOp'
import { isCancelAccountOp } from '@ambire-common/libs/accountOp/cancel'
import useController from '@common/hooks/useController'
import useDappVerificationHoldButtonType from '@common/hooks/useDappVerificationHoldButtonType'
import useExtremeGasFeeWarning from '@common/hooks/useExtremeGasFeeWarning'
import usePrevious from '@common/hooks/usePrevious'
import useSigningAuth from '@common/hooks/useSigningAuth'
import useLedger from '@common/modules/hardware-wallets/hooks/useLedger'
import useOneKey from '@common/modules/hardware-wallets/hooks/useOneKey'
import useQrSigningFlow from '@common/modules/hardware-wallets/hooks/useQrSigningFlow'
import { OneClickEstimationProps } from '@common/modules/sign-account-op/components/OneClick/Estimation/Estimation'
import { getIsSignLoading } from '@web/modules/sign-account-op/utils/helpers'

import type { SignAccountOpUpdateProps } from '@ambire-common/controllers/signAccountOp/signAccountOp'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
type ButtonMode = OneClickEstimationProps['updateType'] | 'Sign' | 'HW' | 'Safe'

const PRIMARY_BUTTON_LABELS: Record<
  ButtonMode,
  { default: string; isLoading: string; config?: string }
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
  },
  Safe: {
    default: 'Begin signing',
    isLoading: 'Close signing'
  }
}

type Props = {
  handleUpdateStatus: (status: SigningStatus) => void
  handleUpdate: (params: SignAccountOpUpdateProps) => void
  signAccountOpState: ISignAccountOpController | null
  isOneClickSign?: boolean
  updateType?: OneClickEstimationProps['updateType'] | undefined
  hasReachedBottom?: boolean | null
  onSafeSignComplete?: () => void
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const useSign = ({
  handleUpdateStatus,
  signAccountOpState,
  handleUpdate,
  isOneClickSign,
  updateType = undefined,
  hasReachedBottom,
  onSafeSignComplete
}: Props) => {
  const { t } = useTranslation()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { dispatch: mainControllerDispatch } = useController('MainController')
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')
  const {
    state: { accountStates }
  } = useController('AccountsController')
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [showSafeSigners, setShowSafeSigners] = useState(false)
  const [isChooseFeePayerKeyShown, setIsChooseFeePayerKeyShown] = useState(false)
  const [shouldDisplayLedgerConnectModal, setShouldDisplayLedgerConnectModal] = useState(false)
  const [shouldDisplayQrSigningModal, setShouldDisplayQrSigningModal] = useState(false)
  const [acknowledgedBannersKey, setAcknowledgedBannersKey] = useState<string | null>(null)
  const [acknowledgedNewFeePayer, setAcknowledgedNewFeePayer] = useState<string | null>(null)
  const safeSignAndCloseRequest = useRef<{
    accountOpId: string
    signingKeyAddr: Key['addr']
  } | null>(null)
  const prevIsChooseSignerShown = usePrevious(isChooseSignerShown)
  const { isLedgerConnected } = useLedger()
  const { ensureOneKeyAccess } = useOneKey()
  const {
    currentRequest,
    signingStep,
    moveToResponseScan,
    moveBack,
    submitSignatureResponse,
    signingCleanup
  } = useQrSigningFlow()

  const {
    sheetRef: signingAuthSheetRef,
    requestSigningAuth,
    cancelSigningAuth,
    signingAuthProps
  } = useSigningAuth({
    requirement: signAccountOpState?.signingAuthRequirement,
    requestId: signAccountOpState?.accountOp.id
  })

  const currentBannersKey = useMemo(
    () => JSON.stringify(signAccountOpState?.banners || []),
    [signAccountOpState?.banners]
  )
  // Executing a Safe from an EOA that never paid for it publicly links the two forever,
  // so it asks for a hold. Only the executing transaction is paid, not a signature.
  // Once held for a payer, the hold is not asked again for it, so the sign button can show
  // its loading state, but switching to another new payer asks for it again
  const feePayer = signAccountOpState?.accountOp.gasFeePayment?.paidBy ?? null
  const isLinkingNewFeePayerToSafe =
    !!signAccountOpState?.isFeePayerNotLinkedToSafe &&
    !!signAccountOpState?.canBroadcast &&
    acknowledgedNewFeePayer !== feePayer
  const shouldHoldToProceed =
    (!!signAccountOpState?.banners.length && acknowledgedBannersKey !== currentBannersKey) ||
    isLinkingNewFeePayerToSafe
  const dappVerificationHoldButtonType = useDappVerificationHoldButtonType(
    signAccountOpState?.banners
  )
  // Linking a new fee payer to the Safe is a warning, unless a dApp check already calls for more
  const holdToProceedButtonType =
    dappVerificationHoldButtonType === 'primary' && isLinkingNewFeePayerToSafe
      ? 'warning'
      : dappVerificationHoldButtonType
  const shouldShowSafeSigners = showSafeSigners && !shouldHoldToProceed

  const [slowRequest, setSlowRequest] = useState<boolean>(false)
  const [slowPaymasterRequest, setSlowPaymasterRequest] = useState<boolean>(true)
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<string[]>([])
  const { ref: warningModalRef, open: openWarningModal, close: closeWarningModal } = useModalize()
  const {
    ref: gasFeeUpdatedModalRef,
    open: openGasFeeUpdatedModal,
    close: closeGasFeeUpdatedModal
  } = useModalize()

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
  }, [signAccountOpState?.isInitialized, signAccountOpState?.gasPrices])

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

  const getIsKeyTypeInvolved = useCallback(
    (keyType: Key['type']) => {
      // if we're broadcasting with this key type, return true
      if (feePayerKeyType === keyType) return true

      // if the account is not a Safe, check the txn signer
      if (!signAccountOpState?.account.safeCreation) return signingKeyType === keyType

      // if it's a Safe, check all the signers
      return !!signAccountOpState.accountOp.signers?.find((s) => s.type === keyType)
    },
    [
      signAccountOpState?.account.safeCreation,
      signAccountOpState?.accountOp.signers,
      signingKeyType,
      feePayerKeyType
    ]
  )

  const isAtLeastOneOfTheKeysInvolvedLedger = useMemo(
    () => getIsKeyTypeInvolved('ledger'),
    [getIsKeyTypeInvolved]
  )
  const isAtLeastOneOfTheKeysInvolvedOneKey = useMemo(
    () => getIsKeyTypeInvolved('onekey'),
    [getIsKeyTypeInvolved]
  )

  const handleDismissLedgerConnectModal = useCallback(() => {
    setShouldDisplayLedgerConnectModal(false)
  }, [])

  const handleQrSigningFlowOnClosePressed = useCallback(
    () => setShouldDisplayQrSigningModal(false),
    []
  )

  const handleQrSigningFlowOnContinuePressed = moveToResponseScan
  const handleQrSigningFlowOnBackPressed = moveBack
  const handleQrSigningFlowSubmitSignatureResponse = submitSignatureResponse

  const handleQrSigningFlowOnRejectPressed = useCallback(() => {
    signingCleanup()
    setShouldDisplayQrSigningModal(false)
  }, [signingCleanup])

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

  const handleBroadcast = useCallback(() => {
    if (!signAccountOpState) return // should never happen

    let type: SignAccountOpType = 'default'

    if (updateType === 'Swap&Bridge') {
      type = 'one-click-swap-and-bridge'
    }

    if (updateType === 'Transfer&TopUp') {
      type = 'one-click-transfer'
    }
    mainControllerDispatch({
      type: 'method',
      params: {
        method: 'handleSignAndBroadcastAccountOp',
        // Pass the id of the accountOp the user is reviewing on screen. The
        // background compares it against the live accountOp before signing to
        // reject signing calls that were appended after this review.
        args: [type, signAccountOpState.fromRequestId, signAccountOpState.accountOp.id]
      }
    })
  }, [mainControllerDispatch, signAccountOpState, updateType])

  const dismissGasFeeChangedConfirmation = useCallback(() => {
    if (updateType === 'Swap&Bridge') {
      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['dismissGasFeeChangedConfirmation', []]
        }
      })
      return
    }

    if (updateType === 'Transfer&TopUp') {
      transferDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['dismissGasFeeChangedConfirmation', []]
        }
      })
      return
    }

    signAccountOpDispatch({
      type: 'method',
      params: {
        method: 'dismissGasFeeChangedConfirmation',
        args: []
      }
    })
  }, [signAccountOpDispatch, swapAndBridgeDispatch, transferDispatch, updateType])

  const handleDismissGasFeeUpdate = useCallback(() => {
    dismissGasFeeChangedConfirmation()
    closeGasFeeUpdatedModal()
  }, [dismissGasFeeChangedConfirmation, closeGasFeeUpdatedModal])

  const handleAcceptGasFeeUpdate = useCallback(() => {
    closeGasFeeUpdatedModal()
    handleBroadcast()
  }, [closeGasFeeUpdatedModal, handleBroadcast])

  const getIsSigningWithInternalKey = useCallback(
    (_chosenSigningKeyTypes?: Key['type'][]) => {
      if (_chosenSigningKeyTypes?.length) return _chosenSigningKeyTypes.includes('internal')

      // A Safe is signed by whichever of its owners are imported, so any internal one counts
      if (signAccountOpState?.account.safeCreation)
        return !!signAccountOpState.accountOp.signers?.some(({ type }) => type === 'internal')

      return signingKeyType === 'internal'
    },
    [
      signAccountOpState?.account.safeCreation,
      signAccountOpState?.accountOp.signers,
      signingKeyType
    ]
  )

  // Lets the signing authentication prompt resume the very call it interrupted, without
  // handleSign having to depend on itself
  const handleSignRef = useRef<
    ((_chosenSigningKeyTypes?: Key['type'][], _warningAccepted?: boolean) => void) | null
  >(null)

  const handleSign = useCallback(
    (_chosenSigningKeyTypes?: Key['type'][], _warningAccepted?: boolean) => {
      // Prioritize warning(s) modals over all others
      // Warning modals are not displayed in the one-click swap flow
      if (warningToPromptBeforeSign && !_warningAccepted) {
        openWarningModal()
        handleUpdateStatus(SigningStatus.UpdatesPaused)
        return
      }

      // A first time recipient or dapp has to be confirmed with the password or biometrics, but
      // only when the keystore holds the signing key - a hardware wallet confirms on the device
      if (
        getIsSigningWithInternalKey(_chosenSigningKeyTypes) &&
        requestSigningAuth(() => handleSignRef.current?.(_chosenSigningKeyTypes, _warningAccepted))
      )
        return

      const isExternalQr =
        signAccountOpState?.accountOp.signingKeyType === 'qr' ||
        signAccountOpState?.accountOp.gasFeePayment?.paidByKeyType === 'qr'
      const isFeePayerSameAsSigner =
        signAccountOpState?.accountOp.signingKeyAddr ===
        signAccountOpState?.accountOp.gasFeePayment?.paidBy
      const getIsKeyTypeInvolvedInTheJustChosenKeys = (
        keyType: Key['type'],
        isInvolvedInTheAccountOp: boolean
      ) =>
        _chosenSigningKeyTypes && _chosenSigningKeyTypes.length
          ? _chosenSigningKeyTypes.indexOf(keyType) !== -1 || feePayerKeyType === keyType
          : isInvolvedInTheAccountOp
      const isLedgerKeyInvolvedInTheJustChosenKeys = getIsKeyTypeInvolvedInTheJustChosenKeys(
        'ledger',
        isAtLeastOneOfTheKeysInvolvedLedger
      )

      if (isLedgerKeyInvolvedInTheJustChosenKeys && !isLedgerConnected) {
        setShouldDisplayLedgerConnectModal(true)
        return
      }

      const isOneKeyKeyInvolvedInTheJustChosenKeys = getIsKeyTypeInvolvedInTheJustChosenKeys(
        'onekey',
        isAtLeastOneOfTheKeysInvolvedOneKey
      )

      const continueSigning = () => {
        if (
          !signAccountOpState?.account.safeCreation &&
          (signAccountOpState?.feePayerKeyStoreKeys?.length || 0) > 1 &&
          !isFeePayerSameAsSigner &&
          feePayerKeyType !== 'internal'
        ) {
          setIsChooseFeePayerKeyShown(true)
          return
        }

        if (isExternalQr) {
          // don't return here — QR flow is part of the signing itself,
          // unlike Ledger where we need to stop and wait for connection
          setShouldDisplayQrSigningModal(true)
        }

        handleBroadcast()
      }

      if (!isOneKeyKeyInvolvedInTheJustChosenKeys) {
        continueSigning()
        return
      }

      // When the OneKey is unplugged or the browser no longer lets Ambire use it, this opens
      // the tab the browser asks for access to a device from, instead of signing
      void ensureOneKeyAccess().then((hasOneKeyAccess) => {
        if (hasOneKeyAccess) continueSigning()
      })
    },
    [
      signAccountOpState?.accountOp.signingKeyAddr,
      signAccountOpState?.accountOp.gasFeePayment?.paidBy,
      signAccountOpState?.feePayerKeyStoreKeys?.length,
      signAccountOpState?.account.safeCreation,
      signAccountOpState?.accountOp.signingKeyType,
      signAccountOpState?.accountOp.gasFeePayment?.paidByKeyType,
      warningToPromptBeforeSign,
      feePayerKeyType,
      isAtLeastOneOfTheKeysInvolvedLedger,
      isLedgerConnected,
      isAtLeastOneOfTheKeysInvolvedOneKey,
      ensureOneKeyAccess,
      handleBroadcast,
      openWarningModal,
      handleUpdateStatus,
      getIsSigningWithInternalKey,
      requestSigningAuth
    ]
  )

  useEffect(() => {
    handleSignRef.current = handleSign
  }, [handleSign])

  const handleChangeSigningKey = useCallback(
    (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => {
      handleUpdate({ signingKeyAddr, signingKeyType: _chosenSigningKeyType })

      // Explicitly pass the currently selected signing key type, because
      // the signing key type in the state might not be updated yet,
      // and Sign Account Op controller assigns a default signing upfront
      handleSign([_chosenSigningKeyType])
    },
    [handleSign, handleUpdate]
  )

  const handleChangeSigningKeyAndClose = useCallback(
    (signingKeyAddr: Key['addr'], chosenSigningKeyType: Key['type']) => {
      const accountOpId = signAccountOpState?.accountOp.id
      if (!accountOpId) return

      safeSignAndCloseRequest.current = {
        accountOpId,
        signingKeyAddr
      }
      handleChangeSigningKey(signingKeyAddr, chosenSigningKeyType)
    },
    [handleChangeSigningKey, signAccountOpState?.accountOp.id]
  )

  useEffect(() => {
    const pendingRequest = safeSignAndCloseRequest.current
    if (!pendingRequest || !signAccountOpState) return

    if (pendingRequest.accountOpId !== signAccountOpState.accountOp.id) {
      safeSignAndCloseRequest.current = null
      return
    }

    const hasSigningCompleted =
      signAccountOpState.status?.type === SigningStatus.Queued &&
      signAccountOpState.accountOp.signed?.includes(pendingRequest.signingKeyAddr)

    if (!hasSigningCompleted) return

    safeSignAndCloseRequest.current = null
    onSafeSignComplete?.()
  }, [onSafeSignComplete, signAccountOpState])

  const handleChangeFeePayerKeyType = useCallback(
    // Done for compatibility with the select component
    (_: Key['addr'], newFeePayerKeyType: Key['type']) => {
      handleUpdate({ paidByKeyType: newFeePayerKeyType })

      if (newFeePayerKeyType !== 'onekey') {
        handleBroadcast()
        return
      }

      // Same as in handleSign: a OneKey that's unplugged or no longer allowed opens the
      // authorization tab instead of failing in the background
      void ensureOneKeyAccess().then((hasOneKeyAccess) => {
        if (hasOneKeyAccess) handleBroadcast()
      })
    },
    [handleBroadcast, handleUpdate, ensureOneKeyAccess]
  )

  const onSignButtonClick = useCallback(() => {
    if (!signAccountOpState) return

    setAcknowledgedBannersKey(currentBannersKey)
    // Only a click made through the linking hold counts. Collecting a Safe signature shows no hold
    // for it, and the same payer must still be held for once the Safe becomes ready to execute
    if (isLinkingNewFeePayerToSafe) setAcknowledgedNewFeePayer(feePayer)

    if (!!signAccountOpState.account.safeCreation && !signAccountOpState.canBroadcast) {
      setShowSafeSigners((prev) => (shouldHoldToProceed ? true : !prev))
      return
    }

    if (
      signAccountOpState?.accountKeyStoreKeys.length === 1 ||
      !!signAccountOpState?.account.safeCreation
    ) {
      handleSign()
      return
    }

    // A private key signs on its own in one click, so the user is not asked to pick another key
    const internalKey = signAccountOpState.accountKeyStoreKeys.find(
      (key) => key.type === 'internal'
    )
    if (internalKey) {
      handleChangeSigningKey(internalKey.addr, internalKey.type)
      return
    }

    setIsChooseSignerShown(true)
  }, [
    currentBannersKey,
    feePayer,
    handleChangeSigningKey,
    handleSign,
    isLinkingNewFeePayerToSafe,
    shouldHoldToProceed,
    signAccountOpState
  ])

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

  const isViewOnly = useMemo(() => {
    // for all accounts except Safe, check if the account has keys
    const noKeysImported = signAccountOpState?.accountKeyStoreKeys.length === 0
    if (!signAccountOpState?.account.safeCreation) return noKeysImported

    // for Safe accounts, do not treat accounts that are not deployed
    // on the network as view only as it will mislead the user into
    // thinking that the account is deployed but no owners have been
    // imported
    const isDeployed =
      !!accountStates[signAccountOpState?.account.addr]?.[
        signAccountOpState?.accountOp.chainId.toString()
      ]?.isDeployed

    return isDeployed && noKeysImported
  }, [
    signAccountOpState?.accountKeyStoreKeys,
    accountStates,
    signAccountOpState?.account,
    signAccountOpState?.accountOp.chainId
  ])

  const isAtLeastOneOfTheKeysInvolvedExternal = useMemo(
    () =>
      (!!signingKeyType && signingKeyType !== 'internal') ||
      (!!feePayerKeyType && feePayerKeyType !== 'internal'),
    [feePayerKeyType, signingKeyType]
  )

  const renderedButNotNecessarilyVisibleModal:
    | 'warnings'
    | 'gas-fee-updated'
    | 'ledger-connect'
    | 'hw-sign'
    | 'qr-sign'
    | null = useMemo(() => {
    const activeSigningKeyType = signAccountOpState?.activeSigningKeyType
    // QR and NFC keys have their own modals, so the HW signing modal isn't used for them
    const isHardwareWalletSigningActive =
      !!activeSigningKeyType && !['internal', 'qr', 'nfc'].includes(activeSigningKeyType)

    // Prioritize warning(s) modals over all others
    if (
      warningToPromptBeforeSign ||
      // We render the warning modal if the paymaster is loading, but
      // don't display it to the user until the paymaster has been loading for too long.
      // This is required because opening the modal isn't possible if it isn't rendered.
      // Not while a hardware wallet is mid-flow (e.g. between the 7702 authorization and
      // the transaction): the HW signing modal stays rendered instead, so it doesn't hide
      // and reappear, and it shows the slow paymaster message itself
      (signAccountOpState?.status?.type === SigningStatus.WaitingForPaymaster &&
        !isHardwareWalletSigningActive)
    )
      return 'warnings'

    if (signAccountOpState?.gasFeeChangedConfirmationRequired) return 'gas-fee-updated'

    if (shouldDisplayLedgerConnectModal) return 'ledger-connect'

    const hasActiveQrFlow = !!currentRequest || (!!signingStep && signingStep !== 'idle')

    if (shouldDisplayQrSigningModal || hasActiveQrFlow) return 'qr-sign'

    if (isAtLeastOneOfTheKeysInvolvedExternal) return 'hw-sign'

    return null
  }, [
    currentRequest,
    isAtLeastOneOfTheKeysInvolvedExternal,
    shouldDisplayLedgerConnectModal,
    shouldDisplayQrSigningModal,
    signAccountOpState?.activeSigningKeyType,
    signAccountOpState?.gasFeeChangedConfirmationRequired,
    signAccountOpState?.status?.type,
    signingStep,
    warningToPromptBeforeSign
  ])

  const isSignedSafeWaitingForNonce = useMemo(() => {
    if (
      !signAccountOpState?.account.safeCreation ||
      signAccountOpState.canBroadcast ||
      signAccountOpState.threshold === 0
    )
      return false

    return (signAccountOpState.accountOp.signed?.length || 0) >= signAccountOpState.threshold
  }, [
    signAccountOpState?.account.safeCreation,
    signAccountOpState?.accountOp.signed?.length,
    signAccountOpState?.canBroadcast,
    signAccountOpState?.threshold
  ])

  const isSpeedUpTransaction = !!signAccountOpState?.accountOp.meta?.speedUp?.enabled
  const isCancelTransaction =
    !!signAccountOpState && isCancelAccountOp(signAccountOpState.accountOp)

  const primaryButtonText = useMemo(() => {
    // Replaces Sign, Execute and Begin signing, so it's clear the pending transaction gets replaced.
    // Not for a Safe cancel: it's a new Safe transaction, so the owners sign it before executing
    if (isCancelTransaction && !signAccountOpState?.account.safeCreation)
      return isSignLoading ? t('Canceling...') : t('Cancel transaction')
    if (isSpeedUpTransaction && !isCancelTransaction)
      return isSignLoading ? t('Speeding up...') : t('Speed up')

    let buttonLabelType: ButtonMode =
      updateType || (isAtLeastOneOfTheKeysInvolvedExternal ? 'HW' : 'Sign')

    if (signAccountOpState?.account.safeCreation) {
      if (signAccountOpState.canBroadcast || isSignedSafeWaitingForNonce) {
        // the "Safe" term for broadcast is called "Execute"
        return isSignLoading ? 'Executing...' : 'Execute'
      }

      // always use the default state of Safes
      return !shouldShowSafeSigners
        ? PRIMARY_BUTTON_LABELS['Safe'].default
        : PRIMARY_BUTTON_LABELS['Safe'].isLoading
    }

    return t(
      isSignLoading
        ? PRIMARY_BUTTON_LABELS[buttonLabelType].isLoading
        : PRIMARY_BUTTON_LABELS[buttonLabelType].default
    )
  }, [
    isSpeedUpTransaction,
    isCancelTransaction,
    isAtLeastOneOfTheKeysInvolvedExternal,
    isSignLoading,
    t,
    updateType,
    signAccountOpState?.account.safeCreation,
    signAccountOpState?.canBroadcast,
    isSignedSafeWaitingForNonce,
    shouldShowSafeSigners
  ])

  const holdToSignButtonText = useMemo(() => {
    if (!signAccountOpState?.account.safeCreation) return t('Hold to sign')

    const isSafeReadyToExecute =
      signAccountOpState.threshold === 1 ||
      signAccountOpState.canBroadcast ||
      isSignedSafeWaitingForNonce

    // the "Safe" term for broadcast is called "Execute"
    return isSafeReadyToExecute ? t('Hold to execute') : t('Hold to proceed')
  }, [
    signAccountOpState?.account.safeCreation,
    signAccountOpState?.threshold,
    signAccountOpState?.canBroadcast,
    isSignedSafeWaitingForNonce,
    t
  ])

  // When being done, there is a corner case if the sign succeeds, but the broadcast fails.
  // If so, the "Sign" button should NOT be disabled, so the user can retry broadcasting.
  const notReadyToSignButAlsoNotDone =
    !signAccountOpState?.readyToSign && signAccountOpState?.status?.type !== SigningStatus.Done

  const {
    isActive: isExtremeGasFeeActive,
    isProceedDelayed: isExtremeGasFeeProceedDelayed,
    remainingSeconds: extremeGasFeeProceedDelaySeconds,
    signButtonType: extremeGasFeeSignButtonType
  } = useExtremeGasFeeWarning(signAccountOpState, signAccountOpState?.accountOp.chainId)

  // View-only accounts can't sign, so skip the warning-styled button and delay UX.
  const signButtonType = useMemo(
    () => (isViewOnly ? ('primary' as const) : extremeGasFeeSignButtonType),
    [isViewOnly, extremeGasFeeSignButtonType]
  )

  const isExtremeGasFeeProceedDelayedForSign = isExtremeGasFeeProceedDelayed && !isViewOnly

  const isSignDisabled = useMemo(() => {
    return (
      isViewOnly ||
      isSignLoading ||
      signAccountOpState?.isHumanizing ||
      notReadyToSignButAlsoNotDone ||
      !signAccountOpState?.readyToSign ||
      (signAccountOpState && signAccountOpState.estimation.status === EstimationStatus.Loading) ||
      isSignedSafeWaitingForNonce ||
      isExtremeGasFeeProceedDelayedForSign
    )
  }, [
    isViewOnly,
    isSignLoading,
    isExtremeGasFeeProceedDelayedForSign,
    isSignedSafeWaitingForNonce,
    notReadyToSignButAlsoNotDone,
    signAccountOpState
  ])

  const isSafeFeePayerChoiceRequired = !!signAccountOpState?.isSafeFeePayerChoiceRequired

  const disabledReason = useMemo(() => {
    if (isSafeFeePayerChoiceRequired) {
      return t('Choose who pays the fee to execute this transaction.')
    }

    if (isExtremeGasFeeProceedDelayedForSign) {
      return t('Please wait {{seconds}}s to review the high network fee.', {
        seconds: extremeGasFeeProceedDelaySeconds
      })
    }

    return typeof hasReachedBottom === 'boolean' && !hasReachedBottom
      ? t('Scroll to the bottom of the transaction overview to sign.')
      : undefined
  }, [
    extremeGasFeeProceedDelaySeconds,
    hasReachedBottom,
    isExtremeGasFeeProceedDelayedForSign,
    isSafeFeePayerChoiceRequired,
    t
  ])

  const signButtonText = useMemo(() => {
    if (isExtremeGasFeeProceedDelayedForSign) {
      return t('Wait {{seconds}}s', { seconds: extremeGasFeeProceedDelaySeconds })
    }

    return primaryButtonText
  }, [extremeGasFeeProceedDelaySeconds, isExtremeGasFeeProceedDelayedForSign, primaryButtonText, t])

  const bundlerNonceDiscrepancy = useMemo(
    () =>
      signAccountOpState?.warnings.find((warning) => warning.id === 'bundler-nonce-discrepancy') ||
      signAccountOpState?.warnings.find((warning) => warning.id === 'bundler-failure'),
    [signAccountOpState?.warnings]
  )

  useEffect(() => {
    const isExternalQr =
      signAccountOpState?.accountOp.signingKeyType === 'qr' ||
      signAccountOpState?.accountOp.gasFeePayment?.paidByKeyType === 'qr'

    const hasActiveQrFlow = !!currentRequest || (!!signingStep && signingStep !== 'idle')

    if (isExternalQr && hasActiveQrFlow) {
      setShouldDisplayQrSigningModal(true)
    }
  }, [
    currentRequest,
    signingStep,
    signAccountOpState?.accountOp.signingKeyType,
    signAccountOpState?.accountOp.gasFeePayment?.paidByKeyType
  ])

  useEffect(() => {
    if (signAccountOpState?.gasFeeChangedConfirmationRequired) {
      openGasFeeUpdatedModal()
    }
  }, [signAccountOpState?.gasFeeChangedConfirmationRequired, openGasFeeUpdatedModal])

  return {
    renderedButNotNecessarilyVisibleModal,
    isViewOnly,
    dismissWarning,
    acknowledgeWarning,
    onSignButtonClick,
    handleChangeSigningKey,
    handleChangeSigningKeyAndClose,
    warningToPromptBeforeSign,
    handleDismissLedgerConnectModal,
    isChooseSignerShown,
    setIsChooseSignerShown,
    slowPaymasterRequest,
    slowRequest,
    isSignLoading,
    hasEstimation,
    warningModalRef,
    gasFeeUpdatedModalRef,
    handleAcceptGasFeeUpdate,
    handleDismissGasFeeUpdate,
    signingKeyType,
    feePayerKeyType,
    handleChangeFeePayerKeyType,
    shouldDisplayLedgerConnectModal,
    network,
    notReadyToSignButAlsoNotDone,
    isSignDisabled,
    primaryButtonText,
    signButtonText,
    holdToSignButtonText,
    isExtremeGasFeeActive,
    extremeGasFeeSignButtonType: signButtonType,
    bundlerNonceDiscrepancy,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    shouldHoldToProceed,
    isLinkingNewFeePayerToSafe,
    holdToProceedButtonType,
    shouldDisplayQrSigningModal,
    handleQrSigningFlowOnContinuePressed,
    handleQrSigningFlowSubmitSignatureResponse,
    handleQrSigningFlowOnClosePressed,
    handleQrSigningFlowOnRejectPressed,
    handleQrSigningFlowOnBackPressed,
    currentRequest,
    signingStep,
    disabledReason,
    showSafeSigners: shouldShowSafeSigners,
    signingAuthSheetRef,
    cancelSigningAuth,
    signingAuthProps
  }
}

export default useSign
