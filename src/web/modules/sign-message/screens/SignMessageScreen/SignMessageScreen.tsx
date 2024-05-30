/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { SignMessageAction } from '@ambire-common/controllers/actions/actions'
import { SignMessageController } from '@ambire-common/controllers/signMessage/signMessage'
import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import { NetworkIconIdType } from '@common/components/NetworkIcon/NetworkIcon'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
import ActionFooter from '@web/modules/action-requests/components/ActionFooter'
import HardwareWalletSigningModal from '@web/modules/hardware-wallet/components/HardwareWalletSigningModal'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'
import MessageSummary from '@web/modules/sign-message/controllers/MessageSummary'
import { getUiType } from '@web/utils/uiType'

import FallbackVisualization from './FallbackVisualization'
import Info from './Info'

const SignMessageScreen = () => {
  const { t } = useTranslation()
  const signMessageState = useSignMessageControllerState()
  const [hasReachedBottom, setHasReachedBottom] = useState(false)
  const keystoreState = useKeystoreControllerState()
  const mainState = useMainControllerState()
  const { networks } = useSettingsControllerState()
  const { dispatch } = useBackgroundService()
  const { params } = useRoute()
  const { navigate } = useNavigation()
  const { ref: hwModalRef, open: openHwModal, close: closeHwModal } = useModalize()

  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [shouldShowFallback, setShouldShowFallback] = useState(false)
  const actionState = useActionsControllerState()

  const signMessageAction = useMemo(() => {
    return actionState.currentAction as SignMessageAction
  }, [actionState.currentAction])

  const networkData: NetworkDescriptor | null =
    networks.find(({ id }) => signMessageState.messageToSign?.networkId === id) || null

  const prevSignMessageState: SignMessageController =
    usePrevious(signMessageState) || ({} as SignMessageController)

  const selectedAccountFull = useMemo(
    () => mainState.accounts.find((acc) => acc.addr === mainState.selectedAccount),
    [mainState.accounts, mainState.selectedAccount]
  )

  const selectedAccountKeyStoreKeys = useMemo(
    () =>
      keystoreState.keys.filter((key) => selectedAccountFull?.associatedKeys.includes(key.addr)),
    [keystoreState.keys, selectedAccountFull?.associatedKeys]
  )

  const network = useMemo(
    () => networks.find((n) => n.id === signMessageState.messageToSign?.networkId),
    [networks, signMessageState.messageToSign?.networkId]
  )

  const isViewOnly = useMemo(
    () => selectedAccountKeyStoreKeys.length === 0,
    [selectedAccountKeyStoreKeys.length]
  )

  const visualizeHumanized = useMemo(
    () =>
      signMessageState.humanReadable !== null &&
      network &&
      signMessageState.messageToSign?.content.kind,
    [network, signMessageState.humanReadable, signMessageState.messageToSign?.content?.kind]
  )

  const isScrollToBottomForced = useMemo(
    () =>
      signMessageState.messageToSign?.content.kind === 'typedMessage' &&
      !hasReachedBottom &&
      !visualizeHumanized,
    [hasReachedBottom, signMessageState.messageToSign?.content?.kind, visualizeHumanized]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShowFallback(true)
    }, 3000)
    return () => clearTimeout(timer)
  })

  useEffect(() => {
    if (!params?.accountAddr) {
      navigate('/')
    }
  }, [params?.accountAddr, navigate])

  useEffect(() => {
    if (
      prevSignMessageState.status === 'LOADING' &&
      signMessageState.status === 'DONE' &&
      signMessageState.signedMessage
    ) {
      dispatch({
        type: 'MAIN_CONTROLLER_BROADCAST_SIGNED_MESSAGE',
        params: { signedMessage: signMessageState.signedMessage }
      })
    }
  }, [
    dispatch,
    prevSignMessageState.status,
    signMessageState.signedMessage,
    signMessageState.status
  ])

  useEffect(() => {
    const msgToBeSigned = mainState.messagesToBeSigned[params!.accountAddr]
    if (msgToBeSigned) {
      if (msgToBeSigned.id !== signMessageState.messageToSign?.id) {
        dispatch({
          type: 'MAIN_CONTROLLER_ACTIVITY_INIT'
        })

        dispatch({
          type: 'MAIN_CONTROLLER_SIGN_MESSAGE_INIT',
          params: {
            dapp: {
              name: signMessageAction.userRequest?.session?.name || '',
              icon: signMessageAction.userRequest?.session?.icon || ''
            },
            messageToSign: msgToBeSigned,
            accounts: mainState.accounts,
            accountStates: mainState.accountStates
          }
        })
      }
    }
  }, [
    dispatch,
    params,
    networks,
    mainState.messagesToBeSigned,
    mainState.selectedAccount,
    mainState.accounts,
    mainState.accountStates,
    signMessageState.messageToSign?.id,
    signMessageState.messageToSign?.accountAddr,
    signMessageAction.userRequest?.session
  ])

  useEffect(() => {
    if (!getUiType().isActionWindow) return
    const reset = () => {
      dispatch({ type: 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET' })
      dispatch({ type: 'MAIN_CONTROLLER_ACTIVITY_RESET' })
    }
    window.addEventListener('beforeunload', reset)

    return () => {
      window.removeEventListener('beforeunload', reset)
    }
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch({ type: 'MAIN_CONTROLLER_SIGN_MESSAGE_RESET' })
      dispatch({ type: 'MAIN_CONTROLLER_ACTIVITY_RESET' })
    }
  }, [dispatch])

  const handleChangeSigningKey = useCallback(
    (keyAddr: string, keyType: string) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_MESSAGE_SET_SIGN_KEY',
        params: { key: keyAddr, type: keyType }
      })
    },
    [dispatch]
  )

  const handleReject = () => {
    dispatch({
      type: 'MAIN_CONTROLLER_REJECT_USER_REQUEST',
      params: { err: t('User rejected the request.'), id: signMessageAction.userRequest.id }
    })
  }

  const handleSign = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_MESSAGE_SIGN'
    })
  }, [dispatch])

  useEffect(() => {
    if (
      signMessageState.isInitialized &&
      signMessageState.status === 'INITIAL' &&
      signMessageState.signingKeyAddr &&
      signMessageState.signingKeyType &&
      signMessageState.messageToSign
    ) {
      handleSign()
    }
  }, [
    handleSign,
    signMessageState.isInitialized,
    signMessageState.status,
    signMessageState.signingKeyAddr,
    signMessageState.signingKeyType,
    signMessageState.messageToSign
  ])

  useEffect(() => {
    if (
      signMessageState.signingKeyType &&
      signMessageState.signingKeyType !== 'internal' &&
      signMessageState.status === 'LOADING'
    ) {
      openHwModal()
      return
    }

    closeHwModal()
  }, [signMessageState.signingKeyType, signMessageState.status, openHwModal, closeHwModal])

  if (!Object.keys(signMessageState).length) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Spinner />
      </View>
    )
  }

  const onSignButtonClick = () => {
    // FIXME: Ugly workaround for triggering `handleSign` manually.
    // This approach is a temporary fix to address the issue where the
    // 'useEffect' hook fails to get re-triggered. The original 'useEffect' was
    // supposed to trigger 'handleSign' when certain conditions in
    // 'signMessageState' were met. However, we encountered a problem: when
    // 'mainCtrl.signMessage.sign()' throws an error (e.g., hardware wallet issues),
    // the 'Sign' button becomes non-responsive. This happens because the
    // 'useEffect' doesn't reactivate after the first  execution of
    // 'mainCtrl.signMessage.setSigningKey'. To ensure functionality, this
    // workaround checks if the signing key is set (via 'hasSigningKey') and
    // then directly calls 'handleSign', bypassing the problematic 'useEffect' logic.
    // A more robust and maintainable fix should be explored
    // to handle such edge cases effectively in the future!
    // FIXME: this won't allow changing the signing key (if user has multiple)
    // after the first time the user picks key and attempts to sign the message
    // (which ultimately sets the signing key the first time it gets triggered).
    const hasSigningKey = signMessageState.signingKeyAddr && signMessageState.signingKeyType
    if (hasSigningKey) return handleSign()

    // If the account has only one signer, we don't need to show the keys select
    if (selectedAccountKeyStoreKeys.length === 1) {
      handleChangeSigningKey(
        selectedAccountKeyStoreKeys[0].addr,
        selectedAccountKeyStoreKeys[0].type
      )
      return
    }

    setIsChooseSignerShown(true)
  }

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderAccountAndNetworkInfo
          networkName={networkData?.name}
          networkId={networkData?.id as NetworkIconIdType}
        />
      }
      footer={
        <ActionFooter
          onReject={handleReject}
          onResolve={onSignButtonClick}
          resolveButtonText={signMessageState.status === 'LOADING' ? t('Signing...') : t('Sign')}
          resolveDisabled={
            signMessageState.status === 'LOADING' || isScrollToBottomForced || isViewOnly
          }
          resolveButtonTestID="button-sign"
        />
      }
    >
      <SigningKeySelect
        isVisible={isChooseSignerShown}
        isSigning={signMessageState.status === 'LOADING'}
        selectedAccountKeyStoreKeys={selectedAccountKeyStoreKeys}
        handleChangeSigningKey={handleChangeSigningKey}
        handleClose={() => setIsChooseSignerShown(false)}
      />
      <TabLayoutWrapperMainContent style={spacings.mbLg} contentContainerStyle={spacings.pvXl}>
        <View style={flexbox.flex1}>
          <Text weight="medium" fontSize={20} style={spacings.mbLg}>
            {t('Sign message')}
          </Text>
          <Info
            kindOfMessage={signMessageState.messageToSign?.content.kind}
            isViewOnly={isViewOnly}
          />
          {visualizeHumanized &&
          // @TODO: Duplicate check. For some reason ts throws an error if we don't do this
          signMessageState.humanReadable &&
          signMessageState.messageToSign?.content.kind ? (
            <MessageSummary
              message={signMessageState.humanReadable}
              networkId={network?.id}
              explorerUrl={network?.explorerUrl}
              kind={signMessageState.messageToSign?.content.kind}
            />
          ) : shouldShowFallback ? (
            <FallbackVisualization
              setHasReachedBottom={setHasReachedBottom}
              messageToSign={signMessageState.messageToSign}
            />
          ) : (
            <Text>Loading</Text>
          )}
          {isViewOnly && (
            <View
              style={{
                ...flexbox.alignSelfCenter,
                marginTop: 'auto',
                maxWidth: 600
              }}
            >
              <NoKeysToSignAlert />
            </View>
          )}
          {!!signMessageState.signingKeyType && (
            <HardwareWalletSigningModal
              modalRef={hwModalRef}
              keyType={signMessageState.signingKeyType}
              onReject={handleReject}
            />
          )}
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(SignMessageScreen)
