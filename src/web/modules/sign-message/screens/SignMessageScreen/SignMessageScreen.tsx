/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

import { SignMessageAction } from '@ambire-common/interfaces/actions'
import { Key } from '@ambire-common/interfaces/keystore'
import { PlainTextMessage, TypedMessage } from '@ambire-common/interfaces/userRequest'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { humanizeMessage } from '@ambire-common/libs/humanizer'
import {
  EIP_1271_NOT_SUPPORTED_BY,
  toPersonalSignHex
} from '@ambire-common/libs/signMessage/signMessage'
import { isPlainTextMessage } from '@ambire-common/libs/transfer/userRequest'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Spinner from '@common/components/Spinner'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappInfo from '@web/hooks/useDappInfo/useDappInfo'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'

import Authorization7702 from './Contents/authorization7702'
import Main from './Contents/main'
import SignInWithEthereum from './Contents/signInWithEthereum'

const SignMessageScreen = () => {
  const { t } = useTranslation()
  const signMessageState = useSignMessageControllerState()
  const signStatus = signMessageState.statuses.sign
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)
  const keystoreState = useKeystoreControllerState()
  const { account } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const { dispatch } = useBackgroundService()
  const { isLedgerConnected } = useLedger()
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [shouldDisplayLedgerConnectModal, setShouldDisplayLedgerConnectModal] = useState(false)
  const [makeItSmartConfirmed, setMakeItSmartConfirmed] = useState(false)
  const [doNotAskMeAgain, setDoNotAskMeAgain] = useState(false)
  const actionState = useActionsControllerState()
  const { theme, themeType } = useTheme()

  const signMessageAction = useMemo(() => {
    if (actionState.currentAction?.type !== 'signMessage') return undefined

    return actionState.currentAction as SignMessageAction
  }, [actionState.currentAction])

  const userRequest = useMemo(() => {
    if (!signMessageAction) return undefined
    if (
      !['typedMessage', 'message', 'authorization-7702', 'siwe', 'signUserOperations'].includes(
        signMessageAction.userRequest.action.kind
      )
    )
      return undefined

    return signMessageAction.userRequest
  }, [signMessageAction])

  const { name, icon } = useDappInfo(userRequest)

  const isAuthorization = useMemo(() => {
    if (!signMessageAction) return false
    if (signMessageAction.userRequest.action.kind !== 'authorization-7702') return false
    if (!signMessageAction.userRequest.meta.show7702Info) return false

    return true
  }, [signMessageAction])

  const isSiwe = useMemo(() => {
    if (!signMessageAction) return false

    return signMessageAction.userRequest.action.kind === 'siwe'
  }, [signMessageAction])

  const selectedAccountKeyStoreKeys = useMemo(
    () => keystoreState.keys.filter((key) => account?.associatedKeys.includes(key.addr)),
    [keystoreState.keys, account?.associatedKeys]
  )

  const network = useMemo(
    () =>
      networks.find((n) => {
        return signMessageState.messageToSign?.content.kind === 'typedMessage' &&
          signMessageState.messageToSign?.content.domain.chainId
          ? n.chainId.toString() === signMessageState.messageToSign?.content.domain.chainId
          : n.chainId === signMessageState.messageToSign?.chainId
      }),
    [networks, signMessageState.messageToSign]
  )
  const isViewOnly = useMemo(
    () => selectedAccountKeyStoreKeys.length === 0,
    [selectedAccountKeyStoreKeys.length]
  )
  const humanizedMessage = useMemo(() => {
    if (!signMessageState?.messageToSign) return
    return humanizeMessage(signMessageState.messageToSign)
  }, [signMessageState])

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
    const isAlreadyInit = signMessageState.messageToSign?.fromActionId === signMessageAction?.id

    if (!userRequest || !signMessageAction || isAlreadyInit) return

    // Similarly to other wallets, attempt to normalize the input to a hex string,
    // because some dapps not always pass hex strings, but plain text or Uint8Array.
    if (isPlainTextMessage(userRequest.action))
      userRequest.action.message = toPersonalSignHex(userRequest.action.message)

    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT',
      params: {
        dapp: { name, icon },
        messageToSign: {
          accountAddr: userRequest.meta.accountAddr,
          chainId: userRequest.meta.chainId,
          content: userRequest.action as PlainTextMessage | TypedMessage,
          fromActionId: signMessageAction.id,
          signature: null
        }
      }
    })
  }, [
    dispatch,
    userRequest,
    signMessageAction,
    signMessageState.messageToSign?.fromActionId,
    name,
    icon
  ])

  useEffect(() => {
    return () => {
      dispatch({ type: 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET' })
    }
  }, [dispatch])

  const handleReject = () => {
    if (!signMessageAction || !userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: {
        err: t('User rejected the request.'),
        id: userRequest.id
      }
    })
  }

  const handleSign = useCallback(
    (chosenSigningKeyAddr?: Key['addr'], chosenSigningKeyType?: Key['type']) => {
      if (isAuthorization && !makeItSmartConfirmed) {
        setMakeItSmartConfirmed(true)
        setDoNotAskMeAgain(false)
        return
      }

      // Has more than one key, should first choose the key to sign with
      const hasChosenSigningKey = chosenSigningKeyAddr && chosenSigningKeyType
      const hasMultipleKeys = selectedAccountKeyStoreKeys.length > 1
      if (hasMultipleKeys && !hasChosenSigningKey) {
        return setIsChooseSignerShown(true)
      }

      const isLedgerKeyChosen = hasMultipleKeys
        ? // Accounts with multiple keys have an additional step to choose the key first
          chosenSigningKeyType === 'ledger'
        : // Take the key type from the account key itself, no additional step to choose key
          selectedAccountKeyStoreKeys[0].type === 'ledger'
      if (isLedgerKeyChosen && !isLedgerConnected) {
        setShouldDisplayLedgerConnectModal(true)
        return
      }

      const keyAddr = chosenSigningKeyAddr || selectedAccountKeyStoreKeys[0].addr
      const keyType = chosenSigningKeyType || selectedAccountKeyStoreKeys[0].type

      dispatch({
        type: 'MAIN_CONTROLLER_HANDLE_SIGN_MESSAGE',
        params: { keyAddr, keyType }
      })
    },
    [
      dispatch,
      isLedgerConnected,
      selectedAccountKeyStoreKeys,
      makeItSmartConfirmed,
      isAuthorization
    ]
  )

  const resolveButtonText = useMemo(() => {
    if (isSiwe) return t('Sign in')
    if (isScrollToBottomForced) return t('Read the message')

    if (signStatus === 'LOADING') return t('Signing...')

    if (isAuthorization && !makeItSmartConfirmed) return 'Add smart features'

    return t('Sign')
  }, [isSiwe, t, isScrollToBottomForced, signStatus, isAuthorization, makeItSmartConfirmed])

  const rejectButtonText = useMemo(() => {
    if (isAuthorization && doNotAskMeAgain) return 'Skip'
    if (isAuthorization) return 'Skip for now'
    return 'Reject'
  }, [isAuthorization, doNotAskMeAgain])

  const handleDismissLedgerConnectModal = useCallback(() => {
    setShouldDisplayLedgerConnectModal(false)
  }, [])

  const shouldDisplayEIP1271Warning = useMemo(() => {
    const dappOrigin = userRequest?.session?.origin

    if (!dappOrigin || !isSmartAccount(account)) return false

    return EIP_1271_NOT_SUPPORTED_BY.some((origin) => dappOrigin.includes(origin))
  }, [account, userRequest?.session?.origin])

  const onDoNotAskMeAgainChange = useCallback(() => {
    setDoNotAskMeAgain(!doNotAskMeAgain)
  }, [doNotAskMeAgain])

  const view = useMemo(() => {
    if (isAuthorization && !makeItSmartConfirmed) return 'authorization-7702'

    if (isSiwe) return 'siwe'

    return 'sign-message'
  }, [isAuthorization, isSiwe, makeItSmartConfirmed])

  // In the split second when the action window opens, but the state is not yet
  // initialized, to prevent a flash of the fallback visualization, show a
  // loading spinner instead (would better be a skeleton, but whatever).
  if (!signMessageState.isInitialized || !account || !signMessageAction) {
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
        header={
          <HeaderAccountAndNetworkInfo
            backgroundColor={
              themeType === THEME_TYPES.DARK
                ? (theme.secondaryBackground as string)
                : (theme.primaryBackground as string)
            }
          />
        }
        footer={
          <ActionFooter
            onReject={handleReject}
            onResolve={handleSign}
            resolveButtonText={resolveButtonText}
            resolveDisabled={signStatus === 'LOADING' || isScrollToBottomForced || isViewOnly}
            resolveButtonTestID="button-sign"
            rejectButtonText={rejectButtonText}
            {...(isViewOnly
              ? {
                  resolveNode: (
                    <View style={[{ flex: 3 }, flexbox.directionRow, flexbox.justifyEnd]}>
                      <NoKeysToSignAlert type="short" isTransaction={false} />
                    </View>
                  )
                }
              : {})}
          />
        }
        backgroundColor={
          isAuthorization && !makeItSmartConfirmed
            ? theme.primaryBackground
            : theme.quinaryBackground
        }
      >
        <SigningKeySelect
          isVisible={isChooseSignerShown}
          isSigning={signStatus === 'LOADING'}
          selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
          handleChooseKey={handleSign}
          type="signing"
          handleClose={() => setIsChooseSignerShown(false)}
          account={account}
        />
        {view === 'authorization-7702' && (
          <Authorization7702
            onDoNotAskMeAgainChange={onDoNotAskMeAgainChange}
            doNotAskMeAgain={doNotAskMeAgain}
            displayFullInformation
          />
        )}
        {view === 'sign-message' && (
          <Main
            shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
            isLedgerConnected={isLedgerConnected}
            handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
            hasReachedBottom={hasReachedBottom}
            setHasReachedBottom={setHasReachedBottom}
            shouldDisplayEIP1271Warning={shouldDisplayEIP1271Warning}
          />
        )}
        {view === 'siwe' && (
          <SignInWithEthereum
            shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
            isLedgerConnected={isLedgerConnected}
            handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
          />
        )}
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(SignMessageScreen)
