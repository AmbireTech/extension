import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Key } from '@ambire-common/interfaces/keystore'
import { SignMessageStatus } from '@ambire-common/interfaces/signMessage'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { getDappIconFromUrl } from '@ambire-common/libs/dapps/helpers'
import { humanizeMessage } from '@ambire-common/libs/humanizer'
import { HumanizerWarning } from '@ambire-common/libs/humanizer/interfaces'
import { EIP_1271_NOT_SUPPORTED_BY, toPersonalSignHex } from '@ambire-common/libs/signMessage/utils'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDappInfo from '@common/hooks/useDappInfo/useDappInfo'
import useDappVerificationHoldButtonType from '@common/hooks/useDappVerificationHoldButtonType'
import useSigningAuth from '@common/hooks/useSigningAuth'
import useToast from '@common/hooks/useToast'
import useUnsupportedAccountKeys from '@common/hooks/useUnsupportedAccountKeys'
import useLedger from '@common/modules/hardware-wallets/hooks/useLedger'
import useOneKey from '@common/modules/hardware-wallets/hooks/useOneKey'
import useQrSigningFlow from '@common/modules/hardware-wallets/hooks/useQrSigningFlow'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates

/**
 * Identifies a warning the user confirmed on a specific request, so that confirming it never
 * carries over to another request that has the same warning
 */
const getConfirmedWarningKey = (
  requestId: string | number | undefined,
  warning: HumanizerWarning
) => `${requestId}:${warning.code}`

/** The first warning of the request that has to be confirmed before signing and isn't yet */
const getWarningToConfirm = (
  warnings: HumanizerWarning[] | undefined,
  requestId: string | number | undefined,
  confirmedWarningKeys: string[]
) =>
  warnings?.find(
    (warning) =>
      warning.promptBefore?.includes('sign') &&
      !confirmedWarningKeys.includes(getConfirmedWarningKey(requestId, warning))
  )

