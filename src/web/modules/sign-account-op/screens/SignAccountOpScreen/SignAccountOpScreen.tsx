import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { AccountOpAction } from '@ambire-common/controllers/actions/actions'
import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import Alert from '@common/components/Alert'
import usePrevious from '@common/hooks/usePrevious'
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
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import useLedger from '@web/modules/hardware-wallet/hooks/useLedger'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import PendingTransactions from '@web/modules/sign-account-op/components/PendingTransactions'
import SafetyChecksOverlay from '@web/modules/sign-account-op/components/SafetyChecksOverlay'
import SignAccountOpHardwareWalletSigningModal from '@web/modules/sign-account-op/components/SignAccountOpHardwareWalletSigningModal'
import Simulation from '@web/modules/sign-account-op/components/Simulation'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'

import getStyles from './styles'

const SignAccountOpScreen = () => {
  const actionsState = useActionsControllerState()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const activityState = useActivityControllerState()
  const { dispatch } = useBackgroundService()
  const { networks } = useNetworksControllerState()
  const { styles } = useTheme(getStyles)
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const prevIsChooseSignerShown = usePrevious(isChooseSignerShown)
  const { isLedgerConnected } = useLedger()
  const [didTriggerSigning, setDidTriggerSigning] = useState(false)
  const [slowRequest, setSlowRequest] = useState<boolean>(false)
  const [didTraceCall, setDidTraceCall] = useState<boolean>(false)
  const { maxWidthSize } = useWindowSize()
  const hasEstimation = useMemo(
    () => signAccountOpState?.isInitialized && !!signAccountOpState?.gasPrices,
    [signAccountOpState?.gasPrices, signAccountOpState?.isInitialized]
  )
  const estimationFailed = signAccountOpState?.status?.type === SigningStatus.EstimationError

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

  const isSignLoading =
    signAccountOpState?.status?.type === SigningStatus.InProgress ||
    signAccountOpState?.status?.type === SigningStatus.Done ||
    mainState.statuses.broadcastSignedAccountOp === 'LOADING'

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

    return () => {
      clearTimeout(timeout)
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

  // trace the call once gas price and estimation is up
  // we do this only 1 time when there's no estimation error
  useEffect(() => {
    if (
      accountOpAction?.id &&
      signAccountOpState &&
      signAccountOpState.estimation &&
      hasEstimation && // this includes gas prices as well, we need it
      !estimationFailed &&
      !didTraceCall
    ) {
      setDidTraceCall(true)
      dispatch({
        type: 'MAIN_CONTROLLER_TRACE_CALL',
        params: {
          estimation: signAccountOpState.estimation
        }
      })
    }
  }, [hasEstimation, accountOpAction, signAccountOpState, didTraceCall, estimationFailed, dispatch])

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

  const signingKeyType = signAccountOpState?.accountOp?.signingKeyType
  const feePayerKeyType = mainState.feePayerKey?.type
  const isAtLeastOneOfTheKeysInvolvedLedger =
    signingKeyType === 'ledger' || feePayerKeyType === 'ledger'
  const handleDismissLedgerConnectModal = useCallback(() => {
    setDidTriggerSigning(false)
  }, [])

  const handleSign = useCallback(() => {
    setDidTriggerSigning(true)
    if (isAtLeastOneOfTheKeysInvolvedLedger && !isLedgerConnected) return

    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_SIGN'
    })
  }, [dispatch, isAtLeastOneOfTheKeysInvolvedLedger, isLedgerConnected])

  const handleChangeSigningKey = useCallback(
    (signingKeyAddr: string, _signingKeyType: string) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: { signingKeyAddr, signingKeyType: _signingKeyType }
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

  return (
    <>
      <SafetyChecksOverlay
        shouldBeVisible={!signAccountOpState?.estimation || !signAccountOpState?.isInitialized}
      />
      <TabLayoutContainer
        width="full"
        header={<HeaderAccountAndNetworkInfo />}
        footer={
          <Footer
            onReject={handleRejectAccountOp}
            onAddToCart={handleAddToCart}
            isEOA={!signAccountOpState || !isSmartAccount(signAccountOpState.account)}
            isSignLoading={isSignLoading}
            readyToSign={!!signAccountOpState && signAccountOpState.readyToSign}
            isViewOnly={isViewOnly}
            onSign={onSignButtonClick}
          />
        }
      >
        {signAccountOpState ? (
          <SigningKeySelect
            isVisible={isChooseSignerShown}
            isSigning={isSignLoading || !signAccountOpState.readyToSign}
            handleClose={() => setIsChooseSignerShown(false)}
            selectedAccountKeyStoreKeys={signAccountOpState.accountKeyStoreKeys}
            handleChooseSigningKey={handleChangeSigningKey}
          />
        ) : null}
        <TabLayoutWrapperMainContent scrollEnabled={false}>
          <View style={styles.container}>
            <View style={styles.leftSideContainer}>
              <Simulation network={network} hasEstimation={!!hasEstimation && !!network} />
              <PendingTransactions
                callsToVisualize={
                  signAccountOpState?.humanReadable || signAccountOpState?.accountOp?.calls || []
                }
                network={network}
              />
            </View>
            <View style={[styles.separator, maxWidthSize('xl') ? spacings.mh3Xl : spacings.mhXl]} />
            <Estimation
              signAccountOpState={signAccountOpState}
              disabled={isSignLoading}
              hasEstimation={!!hasEstimation && !!signAccountOpState}
              slowRequest={slowRequest}
              isViewOnly={isViewOnly}
            />

            <SignAccountOpHardwareWalletSigningModal
              signingKeyType={signingKeyType}
              feePayerKeyType={feePayerKeyType}
              broadcastSignedAccountOpStatus={mainState.statuses.broadcastSignedAccountOp}
              signAccountOpStatusType={signAccountOpState?.status?.type}
            />
            {isAtLeastOneOfTheKeysInvolvedLedger && didTriggerSigning && (
              // TODO: Fallback to re-authorize Ledger on a new tab
              <LedgerConnectModal
                isVisible={!isLedgerConnected}
                handleOnConnect={handleDismissLedgerConnectModal}
                handleClose={handleDismissLedgerConnectModal}
                displayOptionToAuthorize={false}
              />
            )}
          </View>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </>
  )
}

export default React.memo(SignAccountOpScreen)
