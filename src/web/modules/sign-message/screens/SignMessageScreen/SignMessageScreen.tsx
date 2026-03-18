/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import { SignMessageStatus } from '@ambire-common/interfaces/signMessage'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { humanizeMessage } from '@ambire-common/libs/humanizer'
import {
  EIP_1271_NOT_SUPPORTED_BY,
  toPersonalSignHex
} from '@ambire-common/libs/signMessage/signMessage'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Spinner from '@common/components/Spinner'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import flexbox from '@common/styles/utils/flexbox'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useDappInfo from '@web/hooks/useDappInfo/useDappInfo'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import ActionHeader from '@web/modules/action-requests/components/ActionHeader'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'

import KeySelect from '../../../../../common/modules/sign-message/components/KeySelect'
import Main from './Contents/main'
import SignInWithEthereum from './Contents/signInWithEthereum'
import SafeFooter from './SafeFooter'

const SignMessageScreen = () => {
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
  const { theme } = useTheme()
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
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
    if (!signMessageState?.messageToSign) return
    return humanizeMessage(signMessageState.messageToSign)
  }, [signMessageState])

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
            dapp: { name, icon },
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
            hash: userRequest.meta.hash
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

  const handleReject = () => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.'), [userRequest.id]]
      }
    })
  }

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
    if (signMessageState.status === SignMessageStatus.Partial) return 'Close'
    if (isSiwe) return t('Sign in')
    if (isScrollToBottomForced) return t('Read the message')

    if (signStatus === 'LOADING') return t('Signing...')

    return t('Sign')
  }, [isSiwe, t, isScrollToBottomForced, signStatus, signMessageState.status])

  const handleDismissLedgerConnectModal = useCallback(() => {
    setShouldDisplayLedgerConnectModal(false)
  }, [])

  const shouldDisplayEIP1271Warning = useMemo(() => {
    const dappOrigin = userRequest?.dappPromises[0]?.session?.origin

    if (!dappOrigin || !isSmartAccount(account)) return false

    return EIP_1271_NOT_SUPPORTED_BY.some((origin) => dappOrigin.includes(origin))
  }, [account, userRequest?.dappPromises])

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
          />
        )}
        {view === 'siwe' && (
          <SignInWithEthereum
            shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
            isLedgerConnected={isLedgerConnected}
            handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
            isSafeNotDeployed={isSafeNotDeployed}
          />
        )}
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(SignMessageScreen)
