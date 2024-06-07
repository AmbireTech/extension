import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { AccountOpAction } from '@ambire-common/controllers/actions/actions'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { Call } from '@ambire-common/libs/accountOp/types'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import Alert from '@common/components/Alert'
import { NetworkIconIdType } from '@common/components/NetworkIcon/NetworkIcon'
import Spinner from '@common/components/Spinner'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import HardwareWalletSigningModal from '@web/modules/hardware-wallet/components/HardwareWalletSigningModal'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import PendingTransactions from '@web/modules/sign-account-op/components/PendingTransactions'
import Simulation from '@web/modules/sign-account-op/components/Simulation'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'

import getStyles from './styles'

const SignAccountOpScreen = () => {
  const actionsState = useActionsControllerState()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const activityState = useActivityControllerState()
  const { dispatch } = useBackgroundService()
  const { networks } = useSettingsControllerState()
  const { ref: hwModalRef, open: openHwModal, close: closeHwModal } = useModalize()
  const { styles } = useTheme(getStyles)
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [slowRequest, setSlowRequest] = useState<boolean>(false)
  const { maxWidthSize } = useWindowSize()
  const hasEstimation = useMemo(
    () => signAccountOpState?.isInitialized && !!signAccountOpState?.gasPrices,
    [signAccountOpState?.gasPrices, signAccountOpState?.isInitialized]
  )

  useEffect(() => {
    // These errors get displayed in the UI (in the <Warning /> component),
    // so in case of an error, closing the signer key selection modal is needed,
    // otherwise errors will be displayed behind the modal overlay.
    if (isChooseSignerShown && !!signAccountOpState?.errors.length) {
      setIsChooseSignerShown(false)
    }
  }, [isChooseSignerShown, signAccountOpState?.errors.length])

  const isSignLoading =
    signAccountOpState?.status?.type === SigningStatus.InProgress ||
    signAccountOpState?.status?.type === SigningStatus.Done ||
    mainState.broadcastStatus === 'LOADING'

  useEffect(() => {
    if (signAccountOpState?.accountOp.signingKeyType !== 'internal' && isSignLoading) {
      openHwModal()
      return
    }

    closeHwModal()
  }, [closeHwModal, isSignLoading, openHwModal, signAccountOpState?.accountOp.signingKeyType])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasEstimation) {
        setSlowRequest(true)
      }
    }, 5000)

    if (hasEstimation) {
      clearTimeout(timeout)
      setSlowRequest(false)
    }
  }, [hasEstimation, slowRequest])

  const accountOpAction = useMemo(() => {
    if (actionsState.currentAction?.type !== 'accountOp') return undefined
    return actionsState.currentAction as AccountOpAction
  }, [actionsState.currentAction])

  useEffect(() => {
    if (accountOpAction?.id) {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_INIT',
        params: { actionId: accountOpAction.id }
      })
    }
  }, [accountOpAction?.id, dispatch])

  useEffect(() => {
    if (!accountOpAction) return

    if (!activityState.isInitialized) {
      dispatch({
        type: 'MAIN_CONTROLLER_ACTIVITY_INIT',
        params: {
          filters: {
            account: accountOpAction.accountOp.accountAddr,
            network: accountOpAction.accountOp.networkId
          }
        }
      })
    }
  }, [activityState.isInitialized, accountOpAction, dispatch])

  const network = useMemo(() => {
    return networks.find((n) => n.id === signAccountOpState?.accountOp?.networkId)
  }, [networks, signAccountOpState?.accountOp?.networkId])

  const handleRejectAccountOp = useCallback(() => {
    if (!accountOpAction) return

    dispatch({
      type: 'MAIN_CONTROLLER_REJECT_ACCOUNT_OP',
      params: {
        err: 'User rejected the transaction request.',
        actionId: accountOpAction.id
      }
    })
  }, [dispatch, accountOpAction])

  const handleAddToCart = useCallback(() => {
    window.close()
  }, [])

  const callsToVisualize: (IrCall | Call)[] = useMemo(() => {
    if (!signAccountOpState?.accountOp) return []

    if (signAccountOpState.accountOp?.calls?.length) {
      return signAccountOpState.accountOp.calls
        .map((opCall) => {
          const found: IrCall[] = (signAccountOpState.humanReadable || []).filter(
            (irCall) => irCall.fromUserRequestId === opCall.fromUserRequestId
          )
          return found.length ? found : [opCall]
        })
        .flat()
    }

    return []
  }, [signAccountOpState?.accountOp, signAccountOpState?.humanReadable])

  useEffect(() => {
    const destroy = () => {
      dispatch({ type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_DESTROY' })
    }
    window.addEventListener('beforeunload', destroy)

    return () => {
      destroy()
      window.removeEventListener('beforeunload', destroy)
    }
  }, [dispatch])

  const handleSign = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_SIGN'
    })
  }, [dispatch])

  const handleChangeSigningKey = useCallback(
    (signingKeyAddr: string, signingKeyType: string) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: { signingKeyAddr, signingKeyType }
      })

      handleSign()
    },
    [dispatch, handleSign]
  )

  const onSignButtonClick = () => {
    // If the account has only one signer, we don't need to show the select signer overlay,
    // and we will sign the transaction with the only one available signer (it is set by default in the controller).
    if (signAccountOpState?.accountKeyStoreKeys.length === 1) {
      handleSign()
      return
    }

    setIsChooseSignerShown(true)
  }

  const isViewOnly = useMemo(
    () => signAccountOpState?.accountKeyStoreKeys.length === 0,
    [signAccountOpState?.accountKeyStoreKeys]
  )

  if (mainState.signAccOpInitError) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Alert type="error" title={mainState.signAccOpInitError} />
      </View>
    )
  }

  // We want to show the errors one by one.
  // Once the user resolves an error, it will be removed from the array,
  // and we are going to show the next one, if it exists.
  if (!signAccountOpState?.accountOp) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Spinner />
      </View>
    )
  }

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderAccountAndNetworkInfo
          networkName={network?.name}
          networkId={network?.id as NetworkIconIdType}
        />
      }
      footer={
        <Footer
          onReject={handleRejectAccountOp}
          onAddToCart={handleAddToCart}
          isEOA={!isSmartAccount(signAccountOpState.account)}
          isSignLoading={isSignLoading}
          readyToSign={signAccountOpState.readyToSign}
          isViewOnly={isViewOnly}
          onSign={onSignButtonClick}
        />
      }
    >
      <SigningKeySelect
        isVisible={isChooseSignerShown}
        isSigning={isSignLoading || !signAccountOpState.readyToSign}
        handleClose={() => setIsChooseSignerShown(false)}
        selectedAccountKeyStoreKeys={signAccountOpState.accountKeyStoreKeys}
        handleChangeSigningKey={handleChangeSigningKey}
      />
      <TabLayoutWrapperMainContent scrollEnabled={false}>
        <View style={styles.container}>
          <View style={styles.leftSideContainer}>
            <Simulation network={network} hasEstimation={!!hasEstimation} />
            <PendingTransactions callsToVisualize={callsToVisualize} network={network} />
          </View>
          <View style={[styles.separator, maxWidthSize('xl') ? spacings.mh3Xl : spacings.mhXl]} />
          <Estimation
            signAccountOpState={signAccountOpState}
            disabled={isSignLoading}
            hasEstimation={!!hasEstimation}
            slowRequest={slowRequest}
            isViewOnly={isViewOnly}
          />
          <HardwareWalletSigningModal
            modalRef={hwModalRef}
            keyType={signAccountOpState.accountOp.signingKeyType}
            onReject={handleRejectAccountOp}
          />
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(SignAccountOpScreen)
