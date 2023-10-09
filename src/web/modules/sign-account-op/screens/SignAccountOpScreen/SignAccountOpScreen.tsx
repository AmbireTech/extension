import React, { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, View } from 'react-native'

import { networks } from '@ambire-common/consts/networks'
import { Account } from '@ambire-common/interfaces/account'
import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { PortfolioControllerState, TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import Select from '@common/components/Select/'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import Footer from '@web/modules/sign-account-op/components/Footer'
import Header from '@web/modules/sign-account-op/components/Header'
import Heading from '@web/modules/sign-account-op/components/Heading'
import PendingTokenSummary from '@web/modules/sign-account-op/components/PendingTokenSummary'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'
import { mapTokenOptions } from '@web/utils/maps'
import { getUiType } from '@web/utils/uiType'

import Fees from '../../components/Fees/Fees'
import styles from './styles'

// @TODO: - get accounts from controller
const ACCOUNTS = [
  {
    addr: '0xe1B0aB5DfBbBb7eAeC1FfBfE3B5e4FfFfFfFfFfF',
    label: 'Account.Name.eth',
    pfp: 'https://mars-images.imgix.net/nft/1629012092532.png?auto=compress&w=600'
  },
  {
    addr: '0x2',
    label: '0x2.eth',
    pfp: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTiA3zMVkqgS_qHXKNkxgDs4IYwc387AMfesyPxHerLdt0dLiu7Zs8UfCsEmz7wSLqfz4&usqp=CAU'
  }
]

// @TODO: - get tokens from portfolio based on currently selected account
const TOKENS = [
  {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    networkId: 'ethereum'
  },
  {
    address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    symbol: 'MATIC',
    networkId: 'polygon'
  }
]

const mapAccountOptions = (values: Account[]) =>
  values.map((value) => ({
    value: value.addr,
    label: <Text weight="medium">{value.label}</Text>,
    icon: value.pfp
  }))

export type PendingToken = TokenResult & {
  amountToSend: TokenResult['amount']
  type: 'send' | 'receive' | null
}

function calculateTokensPendingState(
  selectedAccount: string,
  network: NetworkDescriptor,
  state: { pending: PortfolioControllerState }
): PendingToken[] {
  const pendingData = state.pending[selectedAccount][network.id]

  if (!pendingData || !pendingData.isReady || !pendingData.result) {
    return []
  }

  const { tokens } = pendingData.result

  const tokensWithChangedAmounts = tokens.filter((token) => {
    if (!token.amountPostSimulation) return false
    if (token.amount !== token.amountPostSimulation) {
      return true
    }
    return false
  })

  return tokensWithChangedAmounts.map((token) => {
    let type: PendingToken['type'] = null
    const amountToSend =
      token.amount - token.amountPostSimulation! >= 0n
        ? token.amount - token.amountPostSimulation!
        : token.amountPostSimulation! - token.amount!

    if (token.amount > token.amountPostSimulation!) {
      type = 'send'
    }

    if (token.amount < token.amountPostSimulation!) {
      type = 'receive'
    }

    return {
      ...token,
      amountToSend,
      type
    }
  })
}

const SignAccountOpScreen = () => {
  const { params } = useRoute()
  const { navigate } = useNavigation()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const activityState = useActivityControllerState()
  const portfolioState = usePortfolioControllerState()
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  console.log(portfolioState)
  const accounts = mapAccountOptions(ACCOUNTS as Account[])
  const tokens = mapTokenOptions(TOKENS as TokenResult[])

  const { control } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      account: accounts[0] || {},
      token: tokens[0] || {}
    }
  })

  useEffect(() => {
    if (!params?.accountAddr || !params?.network) {
      navigate('/')
    }
  }, [params?.accountAddr, params?.network, navigate])

  useEffect(() => {
    if (!params?.accountAddr || !params?.network) {
      return
    }

    const accountOpToBeSigned: any =
      mainState.accountOpsToBeSigned?.[params.accountAddr]?.[params.network.id] || []
    if (accountOpToBeSigned) {
      if (!signAccountOpState.accountOp) {
        dispatch({
          type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
          params: {
            accounts: mainState.accounts,
            accountStates: mainState.accountStates,
            networks,
            estimation: accountOpToBeSigned.estimation,
            accountOp: accountOpToBeSigned.accountOp
            // gasPrices
            // feeTokenAddr
          }
        })
      }
    }
  }, [
    params,
    dispatch,
    mainState.messagesToBeSigned,
    mainState.selectedAccount,
    mainState.accounts,
    mainState.accountStates,
    mainState.accountOpsToBeSigned,
    signAccountOpState.accountOp
  ])

  useEffect(() => {
    if (!params?.accountAddr || !params?.network) {
      return
    }

    const accountOpToBeSigned: any =
      mainState.accountOpsToBeSigned?.[params.accountAddr]?.[params.network.id] || []

    dispatch({
      type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
      params: {
        estimation: accountOpToBeSigned.estimation,
        accountOp: accountOpToBeSigned.accountOp
      }
    })
  }, [mainState.accountOpsToBeSigned, params, dispatch])

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
    return mainState.accounts.find((acc) => acc.addr === signAccountOpState.accountOp?.accountAddr)
  }, [mainState.accounts, signAccountOpState.accountOp?.accountAddr])

  const network = useMemo(() => {
    return mainState.settings.networks.find(
      (n) => n.id === signAccountOpState?.accountOp?.networkId
    )
  }, [mainState.settings.networks, signAccountOpState?.accountOp?.networkId])

  const handleRejectAccountOp = useCallback(() => {
    if (!signAccountOpState.accountOp) return

    signAccountOpState.accountOp.calls.forEach((call) => {
      if (call.fromUserRequestId)
        dispatch({
          type: 'NOTIFICATION_CONTROLLER_REJECT_REQUEST',
          params: { err: 'User rejected the transaction request', id: call.fromUserRequestId }
        })
    })
  }, [dispatch, signAccountOpState.accountOp])

  const handleAddToCart = useCallback(() => {
    if (getUiType().isNotification) {
      window.close()
    } else {
      navigate('/')
    }
  }, [navigate])

  const callsToVisualize: IrCall[] = useMemo(() => {
    if (signAccountOpState.humanReadable.length) return signAccountOpState.humanReadable
    return signAccountOpState.accountOp?.calls || []
  }, [signAccountOpState.accountOp?.calls, signAccountOpState.humanReadable])

  const pendingTokens = useMemo(() => {
    if (signAccountOpState.accountOp && network) {
      return calculateTokensPendingState(
        signAccountOpState.accountOp.accountAddr,
        network,
        portfolioState.state
      )
    }
    return []
  }, [network, portfolioState.state, signAccountOpState.accountOp])

  if (!signAccountOpState.accountOp || !network) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Spinner />
      </View>
    )
  }

  return (
    <TabLayoutWrapperMainContent
      width="full"
      forceCanGoBack
      pageTitle={<Header account={account} network={network} />}
      footer={<Footer onReject={handleRejectAccountOp} onAddToCart={handleAddToCart} />}
    >
      <View style={styles.container}>
        <View style={styles.leftSideContainer}>
          <View style={styles.transactionsContainer}>
            <Heading text={t('Waiting Transactions')} style={styles.transactionsHeading} />
            <ScrollView style={styles.transactionsScrollView} scrollEnabled>
              {callsToVisualize.map((call) => {
                return (
                  <TransactionSummary
                    key={call.data + call.fromUserRequestId}
                    style={spacings.mbSm}
                    call={call}
                    networkId={network.id}
                    explorerUrl={network.explorerUrl}
                  />
                )
              })}
            </ScrollView>
          </View>
          <View style={styles.pendingTokensContainer}>
            <View style={styles.pendingTokensSeparatorContainer}>
              <View style={styles.separatorHorizontal} />
              <View style={styles.pendingTokensHeadingWrapper}>
                <Text weight="medium" fontSize={16}>
                  {t('Balance changes')}
                </Text>
              </View>
            </View>
            <ScrollView style={styles.pendingTokensScrollView} scrollEnabled>
              {pendingTokens.map((token) => {
                return <PendingTokenSummary token={token} networkId={network.id} />
              })}
            </ScrollView>
          </View>
        </View>
        <View style={styles.separator} />
        <View style={styles.estimationContainer}>
          <Heading text={t('Estimation')} style={styles.estimationHeading} />
          <Controller
            name="account"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Select
                setValue={onChange}
                label={t('Fee paid by')}
                options={accounts}
                style={styles.accountSelect}
                labelStyle={styles.accountSelectLabel}
                value={value}
                defaultValue={value}
              />
            )}
          />
          <Fees control={control} tokens={tokens} />
        </View>
      </View>
    </TabLayoutWrapperMainContent>
  )
}

export default SignAccountOpScreen