const useSignMessage = () => {
  const { t } = useTranslation()
  const { state: signMessageState, dispatch: signMessageDispatch } =
    useController('SignMessageController')
  const signStatus = signMessageState.statuses.sign
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: accountStates } = useController('AccountsController', selectAccountStates)
  // Tracks which request hasReachedBottom currently reflects, so it can't carry over "already
  // read" from a previous message onto a new, unread one (would silently skip
  // isScrollToBottomForced below and hide the down arrow for content that's actually unread).
  const [hasReachedBottomRequestId, setHasReachedBottomRequestId] = useState<
    string | number | undefined
  >(undefined)
  const { dispatch } = useControllersMiddleware()
  const { isLedgerConnected } = useLedger()
  const { ensureOneKeyAccess } = useOneKey()
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [shouldDisplayLedgerConnectModal, setShouldDisplayLedgerConnectModal] = useState(false)
  const [confirmedWarningKeys, setConfirmedWarningKeys] = useState<string[]>([])
  const { ref: warningModalRef, open: openWarningModal, close: closeWarningModal } = useSheetRef()
  // The signers Sign was pressed with while the warning was shown, to sign with once it's confirmed
  const signersPendingWarningRef = useRef<{ addr: Key['addr']; type: Key['type'] }[] | undefined>(
    undefined
  )
  // Whether signing waits for the warning to be confirmed, so that pressing Proceed again while
  // the confirmation closes doesn't continue the signing a second time
  const isSigningPendingWarningRef = useRef(false)
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const {
    currentRequest,
    signingStep,
    moveToResponseScan,
    moveBack,
    submitSignatureResponse,
    signingCleanup
  } = useQrSigningFlow()
  const { addToast } = useToast()
  const {
    sheetRef: signingAuthSheetRef,
    requestSigningAuth,
    cancelSigningAuth,
    signingAuthProps
  } = useSigningAuth({
    requirement: signMessageState.signingAuthRequirement,
    requestId: signMessageState.messageToSign?.fromRequestId
  })

  const userRequest = useMemo(() => {
    if (
      currentUserRequest?.kind === 'message' ||
      currentUserRequest?.kind === 'typedMessage' ||
      currentUserRequest?.kind === 'siwe'
    )
      return currentUserRequest

    return undefined
  }, [currentUserRequest])

  // React-recommended "adjust state when a prop changes" pattern (setting state directly during
  // render, not in an effect) - resets synchronously in the same render the new request appears,
  // instead of one render late as an effect-based reset would.
  if (userRequest?.id !== hasReachedBottomRequestId) {
    setHasReachedBottomRequestId(userRequest?.id)
    setHasReachedBottom(null)
  }

  const { name, icon } = useDappInfo(userRequest)
  const { state: dappsState } = useController('DappsController')

  const dappUrl = useMemo(
    () => userRequest?.dappPromises[0]?.session?.origin || userRequest?.meta.dappUrl,
    [userRequest]
  )
  const resolvedIcon = useMemo(
    () => icon || getDappIconFromUrl(dappUrl || '', dappsState.dapps || []),
    [icon, dappUrl, dappsState.dapps]
  )

  const isSiwe = useMemo(() => {
    if (!userRequest) return false

    return userRequest.kind === 'siwe'
  }, [userRequest])

  const network = useMemo(
    () =>
      networks.find((n) => {
        return n.chainId === signMessageState.messageToSign?.chainId
      }),
    [networks, signMessageState.messageToSign?.chainId]
  )

  const accountState = useMemo(() => {
    if (!account || !network) return undefined
    return accountStates[account.addr]?.[network.chainId.toString()]
  }, [account, network, accountStates])

  const selectedAccountKeyStoreKeys = useMemo(
    () => accountState?.importedAccountKeys || [],
    [accountState]
  )

  const unsupportedAccountKeys = useUnsupportedAccountKeys(account, network?.chainId)
  // The only keys the account (a Safe too) has here were synced from a device that supports them
  const hasOnlyUnsupportedKeys =
    !selectedAccountKeyStoreKeys.length && !!unsupportedAccountKeys.length

  const isViewOnly = useMemo(
    () =>
      (!account?.safeCreation && selectedAccountKeyStoreKeys.length === 0) ||
      hasOnlyUnsupportedKeys,
    [account?.safeCreation, hasOnlyUnsupportedKeys, selectedAccountKeyStoreKeys.length]
  )
  const humanizedMessage = useMemo(() => {
    if (signMessageState.humanizedMessage) return signMessageState.humanizedMessage
    if (signMessageState.isHumanizing) return
    if (!signMessageState?.messageToSign) return
    return humanizeMessage(signMessageState.messageToSign)
  }, [
    signMessageState.humanizedMessage,
    signMessageState.isHumanizing,
    signMessageState?.messageToSign
  ])

  const humanizationHasBlockingWarnings = useMemo(
    () => !!humanizedMessage?.warnings?.some((w) => w.blocking),
    [humanizedMessage?.warnings]
  )

  // A warning that has to be confirmed before signing and isn't confirmed yet for this request
  const warningToConfirmBeforeSign = useMemo(
    () =>
      getWarningToConfirm(
        humanizedMessage?.warnings,
        signMessageState.messageToSign?.fromRequestId,
        confirmedWarningKeys
      ),
    [
      humanizedMessage?.warnings,
      confirmedWarningKeys,
      signMessageState.messageToSign?.fromRequestId
    ]
  )

  const visualizeHumanized = useMemo(
    () =>
      humanizedMessage?.fullVisualization &&
      network &&
      signMessageState.messageToSign?.content.kind,
    [network, humanizedMessage, signMessageState.messageToSign?.content?.kind]
  )

  const isScrollToBottomForced = useMemo(
    () => typeof hasReachedBottom === 'boolean' && !hasReachedBottom && !visualizeHumanized,
    [hasReachedBottom, visualizeHumanized]
  )

  useEffect(() => {
    const isAlreadyInit = signMessageState.messageToSign?.fromRequestId === userRequest?.id

    if (!userRequest || !userRequest || isAlreadyInit) return

    // Similarly to other wallets, attempt to normalize the input to a hex string,
    // because some dapps not always pass hex strings, but plain text or Uint8Array.
    if (userRequest.kind === 'message' || userRequest.kind === 'siwe')
      userRequest.meta.params.message = toPersonalSignHex(userRequest.meta.params.message)

    signMessageDispatch({
      type: 'method',
      params: {
        method: 'init',
        args: [
          {
            dapp: {
              // Safe messages co-signed from another device have no live dapp
              // session; fall back to the metadata recovered from the message
              // (icon is resolved from the dapp catalog by url, see resolvedIcon)
              name: name || userRequest.meta.dappName || '',
              icon: resolvedIcon,
              url: dappUrl,
              sessionId: userRequest.dappPromises[0]?.session?.sessionId
            },
            messageToSign: {
              fromRequestId: userRequest.id,
              content: {
                kind: userRequest.kind,
                ...(userRequest.meta.params as any)
              },
              accountAddr: userRequest.meta.accountAddr,
              chainId: userRequest.meta.chainId,
              signature: null
            },
            signed: userRequest.meta.signed,
            hash: userRequest.meta.hash,
            signatures: userRequest.meta.signatures
          }
        ]
      }
    })
  }, [
    signMessageDispatch,
    userRequest,
    signMessageState.messageToSign?.fromRequestId,
    name,
    resolvedIcon,
    dappUrl
  ])

  useEffect(() => {
    return () => {
      signMessageDispatch({ type: 'method', params: { method: 'reset', args: [] } })
    }
  }, [signMessageDispatch])

  const handleReject = useCallback(() => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.'), [userRequest.id]]
      }
    })
  }, [userRequest, t, requestsDispatch])

  // Lets the signing authentication prompt resume the very call it interrupted, without
  // handleSign having to depend on itself
  const handleSignRef = useRef<
    ((signers?: { addr: Key['addr']; type: Key['type'] }[]) => void) | null
  >(null)

  const handleSign = useCallback(
    (signers?: { addr: Key['addr']; type: Key['type'] }[], justConfirmedWarningKeys?: string[]) => {
      // A warning that has to be confirmed comes before everything else, even choosing the key.
      // `justConfirmedWarningKeys` is passed only right after confirming one, while the state
      // that records it hasn't updated yet, so that only the confirmed ones are skipped
      const warningToConfirm = justConfirmedWarningKeys
        ? getWarningToConfirm(
            humanizedMessage?.warnings,
            signMessageState.messageToSign?.fromRequestId,
            justConfirmedWarningKeys
          )
        : warningToConfirmBeforeSign
      if (warningToConfirm) {
        signersPendingWarningRef.current = signers
        isSigningPendingWarningRef.current = true
        openWarningModal()
        return
      }

      // Has more than one key, should first choose the key to sign with
      const hasChosenSigningKey = signers && signers.length
      if (!hasChosenSigningKey) {
        return setIsChooseSignerShown(true)
      }

      const chosenSigners = signers && signers.length ? signers : signMessageState.signers || []
      if (!chosenSigners.length) {
        addToast(
          t(
            'No signing key available to sign the message. Please reject the request and try again.'
          ),
          { type: 'error' }
        )
        return
      }

      // A first time dapp has to be confirmed with the password or biometrics, but only when the
      // keystore holds the key - a hardware wallet confirms on the device
      const isSigningWithInternalKey = chosenSigners.some(({ type }) => type === 'internal')
      if (isSigningWithInternalKey && requestSigningAuth(() => handleSignRef.current?.(signers)))
        return

      const isLedgerKeyChosen = chosenSigners.find((s) => s.type === 'ledger')
      if (isLedgerKeyChosen && !isLedgerConnected) {
        setShouldDisplayLedgerConnectModal(true)
        return
      }

      const signWithChosenSigners = () => {
        dispatch({
          type: 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE',
          params: { signers: chosenSigners }
        })
      }

      const isOneKeyKeyChosen = chosenSigners.some((s) => s.type === 'onekey')
      if (!isOneKeyKeyChosen) {
        signWithChosenSigners()
        return
      }

      // When the OneKey is unplugged or the browser no longer lets Ambire use it, this opens
      // the tab the browser asks for access to a device from, instead of signing
      //
      // ensureOneKeyAccess() catches every error itself and always resolves
      void ensureOneKeyAccess().then((hasOneKeyAccess) => {
        if (hasOneKeyAccess) signWithChosenSigners()
      })
    },
    [
      isLedgerConnected,
      ensureOneKeyAccess,
      dispatch,
      addToast,
      t,
      signMessageState.signers,
      requestSigningAuth,
      warningToConfirmBeforeSign,
      openWarningModal,
      humanizedMessage?.warnings,
      signMessageState.messageToSign?.fromRequestId
    ]
  )

  useEffect(() => {
    handleSignRef.current = handleSign
  }, [handleSign])

  const confirmWarning = useCallback(() => {
    if (!warningToConfirmBeforeSign || !isSigningPendingWarningRef.current) return

    const requestId = signMessageState.messageToSign?.fromRequestId
    const nextConfirmedWarningKeys = [
      ...confirmedWarningKeys,
      getConfirmedWarningKey(requestId, warningToConfirmBeforeSign)
    ]
    setConfirmedWarningKeys(nextConfirmedWarningKeys)

    // Another warning has to be confirmed too. The open confirmation shows it next, once the
    // state that records this one updates
    if (getWarningToConfirm(humanizedMessage?.warnings, requestId, nextConfirmedWarningKeys)) return

    const signers = signersPendingWarningRef.current
    signersPendingWarningRef.current = undefined
    isSigningPendingWarningRef.current = false
    closeWarningModal()
    // Continues the signing the warning stopped, with the signers Sign was pressed with
    handleSign(signers, nextConfirmedWarningKeys)
  }, [
    warningToConfirmBeforeSign,
    confirmedWarningKeys,
    humanizedMessage?.warnings,
    signMessageState.messageToSign?.fromRequestId,
    closeWarningModal,
    handleSign
  ])

  const dismissWarning = useCallback(() => {
    signersPendingWarningRef.current = undefined
    isSigningPendingWarningRef.current = false
    closeWarningModal()
  }, [closeWarningModal])

  const cancelQrSigningFlow = useCallback(() => {
    signingCleanup()

    signMessageDispatch({
      type: 'method',
      params: {
        method: 'cancelSignReq',
        args: []
      }
    })
  }, [signingCleanup, signMessageDispatch])

  const handleQrSigningFlowOnBackPressed = useCallback(() => {
    if (signingStep === 'show-request') {
      cancelQrSigningFlow()
      return
    }

    moveBack()
  }, [signingStep, cancelQrSigningFlow, moveBack])

  const handleQrSigningFlowOnRejectPressed = useCallback(() => {
    cancelQrSigningFlow()
  }, [cancelQrSigningFlow])

  const setSigner = useCallback(
    (chosenSigningKeyAddr?: Key['addr'], chosenSigningKeyType?: Key['type']) => {
      const signers =
        chosenSigningKeyAddr && chosenSigningKeyType
          ? [{ addr: chosenSigningKeyAddr, type: chosenSigningKeyType }]
          : undefined
      handleSign(signers)
    },
    [handleSign]
  )

  const signWithDefaultSignerIfPossible = useCallback(() => {
    if (!account?.safeCreation && selectedAccountKeyStoreKeys.length > 1) {
      // A private key signs on its own in one click, so the user is not asked to pick another key
      const internalKey = selectedAccountKeyStoreKeys.find((key) => key.type === 'internal')
      if (internalKey) {
        setSigner(internalKey.addr, internalKey.type)
        return
      }

      handleSign()
      return
    }

    const key = selectedAccountKeyStoreKeys?.[0]
    if (!key) return

    setSigner(key.addr, key.type)
  }, [selectedAccountKeyStoreKeys, setSigner, account?.safeCreation, handleSign])

  const resolveButtonText = useMemo(() => {
    if (signMessageState.status === SignMessageStatus.Partial) return t('Close')
    if (signMessageState.isHumanizing) return t('Preparing...')
    if (isSiwe) return t('Sign in')
    if (isScrollToBottomForced) return t('Read the message')

    if (signStatus === 'LOADING') return t('Signing...')

    return t('Sign')
  }, [
    isSiwe,
    isScrollToBottomForced,
    signStatus,
    signMessageState.status,
    signMessageState.isHumanizing,
    t
  ])

  const holdToProceedButtonText = useMemo(() => {
    if (signMessageState.isHumanizing) return t('Preparing...')
    if (isScrollToBottomForced) return t('Read the message')
    if (isSiwe) return t('Hold to sign in')

    return t('Hold to sign')
  }, [isSiwe, isScrollToBottomForced, signMessageState.isHumanizing, t])

  const holdToProceedCompleteText = useMemo(() => {
    if (signStatus === 'LOADING') return t('Signing...')
    if (signMessageState.status === SignMessageStatus.Partial) return t('Close')
    if (isSiwe) return t('Sign in')

    return t('Sign')
  }, [signStatus, signMessageState.status, isSiwe, t])

  const handleDismissLedgerConnectModal = useCallback(() => {
    setShouldDisplayLedgerConnectModal(false)
  }, [])

  const shouldDisplayEIP1271Warning = useMemo(() => {
    const dappOrigin = userRequest?.dappPromises[0]?.session?.origin

    if (!dappOrigin || !isSmartAccount(account)) return false

    return EIP_1271_NOT_SUPPORTED_BY.some((origin) => dappOrigin.includes(origin))
  }, [account, userRequest?.dappPromises])

  const hasSafetyBanners = !!signMessageState.banners?.length
  const holdToProceedButtonType = useDappVerificationHoldButtonType(signMessageState.banners)

  const view = useMemo(() => {
    // Happens when switching between requests
    const isReinitializingAfterSwitch =
      userRequest?.kind &&
      signMessageState.messageToSign &&
      userRequest.kind !== signMessageState.messageToSign.content.kind

    if (isReinitializingAfterSwitch) return 'reinitializing'

    if (isSiwe) return 'siwe'

    return 'sign-message'
  }, [isSiwe, signMessageState.messageToSign, userRequest?.kind])

  const threshold = useMemo(() => {
    return accountState?.threshold || 0
  }, [accountState])

  const isSafeNotDeployed = useMemo(() => {
    if (!account?.safeCreation) return false
    return !accountState?.isDeployed
  }, [account?.safeCreation, accountState?.isDeployed])

  const isResolveActionDisabled =
    signStatus === 'LOADING' ||
    signMessageState.isHumanizing ||
    isScrollToBottomForced ||
    humanizationHasBlockingWarnings ||
    isSafeNotDeployed ||
    isViewOnly

  const isLoading = !signMessageState.isInitialized || !account || !userRequest

  return {
    t,
    signMessageState,
    signStatus,
    hasReachedBottom,
    setHasReachedBottom,
    account,
    selectedAccountKeyStoreKeys,
    isViewOnly,
    hasOnlyUnsupportedKeys,
    humanizedMessage,
    isHumanizing: signMessageState.isHumanizing,
    humanizationHasBlockingWarnings,
    visualizeHumanized,
    isScrollToBottomForced,
    userRequest,
    name,
    icon,
    isSiwe,
    network,
    accountState,
    isLedgerConnected,
    isChooseSignerShown,
    setIsChooseSignerShown,
    shouldDisplayLedgerConnectModal,
    setShouldDisplayLedgerConnectModal,
    currentRequest,
    signingStep,
    moveToResponseScan,
    moveBack,
    submitSignatureResponse,
    signingCleanup,
    handleReject,
    handleSign,
    warningToConfirmBeforeSign,
    warningModalRef,
    confirmWarning,
    dismissWarning,
    cancelQrSigningFlow,
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
    holdToProceedButtonText,
    holdToProceedCompleteText,
    hasSafetyBanners,
    holdToProceedButtonType,
    isResolveActionDisabled,
    signingAuthSheetRef,
    cancelSigningAuth,
    signingAuthProps
  }
}

export default useSignMessage
