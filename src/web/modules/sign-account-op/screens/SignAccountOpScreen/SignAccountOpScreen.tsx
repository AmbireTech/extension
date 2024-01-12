import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { calculateTokensPendingState } from '@ambire-common/libs/portfolio/portfolioView'
import Alert from '@common/components/Alert'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text/'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import spacings, {
  IS_SCREEN_SIZE_DESKTOP_LARGE,
  SPACING,
  SPACING_2XL,
  SPACING_3XL,
  SPACING_XL
} from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
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
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import Header from '@web/modules/sign-account-op/components/Header'
import PendingTokenSummary from '@web/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const { isTab, isNotification } = getUiType()

const SignAccountOpScreen = () => {
  const { params } = useRoute()
  const { navigate } = useNavigation()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const activityState = useActivityControllerState()
  const portfolioState = usePortfolioControllerState()
  const { dispatch } = useBackgroundService()
  const { networks } = useSettingsControllerState()

  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const [isChooseSignerShown, setIsChooseSignerShown] = useState(false)

  const hasEstimation = useMemo(
    () => !!signAccountOpState?.availableFeeOptions.length,
    [signAccountOpState?.availableFeeOptions]
  )

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

    const estimateAccountOp = () => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_ESTIMATE',
        params: {
          accountAddr: params.accountAddr,
          networkId: params.network.id
        }
      })
    }

    const interval = setInterval(estimateAccountOp, 60000)

    return () => {
      clearInterval(interval)
    }
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

  const account = useMemo(() => {
    return mainState.accounts.find((acc) => acc.addr === signAccountOpState?.accountOp?.accountAddr)
  }, [mainState.accounts, signAccountOpState?.accountOp?.accountAddr])

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

  const callsToVisualize: IrCall[] = useMemo(() => {
    if (!signAccountOpState || !signAccountOpState?.humanReadable) return []
    if (signAccountOpState.humanReadable.length) return signAccountOpState.humanReadable
    return signAccountOpState.accountOp?.calls || []
  }, [signAccountOpState?.accountOp?.calls, signAccountOpState?.humanReadable])

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
        <Header
          networkId={network!.id as any}
          isEOA={!account?.creation}
          networkName={network?.name}
        />
      }
      footer={
        <Footer
          onReject={handleRejectAccountOp}
          onAddToCart={handleAddToCart}
          isEOA={!account?.creation}
          isSignLoading={
            signAccountOpState.status?.type === SigningStatus.InProgress ||
            signAccountOpState.status?.type === SigningStatus.InProgressAwaitingUserInput ||
            signAccountOpState.status?.type === SigningStatus.Done ||
            mainState.broadcastStatus === 'LOADING'
          }
          readyToSign={signAccountOpState.readyToSign}
          isChooseSignerShown={isChooseSignerShown}
          isViewOnly={isViewOnly}
          handleChangeSigningKey={handleChangeSigningKey}
          selectedAccountKeyStoreKeys={signAccountOpState?.accountKeyStoreKeys}
          onSign={onSignButtonClick}
        />
      }
      style={
        isTab || isNotification
          ? {
              paddingLeft: IS_SCREEN_SIZE_DESKTOP_LARGE ? SPACING_3XL : SPACING_XL,
              paddingRight: IS_SCREEN_SIZE_DESKTOP_LARGE ? SPACING_2XL : SPACING
            }
          : {}
      }
    >
      <TabLayoutWrapperMainContent scrollEnabled={false}>
        <View style={styles.container}>
          <View style={styles.leftSideContainer}>
            {!!pendingTokens.length && (
              <View style={styles.simulationSection}>
                <Text fontSize={20} weight="medium" style={spacings.mbLg}>
                  {t('Simulation results')}
                </Text>
                <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignStart]}>
                  <View style={[styles.simulationContainer, spacings.mrTy]}>
                    <View style={styles.simulationContainerHeader}>
                      <Text fontSize={14} appearance="secondaryText" numberOfLines={1}>
                        {t('Tokens out')}
                      </Text>
                    </View>
                    <ScrollView
                      style={styles.simulationScrollView}
                      contentContainerStyle={{ flexGrow: 1 }}
                      scrollEnabled
                    >
                      {pendingTokens.map((token, i) => {
                        return (
                          <PendingTokenSummary
                            key={token.address}
                            token={token}
                            networkId={network!.id}
                            hasBottomSpacing={i < pendingTokens.length - 1}
                          />
                        )
                      })}
                    </ScrollView>
                  </View>
                  <View style={styles.simulationContainer}>
                    <View style={styles.simulationContainerHeader}>
                      <Text fontSize={14} appearance="secondaryText" numberOfLines={1}>
                        {t('Tokens in')}
                      </Text>
                    </View>
                    <ScrollView style={styles.simulationScrollView} scrollEnabled>
                      {pendingTokens.map((token, i) => {
                        return (
                          <PendingTokenSummary
                            key={token.address}
                            token={token}
                            networkId={network!.id}
                            hasBottomSpacing={i < pendingTokens.length - 1}
                          />
                        )
                      })}
                    </ScrollView>
                  </View>
                </View>
              </View>
            )}
            <View style={styles.transactionsContainer}>
              <Text fontSize={20} weight="medium" style={spacings.mbLg}>
                {t('Waiting Transactions')}
              </Text>
              <ScrollView style={styles.transactionsScrollView} scrollEnabled>
                {callsToVisualize.map((call, i) => {
                  return (
                    <TransactionSummary
                      key={call.data + call.fromUserRequestId}
                      style={i !== callsToVisualize.length - 1 ? spacings.mbSm : {}}
                      call={call}
                      networkId={network!.id}
                      explorerUrl={network!.explorerUrl}
                    />
                  )
                })}
              </ScrollView>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.estimationContainer}>
            <Text fontSize={20} weight="medium" style={spacings.mbLg}>
              {t('Estimation')}
            </Text>
            <ScrollView style={styles.estimationScrollView} contentContainerStyle={{ flexGrow: 1 }}>
              {hasEstimation ? (
                <Estimation
                  mainState={mainState}
                  signAccountOpState={signAccountOpState}
                  accountPortfolio={portfolioState.accountPortfolio}
                  networkId={network!.id}
                  isViewOnly={isViewOnly}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
                  <Spinner style={styles.spinner} />
                </View>
              )}

              {signAccountOpState.errors.length ? (
                <View style={styles.errorContainer}>
                  <Alert
                    type="error"
                    title={`We are unable to sign your transaction. ${signAccountOpState.errors[0]}`}
                  />
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SignAccountOpScreen
