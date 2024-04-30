import { isHexString } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { Call } from '@ambire-common/libs/accountOp/types'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { calculateTokensPendingState } from '@ambire-common/libs/portfolio/portfolioView'
import Alert from '@common/components/Alert'
import Checkbox from '@common/components/Checkbox'
import { NetworkIconIdType } from '@common/components/NetworkIcon/NetworkIcon'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text/'
import { Trans, useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import HardwareWalletSigningModal from '@web/modules/hardware-wallet/components/HardwareWalletSigningModal'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import PendingTokenSummary from '@web/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'
import SigningKeySelect from '@web/modules/sign-message/components'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const SignAccountOpScreen = () => {
  const { params } = useRoute()
  const { navigate } = useNavigation()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const activityState = useActivityControllerState()
  const portfolioState = usePortfolioControllerState()
  const { dispatch } = useBackgroundService()
  const { networks } = useSettingsControllerState()
  const { ref: hwModalRef, open: openHwModal, close: closeHwModal } = useModalize()
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)
  const [slowRequest, setSlowRequest] = useState<boolean>(false)
  const [initialSimulationLoaded, setInitialSimulationLoaded] = useState<boolean>(false)
  const { maxWidthSize } = useWindowSize()
  const hasEstimation = useMemo(
    () => signAccountOpState?.isInitialized && !!signAccountOpState?.gasPrices,
    [signAccountOpState?.gasPrices, signAccountOpState?.isInitialized]
  )

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

  useEffect(() => {
    if (!params?.accountAddr || !params?.network) {
      return
    }

    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_INIT',
      params: {
        accountAddr: params?.accountAddr,
        networkId: params?.network?.id
      }
    })
  }, [params, dispatch])

  useEffect(() => {
    if (!params?.accountAddr || !params?.network) {
      return
    }

    if (!activityState.isInitialized) {
      dispatch({
        type: 'MAIN_CONTROLLER_ACTIVITY_INIT',
        params: {
          filters: {
            account: params.accountAddr,
            network: params.network.id
          }
        }
      })
    }
  }, [activityState.isInitialized, dispatch, params])

  const network = useMemo(() => {
    return networks.find((n) => n.id === signAccountOpState?.accountOp?.networkId)
  }, [networks, signAccountOpState?.accountOp?.networkId])

  const handleRejectAccountOp = useCallback(() => {
    if (!signAccountOpState?.accountOp) return

    signAccountOpState.accountOp.calls.forEach((call) => {
      if (call.fromUserRequestId)
        dispatch({
          type: 'NOTIFICATION_CONTROLLER_REJECT_REQUEST',
          params: { err: 'User rejected the transaction request', id: call.fromUserRequestId }
        })
    })
  }, [dispatch, signAccountOpState?.accountOp])

  const handleAddToCart = useCallback(() => {
    if (getUiType().isNotification) {
      window.close()
    } else {
      navigate('/')
    }
  }, [navigate])

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

  const pendingTokens = useMemo(() => {
    if (signAccountOpState?.accountOp && network) {
      return calculateTokensPendingState(
        signAccountOpState?.accountOp.accountAddr,
        network,
        portfolioState.state
      )
    }
    return []
  }, [network, portfolioState.state, signAccountOpState?.accountOp])

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

  const onGasUsedTooHighAgreed = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
      params: { gasUsedTooHighAgreed: !signAccountOpState?.gasUsedTooHighAgreed }
    })
  }, [signAccountOpState?.gasUsedTooHighAgreed, dispatch])

  const isViewOnly = useMemo(
    () => signAccountOpState?.accountKeyStoreKeys.length === 0,
    [signAccountOpState?.accountKeyStoreKeys]
  )

  const pendingSendTokens = useMemo(
    () => pendingTokens.filter((token) => token.type === 'send'),
    [pendingTokens]
  )

  const pendingReceiveTokens = useMemo(
    () => pendingTokens.filter((token) => token.type === 'receive'),
    [pendingTokens]
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

  const portfolioStatePending =
    portfolioState.state.pending[signAccountOpState?.accountOp.accountAddr][network!.id]

  let hasSimulationError = false
  if (
    (!portfolioStatePending?.isLoading || initialSimulationLoaded) &&
    (!!portfolioStatePending?.errors.find((err) => err.simulationErrorMsg) ||
      !!portfolioStatePending?.criticalError?.simulationErrorMsg ||
      signAccountOpState?.errors.length)
  ) {
    hasSimulationError = true
    if (!initialSimulationLoaded) setInitialSimulationLoaded(true)
  }

  let simulationErrorMsg = 'We were unable to simulate the transaction'
  if (portfolioStatePending?.criticalError) {
    if (isHexString(portfolioStatePending?.criticalError.simulationErrorMsg)) {
      simulationErrorMsg = `${simulationErrorMsg}. Please report this error to our team: ${portfolioStatePending?.criticalError.simulationErrorMsg}`
    } else {
      simulationErrorMsg = `${simulationErrorMsg}: ${portfolioStatePending?.criticalError.simulationErrorMsg}`
    }
  } else if (portfolioStatePending?.errors.length) {
    const simulationError = portfolioStatePending?.errors.find((err) => err.simulationErrorMsg)
    if (simulationError) {
      if (isHexString(simulationError)) {
        simulationErrorMsg = `${simulationErrorMsg}. Please report this error to our team: ${simulationError.simulationErrorMsg}`
      } else {
        simulationErrorMsg = `${simulationErrorMsg}: ${simulationError.simulationErrorMsg}`
      }
    }
  } else if (signAccountOpState?.errors.length) {
    simulationErrorMsg = `${simulationErrorMsg}. ${signAccountOpState?.errors[0]}`
  }

  const estimationFailed = signAccountOpState.status?.type === SigningStatus.EstimationError

  let shouldShowNoBalanceChanges = false
  if (
    (!portfolioStatePending?.isLoading || initialSimulationLoaded) &&
    !pendingTokens.length &&
    !portfolioStatePending?.errors.length &&
    !portfolioStatePending?.criticalError &&
    !signAccountOpState.errors.length
  ) {
    shouldShowNoBalanceChanges = true
    if (!initialSimulationLoaded) setInitialSimulationLoaded(true)
  }

  let shouldShowSimulation = false
  const isReloading = initialSimulationLoaded && !hasEstimation
  if (
    (!portfolioStatePending?.isLoading || initialSimulationLoaded) &&
    !!pendingTokens.length &&
    !hasSimulationError &&
    !isReloading
  ) {
    shouldShowSimulation = true
    if (!initialSimulationLoaded) setInitialSimulationLoaded(true)
  }

  let shouldShowLoader = false
  if ((!!portfolioStatePending?.isLoading && !initialSimulationLoaded) || isReloading) {
    shouldShowLoader = true
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
            <View style={styles.simulationSection}>
              <Text fontSize={20} weight="medium" style={spacings.mbLg}>
                {t('Simulation results')}
              </Text>
              {!!shouldShowSimulation && (
                <View style={[flexbox.directionRow, flexbox.flex1]}>
                  {!!pendingSendTokens.length && (
                    <View
                      style={[
                        styles.simulationContainer,
                        !!pendingReceiveTokens.length && spacings.mrTy
                      ]}
                    >
                      <View style={styles.simulationContainerHeader}>
                        <Text fontSize={14} appearance="secondaryText" numberOfLines={1}>
                          {t('Tokens out')}
                        </Text>
                      </View>
                      <ScrollableWrapper
                        style={styles.simulationScrollView}
                        contentContainerStyle={{ flexGrow: 1 }}
                      >
                        {pendingSendTokens.map((token, i) => {
                          return (
                            <PendingTokenSummary
                              key={token.address}
                              token={token}
                              networkId={network!.id}
                              hasBottomSpacing={i < pendingTokens.length - 1}
                            />
                          )
                        })}
                      </ScrollableWrapper>
                    </View>
                  )}
                  {!!pendingReceiveTokens.length && (
                    <View style={styles.simulationContainer}>
                      <View style={styles.simulationContainerHeader}>
                        <Text fontSize={14} appearance="secondaryText" numberOfLines={1}>
                          {t('Tokens in')}
                        </Text>
                      </View>
                      <ScrollableWrapper
                        style={styles.simulationScrollView}
                        contentContainerStyle={{ flexGrow: 1 }}
                      >
                        {pendingReceiveTokens.map((token, i) => {
                          return (
                            <PendingTokenSummary
                              key={token.address}
                              token={token}
                              networkId={network!.id}
                              hasBottomSpacing={i < pendingTokens.length - 1}
                            />
                          )
                        })}
                      </ScrollableWrapper>
                    </View>
                  )}
                </View>
              )}
              {!!hasSimulationError && (
                <View>
                  <Alert type="error" title={simulationErrorMsg} />
                </View>
              )}
              {!!shouldShowNoBalanceChanges && (
                <View>
                  <Alert
                    type="info"
                    isTypeLabelHidden
                    title={
                      <Trans>
                        No token balance changes detected. Please{' '}
                        <Text appearance="infoText" weight="semiBold">
                          carefully
                        </Text>{' '}
                        review the transaction preview below.
                      </Trans>
                    }
                  />
                </View>
              )}
              {shouldShowLoader && (
                <View style={spacings.mt}>
                  <Spinner style={styles.spinner} />
                </View>
              )}
            </View>
            <View style={styles.transactionsContainer}>
              <Text fontSize={20} weight="medium" style={spacings.mbLg}>
                {t('Waiting Transactions')}
              </Text>
              <ScrollableWrapper style={styles.transactionsScrollView} scrollEnabled>
                {callsToVisualize.map((call, i) => {
                  return (
                    <TransactionSummary
                      key={`${call.fromUserRequestId}+${i}`}
                      style={i !== callsToVisualize.length - 1 ? spacings.mbSm : {}}
                      call={call}
                      networkId={network!.id}
                    />
                  )
                })}
              </ScrollableWrapper>
            </View>
          </View>
          <View style={[styles.separator, maxWidthSize('xl') ? spacings.mh3Xl : spacings.mhXl]} />
          <View style={styles.estimationContainer}>
            <Text fontSize={20} weight="medium" style={spacings.mbLg}>
              {t('Estimation')}
            </Text>
            <ScrollableWrapper style={[styles.estimationScrollView]}>
              {!!hasEstimation && !estimationFailed && (
                <Estimation signAccountOpState={signAccountOpState} disabled={isSignLoading} />
              )}
              {!!hasEstimation &&
                !estimationFailed &&
                signAccountOpState.gasUsedTooHigh &&
                !signAccountOpState?.errors.length && (
                  <View style={styles.errorContainer}>
                    <Alert
                      type="warning"
                      title="Estimation for this request is enormously high (more than 10 million gas units). There's a chance the transaction is invalid and it will revert. Are you sure you want to continue?"
                    />
                    <Checkbox
                      value={signAccountOpState.gasUsedTooHighAgreed}
                      onValueChange={onGasUsedTooHighAgreed}
                      style={spacings.mtSm}
                    >
                      <Text fontSize={14} onPress={onGasUsedTooHighAgreed}>
                        {t('I understand the risks')}
                      </Text>
                    </Checkbox>
                  </View>
                )}

              {!hasEstimation && !estimationFailed && (
                <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
                  <Spinner style={styles.spinner} />
                </View>
              )}

              {!hasEstimation && !!slowRequest && !signAccountOpState?.errors.length ? (
                <View style={styles.errorContainer}>
                  <Alert
                    type="warning"
                    title="Estimating this transaction is taking an unexpectedly long time. We'll keep trying, but it is possible that there's an issue with this network or RPC - please change your RPC provider or contact Ambire support if this issue persists."
                  />
                </View>
              ) : null}

              {!!signAccountOpState?.errors.length && !isViewOnly ? (
                <View style={styles.errorContainer}>
                  <Alert type="error" title={signAccountOpState?.errors[0]} />
                </View>
              ) : null}
              {isViewOnly && <NoKeysToSignAlert />}
            </ScrollableWrapper>
          </View>
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
