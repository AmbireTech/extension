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
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useDappInfo from '@web/hooks/useDappInfo/useDappInfo'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import ActionHeader from '@web/modules/action-requests/components/ActionHeader'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'

import KeySelect from '../../components/KeySelect'
import Main from './Contents/main'
import SignInWithEthereum from './Contents/signInWithEthereum'

const SignMessageScreen = () => {
  const { t } = useTranslation()
  const signMessageState = useSignMessageControllerState()
  const signStatus = signMessageState.statuses.sign
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)
  const { account } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const { accountStates } = useAccountsControllerState()
  const { dispatch } = useControllersMiddleware()
  const { isLedgerConnected } = useLedger()
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [shouldDisplayLedgerConnectModal, setShouldDisplayLedgerConnectModal] = useState(false)
  const { currentUserRequest } = useRequestsControllerState()
  const { theme, themeType } = useTheme()
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
        return signMessageState.messageToSign?.content.kind === 'typedMessage' &&
          signMessageState.messageToSign?.content.domain.chainId
          ? n.chainId.toString() === signMessageState.messageToSign?.content.domain.chainId
          : n.chainId === signMessageState.messageToSign?.chainId
      }),
    [networks, signMessageState.messageToSign]
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
    () => selectedAccountKeyStoreKeys.length === 0,
    [selectedAccountKeyStoreKeys.length]
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

    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT',
      params: {
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
        signed: userRequest.meta.signed
      }
    })
  }, [dispatch, userRequest, signMessageState.messageToSign?.fromRequestId, name, icon])

  useEffect(() => {
    return () => {
      dispatch({ type: 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET' })
    }
  }, [dispatch])

  const handleReject = () => {
    if (!userRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: {
        err: t('User rejected the request.'),
        id: userRequest.id
      }
    })
  }

  const handleSign = useCallback(
    (signers?: { addr: Key['addr']; type: Key['type'] }[]) => {
      // Has more than one key, should first choose the key to sign with
      const hasChosenSigningKey = signers && signers.length
      const hasMultipleKeysNotInternal =
        !selectedAccountKeyStoreKeys.find((k) => k.type === 'internal') &&
        selectedAccountKeyStoreKeys.length > 1
      const isSafeWithoutDefaultSigners =
        !!account?.safeCreation && !signMessageState.signers?.length
      if (!hasChosenSigningKey && (hasMultipleKeysNotInternal || isSafeWithoutDefaultSigners)) {
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
    [
      selectedAccountKeyStoreKeys,
      isLedgerConnected,
      dispatch,
      addToast,
      t,
      signMessageState.signers,
      account?.safeCreation
    ]
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

  const setSignerOrClose = useCallback(
    (chosenSigningKeyAddr?: Key['addr'], chosenSigningKeyType?: Key['type']) => {
      // safe accounts may sign the message partially only,
      // meaning a success message will be displayed and the user will be
      // prompt to close the action window by himself
      if (signMessageState.status === SignMessageStatus.Partial) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        closeCurrentWindow()
        return
      }

      setSigner(chosenSigningKeyAddr, chosenSigningKeyType)
    },
    [setSigner, signMessageState.status]
  )

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
        footer={
          <ActionFooter
            onReject={
              signMessageState.status !== SignMessageStatus.Partial ? handleReject : undefined
            }
            onResolve={setSignerOrClose}
            resolveButtonText={resolveButtonText}
            resolveDisabled={
              signStatus === 'LOADING' ||
              isScrollToBottomForced ||
              isViewOnly ||
              humanizationHasBlockingWarnings
            }
            resolveButtonTestID="button-sign"
            rejectButtonText="Reject"
            {...(isViewOnly
              ? {
                  resolveNode: (
                    <View style={[{ flex: 3 }, flexbox.directionRow, flexbox.justifyEnd]}>
                      <NoKeysToSignAlert type="short" isTransaction={false} />
                    </View>
                  )
                }
              : {})}
            informationalNode={
              signMessageState.status === SignMessageStatus.Partial ? (
                <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
                  <SuccessIcon color={theme.successDecorative} />
                  <Text
                    color={theme.successDecorative}
                    style={spacings.mlSm}
                    fontSize={16}
                    appearance="secondaryText"
                    numberOfLines={1}
                  >
                    {t('Waiting for signatures')}
                  </Text>
                </View>
              ) : null
            }
          />
        }
        backgroundColor={theme.primaryBackground}
      >
        <KeySelect
          isSigning={signStatus === 'LOADING'}
          handleChooseKey={setSigner}
          isChooseSignerShown={isChooseSignerShown}
          isChooseFeePayerKeyShown={false}
          handleClose={() => setIsChooseSignerShown(false)}
          selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
          account={account}
          signed={[]} // todo
          threshold={threshold}
          handleSetMultisigSigners={handleSign}
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
