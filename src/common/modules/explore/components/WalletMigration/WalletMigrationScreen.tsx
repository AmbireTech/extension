import { formatUnits, parseUnits } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { getTokenUsdPrice } from '@ambire-common/libs/portfolio/helpers'
import { getWalletAmountFromXWallet } from '@ambire-common/libs/walletStaking/shareValue'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import AmountSlider from '../WalletStaking/AmountSlider'
import BalanceWithMax from '../WalletStaking/BalanceWithMax'
import { getMigrateXWalletCalls } from '../WalletStaking/calls'
import getStyles from '../WalletStaking/styles'
import WalletStakingApy from '../WalletStaking/WalletStakingApy'

const TOKEN_DECIMALS = 18

const getAmountInWei = (amount: string) => {
  const normalizedAmount = amount.endsWith('.') ? amount.slice(0, -1) : amount
  if (!normalizedAmount) return 0n

  return parseUnits(normalizedAmount, TOKEN_DECIMALS)
}

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens
const selectXWalletShareValue = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.walletStaking?.shareValue

const WalletMigrationScreen = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()

  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const { state: shareValue } = useController('SelectedAccountController', selectXWalletShareValue)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const xWalletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()
      ),
    [portfolioTokens]
  )
  const walletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === WALLET_TOKEN.toLowerCase()
      ),
    [portfolioTokens]
  )
  const balance = useMemo(() => BigInt(xWalletToken?.amount || 0n), [xWalletToken?.amount])
  const amountInWei = getAmountInWei(amount)
  const hasInsufficientBalance = amountInWei > balance
  const balanceLabel = useMemo(
    () => formatDecimals(Number(formatUnits(balance, TOKEN_DECIMALS)), 'amount'),
    [balance]
  )
  const walletPrice = useMemo(() => {
    const walletPriceToken = walletToken || xWalletToken
    return walletPriceToken ? getTokenUsdPrice(walletPriceToken) : 0
  }, [walletToken, xWalletToken])
  const walletAmount = useMemo(
    () => (shareValue ? getWalletAmountFromXWallet(amountInWei, shareValue) : 0n),
    [amountInWei, shareValue]
  )
  const amountValueInUsd = useMemo(
    () => Number(formatUnits(walletAmount, TOKEN_DECIMALS)) * walletPrice,
    [walletAmount, walletPrice]
  )
  const amountInUsd = useMemo(() => formatDecimals(amountValueInUsd, 'value'), [amountValueInUsd])

  const isSubmitDisabled = !account || isSubmitting || amountInWei <= 0n || hasInsufficientBalance
  const submitButtonText = isSubmitting ? t('Migrating...') : t('Migrate')

  const handleSliderValueChange = useCallback(
    (nextAmount: bigint) => setAmount(formatUnits(nextAmount, TOKEN_DECIMALS)),
    []
  )
  const handleMaxPress = useCallback(
    () => setAmount(formatUnits(balance, TOKEN_DECIMALS)),
    [balance]
  )

  const handleBack = useCallback(() => navigate(-1), [navigate])
  const handleSubmit = useCallback(() => {
    if (!account || isSubmitting || amountInWei <= 0n || hasInsufficientBalance) return

    setIsSubmitting(true)
    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              executionType: 'open-request-window',
              userRequestParams: {
                calls: getMigrateXWalletCalls(amountInWei),
                meta: {
                  accountAddr: account.addr,
                  chainId: ETHEREUM_CHAIN_ID
                }
              }
            }
          }
        ]
      }
    })
  }, [account, amountInWei, hasInsufficientBalance, isSubmitting, requestsDispatch])

  return (
    <LayoutWrapper>
      <Header.Wrapper>
        <Header.Container side="left">
          <Header.BackButton forceBack onGoBackPress={handleBack} />
        </Header.Container>
        <Header.Title>{t('$xWALLET Migration')}</Header.Title>
        <Header.Container side="right" />
      </Header.Wrapper>
      <View style={styles.screenContent}>
        <View style={spacings.mt2Xl}>
          <View style={styles.amountCard}>
            <View style={styles.balanceRow}>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <SwapAndBridgeIcon
                  width={14}
                  height={14}
                  color={theme.primaryAccent200}
                  strokeWidth={1.8}
                />
                <Text fontSize={12} appearance="secondaryText" style={spacings.mlTy}>
                  {amountInUsd}
                </Text>
              </View>
              <BalanceWithMax
                balanceLabel={balanceLabel}
                disabled={balance <= 0n}
                onMaxPress={handleMaxPress}
                testID="wallet-migration-max-button"
              />
            </View>

            <NumberInput
              value={amount}
              onChangeText={setAmount}
              precision={TOKEN_DECIMALS}
              placeholder="0.00"
              borderless
              containerStyle={styles.amountInput}
              inputWrapperStyle={styles.amountInputWrapper}
              nativeInputStyle={styles.amountNativeInput}
              childrenBeforeButtons={
                <Text fontSize={13} appearance="secondaryText" style={spacings.mlSm}>
                  xWALLET
                </Text>
              }
            />

            <AmountSlider
              value={amountInWei}
              maximumValue={balance}
              maximumLabel={balanceLabel}
              onValueChange={handleSliderValueChange}
              accessibilityLabel={t('xWALLET amount')}
            />
          </View>

          <View style={styles.details}>
            <WalletStakingApy />
            <Text fontSize={11} appearance="errorText" style={styles.validation}>
              {hasInsufficientBalance ? t('The amount is higher than your balance.') : ''}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <GlassView borderRadius={32} cssStyle={{ overflow: 'hidden' }}>
            <View style={styles.footer}>
              <Button
                type="secondary"
                text={t('Cancel')}
                onPress={handleBack}
                hasBottomSpacing={false}
                style={styles.footerButton}
              />
              <Button
                type="primary"
                text={submitButtonText}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
                hasBottomSpacing={false}
                style={styles.footerButton}
                testID="wallet-migration-submit-button"
              />
            </View>
          </GlassView>
        </View>
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(WalletMigrationScreen)
