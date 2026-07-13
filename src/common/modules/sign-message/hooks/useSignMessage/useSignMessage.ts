import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Key } from '@ambire-common/interfaces/keystore'
import { SignMessageStatus } from '@ambire-common/interfaces/signMessage'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { humanizeMessage } from '@ambire-common/libs/humanizer'
import { EIP_1271_NOT_SUPPORTED_BY, toPersonalSignHex } from '@ambire-common/libs/signMessage/utils'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDappInfo from '@common/hooks/useDappInfo/useDappInfo'
import useToast from '@common/hooks/useToast'
import useLedger from '@common/modules/hardware-wallets/hooks/useLedger'
import useQrSigningFlow from '@common/modules/hardware-wallets/hooks/useQrSigningFlow'
import useDappVerificationHoldButtonType from '@web/hooks/useDappVerificationHoldButtonType'

const useSignMessage = () => {
  const { t } = useTranslation()
  const { state: signMessageState, dispatch: signMessageDispatch } =
    useController('SignMessageController')
  const signStatus = signMessageState.statuses.sign
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { networks } = useController('NetworksController').state
  const { accountStates } = useController('AccountsController').state
  const { dispatch } = useControllersMiddleware()
  const { isLedgerConnected } = useLedger()
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [shouldDisplayLedgerConnectModal, setShouldDisplayLedgerConnectModal] = useState(false)
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

  const userRequest = useMemo(() => {
    if (
      currentUserRequest?.kind === 'message' ||
      currentUserRequest?.kind === 'typedMessage' ||
      currentUserRequest?.kind === 'siwe'
    )
      return currentUserRequest

    return undefined
  }, [currentUserRequest])

  const { name, icon } = useDappInfo(userRequest)

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

  const isViewOnly = useMemo(
    () => !account?.safeCreation && selectedAccountKeyStoreKeys.length === 0,
    [account?.safeCreation, selectedAccountKeyStoreKeys.length]
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
              name,
              icon,
              url: userRequest.dappPromises[0]?.session?.origin,
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
  }, [signMessageDispatch, userRequest, signMessageState.messageToSign?.fromRequestId, name, icon])

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

  const handleSign = useCallback(
    (signers?: { addr: Key['addr']; type: Key['type'] }[]) => {
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

      const isLedgerKeyChosen = chosenSigners.find((s) => s.type === 'ledger')
      if (isLedgerKeyChosen && !isLedgerConnected) {
        setShouldDisplayLedgerConnectModal(true)
        return
      }

      dispatch({
        type: 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE',
        params: { signers: chosenSigners }
      })
    },
    [isLedgerConnected, dispatch, addToast, t, signMessageState.signers]
  )

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

    return t('Signing...')
  }, [signStatus, signMessageState.status, t])

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
    isResolveActionDisabled
  }
}

export default useSignMessage
